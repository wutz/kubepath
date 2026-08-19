/**
 * 集群容量推算 —— 从节点规格推出真正可分配的资源、Pod 密度与集群规模上限。
 *
 * 口径说明：
 * - CPU 一律按毫核（m）计算，1 core = 1000m
 * - 内存一律按 MiB 计算，对外展示时换成 GiB
 * - 「可分配」= 容量 − 系统预留 − kube 预留 − 驱逐阈值，与 kubelet 的
 *   Allocatable 语义一致；这是调度器真正看到的那个数
 */

export interface ReserveTier {
  /** 这一档覆盖到多少（cores 或 GiB），Infinity 表示兜底档 */
  upTo: number
  /** 这一档内的预留比例 */
  ratio: number
}

/**
 * 云厂商普遍采用的分段预留公式（GKE / EKS 口径基本一致）。
 * 越大的机器预留比例越低 —— 系统开销并不随规格线性增长。
 */
export const CPU_RESERVE_TIERS: ReserveTier[] = [
  { upTo: 1, ratio: 0.06 },
  { upTo: 2, ratio: 0.01 },
  { upTo: 4, ratio: 0.005 },
  { upTo: Infinity, ratio: 0.0025 },
]

export const MEM_RESERVE_TIERS: ReserveTier[] = [
  { upTo: 4, ratio: 0.25 },
  { upTo: 8, ratio: 0.2 },
  { upTo: 16, ratio: 0.1 },
  { upTo: 128, ratio: 0.06 },
  { upTo: Infinity, ratio: 0.02 },
]

/** 按分段比例累加，返回预留量（单位与入参一致） */
export function tieredReserve(total: number, tiers: ReserveTier[]): number {
  let reserved = 0
  let handled = 0
  for (const tier of tiers) {
    if (total <= handled) break
    const slice = Math.min(total, tier.upTo) - handled
    if (slice <= 0) continue
    reserved += slice * tier.ratio
    handled = Math.min(total, tier.upTo)
  }
  return reserved
}

export interface CapacityInput {
  /** 计算（worker）节点数 */
  workerNodes: number
  /** 单节点物理核数 */
  cpuPerNode: number
  /** 单节点内存 GiB */
  memPerNode: number
  /** 单节点 GPU 卡数，0 表示纯 CPU 集群 */
  gpusPerNode: number
  /** kubelet 的 maxPods，社区默认 110 */
  maxPodsPerNode: number
  /** 内存驱逐阈值 MiB，kubelet 默认 memory.available<100Mi */
  evictionMiB: number
  /** 典型 Pod 的 CPU request，毫核 */
  avgPodCpuM: number
  /** 典型 Pod 的内存 request，MiB */
  avgPodMemMiB: number
  /** Pod CIDR 掩码，如 10.244.0.0/16 填 16 */
  podCidrMask: number
  /** 每节点分到的子网掩码，kube-controller-manager 的 node-cidr-mask-size */
  nodeCidrMask: number
}

export type BottleneckId = 'cpu' | 'memory' | 'maxPods' | 'nodeCidr'

export const BOTTLENECK_LABEL: Record<BottleneckId, string> = {
  cpu: 'CPU 可分配量',
  memory: '内存可分配量',
  maxPods: 'kubelet maxPods 上限',
  nodeCidr: '节点子网 IP 数',
}

export const BOTTLENECK_ADVICE: Record<BottleneckId, string> = {
  cpu: '每个 Pod 的 CPU request 偏大，或节点核数偏少。先核对 request 是不是照着峰值填的 —— request 决定调度，limits 才决定上限。',
  memory: '内存先于 CPU 用完，说明机型的内存核比不匹配这类业务。加内存通常比加节点便宜。',
  maxPods: '资源还剩不少，但 kubelet 的 maxPods 已经封顶。可以调高 maxPods，但要同步确认节点子网 IP 数、conntrack 与 kube-proxy 规则数扛得住。',
  nodeCidr: '节点子网太小，IP 先于资源耗尽。改 node-cidr-mask-size 意味着重划网段，务必在集群建成前定好。',
}

export interface ControlPlaneSpec {
  /** 适用的最大 worker 节点数 */
  upTo: number
  nodes: number
  cpu: number
  memGiB: number
  note: string
}

/**
 * 控制面规格建议。依据是 apiserver 的对象缓存与 etcd 的写入压力
 * 随节点数和对象数增长，而不是随业务流量增长。
 */
export const CONTROL_PLANE_TIERS: ControlPlaneSpec[] = [
  { upTo: 10, nodes: 3, cpu: 4, memGiB: 8, note: '实验或小规模生产，3 节点满足 HA 的最低要求' },
  { upTo: 50, nodes: 3, cpu: 8, memGiB: 16, note: '常规生产集群，etcd 建议独占 NVMe' },
  { upTo: 250, nodes: 3, cpu: 16, memGiB: 32, note: 'etcd 必须独立盘，开始关注 apiserver list 请求' },
  { upTo: 500, nodes: 5, cpu: 16, memGiB: 64, note: '5 节点 etcd 提高容错，需配置 APF 保护关键请求' },
  { upTo: Infinity, nodes: 5, cpu: 32, memGiB: 128, note: '接近官方规模上限，认真评估拆分成多集群' },
]

export function pickControlPlane(workerNodes: number): ControlPlaneSpec {
  return CONTROL_PLANE_TIERS.find((tier) => workerNodes <= tier.upTo) ?? CONTROL_PLANE_TIERS[CONTROL_PLANE_TIERS.length - 1]
}

export interface CapacityResult {
  /** 单节点 CPU 容量 / 预留 / 可分配，毫核 */
  cpuCapacityM: number
  cpuReservedM: number
  cpuAllocatableM: number
  /** 单节点内存 容量 / 预留 / 驱逐阈值 / 可分配，MiB */
  memCapacityMiB: number
  memReservedMiB: number
  memAllocatableMiB: number
  /** 可分配占容量的比例 */
  cpuEfficiency: number
  memEfficiency: number

  /** 四条限制各自算出的单节点 Pod 数 */
  limits: Record<BottleneckId, number>
  bottleneck: BottleneckId
  podsPerNode: number

  /** 节点子网能给出的可用 IP 数 */
  ipsPerNode: number
  /** Pod CIDR 最多能切出多少个节点子网 */
  maxNodesByCidr: number

  /** 集群合计 */
  totalPods: number
  totalCpuAllocatable: number
  totalMemAllocatableGiB: number
  totalGpus: number
  /** 每张 GPU 摊到的可分配资源，无 GPU 时为 undefined */
  perGpuCpu?: number
  perGpuMemGiB?: number

  controlPlane: ControlPlaneSpec
  warnings: string[]
}

export function planCapacity(input: CapacityInput): CapacityResult {
  const cpuCapacityM = Math.round(input.cpuPerNode * 1000)
  const memCapacityMiB = Math.round(input.memPerNode * 1024)

  // 系统预留与 kube 预留在这套公式里是一并给出的，不再拆两份
  const cpuReservedM = Math.round(tieredReserve(input.cpuPerNode, CPU_RESERVE_TIERS) * 1000)
  const memReservedMiB = Math.round(tieredReserve(input.memPerNode, MEM_RESERVE_TIERS) * 1024)

  const cpuAllocatableM = Math.max(0, cpuCapacityM - cpuReservedM)
  const memAllocatableMiB = Math.max(0, memCapacityMiB - memReservedMiB - input.evictionMiB)

  const ipsPerNode = Math.max(0, 2 ** (32 - input.nodeCidrMask) - 2)
  const maxNodesByCidr =
    input.nodeCidrMask >= input.podCidrMask ? 2 ** (input.nodeCidrMask - input.podCidrMask) : 0

  const limits: Record<BottleneckId, number> = {
    cpu: input.avgPodCpuM > 0 ? Math.floor(cpuAllocatableM / input.avgPodCpuM) : Infinity,
    memory: input.avgPodMemMiB > 0 ? Math.floor(memAllocatableMiB / input.avgPodMemMiB) : Infinity,
    maxPods: input.maxPodsPerNode,
    nodeCidr: ipsPerNode,
  }

  const bottleneck = (Object.keys(limits) as BottleneckId[]).reduce((min, id) =>
    limits[id] < limits[min] ? id : min,
  )
  const podsPerNode = Math.max(0, limits[bottleneck])

  const schedulableNodes = Math.min(input.workerNodes, maxNodesByCidr || input.workerNodes)
  const totalGpus = input.workerNodes * input.gpusPerNode
  const totalCpuAllocatable = (cpuAllocatableM * input.workerNodes) / 1000
  const totalMemAllocatableGiB = (memAllocatableMiB * input.workerNodes) / 1024

  const warnings: string[] = []

  if (maxNodesByCidr > 0 && input.workerNodes > maxNodesByCidr) {
    warnings.push(
      `Pod CIDR /${input.podCidrMask} 按每节点 /${input.nodeCidrMask} 只能切出 ${maxNodesByCidr} 个节点子网，装不下 ${input.workerNodes} 个节点。网段是建成后最难改的东西，现在就得改大。`,
    )
  } else if (maxNodesByCidr > 0 && input.workerNodes > maxNodesByCidr * 0.7) {
    warnings.push(
      `节点数已占用 Pod CIDR 容量的 ${Math.round((input.workerNodes / maxNodesByCidr) * 100)}%，扩容余量不足，建议现在就把 Pod CIDR 放大。`,
    )
  }
  if (input.nodeCidrMask < input.podCidrMask) {
    warnings.push('节点子网掩码必须比 Pod CIDR 掩码更长（数值更大），当前配置切不出子网。')
  }
  if (input.maxPodsPerNode > 110) {
    warnings.push(
      `maxPods 设为 ${input.maxPodsPerNode}，超过社区默认的 110。需同步压测 kube-proxy 规则数、conntrack 表与镜像并发拉取，否则节点会在高密度下不稳定。`,
    )
  }
  if (input.workerNodes > 500) {
    warnings.push('节点数超过 500，apiserver 的 list/watch 压力会显著上升。务必配置 APF，并评估拆分成多个集群。')
  }
  if (input.cpuPerNode >= 96 && input.workerNodes <= 5) {
    warnings.push('少量超大节点意味着爆炸半径很大：单机故障会带走集群相当比例的算力。评估一下用更多中等规格节点。')
  }
  if (input.gpusPerNode > 0 && cpuAllocatableM / 1000 / input.gpusPerNode < 8) {
    warnings.push(
      `每张 GPU 只摊到 ${(cpuAllocatableM / 1000 / input.gpusPerNode).toFixed(1)} 核可分配 CPU，数据加载很可能成为训练瓶颈。经验值是每卡 8–16 核。`,
    )
  }

  return {
    cpuCapacityM,
    cpuReservedM,
    cpuAllocatableM,
    memCapacityMiB,
    memReservedMiB,
    memAllocatableMiB,
    cpuEfficiency: cpuCapacityM > 0 ? cpuAllocatableM / cpuCapacityM : 0,
    memEfficiency: memCapacityMiB > 0 ? memAllocatableMiB / memCapacityMiB : 0,
    limits,
    bottleneck,
    podsPerNode,
    ipsPerNode,
    maxNodesByCidr,
    totalPods: podsPerNode * schedulableNodes,
    totalCpuAllocatable,
    totalMemAllocatableGiB,
    totalGpus,
    perGpuCpu: totalGpus > 0 ? totalCpuAllocatable / totalGpus : undefined,
    perGpuMemGiB: totalGpus > 0 ? totalMemAllocatableGiB / totalGpus : undefined,
    controlPlane: pickControlPlane(input.workerNodes),
    warnings,
  }
}

/* ---------- 展示辅助 ---------- */

export function formatNumber(value: number, digits = 0) {
  if (!Number.isFinite(value)) return '不限'
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`
}

/** 毫核转成「x.x 核」 */
export function formatCores(milli: number) {
  return `${(milli / 1000).toFixed(2)} 核`
}

/** MiB 转成 GiB */
export function formatGiB(mib: number, digits = 1) {
  return `${(mib / 1024).toFixed(digits)} GiB`
}
