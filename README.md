# Kubepath

**K8s 成长路线** —— 从跑起一个容器，到扛住一套 GPU 集群。

K8s 的难不在命令多，而在每个现象背后都压着好几层：容器、运行时、控制面、网络、存储。
这个项目按真实的成长顺序把它拆开：从 Docker 与容器起步，到本机 kind 集群上的对象与调度，
再到真机部署与逐层选型（CNI、CSI、LB、Gateway API），接上可观测性与镜像仓库、扛过升级与
故障，最后走进 GPU、训练与推理。

## 学习主线

课程只有一条线：**L0 容器与镜像 → L1 K8s 基础与对象 → L2 生产部署与组件选型 →
L3 配套组件与日常运维 → L4 AI 场景**。按顺序从头走就行，每一节都建立在前面几节之上。

每个阶段内部再按同一个节奏排：**先概念 → 再实践 → 最后原理**。先用一到几节把心智模型和
选型判断讲清楚，然后动手做一遍，最后才拆开底下的机制回答「刚才那些现象为什么是这样」。
所以 L1 是先读懂声明式模型与对象，再练熟手上的动作，最后才解剖控制面与调度器；L4 是先
定清楚 AI 平台要什么，再去装 GPU 与 RDMA。唯一的例外是 L1 的 kind 集群 —— 它是后面每节
课的操场，排在第一节，这样读概念时随手就能验证。

首页给出整条主线的进度、下一节的入口，以及按阶段展开的全部课程清单。课程页顶部显示
「第 N / 38 节」，上一课 / 下一课按全局顺序走，跨阶段也连得上；右侧目录是当前阶段的课程列表。
进度存在浏览器 localStorage，换设备不同步。

## 课程阶段

| 阶段 | 主题 | 说明 |
| --- | --- | --- |
| **L0** `l0-container` | 容器与镜像 | 实践：Docker 基础与 Docker–containerd 关系 → 原理：namespace / cgroup / 镜像分层 |
| **L1** `l1-basics` | K8s 基础与对象 | 操场：kind 本地多节点集群 → 概念：声明式模型、工作负载对象、网络模型、RBAC → 实践：客户端工具箱 → 原理：控制面解剖、调度器、kubelet 生命周期、运行时与 CRI（crictl / nerdctl / ctr） |
| **L2** `l2-production` | 生产部署与组件选型 | 概念：硬件拓扑、集群规划、组件选型总览、PV/PVC/CSI、网络策略 → 实践：容量计算器、节点 OS 基线、kubespray 部署（含 group_vars 逐项拆解）、CNI、LB / Ingress / Gateway API、存储接入、PVC 闯关 |
| **L3** `l3-platform-ops` | 配套组件与日常运维 | 概念：镜像仓库、节点生命周期、多租户 → 实践：可观测性、控制面扩缩、升级、etcd 备份恢复、NotReady 闯关 → 原理：规模化限额、值班手册 |
| **L4** `l4-ai` | AI 场景：GPU、训练与推理 | 概念：AI 负载调度（Volcano / Kueue）、训练与推理平台（Trainer / Ray / vLLM） → 实践：GPU Operator 与拓扑、高性能网络（InfiniBand / RoCE） |

共 5 个阶段 **38 节课，全部已完成正文**，其中动手环节 16 节（13 个实验 + 2 个命令行闯关 +
1 个规划计算器），另有 1 个嵌在《控制面解剖》里的 apply 推演。正文含 72 个随堂检查点、
178 个提示框、4 个命令行演练。

线上地址：<https://kubepath.wutz.dev>

## 交互形式

- **检查点（Quiz）** —— 随堂单选/多选，选错给针对性反馈，答对写入本地进度
- **命令行闯关（Terminal）** —— 模拟终端，预置真实的 `kubectl`、`fio`、`ceph` 输出，
  按目标一步步定位根因；支持 `goals` / `hint` / `help` / 命令历史
- **控制面推演（ApplyFlow）** —— 逐步走完一次 `kubectl apply`，还可以把某个组件「打挂」，
  看链路断在哪一步、现象是什么
- **容量计算器（ClusterCapacityPlanner）** —— 从节点规格算出可分配资源、Pod 密度与集群规模上限，
  并直接指出四条限制里**第一个撞上的是哪条**（CPU / 内存 / maxPods / 节点子网 IP）
- **进度追踪** —— 存 localStorage，无账号体系，换设备不同步

## 技术栈

与 [storpath](https://storpath.wutz.dev/) / [netpath](https://netpath.wutz.dev/) 保持一致：

- **TanStack Start / Router** —— 全栈 React 框架 + 类型安全文件路由
- **MDX** —— 课程正文，可直接内嵌交互组件
- **Shiki** —— 构建期代码高亮
- **Tailwind CSS 4** —— 样式
- **Cloudflare Workers** —— 部署

## 快速开始

```bash
bun install
bun run dev        # http://localhost:3003
bun run build
bun run typecheck
bun run deploy     # 手工部署到 Cloudflare Workers
```

### 关于 `@tanstack/*` 的精确版本

三个 `@tanstack/*` 包在 `package.json` 里写的是**精确版本**而不是 `^` 范围，这是刻意的：

TanStack 的包之间用精确版本互锁（`react-start@1.168.44` 精确依赖
`start-client-core@1.170.22`），而它一天要发好几个版本。国内镜像
（`registry.npmmirror.com`）同步有先后，经常出现「新版 `react-start` 同步到了、
它依赖的那个 `start-client-core` 还没到」的中间状态。此时 `^` 范围会解到最新版，
然后报：

```
error: No version matching "1.170.25" found for specifier "@tanstack/start-client-core" (but package exists)
```

—— 注意 `(but package exists)`，包在、只是那个版本还没同步过来。钉死版本就不会去追
`latest`，也就不会撞上这个竞态。

**要升级 TanStack 时**：手工改 `package.json` 里这三个版本号，然后

```bash
# 从 npmjs.org 装，绕开镜像的同步延迟
bun install --registry=https://registry.npmjs.org
bun run typecheck && bun run build
```

三个版本号必须一起对齐 —— `react-start` 会精确指定它要的 `react-router` 版本，
`bun install` 的输出里会直接提示可用的新版本号。

## 持续部署

用 **Cloudflare Workers Builds**，无需在 GitHub 里存密钥。
Dashboard → Compute (Workers) → `kubepath` → Settings → Build → Connect，
授权 GitHub App 并选中 `wutz/kubepath`，构建命令填 `bun run build`，部署命令填 `bunx wrangler deploy`。
之后推送到 `main` 即自动部署。

> Workers Builds 的仓库连接依赖 GitHub App 的 OAuth 授权，只能在 Dashboard 上完成，wrangler CLI 没有对应命令。

## 项目结构

```
kubepath/
├── src/
│   ├── lib/
│   │   ├── curriculum.ts        # 课程大纲：全站唯一数据源
│   │   ├── content.ts           # MDX 正文加载
│   │   ├── progress.ts          # 学习进度（localStorage）
│   │   └── cluster-capacity.ts  # 容量推算：预留公式、四条限制、控制面规格
│   ├── components/
│   │   ├── Callout.tsx                  # note / tip / warn / trap 四种提示框
│   │   ├── Quiz.tsx                     # 随堂检查点
│   │   ├── Terminal.tsx                 # 命令行闯关模拟器
│   │   ├── ApplyFlow.tsx                # 一次 apply 的分步推演 + 组件打挂
│   │   ├── ClusterCapacityPlanner.tsx   # 集群容量计算器
│   │   ├── mdx-components.tsx           # MDX 全局组件表
│   │   └── lesson-context.ts            # 当前课程 key，供交互组件写进度
│   ├── content/                 # 38 节课程正文
│   │   ├── l0-container/        # 2 节
│   │   ├── l1-basics/           # 10 节
│   │   ├── l2-production/       # 12 节
│   │   ├── l3-platform-ops/     # 10 节
│   │   └── l4-ai/               # 4 节
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx                    # 首页：主线进度 + 按阶段展开的全部课程
│   │   ├── tracks.$trackId.tsx          # 阶段详情
│   │   ├── learn.$trackId.$lessonId.tsx # 课程页
│   │   └── labs.tsx                     # 实验与闯关索引
│   ├── router.tsx
│   └── styles.css
├── vite.config.ts
└── wrangler.toml
```

## 新增一节课

1. 在 `src/lib/curriculum.ts` 对应阶段里加一条 `Lesson`，写清 `objectives` 和 `outline`
2. 状态先留 `'planned'` —— 课程页会自动渲染大纲占位，列表里标记为「仅大纲」
3. 正文写好后建 `src/content/<trackId>/<lessonId>.mdx`，把状态改成 `'ready'`

> 注意：MDX 里 JSX 属性值用双引号包裹，属性内部不要再出现半角双引号（用 `「」` 代替），
> 否则会在构建时报解析错误。

MDX 里可以直接使用交互组件，无需 import：

```mdx
<Callout type="trap" title="新人常踩的坑">
RWO 是单节点读写，不是单 Pod —— 同节点上的多个 Pod 能共享它。
</Callout>

<Quiz
  id="cap-1"
  question="32 核 128 GiB 的节点，Pod request 100m / 256Mi，maxPods 默认。先撞上哪条限制？"
  options={[
    { text: 'kubelet 的 maxPods', correct: true },
    { text: 'CPU 可分配量', feedback: '31.9 核 ÷ 100m = 319 个，远不是瓶颈。' },
  ]}
  explain={<>四条限制取最小值，这里是 110。</>}
/>

<ApplyFlow />
<ClusterCapacityPlanner />
```

命令行闯关：给命令加 `goal` 字段即成为闯关目标，全部达成后自动记录通过。

```mdx
<Terminal
  id="pvc-pending"
  host="root@mn-10-128-0-1"
  commands={[
    { cmd: 'kubectl get pvc', goal: '确认 PVC 状态', hint: '先看现象', output: `...` },
    { cmd: 'kubectl describe pvc data-pvc', output: `...` },
  ]}
/>
```

## 内容来源

- **部署与运维实操** —— [k8s-in-action](https://github.com/wutz) 手册的 `k8s/`、`network/`、
  `storage/`、`o11y/`、`ai/`、`compute/`、`repo/` 各章
- **容量与规划口径** —— `k8s/plan/`、`k8s/etcd-disk-performance.md`
- **原理与规范** —— Kubernetes 官方文档
- **存储与网络的纵深** —— [Storpath](https://storpath.wutz.dev/) 与 [Netpath](https://netpath.wutz.dev/)

## 后续可做

- 调度推演组件：改 requests / 污点 / 亲和性，看 Pod 落在哪台节点
- etcd 恢复演练：把《etcd 运维》的 snapshot restore 做成命令行闯关
- Kueue 配额推演：改 nominalQuota 与 borrowingLimit，看任务准入与借用
- 深色模式（Shiki 已按双主题编译，接一个切换即可）
- 全站搜索
