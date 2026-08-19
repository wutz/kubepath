/**
 * 课程大纲 —— 全站唯一数据源。
 * 阶段页、课程页、实验索引、岗位路线、进度统计都从这里派生。
 *
 * status: 'ready'   已有正文（src/content/<trackId>/<lessonId>.mdx）
 *         'planned' 仅有大纲，课程页会渲染大纲占位
 */

export type LessonKind = 'concept' | 'lab' | 'quest' | 'planner'
export type LessonStatus = 'ready' | 'planned'

export interface LessonRef {
  label: string
  /** 外部链接；本地仓库路径留空，按代码样式展示 */
  href?: string
  path?: string
}

export interface Lesson {
  id: string
  title: string
  summary: string
  kind: LessonKind
  status: LessonStatus
  /** 预计学习时长（分钟） */
  minutes: number
  /** 学完能做什么 */
  objectives: string[]
  /** 小节大纲 */
  outline: string[]
  refs?: LessonRef[]
}

export interface Track {
  id: string
  level: string
  title: string
  subtitle: string
  goal: string
  /** Tailwind 类名片段，用于阶段配色 */
  accent: {
    text: string
    bg: string
    border: string
    dot: string
  }
  lessons: Lesson[]
}

export const KIND_LABEL: Record<LessonKind, string> = {
  concept: '原理',
  lab: '实验',
  quest: '闯关',
  planner: '规划',
}

export const KIND_STYLE: Record<LessonKind, string> = {
  concept: 'bg-gray-100 text-gray-600',
  lab: 'bg-emerald-100 text-emerald-700',
  quest: 'bg-amber-100 text-amber-700',
  planner: 'bg-violet-100 text-violet-700',
}

/** k8s-in-action 手册里的具体章节，课程页按代码样式展示路径 */
const repo = (path: string): LessonRef => ({ label: 'k8s-in-action', path })
const REF_UPSTREAM: LessonRef = { label: 'Kubernetes 官方文档', href: 'https://kubernetes.io/zh-cn/docs/home/' }
const REF_STORPATH: LessonRef = { label: 'Storpath 存储工程师成长路径', href: 'https://storpath.wutz.dev/' }
const REF_NETPATH: LessonRef = { label: 'Netpath 网络工程师成长路径', href: 'https://netpath.wutz.dev/' }

export const tracks: Track[] = [
  {
    id: 'l0-foundation',
    level: 'L0',
    title: '底座与前置',
    subtitle: '容器、节点与集群规划',
    goal: 'K8s 装在机器上，机器不合格集群就立不住。这一阶段解决三件事：容器到底是什么、节点要调成什么样、集群规模与命名怎么定。',
    accent: {
      text: 'text-sky-700',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      dot: 'bg-sky-500',
    },
    lessons: [
      {
        id: 'container-runtime',
        title: '容器到底是什么：namespace、cgroup 与镜像',
        summary: '容器不是轻量虚拟机，是被内核圈起来的一组进程。这个认知决定了你后面所有排障的方向。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '说清 namespace 隔离了什么、cgroup 限制了什么，以及两者都管不到什么',
          '解释镜像分层与写时复制，判断容器磁盘占用为什么和镜像大小对不上',
          '在宿主机上找到某个容器进程的真实 PID、cgroup 路径与挂载点',
        ],
        outline: [
          '从一个进程说起：容器不是虚拟机',
          '六种 namespace 各自隔离了什么',
          'cgroup v2：CPU 与内存限制怎么落到内核',
          '镜像分层、OverlayFS 与写时复制',
          '容器里看到的 /proc 为什么会骗人',
        ],
        refs: [REF_UPSTREAM],
      },
      {
        id: 'containerd-cri',
        title: '运行时与 CRI：kubelet 底下发生了什么',
        summary: 'kubelet 自己不会跑容器，它通过 CRI 指挥 containerd。这条链路断在哪，节点就 NotReady 在哪。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '画出 kubelet → CRI → containerd → runc 的完整调用链',
          '用 crictl 直接排查 kubectl 看不到的容器状态',
          '解释 pause 容器的作用，以及 Pod 内容器为什么能共享网络',
        ],
        outline: [
          'CRI 接口：RuntimeService 与 ImageService',
          'containerd 的架构与 namespace（k8s.io）',
          'pause 容器与 Pod sandbox',
          'crictl 常用命令：ps / inspect / logs / imagefs',
          '镜像拉取失败的四类原因与定位顺序',
        ],
        refs: [repo('k8s/faq.md'), REF_UPSTREAM],
      },
      {
        id: 'os-tuning',
        title: '节点 OS 基线：装 K8s 之前要改的那些参数',
        summary: '内核参数、cgroup 驱动、时间同步、swap —— 这些没对齐，集群会以各种诡异的方式间歇性出问题。',
        kind: 'lab',
        status: 'planned',
        minutes: 35,
        objectives: [
          '给一台新机器跑完上线前的 OS 检查清单',
          '解释为什么 systemd cgroup 驱动必须和 containerd 保持一致',
          '判断 conntrack、文件句柄、内核版本是否够撑住目标 Pod 密度',
        ],
        outline: [
          '内核版本与必需模块（br_netfilter、overlay、nf_conntrack）',
          'sysctl 清单：转发、conntrack、inotify、文件句柄',
          'cgroup v2 与 systemd 驱动对齐',
          'swap、透明大页与 NUMA',
          '时间同步：证书与 etcd 都靠它',
        ],
        refs: [repo('k8s/os/README.md'), repo('base/kube-node-tuning/README.md')],
      },
      {
        id: 'etcd-disk',
        title: 'etcd 磁盘验收：p99 fsync 10ms 这条硬线',
        summary: '集群卡顿、频繁选主、apiserver 超时，追到底常常是一块不合格的盘。这条线部署前就能用 fio 测出来。',
        kind: 'lab',
        status: 'ready',
        minutes: 35,
        objectives: [
          '用 fio 复现 etcd 的 WAL 写入模式，并读懂 sync percentiles 输出',
          '说清哪些存储介质绝对不能给 etcd 用，以及为什么',
          '部署后用 PromQL 持续盯住 fsync、backend commit 与选主次数',
        ],
        outline: [
          'Raft 为什么每次提案都要 fsync',
          '硬件要求：独占 NVMe，禁用网络存储',
          '部署前必测：fio --fdatasync=1 的参数逐个解释',
          '结果判定：99.00th < 10000 usec',
          '部署后监控：三个关键指标与官方告警阈值',
        ],
        refs: [repo('k8s/etcd-disk-performance.md'), REF_STORPATH],
      },
      {
        id: 'cluster-plan',
        title: '集群规划与命名：把方案写成一张表',
        summary: '几个控制面、几段网络、节点怎么命名 —— 这些在装机之前定下来，后面两年都不用返工。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '按地区、集群、DNS、节点四层规则给一套新集群命名',
          '规划 Pod / Service / 节点三段网络，并算出它们够撑多大规模',
          '决定控制面节点数、是否复用负载均衡节点、GPU 节点怎么分组',
        ],
        outline: [
          '命名规则：地区机房、集群、DNS、节点角色缩写',
          '控制面 3 / 5 / 7 节点怎么选',
          '网段规划：Pod CIDR、Service CIDR、节点 CIDR 掩码',
          '网络要求：内网、存储复制网、外网接入',
          '把规划落成 kubespray inventory 的对应字段',
        ],
        refs: [repo('k8s/plan/README.md')],
      },
      {
        id: 'hardware-topology',
        title: '硬件与拓扑：控制面、计算节点与 GPU 机型',
        summary: '同样是「三台管理节点 + 若干计算节点」，配错 CPU、网卡或盘位，跑起来的差距是数量级的。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '给控制面、CPU 计算、GPU 计算三类节点各开一份合理配置',
          '说清 GPU 节点上 NUMA、网卡与 GPU 的亲和性为什么影响训练性能',
          '判断什么场景需要 RoCE / InfiniBand，什么场景以太网就够',
        ],
        outline: [
          '控制面规格：CPU、内存与 etcd 盘',
          '计算节点：Pod 密度、系统预留与超卖',
          'GPU 节点：卡型、PCIe 拓扑、NUMA 亲和',
          '网络：管理网、业务网、存储网与 RDMA',
          '故障域：机架、电源与调度约束的对应关系',
        ],
        refs: [repo('k8s/plan/README.md'), REF_NETPATH],
      },
    ],
  },
  {
    id: 'l1-core',
    level: 'L1',
    title: '核心原理',
    subtitle: '控制面、对象与调度',
    goal: '所有排障最终都会回到这一层：一个对象写进 etcd 之后，是谁在看着它、把它变成节点上真实运行的进程。',
    accent: {
      text: 'text-indigo-700',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      dot: 'bg-indigo-500',
    },
    lessons: [
      {
        id: 'architecture',
        title: '控制面解剖：一次 kubectl apply 的全过程',
        summary: '把 apiserver、etcd、scheduler、controller-manager、kubelet 串成一条链，之后每个故障都能定位到具体环节。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '按顺序讲出 kubectl apply 之后发生的每一步，以及每步的负责组件',
          '说清 apiserver 为什么是唯一入口，其它组件之间为什么不直接通信',
          '知道每个控制面组件挂掉之后集群还能做什么、不能做什么',
        ],
        outline: [
          '控制面与数据面的分工',
          'apiserver：认证、鉴权、准入、持久化',
          'etcd：唯一状态存储与 watch 机制',
          'scheduler：只负责写 nodeName 这一个字段',
          'controller-manager：一堆 reconcile 循环',
          'kubelet 与 kube-proxy：节点上的两个执行者',
          '组件挂掉时的影响面对照表',
        ],
        refs: [REF_UPSTREAM],
      },
      {
        id: 'declarative',
        title: '声明式模型与控制器循环',
        summary: '理解 reconcile，就理解了 K8s 的全部脾气：它不执行命令，它只是不停地把现状拉向期望。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '解释期望态 / 实际态 / reconcile 三者的关系',
          '读懂对象的 spec 与 status 分工，以及 ownerReferences 的级联删除',
          '说清 finalizer 卡住时资源为什么删不掉，该怎么处理',
        ],
        outline: [
          '命令式与声明式的区别',
          'spec / status 与控制器的职责边界',
          'watch、informer 与 resourceVersion',
          'ownerReferences 与级联删除',
          'finalizer：删不掉的 Namespace 从哪来',
          'CRD 与 Operator：把运维知识写成控制器',
        ],
        refs: [REF_UPSTREAM],
      },
      {
        id: 'api-objects',
        title: '工作负载对象：Deployment 到 StatefulSet',
        summary: '选错工作负载类型，后面所有的滚动更新、扩缩容和存储绑定都会别扭。',
        kind: 'concept',
        status: 'planned',
        minutes: 35,
        objectives: [
          '给定一个业务形态，选出合适的工作负载类型并说明理由',
          '讲清 StatefulSet 的稳定网络标识与 volumeClaimTemplates 意味着什么',
          '配置滚动更新策略，控制发布过程中的可用副本数',
        ],
        outline: [
          'Pod：最小调度单位与多容器模式',
          'ReplicaSet 与 Deployment 的滚动更新',
          'StatefulSet：有序、稳定标识与独立存储',
          'DaemonSet：每节点一个的系统组件',
          'Job / CronJob 与失败重试语义',
          'ConfigMap、Secret 与配置热更新的边界',
        ],
        refs: [REF_UPSTREAM],
      },
      {
        id: 'scheduling',
        title: '调度器：Pod 为什么落在这台节点上',
        summary: 'requests 决定调度，limits 决定运行。这两个字段配错，集群要么调不满，要么一压就崩。',
        kind: 'concept',
        status: 'planned',
        minutes: 35,
        objectives: [
          '区分 requests 与 limits 的作用时机，说清三种 QoS 的驱逐顺序',
          '用亲和性、污点容忍与拓扑分布约束控制 Pod 落点',
          '读懂 Pending Pod 的 Events，判断是资源不足还是约束冲突',
        ],
        outline: [
          '调度两阶段：过滤（Predicates）与打分（Priorities）',
          'requests / limits 与 QoS：Guaranteed、Burstable、BestEffort',
          'nodeSelector、亲和与反亲和',
          '污点与容忍：节点专用与故障隔离',
          'topologySpreadConstraints：把副本摊开',
          '优先级、抢占与 PodDisruptionBudget',
        ],
        refs: [REF_UPSTREAM],
      },
      {
        id: 'kubelet-lifecycle',
        title: 'kubelet 与 Pod 生命周期：探针、驱逐与预留',
        summary: 'CrashLoopBackOff、Evicted、ContainerCreating —— 这三个状态背后是 kubelet 的三套完全不同的逻辑。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '正确配置 startup / liveness / readiness 三种探针，避免自杀式重启',
          '解释节点资源预留与驱逐阈值，算出一台节点真正可分配多少资源',
          '按 Pod 状态选择正确的排查入口（describe、logs、events、节点侧）',
        ],
        outline: [
          'Pod 阶段与容器状态机',
          '三种探针的语义差异与常见误配',
          'kube-reserved / system-reserved / eviction-threshold',
          '内存压力驱逐与 OOMKilled 的区别',
          '优雅终止：terminationGracePeriod 与 preStop',
          '按状态选排查入口的对照表',
        ],
        refs: [REF_UPSTREAM],
      },
      {
        id: 'networking-model',
        title: 'K8s 网络模型：Pod IP、Service 与 DNS',
        summary: '「每个 Pod 一个可路由 IP」这条约定，是理解 Service、CNI 和所有网络故障的起点。',
        kind: 'concept',
        status: 'planned',
        minutes: 35,
        objectives: [
          '说出 K8s 网络模型的三条基本约定，以及 CNI 负责实现哪一部分',
          '区分 ClusterIP、Headless、NodePort、LoadBalancer 的适用场景',
          '追踪一次跨节点访问 Service 的完整数据路径',
        ],
        outline: [
          '网络模型三条约定与扁平地址空间',
          'CNI 做什么、不做什么',
          'Service 四种类型与各自的实现者',
          'kube-proxy 的 iptables 与 IPVS 模式',
          'CoreDNS 与服务发现，ndots 带来的解析放大',
          '南北向：Ingress 与 Gateway API 的位置',
        ],
        refs: [repo('network/README.md'), REF_NETPATH],
      },
      {
        id: 'rbac',
        title: '认证、授权与 ServiceAccount',
        summary: '谁能动这个集群、能动到什么程度 —— 交付前必须回答清楚，交付后再补就是一场大手术。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '区分认证与授权两个阶段，说清用户和 ServiceAccount 的不同来源',
          '为一个团队设计最小权限的 Role / RoleBinding 组合',
          '用 kubectl auth can-i 验证权限，排查 Forbidden 报错',
        ],
        outline: [
          '认证方式：证书、Token、OIDC',
          'ServiceAccount 与投射 Token',
          'Role 与 ClusterRole 的作用域差异',
          'RoleBinding / ClusterRoleBinding 的四种组合',
          '最小权限实践与常见过度授权',
          '给外部用户签发 kubeconfig 的完整流程',
        ],
        refs: [repo('k8s/sa-management/README.md')],
      },
    ],
  },
  {
    id: 'l2-cluster',
    level: 'L2',
    title: '部署与运维',
    subtitle: '主战场：从装出来到扛得住',
    goal: '这一阶段是集群运维的主课：用 kubespray 把集群装出来，然后经历扩缩、升级、备份、节点故障这些必然会来的事。',
    accent: {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    lessons: [
      {
        id: 'kubespray-deploy',
        title: '用 kubespray 装出第一套集群',
        summary: '不是 kubeadm 敲一遍就完事：inventory 怎么写、离线源怎么配、装完先验什么。',
        kind: 'lab',
        status: 'planned',
        minutes: 45,
        objectives: [
          '按规划写出 inventory.ini 与 group_vars，跑完一次完整部署',
          '说清 kubespray 与 kubeadm 的关系，出错时知道该看哪一层',
          '部署完成后按验收清单确认集群可用',
        ],
        outline: [
          'kubespray 版本选择与目录结构',
          'inventory.ini：节点角色划分',
          'group_vars 关键项：网络插件、镜像仓库、证书有效期',
          '离线部署：镜像与二进制包预置',
          '执行 cluster.yml 与失败重跑',
          '部署后验收清单',
        ],
        refs: [repo('k8s/kubespray/README.md'), repo('k8s/README.md')],
      },
      {
        id: 'inventory-vars',
        title: '把规划写进配置：group_vars 逐项拆解',
        summary: '同一份 playbook，配置写法决定了集群是能用两年还是三个月后推倒重来。',
        kind: 'lab',
        status: 'planned',
        minutes: 35,
        objectives: [
          '逐项解释 k8s-cluster.yml 里影响长期运维的关键变量',
          '配置容器运行时、镜像仓库镜像源与证书有效期',
          '用 addons.yml 选择随集群一起装的组件，并说明为什么不全开',
        ],
        outline: [
          'all.yml：全局与代理设置',
          'k8s-cluster.yml：网络插件、CIDR、kube-proxy 模式',
          'containerd.yml：镜像仓库与私有源',
          'etcd.yml：数据目录与部署方式',
          'addons.yml：哪些该装、哪些该自己管',
          '配置改动后如何安全重跑',
        ],
        refs: [repo('k8s/kubespray/kubespray-2.31.0/README.md')],
      },
      {
        id: 'kubectl-toolbox',
        title: '客户端工具箱：kubectl、kustomize、helm',
        summary: '手上快十倍靠的不是记命令，是把 kubectl 输出、kustomize 分层和 helm 发布用在对的地方。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '用 -o jsonpath、--sort-by、events 等把 kubectl 用出调查工具的样子',
          '用 kustomize 分层管理多环境清单，不再复制粘贴 YAML',
          '判断什么该用 helm、什么该用原生清单，并处理 release 卡住的情况',
        ],
        outline: [
          'kubectl 输出控制与常用调查姿势',
          'kubeconfig 多集群上下文管理',
          'kustomize：base 与 overlay 分层',
          'helm：values、模板与 release 生命周期',
          'helmwave：批量编排多个 chart',
          '图形客户端与其它趁手工具',
        ],
        refs: [repo('k8s/client.md')],
      },
      {
        id: 'node-ops',
        title: '节点生命周期：加入、维护、下线',
        summary: 'cordon、drain、delete 三步之间的差别，决定了一次夜间维护是平稳还是事故。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '安全地把一台节点摘出集群做维护，再原样放回去',
          '处理 drain 卡住的三类常见原因（PDB、DaemonSet、本地存储）',
          '给新节点扩容并确认它真正参与了调度',
        ],
        outline: [
          '扩容节点：scale.yml 与手工 join',
          'cordon / drain / uncordon 的语义差异',
          'drain 卡住：PDB、裸 Pod、emptyDir 与本地卷',
          '节点下线的完整清单（含存储与网络侧）',
          '批量维护与滚动重启节奏',
        ],
        refs: [repo('k8s/kubespray/kubespray-2.28.0/control-plane-scale.md')],
      },
      {
        id: 'control-plane-scale',
        title: '控制面扩缩与证书轮转',
        summary: '3 台变 5 台、换掉一台坏掉的管理节点、证书还有 30 天到期 —— 都是不能试错的操作。',
        kind: 'lab',
        status: 'planned',
        minutes: 35,
        objectives: [
          '在不中断服务的前提下增删一台控制面节点',
          '同步处理 etcd 成员变更，避免 quorum 丢失',
          '检查并轮转集群证书，处理已过期的场面',
        ],
        outline: [
          '控制面节点数与 etcd quorum 的关系',
          '新增控制面：证书、etcd 成员、负载均衡配置',
          '替换故障控制面节点的顺序',
          '证书有效期检查与轮转',
          '操作前的备份与回滚预案',
        ],
        refs: [repo('k8s/kubespray/kubespray-2.28.0/control-plane-scale.md')],
      },
      {
        id: 'upgrade',
        title: '集群升级：版本偏差与回滚预案',
        summary: '升级本身不难，难的是升到一半发现回不去。先把回滚路径想清楚再动手。',
        kind: 'lab',
        status: 'planned',
        minutes: 40,
        objectives: [
          '查清目标版本的 API 弃用项与组件版本偏差约束',
          '按控制面 → 节点的顺序完成一次滚动升级',
          '给每一步准备可执行的回滚动作，而不只是「再升回去」',
        ],
        outline: [
          '版本偏差策略与跳版本的限制',
          '升级前检查：API 弃用、CRD、插件兼容性',
          'upgrade-cluster.yml 的执行顺序与 serial 控制',
          '业务侧配合：PDB 与滚动节奏',
          '失败场景与回滚边界（etcd 是单向门）',
        ],
        refs: [repo('k8s/kubespray/kubespray-2.31.0/kubespray-changes.md')],
      },
      {
        id: 'etcd-ops',
        title: 'etcd 运维：备份、恢复与碎片整理',
        summary: '集群其它东西都能重建，etcd 不能。这一节练的是「真的能恢复」，不是「有备份」。',
        kind: 'lab',
        status: 'planned',
        minutes: 35,
        objectives: [
          '做一次快照备份，并在测试环境完整恢复出集群',
          '处理 etcd 空间告警：defrag、compact 与告警解除',
          '判断 etcd 集群是否健康，读懂成员列表与 endpoint status',
        ],
        outline: [
          'etcdctl 连接参数与常用子命令',
          'snapshot save / restore 全流程',
          '存储配额、自动压缩与碎片整理',
          'mvcc: database space exceeded 的处置',
          '成员健康检查与故障成员替换',
          '备份策略：频率、异地与恢复演练',
        ],
        refs: [repo('k8s/faq.md'), repo('k8s/etcd-disk-performance.md')],
      },
      {
        id: 'quest-node-notready',
        title: '闯关：一台节点变成 NotReady',
        summary: '在模拟终端里接手一台刚刚失联的节点，从现象一路追到根因。',
        kind: 'quest',
        status: 'planned',
        minutes: 35,
        objectives: [
          '按固定顺序收敛 NotReady 的可能原因，而不是随机试',
          '在节点侧读 kubelet 日志与 containerd 状态，判断断点在哪一层',
          '给出处置动作，并说明什么情况下该直接摘掉这台节点',
        ],
        outline: [
          '第一现场：kubectl get node 与 describe',
          '节点侧：kubelet 服务状态与日志',
          '运行时侧：containerd、crictl 与磁盘压力',
          '网络侧：到 apiserver 的连通性与证书',
          '处置与复盘',
        ],
        refs: [repo('k8s/faq.md')],
      },
    ],
  },
  {
    id: 'l3-platform',
    level: 'L3',
    title: '平台能力',
    subtitle: '网络、存储与可观测性',
    goal: '裸集群交付不出去。这一阶段把网络、存储、监控和镜像分发接上，让平台真的能承载业务。',
    accent: {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    lessons: [
      {
        id: 'cni-cilium',
        title: 'CNI 与 Cilium：eBPF 数据面',
        summary: 'CNI 选型是集群建成后最难改的决定之一。这一节把 Cilium 的能力边界讲清楚再动手装。',
        kind: 'lab',
        status: 'planned',
        minutes: 40,
        objectives: [
          '说清主流 CNI 的差异，给出选型理由而不是只报名字',
          '部署 Cilium 并用它替换 kube-proxy，验证 Service 仍然可达',
          '用 cilium 命令行排查 Pod 间不通的问题',
        ],
        outline: [
          'CNI 规范与常见实现的路线差异',
          'Cilium 架构：eBPF、Envoy 与 Hubble',
          '部署与关键 values（kube-proxy replacement、隧道模式）',
          '数据路径验证与 Hubble 观测',
          '与底层网络的配合：BGP、直连路由、MTU',
        ],
        refs: [repo('network/cilium/README.md'), REF_NETPATH],
      },
      {
        id: 'service-ingress',
        title: '把服务暴露出去：MetalLB、Ingress 与 Gateway API',
        summary: '私有集群没有云厂商的 LB，LoadBalancer 那个 IP 得你自己变出来。',
        kind: 'lab',
        status: 'planned',
        minutes: 35,
        objectives: [
          '用 MetalLB 给 LoadBalancer 类型的 Service 分配可路由 IP',
          '部署 Ingress Nginx 并配置 TLS 证书的自动签发',
          '说清 Ingress 与 Gateway API 的差异，判断新项目该用哪个',
        ],
        outline: [
          'LoadBalancer 在私有环境的实现方式（L2 与 BGP）',
          'MetalLB 地址池与通告模式',
          'Ingress Nginx 部署与常用注解',
          'cert-manager 自动签发与续期',
          'Gateway API：角色分离与迁移路径',
        ],
        refs: [
          repo('network/metallb/README.md'),
          repo('network/ingress-nginx/SKILL.md'),
          repo('network/cert-manager/SKILL.md'),
        ],
      },
      {
        id: 'network-policy',
        title: '网络策略与多租户隔离',
        summary: '默认全通的集群，一个租户的 Pod 可以直接连另一个租户的数据库。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '写出默认拒绝 + 按需放行的 NetworkPolicy 组合',
          '解释 NetworkPolicy 的生效前提与常见失效原因',
          '判断什么场景需要上 Cilium 的 L7 策略',
        ],
        outline: [
          'NetworkPolicy 语义：白名单与叠加规则',
          '默认拒绝的正确写法',
          '跨命名空间与 DNS 放行的坑',
          'Cilium NetworkPolicy 与 L7 规则',
          '隔离方案对比：策略、命名空间、独立集群',
        ],
        refs: [repo('security/cilium'), repo('network/cilium/README.md')],
      },
      {
        id: 'k8s-storage',
        title: 'PV、PVC、StorageClass 与 CSI',
        summary: '一个 PVC 从 Pending 到挂进容器，中间经过四个组件。知道是哪四个，排障就有了方向。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '讲清 PV / PVC / StorageClass 三者的职责边界与动态供应流程',
          '按业务场景选对 accessModes 与 reclaimPolicy',
          '区分「卷创建不出来」和「卷挂不上」，分别去看哪个组件的日志',
        ],
        outline: [
          '临时卷与持久卷',
          'PV / PVC / SC 的职责与动态供应',
          'accessModes：RWO 不等于单 Pod',
          'reclaimPolicy 与 volumeBindingMode',
          'CSI 架构：controller 与 node 两侧',
          '按现象选排查入口',
        ],
        refs: [repo('storage/README.md'), REF_STORPATH],
      },
      {
        id: 'csi-practice',
        title: '接入后端存储：ceph-csi、gpfs-csi 与快照',
        summary: '把已有的 Ceph 或 GPFS 接进集群，跑通动态供应、扩容和快照这三件事。',
        kind: 'lab',
        status: 'planned',
        minutes: 40,
        objectives: [
          '部署一个 CSI 驱动并创建可用的 StorageClass',
          '验证动态供应、在线扩容与卷快照的完整链路',
          '为不同业务选择块存储还是共享文件存储',
        ],
        outline: [
          'ceph-csi-rbd 与 ceph-csi-cephfs 的差异',
          'gpfs-csi：把 owning / accessing 集群接进来',
          'StorageClass 参数与 secret 管理',
          'VolumeSnapshot 与 external-snapshotter',
          '在线扩容的前提条件',
          '本地盘方案：local-storage 的适用边界',
        ],
        refs: [
          repo('storage/ceph-csi-rbd/README.md'),
          repo('storage/gpfs-csi/README.md'),
          repo('storage/volumesnapshots/README.md'),
        ],
      },
      {
        id: 'quest-pvc-pending',
        title: '闯关：PVC 一直 Pending，业务起不来',
        summary: '模拟终端里给你一个卡了十分钟的 PVC，按目标一步步定位到真正的根因。',
        kind: 'quest',
        status: 'ready',
        minutes: 30,
        objectives: [
          '用 events 而不是猜测来定位 PVC 卡住的原因',
          '分清 PVC Pending 与 Pod ContainerCreating 两类故障的排查路径',
          '读懂 CSI provisioner 日志里的关键报错',
        ],
        outline: [
          '看现象：PVC 状态与 StorageClass',
          '看 events：让集群自己说话',
          '看 provisioner 日志',
          '定位后端：容量、认证还是拓扑',
          '总结一张排查路径图',
        ],
        refs: [repo('storage/ceph-csi-rbd/README.md')],
      },
      {
        id: 'observability',
        title: '可观测性：指标、日志与该盯的那几个数',
        summary: '监控装了一堆面板，出事时还是不知道看哪个 —— 因为没先定义「什么算不正常」。',
        kind: 'lab',
        status: 'planned',
        minutes: 40,
        objectives: [
          '部署 VictoriaMetrics 与日志采集，把集群指标收上来',
          '列出控制面、节点、工作负载三层各自必须盯的指标',
          '写出几条真正会响、且响了就有动作的告警规则',
        ],
        outline: [
          '指标体系：VictoriaMetrics 与 exporter 分工',
          '控制面必看：apiserver 延迟、etcd fsync、选主次数',
          '节点必看：资源压力、kubelet 与运行时状态',
          '工作负载：重启、驱逐与 OOM',
          '日志采集与检索',
          '告警设计：可动作、有阈值、不重复',
        ],
        refs: [repo('o11y/README.md'), repo('addons/metrics-server/README.md')],
      },
      {
        id: 'registry',
        title: '镜像仓库与分发：Harbor、Spegel 与离线源',
        summary: '几百个节点同时拉一个 10G 的镜像，仓库和网络会先倒下。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '搭出一套私有镜像仓库并接入集群的拉取凭据',
          '用 P2P 分发缓解大规模并发拉取的带宽压力',
          '为离线环境准备镜像、PyPI 与 Conda 源',
        ],
        outline: [
          'Harbor：项目、配额与镜像复制',
          'imagePullSecrets 与全局凭据配置',
          'Spegel：节点间共享已有镜像层',
          'Dragonfly：P2P 分发大镜像',
          '离线源：PyPI 与 Conda 镜像',
          '镜像瘦身与拉取策略',
        ],
        refs: [repo('repo/README.md'), repo('base/spegel/README.md')],
      },
    ],
  },
  {
    id: 'l4-advanced',
    level: 'L4',
    title: '进阶战场',
    subtitle: 'GPU、AI 负载与规模化',
    goal: '把集群从「能跑业务」推到「能跑 AI 训练与推理、能给多个租户用、能算清账」。',
    accent: {
      text: 'text-violet-700',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      dot: 'bg-violet-500',
    },
    lessons: [
      {
        id: 'gpu-operator',
        title: 'GPU 节点：GPU Operator、设备插件与拓扑',
        summary: '把一台插了八张卡的机器变成集群里可调度的 GPU 节点，比装个驱动复杂得多。',
        kind: 'lab',
        status: 'planned',
        minutes: 40,
        objectives: [
          '用 GPU Operator 完成驱动、容器运行时与设备插件的全套部署',
          '验证 Pod 真正拿到了 GPU，并确认拓扑与 NUMA 亲和',
          '排查「有卡但调度不上去」的常见原因',
        ],
        outline: [
          'GPU Operator 组件与部署顺序',
          '设备插件与 nvidia.com/gpu 资源',
          'NFD：把硬件特征打成节点标签',
          '拓扑感知：GPU、网卡与 NUMA 的绑定',
          'MIG 与共享方案的取舍',
          '常见故障：驱动版本、运行时配置、资源不可见',
        ],
        refs: [repo('ai/gpu-operator/README.md'), repo('base/nfd/README.md')],
      },
      {
        id: 'ai-scheduling',
        title: 'AI 负载调度：Volcano、Kueue 与 gang scheduling',
        summary: '默认调度器一个一个放 Pod，分布式训练要么全起要么别起 —— 这就是要换调度器的原因。',
        kind: 'concept',
        status: 'planned',
        minutes: 40,
        objectives: [
          '解释 gang scheduling 解决的死锁问题，以及默认调度器为什么做不到',
          '对比 Volcano、Kueue 与 scheduler-plugins 的定位与组合方式',
          '为多团队共享的 GPU 集群设计队列与配额',
        ],
        outline: [
          '分布式训练的资源死锁场景',
          'gang / co-scheduling 的实现思路',
          'Volcano：队列、作业与插件',
          'Kueue：配额借用与准入排队',
          'scheduler-plugins：最小侵入的选择',
          '三者对比与选型建议',
        ],
        refs: [repo('ai/scheduling-comparison.md'), repo('ai/volcano/README.md'), repo('ai/kueue/README.md')],
      },
      {
        id: 'ai-serving',
        title: '训练与推理平台：Trainer、Ray 与 vLLM',
        summary: '平台交付给算法团队的不是节点，是「提交一个作业」和「上线一个模型」这两个动作。',
        kind: 'concept',
        status: 'planned',
        minutes: 35,
        objectives: [
          '说清训练作业与推理服务对集群的不同要求',
          '选择合适的编排方式跑起一个多机多卡训练作业',
          '部署一个 LLM 推理服务，并说明扩缩容的难点在哪',
        ],
        outline: [
          'Trainer / MPI Operator：多机多卡作业编排',
          'KubeRay：RayCluster、RayJob 与 RayService',
          '推理侧：vLLM、SGLang 与 LWS 多机部署',
          'llm-d 与推理网关',
          '存储与网络对训练性能的影响',
          '基准测试：NCCL tests 与 nvbandwidth',
        ],
        refs: [repo('ai/README.md'), repo('ai/kuberay/README.md'), repo('ai/nccl-tests/README.md')],
      },
      {
        id: 'multi-tenancy',
        title: '多租户与虚拟集群：Kamaji、vcluster、k3k',
        summary: '「每个团队一套集群」和「所有团队一套集群」之间，还有一整排折中方案。',
        kind: 'concept',
        status: 'planned',
        minutes: 35,
        objectives: [
          '在命名空间隔离、虚拟集群、独立集群之间给出选型理由',
          '说清虚拟集群方案各自把控制面放在哪、代价是什么',
          '为多租户平台设计配额、隔离与计费的落点',
        ],
        outline: [
          '隔离强度谱系：命名空间 → 虚拟集群 → 独立集群',
          'Kamaji：控制面即 Pod',
          'vcluster 与 k3k 的差异',
          'ResourceQuota、LimitRange 与优先级',
          '租户的网络与存储隔离',
          '运维成本对比',
        ],
        refs: [repo('compute/README.md'), repo('compute/kamaji/README.md'), repo('compute/vcluster/README.md')],
      },
      {
        id: 'capacity-planning',
        title: '集群容量规划（计算器）',
        summary: '「我们要 100 张卡的集群」到底需要几台机器、控制面多大、能跑多少 Pod —— 这一节把账算出来。',
        kind: 'planner',
        status: 'ready',
        minutes: 40,
        objectives: [
          '从节点规格推出真正可分配的 CPU、内存与 Pod 数',
          '按集群规模选出控制面规格与 etcd 配置',
          '识别第一个撞上的限制：CPU、内存、Pod 密度还是 IP 段',
        ],
        outline: [
          '三刀账：系统预留、kube 预留、驱逐阈值',
          'Pod 密度上限与 CIDR 掩码的关系',
          '控制面规格随节点数与对象数的增长',
          '超卖比与 QoS 的配合',
          '用计算器验证一份真实需求',
        ],
        refs: [repo('k8s/plan/README.md'), REF_STORPATH],
      },
      {
        id: 'scale-limits',
        title: '规模化：apiserver 过载与大集群的限额',
        summary: '几十台的时候一切正常，几百台之后 list 一次 Pod 就能把控制面拖垮。',
        kind: 'concept',
        status: 'planned',
        minutes: 35,
        objectives: [
          '定位 apiserver 压力来源：谁在 list、谁在 watch',
          '用 APF（API Priority and Fairness）保住关键请求',
          '说出官方规模上限的几条硬约束，以及逼近时的表现',
        ],
        outline: [
          'apiserver 请求链路与缓存',
          '昂贵的 list：全量拉取与 resourceVersion',
          'API Priority and Fairness 配置',
          'etcd 对象数与大小限制',
          '大集群的调度延迟与 informer 压力',
          '拆集群的时机判断',
        ],
        refs: [REF_UPSTREAM],
      },
      {
        id: 'oncall',
        title: '值班手册与变更管理',
        summary: '把排查过程固化成 SOP，把每次事故变成一条检查项 —— 这是运维团队唯一的复利。',
        kind: 'concept',
        status: 'planned',
        minutes: 30,
        objectives: [
          '为常见告警写出可直接执行的处置 SOP',
          '建立变更窗口、双人复核与回滚检查清单',
          '主持一次不追责的故障复盘并产出改进项',
        ],
        outline: [
          '告警分级与响应时限',
          '常见故障的处置 SOP 模板',
          '变更管理：窗口、灰度、回滚',
          '故障复盘：时间线、根因、改进项',
          '知识沉淀与交接',
        ],
        refs: [repo('k8s/faq.md')],
      },
    ],
  },
]

/* ---------- 派生查询 ---------- */

export const allLessons = tracks.flatMap((track) =>
  track.lessons.map((lesson) => ({ track, lesson })),
)

export function getTrack(trackId: string): Track | undefined {
  return tracks.find((t) => t.id === trackId)
}

export function getLesson(trackId: string, lessonId: string) {
  const track = getTrack(trackId)
  if (!track) return undefined
  const index = track.lessons.findIndex((l) => l.id === lessonId)
  if (index === -1) return undefined
  return {
    track,
    lesson: track.lessons[index],
    prev: track.lessons[index - 1],
    next: track.lessons[index + 1],
  }
}

/** 全局线性顺序，用于"上一课 / 下一课"跨阶段跳转 */
export function getFlatNeighbors(trackId: string, lessonId: string) {
  const index = allLessons.findIndex(
    (item) => item.track.id === trackId && item.lesson.id === lessonId,
  )
  return {
    prev: index > 0 ? allLessons[index - 1] : undefined,
    next: index >= 0 && index < allLessons.length - 1 ? allLessons[index + 1] : undefined,
  }
}

export function lessonKey(trackId: string, lessonId: string) {
  return `${trackId}/${lessonId}`
}

export const stats = {
  trackCount: tracks.length,
  lessonCount: allLessons.length,
  readyCount: allLessons.filter(({ lesson }) => lesson.status === 'ready').length,
  labCount: allLessons.filter(({ lesson }) => lesson.kind === 'lab' || lesson.kind === 'quest')
    .length,
  totalMinutes: allLessons.reduce((sum, { lesson }) => sum + lesson.minutes, 0),
}
