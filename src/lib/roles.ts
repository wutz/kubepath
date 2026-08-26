/**
 * 岗位路线 —— 首页的组织方式，也是课程页的"路线模式"。
 *
 * 课程本身仍然只有一份（见 curriculum.ts 的 L0–L4 阶段），
 * 这里做的是"按岗位裁剪并重排顺序"：同一节课可以出现在多条路线里，
 * 每条路线只挑这个岗位真正用得上的部分，再切成几段推进。
 *
 * 集群运维工程师那条不手写课程清单，直接由 L0–L4 全量阶段生成 —— 它是本站的
 * 完整主线，用 layout: 'catalog' 按阶段通读的样式渲染。
 */
import { type Lesson, type Track, getLesson, lessonKey, tracks } from './curriculum'

export interface RoleStage {
  title: string
  /** 这一段解决什么问题，一行以内 */
  hint: string
  /** 课程键，格式 `${trackId}/${lessonId}` */
  lessons: string[]
  /** 整段等于某个 L0–L4 阶段时填上，段标题会链到阶段页 */
  trackId?: string
}

export interface Role {
  id: string
  title: string
  /** 同一岗位的其它常见叫法，展示成一行 */
  alias: string
  /** 这个岗位真正的诉求，一句话 */
  tagline: string
  /** 这条线怎么裁的 */
  desc: string
  /** 走完能做什么 */
  outcomes: string[]
  /** catalog：按 L0–L4 阶段通读；默认按裁剪过的分段清单 */
  layout?: 'catalog'
  stages: RoleStage[]
}

export const roles: Role[] = [
  {
    id: 'architect',
    title: '解决方案架构师',
    alias: '方案工程师 · 售前技术',
    tagline: '客户买的是一套能交付、也养得起的平台',
    desc: '你不必亲手装过集群，但方案里每个数字都得站得住：几台控制面、多少节点、GPU 怎么调度、两年后谁来维护。这条线把部署细节和深度排障压到最少，重点放在对象语义、规模推算与技术选型。',
    outcomes: [
      '把「上一套 100 卡的 K8s」追问成一份能落地的节点与网段规格表',
      '从节点配置算出可分配资源、Pod 密度与控制面规格，并说出第一个瓶颈',
      '在 CNI、存储接入、GPU 调度几个选型点上讲清各自的代价，而不是只报组件名',
    ],
    stages: [
      {
        title: '先有共同语言',
        hint: '方案里天天写「容器」「镜像」，先知道它们在机器上到底是什么',
        lessons: ['l0-container/container-runtime', 'l0-container/docker-basics'],
      },
      {
        title: '对象与语义',
        hint: '本机起一套 kind 集群，边看边把方案里的名词落到实物上',
        lessons: [
          'l1-basics/kind-cluster',
          'l1-basics/architecture',
          'l1-basics/declarative',
          'l1-basics/api-objects',
          'l1-basics/networking-model',
        ],
      },
      {
        title: '把需求写成集群规格',
        hint: '这条线的主课：先定机型，再写规划，最后把数字算出来',
        lessons: [
          'l2-production/hardware-topology',
          'l2-production/cluster-plan',
          'l2-production/capacity-planning',
          'l2-production/os-tuning',
        ],
      },
      {
        title: '组件选型：每一层选什么、为什么',
        hint: '先看清六层版图，再逐层展开成得住的理由',
        lessons: [
          'l2-production/component-stack',
          'l2-production/cni-cilium',
          'l2-production/service-ingress',
          'l2-production/k8s-storage',
          'l3-platform-ops/observability',
        ],
      },
      {
        title: 'AI 场景要多算的那几笔',
        hint: 'GPU 集群的方案里，卡不是唯一贵的东西',
        lessons: ['l4-ai/gpu-operator', 'l4-ai/ai-scheduling'],
      },
      {
        title: '交付前要想清楚的事',
        hint: '签字之前先知道交付以后会踩什么坑',
        lessons: ['l1-basics/rbac', 'l3-platform-ops/multi-tenancy', 'l3-platform-ops/oncall'],
      },
    ],
  },
  {
    id: 'cluster-ops',
    title: '集群运维工程师',
    alias: 'K8s 平台 · GPU 集群 · 完整主线',
    tagline: '集群是你的产品，L0 到 L4 一节不落',
    desc: '本站不做裁剪的那条主线：先用 Docker 把容器与镜像打牢，再在 kind 集群上吃透对象与调度，接着定机型、装生产集群并逐层选型（CNI、CSI、LB、Gateway），然后接上观测与仓库、扛住升级与故障，最后走进 GPU 与 AI 负载的战场。',
    outcomes: [
      '独立部署并运维生产级集群，扛住节点失联、控制面扩缩与版本升级',
      '把网络、存储、监控、镜像仓库接成一个能交付给业务的平台',
      '让 GPU 集群跑得起多机多卡训练与大模型推理，并说得清资源账',
    ],
    layout: 'catalog',
    stages: tracks.map((track) => ({
      trackId: track.id,
      title: `${track.level} ${track.title}`,
      hint: track.goal,
      lessons: track.lessons.map((lesson) => lessonKey(track.id, lesson.id)),
    })),
  },
  {
    id: 'storage-ops',
    title: '存储运维工程师',
    alias: '存储 SRE · Ceph / GPFS 侧',
    tagline: 'K8s 不是你的产品，但 PVC 出事总是先找你',
    desc: '你管的是 Ceph、GPFS 这些后端，K8s 是它们的一个大客户。这条线只学接入与排障用得上的那部分集群原理，不碰集群部署、CNI 深水区和 AI 调度。',
    outcomes: [
      '看懂一个 PVC 从申请到挂进容器的全过程，知道每一步该看谁的日志',
      '把 Ceph 或 GPFS 通过 CSI 接进集群，并跑通快照与在线扩容',
      '面对「Pod 起不来」「挂载卡住」拿得出证据，说清是存储侧还是集群侧的问题',
    ],
    stages: [
      {
        title: '先看懂容器与节点',
        hint: '存储最终挂在节点上，先知道那台机器上发生了什么',
        lessons: [
          'l0-container/container-runtime',
          'l0-container/docker-basics',
          'l0-container/containerd-cri',
        ],
      },
      {
        title: '够用的 K8s 心智模型',
        hint: '本机起一套 kind 集群练手：先会查，再知道对象是怎么变成节点上的挂载点的',
        lessons: [
          'l1-basics/kind-cluster',
          'l1-basics/kubectl-toolbox',
          'l1-basics/architecture',
          'l1-basics/declarative',
          'l1-basics/api-objects',
          'l1-basics/kubelet-lifecycle',
        ],
      },
      {
        title: '把后端存储接进集群',
        hint: '这条线的主课：从 PVC 语义到 CSI 落地，再到卡住时怎么查',
        lessons: [
          'l2-production/os-tuning',
          'l2-production/k8s-storage',
          'l2-production/csi-practice',
          'l2-production/quest-pvc-pending',
        ],
      },
      {
        title: '日常与协作',
        hint: '节点维护会动到挂载，容量水位要提前两周看出来',
        lessons: [
          'l3-platform-ops/node-ops',
          'l3-platform-ops/observability',
          'l3-platform-ops/oncall',
        ],
      },
    ],
  },
]

/* ---------- 派生查询 ---------- */

export interface PathItem {
  key: string
  track: Track
  lesson: Lesson
  /** 在整条路线里的序号，1 起 */
  index: number
}

export interface PathStage {
  stage: RoleStage
  items: PathItem[]
  minutes: number
}

export interface RolePath {
  role: Role
  stages: PathStage[]
  items: PathItem[]
  lessonCount: number
  minutes: number
}

/** 完整主线那条路线的 id，阶段目录里的课程链接都挂在它上面 */
export const MAINLINE_ROLE_ID = 'cluster-ops'

export function getRole(roleId: string | undefined): Role | undefined {
  return roles.find((role) => role.id === roleId)
}

/** 把一条路线的课程键解析成课程对象，并按路线顺序编号 */
export function rolePath(roleId: string | undefined): RolePath | undefined {
  const role = getRole(roleId)
  if (!role) return undefined

  let index = 0
  const stages = role.stages.map((stage) => {
    const items = stage.lessons.flatMap<PathItem>((key) => {
      const [trackId, lessonId] = key.split('/')
      const found = trackId && lessonId ? getLesson(trackId, lessonId) : undefined
      if (!found) {
        // 键写错时丢掉这一条，不让整个首页崩掉
        if (import.meta.env.DEV) console.warn(`[roles] 课程键无效：${key}`)
        return []
      }
      index += 1
      return [{ key, track: found.track, lesson: found.lesson, index }]
    })
    return {
      stage,
      items,
      minutes: items.reduce((sum, item) => sum + item.lesson.minutes, 0),
    }
  })

  const items = stages.flatMap((stage) => stage.items)
  return {
    role,
    stages,
    items,
    lessonCount: items.length,
    minutes: items.reduce((sum, item) => sum + item.lesson.minutes, 0),
  }
}

/** 课程页的路线模式：这节课在这条路线的第几节、属于哪一段、前后是哪两节 */
export function roleNav(roleId: string | undefined, key: string) {
  const path = rolePath(roleId)
  if (!path) return undefined

  const at = path.items.findIndex((item) => item.key === key)
  if (at === -1) return { path, current: undefined, stage: undefined, prev: undefined, next: undefined }

  return {
    path,
    current: path.items[at],
    stage: path.stages.find((stage) => stage.items.some((item) => item.key === key))?.stage,
    prev: at > 0 ? path.items[at - 1] : undefined,
    next: at < path.items.length - 1 ? path.items[at + 1] : undefined,
  }
}
