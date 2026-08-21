import { useState } from 'react'

/**
 * 控制面推演 —— 一次 kubectl apply 的分步走查。
 *
 * 两种玩法：
 * 1. 按步推进，看每一步是谁在动、对象状态变成什么样
 * 2. 点掉某个组件，看这条链路会断在哪一步
 *
 * 目的是把"apiserver 是唯一入口""调度器只写一个字段"这类结论，
 * 变成可以自己点出来的东西。
 */

type ComponentId = 'apiserver' | 'etcd' | 'scheduler' | 'controller' | 'kubelet'

const COMPONENTS: { id: ComponentId; label: string; where: string }[] = [
  { id: 'apiserver', label: 'kube-apiserver', where: '控制面' },
  { id: 'etcd', label: 'etcd', where: '控制面' },
  { id: 'controller', label: 'controller-manager', where: '控制面' },
  { id: 'scheduler', label: 'kube-scheduler', where: '控制面' },
  { id: 'kubelet', label: 'kubelet', where: '节点' },
]

interface Step {
  actor: ComponentId
  title: string
  detail: string
  /** 这一步之后对象变成什么样 */
  state: string
  /** 缺了这个组件时，卡在这一步的表现 */
  stuck: string
}

const STEPS: Step[] = [
  {
    actor: 'apiserver',
    title: '认证、鉴权、准入',
    detail:
      'kubectl 把 YAML 转成 REST 请求发给 apiserver。apiserver 依次做认证（你是谁）、鉴权（你能不能做）、准入控制（这个对象合不合规、要不要改写）。',
    state: 'Deployment 对象还在内存里，没落盘',
    stuck: 'kubectl 直接报连不上或 Forbidden。整个集群的写入全部停摆，已经跑着的 Pod 不受影响。',
  },
  {
    actor: 'etcd',
    title: '持久化',
    detail:
      'apiserver 把对象写进 etcd。这是集群里唯一的状态存储 —— 其它组件都不直连 etcd，只通过 apiserver 的 watch 拿变更。',
    state: 'Deployment 已存在，replicas=3，尚无 Pod',
    stuck: 'apiserver 的写请求超时，读请求可能还能从缓存返回。这是最危险的状态，恢复靠备份。',
  },
  {
    actor: 'controller',
    title: 'Deployment → ReplicaSet → Pod',
    detail:
      'Deployment 控制器 watch 到新对象，创建 ReplicaSet；ReplicaSet 控制器再发现实际副本数 0 ≠ 期望 3，创建三个 Pod 对象。注意：此时 Pod 还没有 nodeName。',
    state: '3 个 Pod 处于 Pending，nodeName 为空',
    stuck: '对象创建成功但什么都不会发生。Deployment 一直是 0/3，没有任何 Pod 被创建出来。',
  },
  {
    actor: 'scheduler',
    title: '过滤、打分、绑定',
    detail:
      '调度器 watch 到 nodeName 为空的 Pod，先过滤掉不满足条件的节点（资源、污点、亲和性），再给剩下的打分，最后把最高分的节点写回 Pod 的 nodeName —— 它只做这一件事。',
    state: '3 个 Pod 仍是 Pending，但 nodeName 已填上',
    stuck: 'Pod 永远 Pending，describe 里看不到 Scheduled 事件。已调度的 Pod 完全不受影响。',
  },
  {
    actor: 'kubelet',
    title: '拉镜像、建 sandbox、起容器',
    detail:
      '目标节点上的 kubelet watch 到 nodeName 是自己的 Pod，通过 CRI 让 containerd 拉镜像、创建 pause 容器建立网络命名空间，再拉起业务容器，然后持续上报状态。',
    state: '3 个 Pod 变成 Running，Deployment 显示 3/3',
    stuck: '这台节点上的 Pod 卡在 ContainerCreating。约 5 分钟后节点转 NotReady，控制器开始在别处重建。',
  },
]

/*
 * 原先五个组件各有一种颜色，但这个颜色只在"它正在动"的时候才用得上 ——
 * 也就是说色相本身没编码任何信息。收成一种高亮样式，读起来反而更清楚：
 * 有颜色的那个就是当前这一步的执行者。
 */
const ACTOR_ACTIVE = 'border-brand-600 bg-brand-50 text-brand-700'

export function ApplyFlow() {
  const [at, setAt] = useState(0)
  const [down, setDown] = useState<ComponentId | null>(null)

  // 链路在第一个挂掉的组件那一步断开
  const brokenAt = down ? STEPS.findIndex((step) => step.actor === down) : -1
  const blocked = brokenAt >= 0 && at >= brokenAt
  const step = STEPS[at]

  return (
    <section className="bg-canvas shadow-card my-6 overflow-hidden rounded-md">
      <header className="border-line flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="eyebrow">推演</span>
          <span className="text-body font-mono text-xs">kubectl apply -f deploy.yaml</span>
        </div>
        <span className="text-mute font-mono text-[11px]">
          第 {at + 1} / {STEPS.length} 步
        </span>
      </header>

      <div className="border-line bg-soft border-b px-4 py-3">
        <div className="text-mute text-[11px]">点组件可以把它「打挂」，看链路断在哪</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {COMPONENTS.map((comp) => {
            const isDown = down === comp.id
            const isActor = step.actor === comp.id && !blocked
            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => setDown(isDown ? null : comp.id)}
                className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
                  isDown
                    ? 'border-danger bg-danger-soft/40 text-danger-deep line-through'
                    : isActor
                      ? ACTOR_ACTIVE
                      : 'border-line bg-canvas text-mute hover:border-line-strong'
                }`}
              >
                <span className="block font-mono">{comp.label}</span>
                <span className="block text-[10px] opacity-70">{comp.where}</span>
              </button>
            )
          })}
        </div>
      </div>

      <ol className="border-line flex gap-1 border-b px-4 py-3">
        {STEPS.map((s, i) => {
          const reachable = brokenAt < 0 || i < brokenAt
          return (
            <li key={s.title} className="flex-1">
              <button
                type="button"
                onClick={() => setAt(i)}
                className="w-full text-left"
                title={s.title}
              >
                <div
                  className={`h-1 rounded-full transition ${
                    !reachable ? 'bg-danger-soft' : i <= at ? 'bg-brand-600' : 'bg-soft-2'
                  }`}
                />
                <span
                  className={`mt-1.5 block truncate text-[10px] ${
                    i === at ? 'text-ink font-medium' : 'text-mute'
                  }`}
                >
                  {i + 1}. {s.title}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded border px-2 py-0.5 font-mono text-xs ${ACTOR_ACTIVE}`}>
            {COMPONENTS.find((c) => c.id === step.actor)?.label}
          </span>
          <h4 className="display-sm">{step.title}</h4>
        </div>

        <p className="text-body mt-2.5 text-sm leading-relaxed">{step.detail}</p>

        {blocked ? (
          <div className="border-danger-soft bg-danger-soft/30 mt-3 rounded-sm border px-3.5 py-3 text-sm">
            <div className="text-danger-deep font-medium">
              {COMPONENTS.find((c) => c.id === down)?.label} 挂了，链路断在第 {brokenAt + 1} 步
            </div>
            <p className="text-body mt-1 leading-relaxed">{STEPS[brokenAt].stuck}</p>
          </div>
        ) : (
          <div className="bg-soft mt-3 rounded-sm px-3.5 py-3 text-sm">
            <span className="text-mute text-xs">这一步之后：</span>
            <span className="text-ink ml-1.5">{step.state}</span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAt((v) => Math.max(0, v - 1))}
            disabled={at === 0}
            className="bg-canvas text-ink shadow-card hover:shadow-float rounded-sm px-4 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← 上一步
          </button>
          <button
            type="button"
            onClick={() => setAt((v) => Math.min(STEPS.length - 1, v + 1))}
            disabled={at === STEPS.length - 1}
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-soft-2 disabled:text-mute rounded-sm px-4 py-1.5 text-sm font-medium text-white transition disabled:cursor-not-allowed"
          >
            下一步 →
          </button>
          {down && (
            <button
              type="button"
              onClick={() => setDown(null)}
              className="text-mute hover:text-ink ml-auto text-xs transition"
            >
              恢复所有组件
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
