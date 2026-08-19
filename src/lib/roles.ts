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
        title: '对象与语义',
        hint: '方案里每写一个词，都得知道它落到集群上是什么东西',
        lessons: [
          'l1-core/architecture',
          'l1-core/declarative',
          'l1-core/api-objects',
          'l1-core/networking-model',
        ],
      },
      {
        title: '把需求写成集群规格',
        hint: '这条线的主课，计算器在这一段',
        lessons: [
          'l0-foundation/cluster-plan',
          'l0-foundation/hardware-topology',
          'l0-foundation/etcd-disk',
          'l4-advanced/capacity-planning',
        ],
      },
      {
        title: '平台能力版图与选型',
        hint: '知道每一层有什么可选、各自强在哪，才谈得上「为什么选它」',
        lessons: [
          'l3-platform/cni-cilium',
          'l3-platform/k8s-storage',
          'l3-platform/observability',
          'l4-advanced/gpu-operator',
          'l4-advanced/ai-scheduling',
        ],
      },
      {
        title: '交付前要想清楚的事',
        hint: '签字之前先知道交付以后会踩什么坑',
        lessons: ['l1-core/rbac', 'l4-advanced/multi-tenancy', 'l4-advanced/oncall'],
      },
    ],
  },
  {
    id: 'cluster-ops',
    title: '集群运维工程师',
    alias: 'K8s 平台 · GPU 集群 · 完整主线',
    tagline: '集群是你的产品，L0 到 L4 一节不落',
    desc: '本站不做裁剪的那条主线：先把容器与节点底座打牢，吃透控制面与调度，再用 kubespray 把集群装出来扛住升级与故障，最后接上网络、存储、观测，走进 GPU 与 AI 负载的战场。',
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
          'l0-foundation/container-runtime',
          'l0-foundation/containerd-cri',
          'l0-foundation/os-tuning',
          'l0-foundation/etcd-disk',
        ],
      },
      {
        title: '够用的 K8s 心智模型',
        hint: '不必会部署集群，但要知道一个对象是怎么变成节点上的挂载点的',
        lessons: [
          'l1-core/architecture',
          'l1-core/declarative',
          'l1-core/api-objects',
          'l1-core/kubelet-lifecycle',
        ],
      },
      {
        title: '把后端存储接进集群',
        hint: '这条线的主课：从 PVC 语义到 CSI 落地，再到卡住时怎么查',
        lessons: [
          'l2-cluster/kubectl-toolbox',
          'l3-platform/k8s-storage',
          'l3-platform/csi-practice',
          'l3-platform/quest-pvc-pending',
        ],
      },
      {
        title: '日常与协作',
        hint: '节点维护会动到挂载，容量水位要提前两周看出来',
        lessons: ['l2-cluster/node-ops', 'l3-platform/observability', 'l4-advanced/oncall'],
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
