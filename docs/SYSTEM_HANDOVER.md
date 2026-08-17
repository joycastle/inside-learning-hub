# 乐堡家园系统交付与维护手册

> 本文是“乐堡家园”内部培训与员工服务中心的主交付文档，面向后续产品负责人、前端、后端、测试、运维、安全和内容管理员。  
> 文档以 2026-08-14 的代码快照为准。发生冲突时，运行中的代码与数据库 migration 是技术事实来源，本文需要随版本同步更新。

| 项目 | 内容 |
| --- | --- |
| 文档版本 | 1.1 |
| 应用版本 | `package.json` 中的 `0.1.0` |
| 审核日期 | 2026-08-14 |
| 当前阶段 | 可运行的高保真交互原型 + 生产技术骨架 |
| 生产就绪结论 | **尚未达到生产上线条件** |
| 默认品牌 | 乐堡家园 |
| 默认语言与时区 | 简体中文、Asia/Shanghai |
| 预计一期规模 | 首年不超过 300 名员工 |

---

## 1. 交付结论与接手须知

### 1.1 一句话说明

乐堡家园是一套统一登录、统一数据模型、员工端与管理端分路由呈现的内部网站。员工端围绕“新人入职说明视频 + HTML 配套讲义 + 随机测评”展开，同时提供 HR、行政、IT 自助服务；管理端负责内容、题库、员工分配、管理员权限和学习统计。

### 1.2 当前代码到底完成到了哪里

当前仓库不是静态设计稿，页面、登录、搜索、视频上报、随机答题、CSV/`.docx` 题库导入、后台弹窗和筛选均可实际操作；但它也不是可以直接承载真实员工数据的成品。它更准确的定位是：

1. 已实现并可验证的产品结构与交互原型。
2. 已建立 Next.js、Payload、PostgreSQL、MinIO、飞书 OAuth 的生产技术骨架。
3. 身份同步与默认培训分配已经存在真实 Payload 写入逻辑。
4. 大部分学习、题库、统计和后台编辑数据仍使用演示数据、进程内 Map 或浏览器 `localStorage`。
5. 正式上线前必须完成第 18、19、25 章列出的持久化、安全与 P0 工作。

### 1.3 状态图例

| 标记 | 含义 |
| --- | --- |
| ✅ | 已有可运行实现，仍需按生产环境验证 |
| 🟡 | 交互完整，但数据仅保存在浏览器或进程内 |
| 🧱 | 数据模型/接口骨架存在，业务持久化未接通 |
| ⬜ | 页面占位或按钮展示，尚无业务动作 |
| ❌ | 尚未实现 |

### 1.4 功能完成度总表

| 能力 | 当前状态 | 当前数据源 | 上线前动作 |
| --- | --- | --- | --- |
| 员工/管理员统一会话 | ✅ | JWT Cookie；生产会重查 Payload 用户 | 配置强密钥、HTTPS、飞书租户白名单 |
| 飞书网页 OAuth | ✅ | 飞书 OAuth v2 + Payload 用户同步 | 在飞书后台配置回调、权限、可用范围 |
| 飞书通讯录部门/人员读取 | ✅/🧱 | 配置凭证时读飞书；失败回退演示数据 | 禁止生产静默回退；验证全组织分页与权限 |
| 飞书员工事件 | 🧱 | Payload 用户与事件集合 | 补齐事件签名/加密、部门变更和新员工事件 |
| 默认入职培训分配 | ✅/🧱 | 首次飞书登录写 Payload Enrollment | 准备默认路径数据并做并发/失败补偿测试 |
| 员工首页、学习、个人记录 | 🟡 | `demo-data.ts` | 改为数据库查询当前员工真实数据 |
| 视频播放、15 秒上报、90% 完播 | 🟡 | 浏览器 localStorage + 服务进程内 Map | 改写 PostgreSQL 原子幂等更新，并从服务端恢复 |
| 随机抽题、答题、评分、解析 | 🟡 | 静态题库 + 服务进程内 Map | 接入 Questions、QuizAttempts、快照与事务 |
| 全局搜索 | 🟡 | 演示数组内存搜索 | 接 PostgreSQL `pg_trgm` 与发布态/权限过滤 |
| 员工服务搜索与分类 Tab | 🟡 | 演示数组 | 接 KnowledgeArticles/ServiceLinks |
| 培训路径与课程新增 | 🟡 | 浏览器 localStorage | 建管理 API，写 Payload/PostgreSQL |
| 题目新增、查看、编辑、删除 | 🟡 | 浏览器 localStorage | 建服务端 CRUD、审计与引用校验 |
| CSV/.docx 题库导入 | 🟡 | 浏览器解析后写 localStorage | 上传服务端校验、预览、事务导入与错误报告 |
| 员工选择、分配、调整期限 | 🟡 | 飞书组织数据 + localStorage | 建 Enrollment API，防重复并保留历史 |
| 管理员配置 | 🟡 | localStorage，仅改变页面列表 | 必须写 Users.role，服务端仅允许 superAdmin |
| 学习概览、漏斗、视频与测评统计 | 🟡 | 静态演示数据，部分页面筛选 | 改为 PostgreSQL 聚合；统一页面/API/CSV口径 |
| 员工服务后台 | 🟡/🧱 | 浏览器 localStorage；Payload 模型存在 | 接服务端文件存储、草稿、预览、发布、回滚和 CRUD |
| 公告后台 | ⬜/🧱 | 静态列表；Payload 模型存在 | 建受众、有效期、发布与首页读取 |
| MinIO 私有媒体与签名下载 | ✅/🧱 | S3 SDK 与 Payload 插件 | 校验资源授权，使用真实桶和生命周期策略 |
| Docker Compose 部署 | ✅/🧱 | web/postgres/minio/nginx | 改生产凭证、镜像固定版本、TLS、健康检查 |
| 单元测试 | ✅ | Vitest | 增加 API 集成、数据库、浏览器 E2E 和并发测试 |
| 可观测性、告警、审计日志 | ❌ | 无 | 上线前至少补日志、健康检查、错误告警与审计 |

### 1.5 接手时不要做错的三件事

1. **不要把 localStorage 后台数据当成数据库数据。** 换浏览器、清缓存或换员工后不会形成共享管理数据。
2. **不要仅把 `DEMO_MODE=false` 就视为生产化完成。** 目前大部分业务 API 仍明确导入 `demo-data` 或 `demo-store`。
3. **不要让浏览器直接拥有 Payload 管理权限。** 应由 Next.js 管理 API 校验当前会话、业务权限和数据归属，再调用 Payload Local API。

---

## 2. 产品定位、范围与原则

### 2.1 产品定位

本系统是“新员工培训闭环 + 日常员工自助服务”的内部工作入口，不是通用 LMS、社区或工单平台。

一期主链路：

```text
飞书登录
  → 首次登录自动分配默认入职任务（默认 7 天）
  → 观看唯一的新人入职说明视频
  → 阅读视频下方 HTML 配套讲义
  → 随机测评（当前可直接开始；90% 仅作为视频完播统计口径）
  → 通过后完成课程
  → HR 在管理端查看完播、成绩、逾期与明细并导出
```

辅助链路：

```text
员工进入员工服务
  → 查看高频问题
  → 在 HR / 行政 / IT 三个 Tab 中筛选
  → 搜索制度、PDF、飞书文档或办事入口
```

### 2.2 一期明确包含

- 飞书 OAuth 登录和企业租户校验。
- 员工、管理员、超级管理员三个角色。
- 一段新人入职说明视频、断点续播及依据《新人培训》整理的 HTML 配套讲义。
- 90% 完播规则、随机选择题、多选题和判断题。
- HR、行政、IT 员工服务知识。
- 学习概览、课程漏斗、视频进度、测评与员工明细。
- CSV 培训明细导出。
- 飞书组织架构读取与人员选择。
- Payload 内容模型、PostgreSQL、MinIO、Docker Compose 基础设施。

### 2.3 一期明确不包含

- 社区动态、评论、员工提问与工单。
- AI 助手、推荐、语义搜索。
- 直播、SCORM、证书、积分、勋章、排行榜。
- 视频转码、DRM、复杂防作弊和专业监考。
- 数据仓库、实时流处理和外部 BI。
- 独立微服务、Redis、消息队列。

### 2.4 产品与设计原则

1. 入职任务优先：员工进入后能立即找到并继续观看。
2. 一个入口：员工端与管理端共享登录、账号、品牌和数据库。
3. 权限由服务端决定：隐藏按钮不能替代 API 与页面授权。
4. 统计可核对：概览、漏斗、员工明细和 CSV 必须来自同一口径。
5. 一期克制：没有真实需求前不扩展成完整 LMS。
6. 品牌克制：近白/近黑中性表面、Logo 青蓝 `#009fdf`、细边框和微阴影；短促动效只用于引导注意、确认操作和解释层级。

更完整的产品和视觉约束分别见：

- [PRODUCT.md](../PRODUCT.md)
- [DESIGN.md](../DESIGN.md)

### 2.5 视觉系统实现约定

视觉系统的运行时唯一入口是 `src/app/globals.css`，规范入口是根目录 `DESIGN.md`，可供设计工具读取的扩展描述位于 `.impeccable/design.json`。后续维护必须优先复用语义 token，不能在单个页面中私自增加颜色、圆角、阴影或动效时长。

核心约定：

- 新会话默认浅色主题：`#fafafa` 工作台底色、近白表面与 `#171717` 主文字；用户可手动切换暗色主题，选择保存在 `lebao-theme-v2`。暗色使用 `#0a0a0a`、`#111111`、`#171717` 三层表面，`prefers-color-scheme` 不覆盖用户选择。
- 全站只有一套强调色：Logo 蓝。主要令牌为 `--accent`、`--accent-strong`、`--accent-soft`；旧 `--brand-*` 变量仅作为兼容别名，不是第二套颜色体系。
- 字体资产已固化在 `public/fonts/`：`geist-latin.woff2` 用于界面，`geist-mono-latin.woff2` 用于日期、编号、进度和统计数字；中文按系统能力回退到苹方、Noto Sans SC 或微软雅黑。
- 圆角只使用 6/8/10px，间距只使用 4/8/12/16/24/32/48/64px。大面积纯白、巨型圆角卡片和彩色胶囊不是本系统语言。
- 状态动效使用 120/180/260ms 三档；进入使用 `cubic-bezier(0.22, 1, 0.36, 1)`，状态变化使用 `cubic-bezier(0.4, 0, 0.2, 1)`。按钮悬停最多上移 1–2px，按下缩放到 0.97–0.98，不得跟随鼠标。
- 页面启用 View Transitions，列表与大区块允许小幅错峰进入；`prefers-reduced-motion: reduce` 下所有非必要动效退化为近即时透明度变化。
- 员工端和管理端共享字体、色彩、控件和状态语法；员工端保持阅读留白，管理端允许更高密度，但不得牺牲 44px 触控目标、键盘焦点或局部滚动边界。
- `src/app/layout.tsx` 中的 `data-design-*` 属性是自动化设计审查使用的方向契约，不参与业务逻辑，修改视觉世界时需与 `DESIGN.md` 同步更新。

---

## 3. 用户、角色与权限

### 3.1 角色

| 角色 | 员工端 | 管理端 | 管理员配置 | 系统配置 |
| --- | --- | --- | --- | --- |
| `employee` | 可访问本人内容 | 不可访问 | 不可访问 | 不可访问 |
| `admin` | 可访问 | 可访问一般管理能力 | 只读/不可变更角色 | 不可变更高风险配置 |
| `superAdmin` | 可访问 | 可访问全部管理能力 | 可授予或撤销管理员 | 可管理系统级配置 |

### 3.2 当前服务端授权链路

1. 登录成功后，服务端签发包含 `AppUser` 的 HS256 JWT。
2. JWT 存储在名为 `inside_session` 的 `HttpOnly` Cookie 中，有效期 8 小时。
3. `src/proxy.ts` 拦截 `/admin/:path*` 与 `/api/admin/:path*`，先检查 JWT 中的角色。
4. 管理页面布局再次调用 `requireAdmin()`。
5. 每个管理 API 也调用 `requireAdmin()`。
6. 当 `DEMO_MODE=false` 时，`getCurrentUser()` 每次请求按飞书 Open ID 从 Payload 重新读取用户角色和启用状态，因此降权或停用可立即生效。

### 3.3 端侧切换

- 管理员在员工端头像菜单看到“切换到管理端”。
- 管理端头像位于侧边导航左下方，菜单中提供“返回员工端”。
- 普通员工不显示管理入口。
- 普通员工直接访问 `/admin` 时，由代理返回 403；未登录返回 401。

### 3.4 当前权限风险

系统设置中的“设为管理员”目前只修改浏览器的 `admin-manager-ids-v1`，**不会修改 Payload `users.role`，也不会获得真实服务端权限**。生产实现必须：

1. 只允许 `superAdmin` 调用角色变更 API。
2. 服务端验证目标用户来自当前允许租户。
3. 更新 `users.role` 并写入审计日志。
4. 禁止撤销最后一个 `superAdmin`。
5. 变更后现有请求必须通过数据库重查立即失效或生效。

---

## 4. 核心业务流程与状态

### 4.1 员工主流程

```mermaid
flowchart TD
  A["员工从飞书或浏览器进入"] --> B["飞书 OAuth"]
  B --> C{"企业租户与员工状态有效？"}
  C -- "否" --> D["拒绝登录"]
  C -- "是" --> E["同步用户"]
  E --> F{"首次创建用户？"}
  F -- "是" --> G["幂等分配默认入职路径"]
  F -- "否" --> H["读取已有学习状态"]
  G --> H
  H --> I["播放新人入职说明视频 / 阅读 HTML 讲义"]
  I --> J["直接开始测评"]
  I --> N{"最大观看进度 ≥ 90%？"}
  N -- "是" --> O["记为视频完播并进入统计"]
  N -- "否" --> I
  J --> K["随机抽取 3 道题"]
  K --> L{"成绩 ≥ 80？"}
  L -- "否" --> K
  L -- "是" --> M["完成单元与课程"]
```

### 4.2 培训状态

| 状态 | 业务含义 | 建议计算方式 |
| --- | --- | --- |
| `notStarted` | 已分配但没有有效学习行为 | 无进度、无开播、无答题 |
| `inProgress` | 已经开始但未完成 | 有进度/开播/答题，未满足完成条件 |
| `completed` | 当前原型在测评通过后完成学习单元 | 生产口径需由业务确认是否还要求视频完播；完成状态落库后不可被普通进度回退 |
| `overdue` | 超过截止时间仍未完成 | 查询时根据 `dueAt` 与完成状态计算或定时落库 |

### 4.3 视频完播口径

- 最大观看进度达到 90% 即为完播。
- 完播只用于内部培训运营，不作为严格防作弊或合规监考证据。
- 前端在 `timeupdate` 中最多每 15 秒上报一次；暂停与结束时强制上报。
- 同一播放会话通过 `sessionId + sequence` 拒绝重复和乱序报告。
- 单次累计有效观看时间最多增加 30 秒，避免跳播或网络重试导致异常累计。
- 最大进度和完播状态只增不减。

### 4.4 测评口径

- 当前默认每次随机抽取 3 道题。
- 同一题组不重复；题目选项也随机排列。
- 80 分及以上通过。
- 未提交的题组重复请求时返回原题组，保证刷新后保持。
- 已提交后再次尝试生成新题组。
- 作答必须保存题目、选项、正确答案、员工答案和解析的历史快照，后续修改题库不得改变历史结果。

### 4.5 默认分配幂等

`syncFeishuUser()` 只在首次创建用户时查找 `isDefaultOnboarding=true` 的第一条学习路径，并生成：

```text
assignmentKey = 用户数据库 ID : 学习路径 ID : default
```

`assignmentKey` 在 Payload 模型中唯一，用于防止默认路径重复分配。正式环境仍需测试并发登录、数据库重试和创建用户成功但分配失败的补偿场景。

---

## 5. 技术架构

### 5.1 目标架构

```mermaid
flowchart LR
  U["员工浏览器 / 飞书客户端"] --> N["Nginx / HTTPS"]
  N --> W["Next.js 16 应用"]
  W --> A["应用会话与业务 API"]
  W --> P["Payload Local API / REST"]
  A --> DB[("PostgreSQL")]
  P --> DB
  W --> S["MinIO 签名 URL"]
  U --> S
  W --> F["飞书 OAuth / 通讯录 / 事件"]
  S --> M[("MinIO 私有桶")]
```

### 5.2 当前数据流事实

| 区域 | 当前读取 | 当前写入 | 是否跨设备持久化 |
| --- | --- | --- | --- |
| 飞书登录用户 | 飞书 + Payload | Payload Users/Enrollments | 是 |
| 员工首页/学习/服务 | `demo-data.ts` | 无或演示 API | 否 |
| 视频播放恢复 | 静态初始值 + 浏览器 localStorage | localStorage + 服务内 Map | 否 |
| 随机答题 | 静态题库 | 服务内 Map | 否，进程重启丢失 |
| 培训路径/课程后台 | 静态初始值 | localStorage | 仅当前浏览器 |
| 题库后台 | 静态初始值 | localStorage | 仅当前浏览器 |
| 人员分配后台 | 静态初始值/飞书通讯录 | localStorage | 仅当前浏览器 |
| 管理员设置 | 飞书通讯录 | localStorage | 仅当前浏览器且不改变权限 |
| 统计和导出 | `demo-data.ts` | 无 | 否 |
| 员工服务后台 | 静态初始值 | `admin-service-content-v1` localStorage | 仅当前浏览器；员工端不会读取 |
| 公告后台 | 静态数组 | 按钮未接动作 | 否 |

### 5.3 关键架构决策

- 单体 Next.js：一期不拆微服务。
- Payload 负责内容模型、草稿、版本和后台领域数据。
- PostgreSQL 是正式业务与统计数据的唯一事实源。
- MinIO 存放 PDF、图片和 MP4；播放使用短时签名地址。
- 不保存无限播放器点击事件，使用单员工/单视频聚合状态。
- 不引入 Redis、消息队列、Elasticsearch 或数据仓库。
- 搜索目标方案是 PostgreSQL `pg_trgm`，当前尚未接入。

---

## 6. 技术栈与版本

版本以 `package-lock.json` 为最终准绳。`package.json` 当前声明：

| 技术 | 版本范围 | 用途 |
| --- | --- | --- |
| Node.js | `>=20.9 <25`；推荐 22 | 运行与构建 |
| Next.js | `^16.3.1` | App Router、页面、Route Handlers |
| React / React DOM | `^19.2.0` | UI |
| TypeScript | `^5.9.2` | 严格类型 |
| Payload CMS | `^3.88.0` | 内容模型、Local/REST API、版本 |
| PostgreSQL adapter | `^3.88.0` | Payload 数据库 |
| Payload S3 storage | `^3.88.0` | MinIO/S3 媒体 |
| Tailwind CSS | `^4.1.13` | 样式基础；主要规则集中在 globals.css |
| Radix Dropdown Menu | `^2.1.16` | 头像账户菜单 |
| Recharts | `^3.1.2` | 管理端统计图 |
| jose | `^6.1.0` | JWT 签名与校验 |
| Zod | `^4.1.5` | API 输入校验 |
| AWS S3 SDK | `^3.888.0` | MinIO 签名 URL |
| Lucide React | `^0.542.0` | 图标 |
| Vitest | `^3.2.4` | 单元测试 |
| ESLint | `^9.35.0` | 静态检查 |

不允许仅为了方便引入新的 npm 包。优先使用现有依赖与 Web Platform 能力。

---

## 7. 仓库结构与文件职责

```text
/
├── README.md                    本地启动摘要
├── PRODUCT.md                   产品边界与原则
├── DESIGN.md                    视觉系统与交互约束
├── .impeccable/design.json      设计 token、动效和组件扩展描述
├── docs/SYSTEM_HANDOVER.md      本交付手册
├── package.json                 依赖与命令
├── payload.config.ts            Payload、PostgreSQL、MinIO 配置
├── docker-compose.yml           web/postgres/minio/nginx 编排
├── Dockerfile                   Next standalone 多阶段镜像
├── nginx/default.conf           反向代理
├── public/company-logo.png      公司 Logo
├── public/fonts/                本地 Geist 与 Geist Mono 字体资产
└── src
    ├── app
    │   ├── (employee)           员工端页面与布局
    │   ├── admin                管理端页面与布局
    │   ├── api                  应用 API、飞书、Payload REST
    │   ├── login               登录页
    │   └── globals.css          全站 tokens、组件与响应式样式
    ├── components               员工端/管理端共享与业务组件
    ├── lib
    │   ├── auth.ts              服务端会话读取与 requireUser/Admin
    │   ├── session-core.ts      JWT Cookie
    │   ├── payload-user.ts      飞书用户同步与事件处理
    │   ├── demo-data.ts         所有演示业务数据
    │   ├── demo-store.ts        进程内答题/进度 Map
    │   ├── video-progress.ts    视频幂等累计算法
    │   ├── quiz-engine.ts       随机抽题与评分
    │   ├── question-import.ts   CSV/.docx 题库解析
    │   ├── analytics.ts         指标与漏斗口径
    │   └── types.ts             领域 TypeScript 类型
    ├── payload/collections.ts   20 个 Payload 集合
    └── proxy.ts                 /admin 与 /api/admin 前置授权
```

### 7.1 当前仓库管理状态

交付审计时，`/Users/mac/peixun` 下没有 `.git` 目录，因此无法从该目录确认提交历史、远程仓库、分支、标签和最后提交。正式交付必须补充或确认：

- 正式 Git 仓库 URL。
- 默认分支与原型分支。
- 当前代码对应的 commit SHA 与 release tag。
- CODEOWNERS/维护人。
- CI/CD 地址。
- 问题追踪系统与需求文档地址。

---

## 8. 页面路由清单

### 8.1 公共页面

| 路由 | 说明 | 授权 |
| --- | --- | --- |
| `/` | 根据会话跳转 `/home` 或 `/login` | 无 |
| `/login` | 飞书登录；演示模式显示员工/管理员体验入口 | 无 |
| `/forbidden` | 管理端无权限提示 | 无 |

### 8.2 员工端

| 路由 | 说明 | 当前数据状态 |
| --- | --- | --- |
| `/home` | 必读通知、欢迎语、入职视频、常用服务 | 演示数据 |
| `/learn` | 唯一新人入职视频入口 | 演示数据 |
| `/learn/[courseId]` | 视频课程详情 | 演示数据 |
| `/learn/[courseId]/[unitId]` | 视频、测评和其他单元类型承载页 | 交互可用，业务数据演示 |
| `/services` | 高频问题、搜索、HR/行政/IT Tabs | 演示数据 |
| `/services/[articleId]` | 员工服务文章详情 | 示例正文 |
| `/me` | 个人资料、当前培训、最近测评 | 用户来自会话，记录来自演示数据 |

员工端布局统一调用 `requireUser()`。顶部主导航只有首页、学习、员工服务；个人学习记录在头像菜单中。

### 8.3 管理端

| 路由 | 说明 | 当前数据状态 |
| --- | --- | --- |
| `/admin` | 概览、筛选、漏斗、视频和员工明细 | 静态演示；页面内筛选可操作，API/CSV 尚未统一 |
| `/admin/training` | 培训路径与课程新增 | localStorage |
| `/admin/questions` | 题库 CRUD 与 CSV/.docx 导入 | localStorage |
| `/admin/people` | 飞书人员选择、分配与调整 | 组织读飞书；分配写 localStorage |
| `/admin/services` | 员工服务内容列表与新建 | localStorage；页面/上传新建可用，编辑未接逻辑 |
| `/admin/content` | 公告列表 | 静态，新增/编辑按钮未接逻辑 |
| `/admin/settings` | 集成摘要与管理员配置 | 管理员配置写 localStorage |
| `/admin/analytics/videos/[videoId]` | 单视频统计和员工名单 | 静态演示；导出按钮未接逻辑 |

### 8.4 Payload 路由现状

- Payload REST：`/api/cms/*` 已通过 `@payloadcms/next/routes` 挂载。
- Payload 配置声明后台路由为 `/cms`。
- 当前仓库没有 Payload Admin UI 所需的 Next 页面/layout 路由，因此 `/cms` 管理界面并未完整挂载。接手人应选择：
  1. 正式挂载 Payload Admin 供少量技术内容管理员使用；或
  2. 只保留 Local API/REST，将所有业务管理放在现有 `/admin/*`。

建议一期选择第 2 种，避免两套后台权限和工作流并存。

---

## 9. 员工端功能说明

### 9.1 登录

- 点击“使用飞书登录”进入 `GET /api/auth/feishu/start`。
- 演示模式未配飞书时回到登录页，并可选择员工或管理员体验账号。
- 生产必须关闭演示登录。

### 9.2 首页

- 员工首次进入首页时会出现居中的开信欢迎动效，内容为“欢迎来到乐堡家园，希望在这里我们共同成长！”。点击“确定”或按 `Esc` 后关闭并展示首页。
- 欢迎信按员工和浏览器记录状态，键为 `inside:welcome-envelope:<userId>:v2`；同一员工确认后刷新不再显示。需要全员重新展示时，应递增组件中的 `STORAGE_VERSION`，不要复用旧键写入不同语义。
- 顶部必读公告目前固定为“2026 年差旅与费用报销规范已更新”。
- 欢迎语与会话用户姓名联动，日期目前固定为 `FRI · 8 / 14`。
- 主内容是一张新人入职视频卡，进度当前来自演示数据。
- 常用员工服务显示前三条示例内容。
- 通知铃铛目前没有打开通知列表的动作。

### 9.3 学习与视频

- `/learn` 只展示一个新人入职视频，符合当前产品范围。
- 播放器使用浏览器原生 `video`，要求 MP4 为 H.264/AAC。
- 浏览器本地恢复键为 `inside:video:<unitId>:v1`。
- 进度上报失败时前端不打断观看，只静默忽略；生产需要可恢复重试和错误观测。
- 当前页面不会从服务端进度 Map 回读，所以不能实现真实跨设备续播。

### 9.4 测评

- 当前原型允许直接开始测评；视频达到 90% 仍单独记为完播，不影响答题入口。
- 一次展示一道题。
- 支持单选、多选；静态题库中也有判断题。
- 通过后调用单元完成 API。
- 当前服务端创建测评 API 不校验视频完播，符合“讲义阅读后可直接答题”的现行产品规则；若后续恢复门槛，必须同时增加服务端校验。

### 9.5 员工服务

- 页面级搜索只过滤服务内容。
- 高频问题由固定 ID 集合决定，当前不是按访问次数计算。
- 高频问题之后直接显示 HR、行政、IT 三个互斥 Tab。
- 外部飞书文档/办事入口会新窗口打开。
- 当前 6 篇详情内容依据《员工手册 V2026.08.01》整理，包含制度来源和版本提示；生产仍需迁移至 Payload 富文本并建立发布审核。

### 9.6 全局搜索

- 顶部搜索可点击或使用 `⌘K / Ctrl+K` 打开。
- 输入后 220ms 防抖，请求 `GET /api/search?q=`。
- 结果分课程、学习单元、员工服务，点击才跳到具体内容。
- 当前实现是内存 `includes` 搜索，不是 `pg_trgm`。

### 9.7 我的

- 姓名、英文名、邮箱、部门和入职日期来自当前会话。
- 当前培训与最近测评来自静态示例。
- “我的”不在主导航中，只从头像菜单进入。

---

## 10. 管理端功能说明

### 10.1 管理端框架

- 左侧浅色侧栏显示“乐堡家园管理端”。
- 侧栏可以收起，当前收起状态只存 React state，刷新后恢复展开。
- 桌面端头像位于侧边导航左下方，账户菜单向上展开；移动端头像随管理导航显示在顶部区域。
- 移动端使用响应式布局；表格由局部横向滚动容器承接。

### 10.2 数据概览

当前显示：

- 应分配、已开始、已完成、完成率、逾期、平均完成用时、测评平均分、首次通过率。
- 学习完成趋势。
- 部门完成率。
- 课程漏斗。
- 视频学习情况。
- 员工学习明细。

当前筛选行为：

- 使用一个开始/结束日期范围组件，没有独立“快捷时间”选择器。
- 部门选项通过浏览器调用飞书组织接口刷新。
- 培训路径选择器当前只有一个静态选项，页面计算暂未使用该值。
- 日期与部门会共同过滤培训记录，并驱动顶部指标、漏斗、趋势图、部门完成率和员工明细。
- 视频表按 `lastWatchedAt` 过滤日期，但尚未应用部门与培训路径过滤。
- `/api/admin/analytics/*` 与 CSV 导出目前仍读取静态数据并忽略计划中的筛选参数。

这意味着当前筛选结果不可作为 HR 正式数据，必须在生产化时统一查询对象和口径。

### 10.3 培训管理

已可实际操作：

- 新建培训路径：名称、说明、默认期限。
- 在当前路径中添加课程。
- 可同时创建第一个视频/图文/PDF/飞书文档单元。
- 路径切换和页面反馈。

限制：

- 数据只写 `admin-training-paths-v1`。
- 选中路径只写 `admin-selected-training-path-v1`。
- 没有编辑、删除、排序、发布、版本回滚、媒体上传。
- 新建路径/课程不会出现在员工端、分配页、搜索或统计中。

### 10.4 题库管理

已可实际操作：

- 新建单选题或多选题。
- 编辑、查看、删除。
- 设置草稿或已发布。
- 正确答案和解析校验。
- 按培训课程筛选并维护对应题库。
- CSV 与 `.docx` 导入，导入题目关联当前课程并保存为草稿。

限制：

- 数据只写 `admin-question-bank-v3`。
- 测评 API 仍读取 `demo-data.ts` 的静态题库，因此后台修改不会改变员工抽题。
- 删除只有浏览器确认框，没有服务端引用检查与审计。
- UI 暂不创建判断题；导入格式也主要面向 A-D 选择题。

### 10.5 员工与分配

已可实际操作：

- 从飞书组织架构读取部门和人员。
- 按姓名/部门搜索。
- 在分配弹窗中按姓名、部门或邮箱搜索，并多选员工分配培训；筛选不会清空已选人员。
- 调整截止日期或课程，现有进度不清空。

限制：

- 数据只写 `admin-training-records-v1`。
- 培训路径与课程选择仍是固定选项，不读取培训管理的 localStorage 数据。
- 分配不会写 Enrollment，不会出现在员工端或统计 API。
- “调整分配”的准确含义是修改截止日期或追加/切换课程；生产模型建议把“追加课程”建成独立 Enrollment，而不是覆盖原课程名称。

### 10.6 员工服务管理

- 当前有 HR、行政、IT 汇总和内容列表。
- “新建内容”支持页面新建，以及上传 PDF、DOC、DOCX 创建文档记录；数据写入 `admin-service-content-v1`。
- 页面新建内容可在管理端本地数据中保存，上传模式目前只保存文件名和内容元数据，不持久化原文件，也没有文件预览。
- 编辑图标尚未接动作；员工端仍读取 `demo-data.ts`，因此管理端新增内容不会进入员工端、详情页或全局搜索。
- Payload 已有 ServiceCategories、KnowledgeArticles、ServiceLinks，可作为生产实现基础。

### 10.7 内容与公告

- 当前展示三条静态公告和状态。
- “新建公告”“编辑”没有实际动作。
- Payload Announcements 已支持受众、部门、开始/结束时间和目标链接。

### 10.8 系统设置

- 展示飞书回调、租户变量、默认入职分配和媒体存储摘要。
- 超级管理员可在 UI 选择飞书人员并“设为管理员”，但当前只写 localStorage。
- 页面展示桶名 `training-assets`，代码实际默认桶是 `inside-hub`，这是已知显示不一致，生产前必须统一。

---

## 11. 飞书集成

### 11.1 OAuth 路径

```mermaid
sequenceDiagram
  participant U as 员工浏览器
  participant W as 乐堡家园
  participant F as 飞书
  participant P as Payload/PostgreSQL
  U->>W: GET /api/auth/feishu/start
  W-->>U: 设置 5 分钟 state Cookie 并跳转飞书
  U->>F: 用户授权
  F-->>W: GET /api/auth/feishu/callback?code&state
  W->>F: 换取 access_token
  W->>F: 获取 user_info
  W->>W: 校验 tenant_key
  W->>P: 幂等创建/更新用户，首次分配默认路径
  W-->>U: 设置 8 小时 inside_session，跳转 /home
```

### 11.2 必须在飞书后台配置

- 网页应用重定向 URI：`<APP_URL>/api/auth/feishu/callback`。
- 事件订阅请求地址：`<APP_URL>/api/feishu/events`。
- 应用可用范围。
- 通讯录部门与员工读取权限。
- 用户基本信息和邮箱等实际需要的权限。
- 员工创建、更新、离职/删除等事件订阅。
- Verification Token；如启用事件加密，还需补代码支持 Encrypt Key。

### 11.3 租户控制

`FEISHU_ALLOWED_TENANT_KEYS` 支持逗号分隔多个 tenant key；未配置时回退 `FEISHU_TENANT_KEY`。两者都为空时当前代码不限制租户。生产环境必须至少配置一个允许租户，并在启动检查中拒绝空值。

### 11.4 首批超级管理员

`BOOTSTRAP_ADMIN_OPEN_IDS` 是逗号分隔的飞书 Open ID。首次创建用户时，命中的账号会获得 `superAdmin`。

注意：

- 该变量只影响首次创建。
- 已存在用户不会因为环境变量变化自动升降权。
- 上线前至少配置两名有授权流程的超级管理员，避免单点。
- 生产角色变更应由审计 API 完成，而不是长期依赖环境变量。

### 11.5 组织架构接口

`GET /api/admin/feishu/organization`：

1. 用 App ID/Secret 获取 tenant access token。
2. 分页读取部门列表。
3. 分页读取用户列表。
4. 映射为统一 `FeishuOrganization`。
5. 未配置凭证时返回演示组织。
6. 调用失败时当前也返回演示组织并附 `warning`。

生产改造要求：

- 调用失败应返回明确 5xx 或“不可用”状态，不得无提示地把演示员工当成真实员工。
- 验证用户列表是否覆盖全部子部门；必要时按部门遍历获取用户并按 Open ID 去重。
- 缓存短时组织快照，避免每个筛选组件都实时请求全通讯录。
- 只返回管理页面需要的字段，减少个人信息暴露。

### 11.6 事件处理现状

`POST /api/feishu/events` 当前支持：

- URL challenge。
- Verification Token 校验（仅变量非空时生效）。
- Tenant Key 白名单。
- Event ID 写入 `feishu-events` 去重。
- 对已有用户处理 `contact.user.*` 资料更新与删除停用。

当前未完整支持：

- 事件加密体解密与飞书签名校验。
- 新用户事件直接创建员工。
- 部门创建、更新、删除。
- 员工部门关系变更写入 Departments。
- 重试队列、死信、告警和人工重放。

---

## 12. 数据模型

### 12.1 Payload 集合总览

`src/payload/collections.ts` 定义 20 个集合：

| 领域 | 集合 slug | 关键字段/作用 | 版本/草稿 | 当前业务接入 |
| --- | --- | --- | --- | --- |
| 身份 | `users` | 飞书 Open ID、tenant、部门、角色、启用状态 | 无 | 飞书登录真实写入 |
| 身份 | `departments` | 飞书部门 ID、父部门、启用状态 | 无 | 尚未完整同步 |
| 媒体 | `media` | PDF/MP4/图片、storageKey、时长、私有标记 | 无 | 配置骨架 |
| 培训 | `learning-paths` | 标题、slug、默认期限、默认入职、课程关系 | 草稿+最多20版 | 后台尚未写入 |
| 培训 | `courses` | 标题、分类、时长、单元关系 | 草稿+最多20版 | 后台尚未写入 |
| 培训 | `units` | article/pdf/feishuDoc/video、内容、媒体、测评规则 | 草稿+最多20版 | 后台尚未写入 |
| 题库 | `question-categories` | 分类名称与说明 | 无 | 后台尚未写入 |
| 题库 | `questions` | 题型、题干、选项、正确项、解析、难度、启用 | 最多20版 | 后台尚未写入 |
| 题库 | `quiz-rules` | 分类范围、抽题数、及格分 | 无 | 测评 API 尚未读取 |
| 学习 | `enrollments` | 用户、路径、分配/截止/完成、状态、唯一分配键 | 无 | 首次登录可真实写入 |
| 学习 | `unit-progress` | 用户、单元、状态、进度、唯一进度键 | 无 | API 尚未写入 |
| 视频 | `video-progress` | 首播、最近播放、位置、累计观看、最大进度、完播 | 无 | API 尚未写入 |
| 视频 | `video-playback-sessions` | sessionId、最后序号、上报时间 | 无 | API 尚未写入 |
| 测评 | `quiz-attempts` | 用户、单元、题目快照、答案快照、得分、通过 | 无 | API 尚未写入 |
| 测评 | `quiz-attempt-items` | 单题快照、选择项与正确状态 | 无 | API 尚未写入 |
| 服务 | `service-categories` | 分类、slug、排序 | 无 | 页面尚未读取 |
| 服务 | `knowledge-articles` | 富文本、媒体、外链、标签 | 草稿+最多20版 | 页面尚未读取 |
| 服务 | `service-links` | 分类、URL、排序 | 无 | 页面尚未读取 |
| 运营 | `announcements` | 受众、部门、有效期、目标 URL | 草稿+最多20版 | 页面尚未读取 |
| 集成 | `feishu-events` | Event ID、类型、租户、原始 payload、处理时间 | 无 | 真实事件可写入 |

### 12.2 关键唯一键

| 字段 | 用途 |
| --- | --- |
| `users.feishuOpenId` | 一个飞书账号只对应一个用户 |
| `departments.feishuDepartmentId` | 一个飞书部门只对应一个部门 |
| `media.storageKey` | 一个存储对象只对应一条媒体记录 |
| `learning-paths.slug`、`courses.slug`、`service-categories.slug`、`knowledge-articles.slug` | 稳定内容路径 |
| `enrollments.assignmentKey` | 防止重复分配 |
| `unit-progress.progressKey` | 单用户单单元聚合 |
| `video-progress.progressKey` | 单用户单视频聚合 |
| `feishu-events.eventId` | 事件幂等 |

`video-playback-sessions` 当前没有复合唯一键。生产建议增加 `sessionKey = userId:unitId:sessionId` 唯一索引，避免并发创建重复会话。

### 12.3 正式关系建议

```mermaid
erDiagram
  DEPARTMENT ||--o{ USER : contains
  USER ||--o{ ENROLLMENT : receives
  LEARNING_PATH ||--o{ ENROLLMENT : assigned
  LEARNING_PATH }o--o{ COURSE : contains
  COURSE }o--o{ UNIT : contains
  UNIT }o--|| MEDIA : uses
  UNIT }o--|| QUIZ_RULE : applies
  QUIZ_RULE }o--o{ QUESTION_CATEGORY : samples
  QUESTION_CATEGORY ||--o{ QUESTION : contains
  USER ||--o{ UNIT_PROGRESS : owns
  UNIT ||--o{ UNIT_PROGRESS : tracks
  USER ||--o{ VIDEO_PROGRESS : owns
  UNIT ||--o{ VIDEO_PROGRESS : tracks
  USER ||--o{ QUIZ_ATTEMPT : submits
  UNIT ||--o{ QUIZ_ATTEMPT : assesses
  QUIZ_ATTEMPT ||--o{ QUIZ_ATTEMPT_ITEM : snapshots
  SERVICE_CATEGORY ||--o{ KNOWLEDGE_ARTICLE : groups
  SERVICE_CATEGORY ||--o{ SERVICE_LINK : groups
```

### 12.4 数据访问注意事项

- 应用 `inside_session` 与 Payload 自带 `users` 登录是两套身份机制，当前没有把应用 JWT 注入 Payload REST。
- 员工页面建议通过服务端业务查询层调用 Payload Local API，不直接让员工浏览器访问 `/api/cms`。
- 当前 UnitProgress、VideoProgress、QuizAttempts 等集合的字段级所有权约束不完整。即使未来开放 Payload REST，也必须补“只能读写本人记录”和“单元已分配”校验。
- 所有进度和答题写入都应以服务端会话用户 ID 为准，不接受客户端传入 userId。

---

## 13. API 清单与当前实现

### 13.1 公共与身份 API

| 方法 | 路径 | 输入 | 输出/动作 | 当前状态 |
| --- | --- | --- | --- | --- |
| GET | `/api/auth/feishu/start` | 无 | 设置 OAuth state，跳转飞书 | 真实 |
| GET | `/api/auth/feishu/callback` | `code`、`state` | 同步用户、签发会话、跳 `/home` | 真实 |
| POST | `/api/auth/demo-login` | form `role=employee/admin` | 演示会话 | 仅演示，生产必须关闭 |
| POST | `/api/auth/logout` | 无 | 清 Cookie，跳 `/login` | 真实 |
| POST | `/api/feishu/events` | 飞书事件 JSON | challenge 或 204 | 部分真实 |

### 13.2 员工业务 API

| 方法 | 路径 | 请求 | 响应 | 数据源/限制 |
| --- | --- | --- | --- | --- |
| PUT | `/api/learning/units/:unitId/progress` | `{ progress: 0..100 }` | 单元聚合进度 | 进程内 Map |
| POST | `/api/learning/units/:unitId/complete` | 无 | 完成状态 | 进程内 Map |
| PUT | `/api/videos/:unitId/progress` | sessionId、sequence、currentSeconds、durationSeconds、progress、event | 聚合视频状态、duplicate | 进程内 Map |
| POST | `/api/quizzes/:unitId/attempts` | 无 | attemptId + 去答案题目 | 静态题库 + 进程内 Map |
| POST | `/api/quiz-attempts/:attemptId/submit` | `{ answers: Record<questionId, optionIds[]> }` | 分数、是否通过、逐题解析 | 进程内 Map |
| GET | `/api/search?q=` | 关键词 | courses、units、services | 演示数组 |
| GET | `/api/media/signed-url?key=` | 对象 key | 15 分钟签名 URL | 真实 S3 SDK；缺业务资源授权 |

视频请求示例：

```json
{
  "sessionId": "浏览器生成的 UUID",
  "sequence": 4,
  "currentSeconds": 61,
  "durationSeconds": 720,
  "progress": 8,
  "event": "heartbeat"
}
```

### 13.3 管理 API

| 方法 | 路径 | 计划筛选 | 当前响应 | 当前限制 |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/analytics/overview` | dateFrom/dateTo/departmentId/pathId/courseId | 指标、漏斗、趋势、部门、视频 | 完全静态且忽略筛选 |
| GET | `/api/admin/analytics/courses/:courseId` | 同上 | courseId、漏斗、记录 | 静态，未验证课程存在 |
| GET | `/api/admin/analytics/videos/:videoId` | 同上 | 视频、比率、员工状态 | 静态 |
| GET | `/api/admin/analytics/quizzes/:quizId` | 同上 | 参与、通过、均分、题目正确率 | 静态正确率 |
| GET | `/api/admin/analytics/users/:userId` | 同上 | 员工记录 | unitProgress/quizAttempts 为空 |
| GET | `/api/admin/exports/training.csv` | 同上 | UTF-8 BOM CSV | 静态且忽略筛选 |
| GET | `/api/admin/feishu/organization` | 无 | 部门、员工、来源、同步时间 | 真实/演示回退 |
| * | `/api/cms/*` | Payload REST 规范 | Payload 集合 | 已挂载，使用 Payload 自有权限 |

### 13.4 尚未建立但生产必需的管理 API

建议至少增加：

```text
POST   /api/admin/learning-paths
PATCH  /api/admin/learning-paths/:id
POST   /api/admin/learning-paths/:id/publish
POST   /api/admin/courses
PATCH  /api/admin/courses/:id
POST   /api/admin/units
PATCH  /api/admin/units/:id
POST   /api/admin/questions
PATCH  /api/admin/questions/:id
DELETE /api/admin/questions/:id
POST   /api/admin/questions/import
POST   /api/admin/enrollments/batch
PATCH  /api/admin/enrollments/:id
POST   /api/admin/users/:id/role
POST   /api/admin/knowledge-articles
PATCH  /api/admin/knowledge-articles/:id
POST   /api/admin/announcements
PATCH  /api/admin/announcements/:id
```

所有 API 需要统一：

- Zod 输入验证。
- `requireAdmin` 或 `requireSuperAdmin`。
- 业务对象存在性与租户/范围校验。
- 标准错误结构和 request ID。
- 审计日志。
- 幂等键或乐观锁。

---

## 14. 统计定义

### 14.1 概览指标

| 指标 | 当前/目标公式 |
| --- | --- |
| 应分配人数 | 当前筛选范围内 Enrollment 去重用户数 |
| 已开始人数 | 状态不是 `notStarted` 的人数 |
| 已完成人数 | 状态是 `completed` 的人数 |
| 完成率 | 已完成人数 ÷ 应分配人数 |
| 逾期人数 | 截止时间已过且未完成 |
| 平均完成用时 | 完成员工 `completedAt - assignedAt` 的平均值 |
| 测评平均分 | 有提交记录员工的成绩平均值；需明确取首次/最高/全部尝试 |
| 首次通过率 | 首次尝试通过人数 ÷ 有首次尝试人数 |

当前 `averageCompletionDays` 固定为 4.6，不是计算结果。正式查询必须替换。

### 14.2 课程漏斗

顺序固定：

```text
已分配 → 已开始 → 内容完成 → 开始测评 → 测评通过 → 课程完成
```

- 内容完成：视频最大进度 ≥ 90%。
- 开始测评：至少存在一次 QuizAttempt。
- 测评通过：至少一次得分 ≥ 规则 passScore。
- 课程完成：课程全部必修单元满足完成条件。
- 每步转化率：当前阶段人数 ÷ 上一阶段人数。

### 14.3 视频指标

| 指标 | 公式 |
| --- | --- |
| 开播率 | 开播人数 ÷ 应学习人数 |
| 完播率 | 完播人数 ÷ 开播人数 |
| 触达完播率 | 完播人数 ÷ 应学习人数 |
| 平均观看时长 | 累计有效观看秒数平均值 |
| 平均观看进度 | 最大观看进度平均值 |
| 进度分桶 | 0–10%、10–25%、25–50%、50–75%、75–90%、90–100% |

边界必须用一套 SQL 定义，避免 90% 同时落入两个桶。

### 14.4 统计一致性要求

生产实现必须让：

1. 页面指标。
2. 图表。
3. 课程/视频/员工详情。
4. CSV 导出。

共享同一个筛选解析器和查询层。不得像当前演示页面一样只过滤部分模块。

---

## 15. 题库导入规范

### 15.1 CSV

支持 UTF-8 CSV。表头支持中文或部分英文别名。推荐模板：

```csv
题目,题型,选项A,选项B,选项C,选项D,正确答案,解析
"跨团队协作前推荐先做什么？","单选","写清目标、事实与约束","直接开大会","等待分配","只在本组讨论","A","先讲清问题能减少无效沟通"
"哪些做法符合协作原则？","多选","默认公开进展","保留深度工作时间","回到用户与数据","决定后反复争论","ABC","A、B、C 正确"
```

规则：

- 必须有“题目”和“正确答案”。
- 至少两个非空选项。
- 正确答案从 A-D 中识别，可写 `A`、`AC`、`A,C` 等。
- 正确项超过一个时自动判定为多选。
- CSV 引号与双引号转义已支持。
- 导入题默认难度为中等、分类为 `imported-choice`、状态为草稿。

### 15.2 Word .docx

仅支持 Office Open XML `.docx`，不支持旧 `.doc`。推荐每题：

```text
题目：跨团队协作前推荐先做什么？
A. 写清目标、事实与约束
B. 直接开大会
C. 等待负责人分配
D. 只在本组讨论
答案：A
解析：先把问题讲清楚，能减少无效沟通。
```

当前解析器直接读取 ZIP 中的 `word/document.xml` 并提取段落。复杂文本框、图片题、合并内容、公式、批注和嵌套表格不保证可识别。

### 15.3 生产导入流程建议

1. 上传文件到临时私有区。
2. 服务端限制文件大小、扩展名和 MIME。
3. 解析为标准题目草稿。
4. 返回逐行预览和错误。
5. 管理员确认后单事务写入。
6. 记录导入批次、操作者、成功/失败数量和原始文件 hash。
7. 清理临时文件。

---

## 16. 本地开发

### 16.1 前置条件

- macOS/Linux/WSL。
- Node.js 22，仓库含 `.nvmrc`。
- npm，使用 `package-lock.json`。
- 仅运行演示模式时，不要求 PostgreSQL、MinIO 或飞书凭证。
- 做生产数据联调时需要 Docker Desktop 或本机 PostgreSQL/MinIO。

### 16.2 最快预览

```bash
nvm use
cp .env.example .env
npm install
npm run dev -- -p 3010
```

访问：

```text
http://localhost:3010/login
```

端口不指定时，Next.js 默认使用 3000。当前浏览器评审使用 3010；如果改端口，`APP_URL` 也要改成对应地址，否则飞书回调 URI 会不一致。

### 16.3 演示账号

当 `DEMO_MODE=true`：

- “体验员工端”使用示例用户陈屿。为了原型中可切换管理端，该用户当前会被兼容提升为 `superAdmin`。
- “体验管理端”使用示例用户林溪，角色为 `superAdmin`。
- 这不是正式角色数据，不应复制到生产。

### 16.4 常用命令

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:watch
npm run build
npm run start
npm run payload:types
npm run payload:migrate:create
npm run payload:migrate
```

### 16.5 清除原型数据

在浏览器开发者工具 Application/Local Storage 中只删除以下键：

```text
admin-training-paths-v1
admin-selected-training-path-v1
admin-question-bank-v3
admin-service-content-v1
admin-training-records-v1
admin-manager-ids-v1
inside:welcome-envelope:<userId>:v2
inside:video:<unitId>:v1
lebao-theme-v2
```

不要在不知道同域是否有其他应用数据时直接执行 `localStorage.clear()`。

服务端演示答题和进度保存在进程内 Map，重启开发服务器即可清空。该行为也是当前不能跨设备、不能稳定保留记录的原因。

### 16.6 数据库联调

可以先启动依赖：

```bash
docker compose up -d postgres minio minio-init
```

然后确保本机 `.env` 中：

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inside_hub
MINIO_ENABLED=true
MINIO_ENDPOINT=http://localhost:9000
MINIO_BUCKET=inside-hub
```

当前仓库没有已提交的 migration 文件，也没有 seed 脚本。接手后必须先建立初始 migration 和可重复 seed，再把数据库初始化纳入 CI/CD。不要在没有备份的正式库上依赖自动 schema push。

---

## 17. 环境变量

以 `.env.example` 为模板。`.env` 已被 gitignore，禁止提交任何真实密钥。

| 变量 | 必需环境 | 示例/默认 | 说明 |
| --- | --- | --- | --- |
| `NODE_ENV` | 全部 | development/production | 影响安全 Cookie 和运行模式 |
| `APP_URL` | 生产必需 | `http://localhost:3000` | 对外完整 origin，无尾斜杠；OAuth 回调依赖 |
| `SESSION_SECRET` | 生产必需 | 无安全默认 | 应至少 32 字节随机值；签应用 JWT |
| `DEMO_MODE` | 全部 | `true` | 生产必须 `false` |
| `DATABASE_URL` | 生产必需 | PostgreSQL URL | Payload 数据库连接 |
| `PAYLOAD_SECRET` | 生产必需 | 无安全默认 | Payload 签名/加密密钥 |
| `FEISHU_APP_ID` | 生产必需 | 空 | 飞书应用 ID |
| `FEISHU_APP_SECRET` | 生产必需 | 空 | 飞书应用 Secret |
| `FEISHU_TENANT_KEY` | 生产建议 | 空 | 单租户兼容变量 |
| `FEISHU_ALLOWED_TENANT_KEYS` | 生产必需 | 空 | 逗号分隔允许租户 |
| `FEISHU_VERIFICATION_TOKEN` | 生产必需 | 空 | 飞书事件 Token |
| `BOOTSTRAP_ADMIN_OPEN_IDS` | 首次上线 | 空 | 逗号分隔首批超级管理员 Open ID |
| `MINIO_ENABLED` | 使用私有媒体时 | `false` | Compose 中覆盖为 true |
| `MINIO_ENDPOINT` | 使用 MinIO 时 | `http://localhost:9000` | 服务端访问地址 |
| `MINIO_REGION` | 使用 MinIO 时 | `us-east-1` | S3 区域 |
| `MINIO_ACCESS_KEY` | 使用 MinIO 时 | 开发默认 | 生产必须替换 |
| `MINIO_SECRET_KEY` | 使用 MinIO 时 | 开发默认 | 生产必须替换 |
| `MINIO_BUCKET` | 使用 MinIO 时 | `inside-hub` | 私有桶 |
| `MINIO_FORCE_PATH_STYLE` | MinIO | `true` | MinIO 通常需要 path style |

### 17.1 密钥要求

- 使用部署平台 Secret Manager，不写 Dockerfile、Compose 或仓库。
- 生产、预发布、开发使用不同密钥。
- 轮换 SESSION_SECRET 会让全部会话失效，应安排维护通知。
- 轮换飞书 Secret 后立即验证 OAuth、组织同步和事件。
- MinIO Access Key 应最小权限，只能访问指定桶。

### 17.2 建议增加的启动时配置校验

当 `NODE_ENV=production` 时，应用应在启动阶段拒绝：

- `DEMO_MODE` 不是 false。
- 使用代码中的默认 SESSION/Payload/MinIO 密钥。
- `APP_URL` 不是 HTTPS。
- 飞书租户白名单或 Verification Token 为空。
- 数据库或对象存储不可连接。

---

## 18. 从原型态迁移到正式持久化

这是接手团队最优先的开发工作。

### 18.1 推荐分层

```text
页面 / Client Component
  → Next Route Handler 或 Server Action
  → 领域服务（鉴权、校验、事务、审计）
  → Repository / Payload Local API
  → PostgreSQL / MinIO
```

不要让 Client Component 直接调用具有管理员权限的 Payload REST。

### 18.2 培训管理迁移

把：

- `admin-training-paths-v1` → LearningPaths、Courses、Units。
- `admin-selected-training-path-v1` → 仅作为 URL/query 或页面 state，不需要业务落库。

实现顺序：

1. 路径创建/编辑。
2. 课程与单元创建/编辑。
3. 有序关系与拖拽排序。
4. 媒体选择/上传。
5. 草稿预览。
6. 发布。
7. 版本历史与回滚。
8. 删除前引用检查。

### 18.3 题库迁移

把 `admin-question-bank-v3` 写入 QuestionCategories 与 Questions。要求：

- 已发布题目才可进入抽题池。
- 修改题目不改变历史 Attempt 快照。
- 删除应优先软停用 `active=false`。
- 导入先生成预览批次。
- QuizRule 决定分类、数量和通过分，而不是 API 写死 3/80。

### 18.4 人员分配迁移

把 `admin-training-records-v1` 拆为真实 Enrollment、UnitProgress、VideoProgress、QuizAttempt 聚合：

- 批量分配请求带客户端幂等键。
- 对同一用户/路径重复分配定义清楚：拒绝、延长或新版本重训。
- “追加课程”不要覆盖原 Enrollment。
- 截止日期变更写审计。
- 逾期状态建议查询时计算，并用每日任务做提醒；无需高频实时流。

### 18.5 管理员配置迁移

把 `admin-manager-ids-v1` 替换为服务端 Role API：

- 仅 `superAdmin`。
- 事务更新 Users.role。
- 记录 before/after、操作者、时间和理由。
- 防止删除最后一个超级管理员。
- 变更后清理相关缓存；下一请求按数据库生效。

### 18.6 视频进度迁移

当前算法可复用，但写入必须原子化：

1. 校验当前员工确实被分配该单元。
2. 按 `user + unit` 锁定或原子 upsert VideoProgress。
3. 按 `user + unit + sessionId` 读取 VideoPlaybackSession。
4. sequence 小于等于已处理值时返回 duplicate。
5. 计算最多 30 秒有效增量。
6. 更新最大进度、位置、累计观看与完播时间。
7. 同一事务更新会话序号。
8. 达到 90% 后更新视频完播状态；测评通过后更新 UnitProgress，并按已确认的业务规则完成 Enrollment/课程。

页面初始化要从服务端读取 `currentSeconds/maxProgress`，而不是只依赖浏览器 localStorage。

### 18.7 测评迁移

创建 Attempt 时：

- 校验 Enrollment、课程/单元归属和 QuizRule。当前产品允许直接开始测评，不校验视频完播；若业务后续恢复 90% 解锁，必须同时增加服务端校验并更新 PRODUCT 与本手册。
- 在数据库事务中随机查询有效题。
- 数量不足返回明确业务错误。
- 保存完整题目快照。
- 返回前去掉正确答案。

提交时：

- 校验 Attempt 属于当前员工、未过期、未越权。
- 幂等返回已提交结果。
- 保存 answersSnapshot 与 QuizAttemptItems。
- 计算得分并更新完成状态。
- 记录提交时间与尝试序号。

### 18.8 搜索迁移

- 为课程、单元、知识标题、摘要、标签建立 `pg_trgm` GIN/GiST 索引。
- 只搜索已发布、在有效期内、员工有权访问的内容。
- 返回稳定类型与目标 URL。
- 设置最大关键词长度、结果数和超时。
- 一期不引入 Elasticsearch。

### 18.9 统计迁移

- 建一个统一筛选 DTO：dateFrom、dateTo、departmentId、pathId、courseId。
- 页面、各详情 API 和 CSV 共享查询函数。
- 大部分一期统计可以用 PostgreSQL 聚合和正确索引完成。
- 不要先建设事件仓库；VideoProgress 聚合已足够。
- 如查询变慢，先看 `EXPLAIN ANALYZE`、索引和缓存，再考虑物化视图。

---

## 19. 安全基线与上线阻断项

### 19.1 P0 安全阻断

以下未完成时不得接入真实员工数据：

1. 关闭 `DEMO_MODE`，禁止演示登录和演示数据静默回退。
2. 替换全部默认 Secret、数据库和 MinIO 凭证。
3. 全站 HTTPS，Cookie 保持 Secure、HttpOnly、SameSite。
4. 强制飞书 Tenant Key 白名单。
5. 飞书事件必须校验 Verification Token，并按飞书配置补签名/加密支持。
6. 所有学习 API 校验“当前用户已被分配该单元”，不能只信 unitId。
7. 若产品重新启用测评门槛，测评创建 API 必须在服务端校验完播状态，不能只靠前端隐藏。
8. 媒体签名 API 不能允许任意已登录用户为任意 key 生成 URL，必须从 Media 记录反查并校验授权。
9. 管理员设置必须真正写数据库角色且只允许超级管理员。
10. 进度、答题、分配和统计改为 PostgreSQL，不再依赖内存/localStorage。
11. 增加管理操作审计日志。
12. 为登录、导入、搜索、进度上报和导出增加合理速率限制。

### 19.2 输入与文件安全

- Zod 校验所有 JSON、query 和 route params。
- CSV/.docx 限制大小、解压后大小、ZIP entry 数量，防止压缩炸弹。
- 媒体限制 MIME 与扩展名，上传后做病毒扫描。
- 外部 URL 只允许批准域名或明确标记风险。
- 避免将员工个人信息写入客户端日志、错误追踪和 URL。
- CSV 导出防公式注入：以 `=`、`+`、`-`、`@` 开头的文本需转义。

### 19.3 Web 安全

建议增加：

- Content-Security-Policy。
- Strict-Transport-Security。
- X-Content-Type-Options。
- Referrer-Policy。
- frame-ancestors 与飞书 WebView 的兼容白名单。
- CSRF 方案或严格 Origin 校验，尤其是角色/分配/删除类写操作。
- 统一安全日志与 request ID。

### 19.4 数据最小化

- 只同步业务需要的飞书字段。
- 管理员列表接口按职责限制数据范围。
- 答题记录属于员工培训数据，需要明确保存期限和访问责任人。
- 飞书事件原始 payload 可能含个人信息，应设定保留周期并限制 superAdmin 访问。

---

## 20. 部署架构与发布

### 20.1 Docker Compose 服务

| 服务 | 镜像/构建 | 端口 | 持久卷 | 说明 |
| --- | --- | --- | --- | --- |
| web | 本仓库 Dockerfile | 3000 | 无 | Next standalone |
| postgres | `postgres:18-alpine` | 容器内 5432 | `postgres-data` | 业务数据库 |
| minio | `minio/minio:latest` | 9000/9001 | `minio-data` | 对象与控制台 |
| minio-init | `minio/mc:latest` | 无 | 无 | 创建私有 `inside-hub` |
| nginx | `nginx:1.29-alpine` | 主机 8080 → 80 | 配置只读 | 反向代理 |

开发启动：

```bash
docker compose up --build
```

访问 `http://localhost:8080`。

### 20.2 当前 Compose 不能直接用于生产的原因

- PostgreSQL 用户密码是 `postgres/postgres`。
- MinIO 用户密码是 `minioadmin/minioadmin`。
- MinIO init 也写死开发凭证。
- MinIO 使用 `latest`，不可重复部署。
- Nginx 没有 TLS、压缩、安全头、限流和独立健康检查。
- 没有数据库备份任务。
- 没有日志采集、错误告警和指标。
- 没有 migration job。
- web 只依赖容器 health，不代表 schema 已就绪。

交付审计已把 MinIO 健康检查改为 `/minio/health/live`，并新增 `.dockerignore` 防止 `.env`、`.git`、构建缓存和本地 AI 工作区进入镜像上下文。由于审计机器没有 Docker CLI，这两项仍需在接手环境执行 `docker compose config --quiet` 和 `docker compose up --build` 实际验证。

### 20.3 发布前配置

1. 准备正式域名与 HTTPS 证书。
2. 在飞书应用后台配置完全一致的正式回调。
3. 创建独立数据库用户与私有 MinIO Access Key。
4. 固定所有基础镜像 digest 或明确版本。
5. 配置 Secret Manager。
6. 创建数据库 migration 并在预发布演练。
7. 创建私有桶、CORS、生命周期和备份策略。
8. 准备至少两名超级管理员。
9. 先用 10–20 人试点。

### 20.4 推荐发布流程

```text
PR 合并
  → lint + typecheck + unit + integration + build
  → 构建不可变镜像（标 commit SHA）
  → 漏洞扫描
  → 部署预发布
  → migration dry run / 备份
  → 自动冒烟 + 手工验收
  → 生产数据库备份
  → 执行向前兼容 migration
  → 发布应用
  → 观察错误率、登录、进度和统计
  → 业务签字
```

### 20.5 回滚原则

- 应用镜像可回滚到上一 SHA。
- 数据库 migration 优先采用 expand/contract，避免发布时破坏旧代码兼容。
- 不在没有回滚脚本和备份恢复演练的情况下做不可逆列删除。
- 内容错误优先通过 Payload 版本回滚。
- 角色错误应通过审计 API 纠正并立即失效会话权限。

### 20.6 媒体

- 播放下载不经 Next.js 转发，而是返回 15 分钟签名 URL。
- 当前管理上传如通过 Payload REST，上传流量仍可能经过 Next.js；大视频应评估预签名直传。
- Nginx 当前允许最大请求体 2GB。
- 视频必须预先转成浏览器兼容 H.264/AAC MP4；系统不负责转码。

---

## 21. 数据库、Migration 与 Seed

### 21.1 当前情况

- Payload PostgreSQL adapter 已配置。
- 模型定义完整度较高。
- 仓库当前没有 migration 目录/文件。
- 仓库当前没有 seed 脚本。
- 演示数据只存在 `src/lib/demo-data.ts`。

### 21.2 必须补齐

- 初始 migration。
- `pg_trgm` extension migration。
- 索引和复合唯一键。
- 最小 seed：服务分类、默认入职路径、课程、视频单元、QuizRule。
- 可重复执行的开发 seed 与只执行一次的生产 bootstrap 分离。
- Migration 执行记录、超时和失败回滚。

### 21.3 数据一致性建议

- Enrollment 创建、默认期限和分配键在一个事务。
- VideoProgress 与 PlaybackSession 在一个事务。
- QuizAttempt 与 AttemptItems、UnitProgress 完成状态在一个事务。
- 删除课程/单元前检查 Enrollment、Progress、Attempt 引用。
- 发布内容采用不可变发布版本或版本号，历史培训引用固定版本。

---

## 22. 测试、质量门禁与验收

### 22.1 当前自动化测试

| 文件 | 覆盖 |
| --- | --- |
| `src/lib/video-progress.test.ts` | 正向累计、重复/乱序、90% 完播 |
| `src/lib/quiz-engine.test.ts` | 随机不重复、评分 |
| `src/lib/analytics.test.ts` | 概览、视频比率、漏斗 |
| `src/lib/question-import.test.ts` | CSV、文本模板、真实 docx 压缩读取 |

当前只有单元测试，没有数据库集成测试或浏览器 E2E。

### 22.2 每次合并最低命令

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

### 22.3 上线前必须增加

- 飞书 OAuth 回调集成测试（Mock 飞书）。
- Payload/PostgreSQL Repository 集成测试。
- 管理 API 角色/越权测试。
- 视频并发、重复、乱序和多设备上报测试。
- 测评题目快照和幂等提交测试。
- 分配幂等和默认分配补偿测试。
- 统计与 CSV 同筛选一致性测试。
- MinIO 签名 URL 权限测试。
- Playwright 桌面、移动端、飞书 WebView 关键路径。
- 50 并发业务请求压测。

### 22.4 核心验收场景

| 场景 | 当前结论 |
| --- | --- |
| 普通员工看不到管理入口 | UI/会话支持；需真实员工角色测试 |
| 普通员工访问 `/admin` 服务端拒绝 | 已实现 |
| 管理员两端切换无需重登 | 已实现 |
| 管理员降级后立即失权 | 生产读取逻辑支持；管理配置尚未真实落库 |
| 首次登录默认路径只分配一次 | Payload 逻辑支持；需 DB 集成和并发测试 |
| 刷新/换设备继续视频 | 当前仅同浏览器 localStorage；未通过 |
| 重复/乱序不重复累计 | 算法单测通过；未接数据库 |
| 90% 后统计与名单同步 | 当前静态统计；未通过 |
| 漏斗可与员工明细核对 | 当前部分数据静态/筛选不一致；未通过 |
| 随机题无重复 | 单元测试通过 |
| 刷新保持当前题组 | 同进程未提交 Attempt 支持；页面状态恢复需 E2E |
| 重试生成新题组 | 已实现演示逻辑 |
| 历史快照不受题库修改影响 | 引擎思路支持；未数据库验证 |
| 筛选、部门汇总、CSV 一致 | 当前未通过 |
| 桌面/飞书桌面/飞书移动可用 | 仅普通浏览器原型评审；需实机验收 |
| 视频不经 Next.js 播放转发 | 签名设计支持；演示视频为外部 URL |

### 22.5 手工冒烟清单

1. 未登录访问 `/` 跳登录。
2. 员工登录进入首页。
3. 全局搜索可用，结果跳正确内容。
4. 视频加载、播放、暂停、刷新恢复。
5. 视频进度正常保存，90% 后记为完播；配套讲义与测评可直接访问。
6. 单选、多选、上一题/下一题、提交和重试。
7. 员工服务搜索和三个 Tab。
8. 头像中个人记录和管理端入口按角色显示。
9. 管理侧栏收起、移动端布局。
10. 路径/课程新增。
11. 题目 CRUD、CSV、docx 导入。
12. 人员搜索、多选分配、调整期限。
13. 原型中验证管理员配置 UI；真实授予/撤销权限需待 Users.role 服务端 API 完成后验收。
14. 筛选和 CSV 相互核对。
15. 退出后 Cookie 清除。

---

## 23. 运维、监控与备份

### 23.1 当前缺失

- 没有 `/healthz`、`/readyz`。
- 没有结构化日志约定。
- 没有 Sentry/APM/Prometheus。
- 没有告警规则。
- 没有定时备份。
- 没有后台任务和失败重放界面。

### 23.2 最低可观测性

建议上线前记录：

- requestId、route、status、duration、userId hash、tenant、错误码。
- OAuth 成功/失败率。
- 飞书事件接收、重复、失败数量。
- 视频进度上报成功率、duplicate 比例、数据库延迟。
- 测评创建/提交失败率。
- CSV 导出耗时与行数。
- PostgreSQL 连接池、慢查询、磁盘。
- MinIO 容量、4xx/5xx、签名失败。

日志不得记录：

- 飞书 App Secret、access token。
- Session Cookie/JWT。
- 员工完整答题内容和敏感个人资料，除非受控审计。

### 23.3 建议 SLO（需业务确认）

| 项目 | 建议 |
| --- | --- |
| 工作时间可用性 | 99.9% |
| 页面/API P95 | 普通查询 < 1 秒 |
| 进度上报成功率 | > 99.5% |
| RPO | PostgreSQL ≤ 24 小时，关键期可缩短 |
| RTO | 4 小时 |

以上是初始建议，不是已经承诺的 SLA。

### 23.4 PostgreSQL 备份

示例逻辑，实际命令应由运维平台注入凭证：

```bash
pg_dump --format=custom --no-owner --file=inside-hub.dump "$DATABASE_URL"
pg_restore --list inside-hub.dump
```

恢复必须先在隔离环境演练：

```bash
pg_restore --clean --if-exists --no-owner --dbname="$RESTORE_DATABASE_URL" inside-hub.dump
```

不要直接对生产库试恢复。定期做可恢复性验证，而不只检查备份文件存在。

### 23.5 MinIO 备份

使用受限运维凭证和 `mc mirror` 将 `inside-hub` 镜像到独立存储位置；同时保存对象版本/校验和。数据库 Media 记录和对象存储必须在可接受时间窗口内成对恢复。

### 23.6 建议保留

- 数据库每日备份 30 天、月度备份 12 个月（需公司制度确认）。
- 媒体按内容生命周期保留。
- 审计日志至少 1 年（需安全/HR 确认）。
- 飞书原始事件按最小必要原则设置较短周期。

### 23.7 日常巡检

每日：

- 登录和飞书事件错误。
- 数据库/对象存储容量。
- 失败进度和测评提交。

每周：

- 逾期和异常进度数据。
- 备份结果。
- 待发布内容和失效外链。

每月：

- 恢复抽检。
- 管理员权限复核。
- 依赖与基础镜像安全更新。
- 已离职员工状态与访问日志抽查。

---

## 24. 故障排查

| 现象 | 优先检查 | 处理 |
| --- | --- | --- |
| 本地打不开 3010 | 端口进程、dev server 输出 | `npm run dev -- -p 3010`；确认无端口占用 |
| 飞书登录提示未配置 | FEISHU_APP_ID/SECRET、DEMO_MODE | 本地用演示登录；生产补凭证 |
| OAuth state 无效 | Cookie、域名、反向代理、回调耗时 | 清登录 Cookie 重试；保证同 origin 和 5 分钟内完成 |
| 飞书回调 URI 不匹配 | APP_URL 与飞书后台 | 必须字符完全一致，包含协议和端口 |
| 账号不属于企业 | tenant_key 与 allowlist | 核对 FEISHU_ALLOWED_TENANT_KEYS |
| 管理端 401/403 | Cookie、JWT 角色、Payload active/role | 生产查 Users；不要只看 UI localStorage 管理员列表 |
| 组织架构显示示例人员 | 飞书凭证/权限/接口 warning | 当前会静默回退；查接口响应 warning，生产应改为显式失败 |
| 新建题目后员工抽不到 | 数据只在 localStorage | 属于当前限制；完成题库 API/Payload 迁移 |
| 分配后员工看不到 | 数据只在 localStorage | 属于当前限制；写入 Enrollment |
| 换设备没有视频进度 | 当前只从 localStorage 恢复 | 接入 VideoProgress 服务端读取 |
| 重启后答题记录丢失 | Attempt 在进程内 Map | 接 PostgreSQL |
| 视频不能播放 | 编码、签名 URL、CORS、Range | 确保 H.264/AAC、Content-Type、Range 和未过期 URL |
| MinIO 签名失败 | endpoint、bucket、region、path style、凭证 | 对照环境变量与服务端网络地址 |
| Word 导入失败 | 是否 .docx、模板段落、文件损坏 | 转存标准 .docx；按第 15 章模板 |
| 统计筛选前后不一致 | 当前只有指标/漏斗部分过滤 | 属于已知限制，统一查询层 |
| Payload CLI 失败 | Node 版本 | 使用 `nvm use` 切到 Node 22 |
| Docker 构建缺文件 | standalone 输出、ignore | 先本机 `npm run build`；检查 Docker build context |
| `/cms` 404 | Payload Admin UI 未挂载 | 属于当前实现；补 Payload Admin route 或只用业务后台 |

---

## 25. 已知问题与技术债

### 25.1 P0：上线前必须完成

1. 所有学习/后台/统计数据接 PostgreSQL。
2. 管理员配置接真实 Users.role。
3. 服务端校验 Enrollment、课程/单元归属和媒体访问；是否恢复视频解锁由业务确认。
4. 统计、明细、CSV 使用统一筛选和真实数据。
5. 飞书事件安全与完整组织同步。
6. 初始 migration、seed、备份和恢复演练。
7. 生产密钥、HTTPS、限流、审计和监控。
8. 去除生产演示数据与静默回退。

### 25.2 P1：试点前建议完成

1. 培训内容完整 CRUD、草稿、发布、版本和回滚。
2. 员工服务与公告完整 CRUD。
3. 真实跨设备续播。
4. 批量导入错误预览。
5. 题库分类与 QuizRule 配置。
6. 完整员工详情和测评题目快照查看。
7. 视频名单导出。
8. 飞书组织缓存与手动同步状态。
9. 数据库/API/E2E 测试。
10. 日期不再写死，统一 Asia/Shanghai。

### 25.3 P2：稳定后再评估

1. 培训提醒通知。
2. 更细管理员权限项。
3. 内容访问热度驱动的高频问题。
4. 大视频预签名直传。
5. 统计物化视图。
6. 内容归档、保留和自动下线。

### 25.4 具体代码不一致

- 系统设置页面显示 MinIO 桶 `training-assets`，配置默认是 `inside-hub`。
- 首页日期、通知、个人测评和多处统计是固定演示值。
- 页面日期/部门筛选已驱动指标、漏斗、趋势、部门完成率和员工明细；视频表只按观看日期过滤，培训路径筛选未生效，统计 API 与 CSV 仍未使用同一筛选。
- 管理培训标题仍有旧文案“认识我们与协作方式”，产品当前主课程是“新人入职说明”。
- `durationMinutes` 仍在领域类型和模型中，员工界面已按要求去掉时长展示；可保留为统计元数据，但不要重新展示。
- 飞书用户资料接口没有建立部门 relationship，登录用户可能显示“待同步部门”。
- Feishu contact event 只更新已有用户，部门事件未处理。
- 媒体签名路由只校验 key 格式，没有资源归属。
- 问题删除是硬删除式本地操作，生产应软停用。

---

## 26. 推荐实施路线

### 阶段 0：接管与冻结（1–2 天）

- 确认 Git 仓库、commit SHA、分支和负责人。
- 复制正式需求、飞书应用所有者、域名和基础设施信息。
- 不新增功能，先修正文档与环境差异。
- 建立 issue 列表，把本章 P0 拆成可验收任务。

### 阶段 1：数据与权限闭环

- 建 migration 和 seed。
- 建 Repository/Service 层。
- 实现管理员真实角色变更。
- 实现 Enrollment、VideoProgress、QuizAttempt 持久化。
- 实现服务端业务授权与审计。

验收：两个浏览器/设备看到同一进度；管理员降权立即失效；后台分配在员工端生效。

### 阶段 2：内容与题库

- 培训、题库、服务、公告 CRUD。
- 草稿、预览、发布、版本。
- CSV/docx 服务端导入。
- MinIO 上传与签名授权。

验收：后台发布内容后员工端与搜索同步；历史题目快照不变。

### 阶段 3：统计

- 统一筛选查询。
- 概览、漏斗、视频、测评、员工详情。
- CSV 与页面同口径。
- 索引和性能测试。

验收：随机抽取员工明细可逐层核对到概览；全部筛选和导出一致。

### 阶段 4：飞书与上线保障

- 完整组织/部门同步。
- 事件安全、重试、告警。
- 监控、备份、恢复、限流、安全头。
- 实机与 50 并发测试。
- 10–20 人试点。

### 阶段 5：全员开放

- 试点问题关闭。
- 内容责任人签字。
- HR 数据口径签字。
- 安全与运维签字。
- 发布与回滚演练通过。

---

## 27. 维护与变更规范

### 27.1 文档同步

以下变化必须同时更新本文：

- 路由、API、环境变量。
- 数据模型、migration、索引。
- 角色和权限。
- 统计定义。
- 部署、备份和故障处理。
- 当前实现状态。

### 27.2 代码约定

- TypeScript strict，不使用无理由的 `any`。
- 组件 PascalCase，文件/文件夹 kebab-case。
- 复杂业务逻辑写中文注释说明“为什么”。
- 页面不直接拼接数据库查询；统一放领域查询层。
- 所有写 API 有 Zod、权限、审计和幂等策略。
- 复用现有组件与 design tokens，不混入新风格。
- 不引入依赖前先说明必要性、包体积、维护状态和替代方案。

### 27.3 Definition of Done

一个功能只有同时满足以下条件才算完成：

1. 真实数据持久化。
2. 服务端权限与越权测试。
3. 正常、空、错误、加载状态。
4. 桌面与移动响应式。
5. 键盘和可访问性。
6. 单元/集成/E2E 中与风险匹配的覆盖。
7. 日志与告警。
8. 文档与 migration。
9. 产品/测试验收。

### 27.4 发布记录模板

每次发布至少记录：

```text
版本 / Commit SHA：
发布日期：
负责人：
变更摘要：
数据库 Migration：
环境变量变化：
安全影响：
验证命令：
手工验收：
回滚镜像：
回滚数据步骤：
已知问题：
```

---

## 28. 新维护人上手清单

### 第 1 小时

- 阅读 README、PRODUCT、DESIGN 和本文第 1、5、8、18、25 章。
- `nvm use`、安装依赖、在 3010 启动。
- 分别体验员工端和管理端。
- 看 `demo-data.ts`、`collections.ts`、`auth.ts`。

### 第 1 天

- 跑 lint、typecheck、test、build。
- 手动走一遍视频与测评。
- 试用培训/题库/分配后台，观察 localStorage。
- 查看所有 API 中的 `demo-data`/`demo-store` 引用。
- 确认正式 Git、CI/CD、飞书应用和基础设施所有者。

### 第 1 周

- 建 P0 issue 与验收用例。
- 建初始 migration/seed。
- 设计 Repository/Service 层和审计模型。
- 在预发布接真实飞书测试应用。
- 完成一个端到端垂直切片：真实分配 → 视频进度 → 答题 → 统计。

---

## 29. 交付物清单

### 29.1 当前仓库已包含

- 应用源代码。
- 员工端和管理端页面。
- 公司 Logo。
- 产品说明 `PRODUCT.md`。
- 设计说明 `DESIGN.md`。
- 本交付手册。
- Payload 集合定义。
- Dockerfile、Docker Compose、Nginx 示例。
- 环境变量模板。
- 单元测试。

### 29.2 项目正式移交仍需补充

- Git 仓库 URL、分支、tag、commit SHA。
- 飞书应用管理员和审批记录。
- 正式/预发布域名与证书负责人。
- Secret Manager 路径，不是密钥明文。
- PostgreSQL 与 MinIO 实例信息。
- CI/CD 流水线。
- migration 与 seed。
- 监控、日志和告警地址。
- 备份策略与最近一次恢复报告。
- 内容责任人：HR、行政、IT、培训。
- 数据保留与隐私政策。
- 试点员工名单和验收记录。
- 上线、回滚和事故联系人。

### 29.3 建议责任矩阵

| 事项 | 业务 Owner | 技术 Owner | 审核 |
| --- | --- | --- | --- |
| 入职视频与题库 | HR/培训 | 应用团队 | HR 负责人 |
| 员工服务知识 | HR/行政/IT 各自 | 应用团队 | 各部门负责人 |
| 飞书应用 | IT/企业应用 | 应用团队 | 安全 |
| 用户与角色 | HR + IT | 应用团队 | 安全 |
| 统计口径与导出 | HR | 数据/应用团队 | HR 负责人 |
| PostgreSQL/MinIO | 基础设施 | SRE/应用团队 | 安全 |
| 发布与事故 | 产品 | 应用/SRE | 业务负责人 |

---

## 30. 关键文件索引

| 目的 | 文件 |
| --- | --- |
| 会话与授权 | `src/lib/session-core.ts`、`src/lib/auth.ts`、`src/proxy.ts` |
| 飞书登录与事件 | `src/app/api/auth/feishu/*`、`src/app/api/feishu/events/route.ts` |
| 飞书用户落库 | `src/lib/payload-user.ts` |
| 飞书组织读取 | `src/app/api/admin/feishu/organization/route.ts` |
| 数据模型 | `src/payload/collections.ts`、`payload.config.ts` |
| 演示数据 | `src/lib/demo-data.ts`、`src/lib/demo-store.ts` |
| 视频算法 | `src/lib/video-progress.ts`、`src/components/video-player.tsx` |
| 测评算法 | `src/lib/quiz-engine.ts`、`src/components/quiz-panel.tsx` |
| 题库导入 | `src/lib/question-import.ts` |
| 统计口径 | `src/lib/analytics.ts` |
| 管理原型数据 | `src/lib/use-stored-state.ts` |
| 页面与响应式 | `src/app/globals.css` |
| 视觉规范与组件约束 | `DESIGN.md`、`.impeccable/design.json` |
| 本地字体资产 | `public/fonts/geist-latin.woff2`、`public/fonts/geist-mono-latin.woff2` |
| 部署 | `Dockerfile`、`docker-compose.yml`、`nginx/default.conf` |

---

## 31. 外部参考

- [飞书网页应用 OAuth 接入指南](https://open.feishu.cn/document/sso/web-application-end-user-consent/guide)
- [飞书通讯录部门列表 API](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/contact-v3/department/list)
- [飞书通讯录用户列表 API](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/contact-v3/user/list)
- [Payload CMS 文档](https://payloadcms.com/docs/getting-started/what-is-payload)
- [Next.js 文档](https://nextjs.org/docs)
- [MinIO 文档](https://min.io/docs/minio/container/index.html)

升级依赖或调整飞书权限前，应重新查阅对应版本的官方文档，不以本文替代官方接口定义。

---

## 32. 待业务确认的决策

在生产开发开始前，产品/HR/IT 需要明确：

1. 入职视频是否永远只有一段，还是未来允许多个必修单元。
2. 测评取最高分、最后一次还是首次成绩作为正式口径。
3. 未通过是否限制次数或设置冷却时间。
4. 逾期后能否继续学习，是否自动提醒主管。
5. 部门管理员是否只能看本部门数据。
6. 已离职员工的培训数据保留多久。
7. 高频问题由人工配置还是按搜索/访问统计生成。
8. 飞书文档是否只跳链接，还是需要同步正文供搜索。
9. 大视频由谁转码、审核和上传。
10. CSV 导出的审批、脱敏和保存期限。
11. 内容发布是否需要双人审核。
12. 生产是否开放 Payload Admin UI。

未确认前不要自行引入更多角色层级、复杂审批流或推荐系统。

---

## 33. 文档维护记录

| 日期 | 版本 | 维护人 | 变更 |
| --- | --- | --- | --- |
| 2026-08-14 | 1.0 | Codex / 待项目 Owner 确认 | 基于当前代码完成首版系统交付与维护手册 |
| 2026-08-14 | 1.1 | Codex / 待项目 Owner 确认 | 交付前代码对照审计：修正测评门槛、主题、筛选、课程题库、员工服务与 localStorage 口径 |

后续每次生产发布至少更新文档版本、日期、当前实现状态、环境变量、migration 和已知问题。

---

## 34. 交付前一致性审计（2026-08-14）

### 34.1 结论

**可以交给研发作为“高保真交互原型 + 生产技术骨架”接管，但不能标记为生产就绪，也不能直接导入真实员工数据。** 研发应以本文第 18、19、25 章为生产化工作清单，以当前代码为原型行为基线。

本次审计已修正此前文档与代码的主要出入：

- 测评当前可直接开始，90% 只作为视频完播与统计口径，不是前端或 API 解锁条件。
- 新会话默认浅色主题，手动切换结果保存在 `lebao-theme-v2`，不自动跟随系统主题。
- 题库使用 `admin-question-bank-v3`，支持课程关联、课程筛选和 CSV/`.docx` 导入。
- 员工服务后台支持页面/文档新建并写入 `admin-service-content-v1`，但编辑、原文件存储和员工端同步尚未实现。
- 管理概览的页面筛选已覆盖多数页面数据区；视频、培训路径、统计 API 和 CSV 仍未完全统一。
- 当前 Logo 为 `public/company-logo.png` 原始 PNG；自动描摹 SVG 已按产品验收回滚，不应从历史记录中恢复。
- Compose 的 MinIO 健康检查改为健康端点，并增加 `.dockerignore` 防止本机环境文件进入镜像构建上下文。

### 34.2 已执行验证

| 检查 | 结果 | 备注 |
| --- | --- | --- |
| Markdown 本地链接 | 通过 | README、PRODUCT、DESIGN、本文引用的本地路径均存在 |
| TypeScript | 通过 | `npm run typecheck` |
| ESLint | 通过 | `npm run lint` |
| Vitest | 通过 | 4 个测试文件、12 项测试全部通过 |
| Next.js 生产构建 | 通过 | Next.js 16.3.1，27 个静态页面生成任务完成 |
| 受支持 Node 范围复验 | 通过 | 使用 Node 24.19.0（满足 `>=20.9 <25`）完成 typecheck、test、lint、build；仍推荐 Node 22 |
| Docker Compose 配置/实跑 | 未验证 | 当前审计机器无 Docker CLI；接手环境必须补跑 |
| Git 提交与版本追溯 | 未验证 | 当前目录没有 `.git`，交付方必须提供正式仓库与 commit SHA |
| 数据库 migration/seed | 缺失 | 当前仓库没有已提交 migration 与可重复 seed，属于 P0 |
| 浏览器 E2E/飞书 WebView | 未自动化 | 只有原型人工评审记录，需在预发布补 Playwright 与实机测试 |

### 34.3 打包边界

交付包应包含源码、`package-lock.json`、`.env.example`、Docker/Nginx 示例、`public/` 资产、PRODUCT、DESIGN 和本手册。不要把以下内容放入交付压缩包或 Git：

```text
.env / .env.*（仅保留 .env.example）
node_modules/
.next/
coverage/
test-results/
playwright-report/
.DS_Store
本机 AI 工作目录与临时附件
```

当前 `node_modules` 存在若干 extraneous WASM 依赖，因此更不能整体打包；研发接手后应在受支持 Node 版本执行 `npm ci`，以 `package-lock.json` 重建依赖。

原始《新人培训.md》和《员工手册（版本号：V2026.08.01）.pdf》位于交付人本机仓库外，不属于当前代码包。若研发、测试或内容团队需要追溯原文，交付方应在确认内部资料权限后，将受控副本放入公司文档系统并在本文补充地址；不要无审查复制到公开 Git。

### 34.4 研发接包后第一组命令

```bash
nvm use
npm ci
npm run typecheck
npm run lint
npm test
npm run build
docker compose config --quiet
docker compose up --build
```

容器启动后至少验证：PostgreSQL/MinIO health、`minio-init` 成功创建 `inside-hub`、Nginx 可访问、Payload migration 可重复执行、`.env` 未出现在镜像层或构建产物中。任何一项失败都应阻止进入预发布。
