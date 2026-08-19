# Kubepath

**K8s 工程师**的在线交互式学习项目。

从容器与节点底座出发，吃透控制面、调度与对象模型，用 kubespray 把集群装出来并扛住升级与故障，
再接上网络、存储与可观测性，最后走进 GPU 与 AI 负载调度的战场。

## 岗位路线

课程只有一份（下面的 L0–L4），首页按岗位裁剪成三条走法 —— 同一节课可以出现在多条路线里，
每条路线只留这个岗位真正用得上的部分，并切成几段推进。路线记在 URL 的 `?role=` 上，可以直接分享。

| 路线 | `?role=` | 面向 | 规模 |
| --- | --- | --- | --- |
| **解决方案架构师** | `architect` | 出方案、算规模、做选型对比，每个数字都得站得住 | 16 节 / 约 9 小时 |
| **集群运维工程师** | `cluster-ops` | 不做裁剪的完整主线，L0→L4 按阶段通读 | 36 节 / 约 21 小时 |
| **存储运维工程师** | `storage-ops` | K8s 是后端存储的一个大客户，PVC 出事先找你 | 15 节 / 约 8 小时 |

架构师与存储运维两条按裁剪过的分段清单渲染（连续编号 + 来源阶段徽标），集群运维那条是完整主线，
按 L0–L4 阶段卡片通读。三条路线共用同一份进度（localStorage），一条里完成的课在另一条里
也是完成状态。定义见 `src/lib/roles.ts`。

**路线模式**：从首页点进课程会带上 `?role=`，此后课程页顶部显示「第 N / M 节 · 段名」和退出出口，
上一课 / 下一课按路线顺序走（可能跨阶段），右侧目录换成整条路线的清单。
带着某条路线打开不在该路线里的课，会提示这一节没排进来并给一条回去的路。

## 课程阶段

| 阶段 | 主题 | 说明 |
| --- | --- | --- |
| **L0** | 底座与前置 | 容器与运行时、节点 OS 基线、etcd 磁盘验收、集群规划与命名、硬件拓扑 |
| **L1** | 核心原理 | 控制面解剖、声明式模型、工作负载对象、调度、kubelet 生命周期、网络模型、RBAC |
| **L2** | 部署与运维 | kubespray 部署、配置拆解、客户端工具、节点与控制面运维、升级、etcd 运维、闯关 |
| **L3** | 平台能力 | Cilium、服务暴露、网络策略、PV/PVC/CSI、存储接入、可观测性、镜像分发 |
| **L4** | 进阶战场 | GPU Operator、AI 调度、训练与推理平台、多租户、容量规划、规模化、值班 |

共 5 个阶段 **36 节课**，其中动手环节 15 节（12 个实验 + 2 个命令行闯关 + 1 个规划计算器），
另有 1 个嵌在《控制面解剖》里的 apply 推演。目前 **7 节已完成正文**，其余为已定稿的小节大纲。

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
│   │   ├── roles.ts             # 岗位路线：按岗位裁剪并重排课程
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
│   ├── content/                 # 课程正文
│   │   ├── l0-foundation/       # 6 节
│   │   ├── l1-core/             # 7 节
│   │   ├── l2-cluster/          # 8 节
│   │   ├── l3-platform/         # 8 节
│   │   └── l4-advanced/         # 7 节
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx                    # 首页：岗位路线选择 + 路线目录 + 进度
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

- 补齐其余 29 节正文（当前 7 节有正文，其余为已定稿大纲）
- 调度推演组件：改 requests / 污点 / 亲和性，看 Pod 落在哪台节点
- L2 的 NotReady 闯关与 etcd 恢复演练
- 深色模式（Shiki 已按双主题编译，接一个切换即可）
- 全站搜索
