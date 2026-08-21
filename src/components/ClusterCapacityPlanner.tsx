import { useState } from 'react'
import {
  BOTTLENECK_ADVICE,
  BOTTLENECK_LABEL,
  type BottleneckId,
  type CapacityInput,
  formatCores,
  formatGiB,
  formatNumber,
  formatPercent,
  planCapacity,
} from '#/lib/cluster-capacity'

const DEFAULTS: CapacityInput = {
  workerNodes: 20,
  cpuPerNode: 64,
  memPerNode: 512,
  gpusPerNode: 0,
  maxPodsPerNode: 110,
  evictionMiB: 100,
  avgPodCpuM: 500,
  avgPodMemMiB: 2048,
  podCidrMask: 16,
  nodeCidrMask: 24,
}

/** 三种常见集群形态，点一下把整组参数换掉 */
const PRESETS: { id: string; label: string; desc: string; input: CapacityInput }[] = [
  {
    id: 'general',
    label: '通用业务集群',
    desc: '20 台中等规格节点，跑微服务',
    input: DEFAULTS,
  },
  {
    id: 'gpu',
    label: 'GPU 训练集群',
    desc: '8 台八卡机，每卡配足 CPU 与内存',
    input: {
      ...DEFAULTS,
      workerNodes: 8,
      cpuPerNode: 128,
      memPerNode: 2048,
      gpusPerNode: 8,
      maxPodsPerNode: 60,
      avgPodCpuM: 16000,
      avgPodMemMiB: 131072,
    },
  },
  {
    id: 'dense',
    label: '高密度小 Pod',
    desc: '大量轻量 Pod，先撞上的通常不是资源',
    input: {
      ...DEFAULTS,
      workerNodes: 50,
      cpuPerNode: 32,
      memPerNode: 128,
      maxPodsPerNode: 250,
      avgPodCpuM: 100,
      avgPodMemMiB: 256,
    },
  },
]

const CIDR_MASKS = [8, 10, 12, 14, 16, 18, 20]
const NODE_MASKS = [22, 23, 24, 25, 26, 27]

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-body mb-1 block text-xs font-medium">{label}</span>
      {children}
      {hint && <span className="text-mute mt-1 block text-[11px]">{hint}</span>}
    </label>
  )
}

/* DESIGN.md 的 form-input：hairline 边框、6px 圆角、focus 时才亮出品牌蓝 */
const inputCls =
  'border-hairline bg-canvas text-ink focus:border-brand-500 focus:ring-brand-100 w-full rounded-md border px-3 py-2 font-mono text-sm outline-none focus:ring-2'

/**
 * 集群容量推算器。
 * 核心不是算出一个漂亮的总数，而是指出「第一个撞上的限制是哪个」——
 * 四条限制里最小的那条决定了单节点能跑多少 Pod，其余三条都是余量。
 */
export function ClusterCapacityPlanner() {
  const [input, setInput] = useState<CapacityInput>(DEFAULTS)
  const result = planCapacity(input)

  const set = <K extends keyof CapacityInput>(key: K, value: CapacityInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }))

  const num = (key: keyof CapacityInput, min: number, max: number) => ({
    type: 'number' as const,
    min,
    max,
    value: input[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      set(key, Math.min(max, Math.max(min, Number(e.target.value) || min)) as never),
    className: inputCls,
  })

  return (
    <section className="border-hairline bg-canvas shadow-card my-6 overflow-hidden rounded-xl border">
      <header className="border-hairline flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="eyebrow">计算器</span>
          <span className="text-ink text-sm font-medium">集群容量推算</span>
        </div>
        <button
          type="button"
          onClick={() => setInput(DEFAULTS)}
          className="text-mute hover:text-ink text-xs transition"
        >
          重置
        </button>
      </header>

      <div className="border-hairline flex gap-2 overflow-x-auto border-b px-4 py-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setInput(preset.input)}
            className="border-hairline hover:border-brand-500 hover:bg-brand-50/50 shrink-0 rounded-lg border px-3 py-1.5 text-left transition"
          >
            <span className="text-ink block text-xs font-medium">{preset.label}</span>
            <span className="text-mute block text-[11px]">{preset.desc}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 px-4 py-4 md:grid-cols-2">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="计算节点数">
              <input {...num('workerNodes', 1, 2000)} />
            </Field>
            <Field label="单节点 GPU 卡数" hint="纯 CPU 集群填 0">
              <input {...num('gpusPerNode', 0, 16)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="单节点 CPU（核）">
              <input {...num('cpuPerNode', 1, 512)} />
            </Field>
            <Field label="单节点内存（GiB）">
              <input {...num('memPerNode', 1, 4096)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="典型 Pod CPU request（m）" hint="1000m = 1 核">
              <input {...num('avgPodCpuM', 1, 128000)} />
            </Field>
            <Field label="典型 Pod 内存 request（MiB）">
              <input {...num('avgPodMemMiB', 1, 1048576)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="maxPods" hint="kubelet 默认 110">
              <input {...num('maxPodsPerNode', 1, 1000)} />
            </Field>
            <Field label="驱逐阈值（MiB）" hint="默认 memory.available<100Mi">
              <input {...num('evictionMiB', 0, 65536)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Pod CIDR" hint="集群整体网段">
              <select
                value={input.podCidrMask}
                onChange={(e) => set('podCidrMask', Number(e.target.value))}
                className={inputCls}
              >
                {CIDR_MASKS.map((mask) => (
                  <option key={mask} value={mask}>
                    /{mask}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="每节点子网" hint="node-cidr-mask-size">
              <select
                value={input.nodeCidrMask}
                onChange={(e) => set('nodeCidrMask', Number(e.target.value))}
                className={inputCls}
              >
                {NODE_MASKS.map((mask) => (
                  <option key={mask} value={mask}>
                    /{mask}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="space-y-3">
          {/* 结论用墨黑面反白，是这个组件里唯一的"极性翻转"——DESIGN.md 的 dark band 做法 */}
          <div className="bg-ink rounded-xl px-4 py-5 text-center">
            <div className="font-mono text-[11px] tracking-wider text-white/50 uppercase">
              集群可调度 Pod 数
            </div>
            <div className="mt-1.5 text-4xl font-semibold tracking-tight text-white">
              {formatNumber(result.totalPods)}
            </div>
            <div className="mt-1.5 text-xs text-white/60">
              每节点 {formatNumber(result.podsPerNode)} 个 · 受限于{' '}
              {BOTTLENECK_LABEL[result.bottleneck]}
            </div>
          </div>

          <div className="border-hairline rounded-xl border px-3.5 py-3">
            <div className="text-body text-xs font-medium">四条限制，最小的那条说了算</div>
            <ul className="mt-2 space-y-1.5">
              {(Object.keys(BOTTLENECK_LABEL) as BottleneckId[]).map((id) => {
                const value = result.limits[id]
                const hit = id === result.bottleneck
                const ratio = result.podsPerNode > 0 && Number.isFinite(value)
                  ? Math.min(1, result.podsPerNode / value)
                  : 1
                return (
                  <li key={id} className="text-xs">
                    <div className="flex items-baseline justify-between">
                      <span className={hit ? 'text-brand-700 font-medium' : 'text-body'}>
                        {hit && '▸ '}
                        {BOTTLENECK_LABEL[id]}
                      </span>
                      <span
                        className={`font-mono ${hit ? 'text-brand-700 font-medium' : 'text-mute'}`}
                      >
                        {formatNumber(value)} Pod
                      </span>
                    </div>
                    <div className="bg-canvas-soft-2 mt-1 h-1 overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full ${hit ? 'bg-brand-500' : 'bg-hairline-strong'}`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="text-mute mt-2.5 text-[11px] leading-relaxed">
              {BOTTLENECK_ADVICE[result.bottleneck]}
            </p>
          </div>

          <dl className="divide-hairline border-hairline rounded-xl border text-sm divide-y">
            {[
              [
                '单节点 CPU 可分配',
                `${formatCores(result.cpuAllocatableM)}（预留 ${formatCores(result.cpuReservedM)}，${formatPercent(result.cpuEfficiency)}）`,
              ],
              [
                '单节点内存可分配',
                `${formatGiB(result.memAllocatableMiB)}（预留 ${formatGiB(result.memReservedMiB)}，${formatPercent(result.memEfficiency)}）`,
              ],
              ['集群可分配 CPU', `${formatNumber(result.totalCpuAllocatable, 1)} 核`],
              ['集群可分配内存', `${formatNumber(result.totalMemAllocatableGiB, 1)} GiB`],
              ['节点子网可用 IP', `${formatNumber(result.ipsPerNode)} 个 / 节点`],
              ['Pod CIDR 可容纳节点', `${formatNumber(result.maxNodesByCidr)} 台`],
              ...(result.totalGpus > 0
                ? [
                    ['GPU 总数', `${formatNumber(result.totalGpus)} 卡`],
                    [
                      '每卡摊到',
                      `${formatNumber(result.perGpuCpu ?? 0, 1)} 核 · ${formatNumber(result.perGpuMemGiB ?? 0, 0)} GiB`,
                    ],
                  ]
                : []),
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 px-3.5 py-2">
                <dt className="text-mute shrink-0 text-xs">{label}</dt>
                <dd className="text-ink text-right font-mono text-xs font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="border-brand-100 bg-brand-50/70 text-brand-700 rounded-xl border px-3.5 py-3 text-xs">
            <div className="font-medium">
              建议控制面：{result.controlPlane.nodes} 台 × {result.controlPlane.cpu} 核 /{' '}
              {result.controlPlane.memGiB} GiB
            </div>
            <p className="text-body mt-1 leading-relaxed">{result.controlPlane.note}</p>
          </div>

          {result.warnings.length > 0 && (
            <ul className="space-y-1.5 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-xs text-amber-900">
              {result.warnings.map((warning) => (
                <li key={warning} className="flex gap-1.5">
                  <span className="shrink-0">⚠</span>
                  <span className="leading-relaxed">{warning}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
