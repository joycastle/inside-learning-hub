# 前后端双仓拆分实施规范

状态：已实施（2026-08-17）
范围：一期新人培训闭环
原则：先完成正式持久化，再迁移员工服务、公告和搜索。

实施结果：当前工作区包含 `inside-learning-hub-fronted/` 与 `inside-learning-hub-backend/`。前者继承原 Git 历史，后者按要求暂未初始化 Git；两者均已独立完成类型检查、测试与生产构建，并通过本地 PostgreSQL 实际联调。

## 1. 已确定的技术方案

```text
浏览器
  ├─ hub.company.com/*          → inside-learning-hub-fronted
  └─ hub.company.com/api/v1/*   → inside-learning-hub-backend

内容管理员
  └─ hub-cms.company.com/*      → inside-learning-hub-backend / Payload Admin

inside-learning-hub-backend → PostgreSQL / S3 兼容对象存储 / 飞书
```

| 服务 | 技术 | 职责 |
| --- | --- | --- |
| `inside-learning-hub-fronted` | Node.js 22、Next.js 16、React 19、TypeScript、Tailwind CSS | 员工端、运营管理页、SSR、调用 `/api/v1` |
| `inside-learning-hub-backend` | Node.js 22、Next.js 16 Headless Runtime、Payload CMS 3、Zod | Payload Admin、业务 API、鉴权、领域服务、飞书集成 |
| PostgreSQL | 公司支持的稳定版本 | 唯一业务事实源、事务、统计与搜索 |
| 对象存储 | S3 兼容服务；有公司托管服务时不自建 MinIO | 私有 MP4、PDF、图片 |

不引入 NestJS、Fastify、Prisma、Drizzle、Redis、消息队列、Elasticsearch、GraphQL 或第三个后端服务。

## 2. 仓库边界

### `inside-learning-hub-fronted`

保留：

- `src/app` 中员工端和定制管理页面；
- UI 组件、主题、格式化和纯展示类型；
- `src/lib/api` 服务端 API Client；
- 由 OpenAPI 生成的 `src/generated/api`。

禁止：

- Payload 配置、数据库和对象存储客户端；
- 飞书密钥或会话签名密钥；
- `demo-data`、`demo-store`；
- 将进度、答题、分配、角色等业务状态保存到 `localStorage`。

主题、欢迎提示等纯 UI 偏好可以继续使用 `localStorage`。

### `inside-learning-hub-backend`

建议目录：

```text
src/app/(payload)/cms/       Payload Admin 页面
src/app/api/cms/             Payload REST，仅供 CMS 使用
src/app/api/v1/              业务 API
src/contracts/               Zod DTO 与 OpenAPI
src/domain/                  鉴权、学习、测评、统计领域服务
src/repositories/            Payload Local API 与参数化 SQL
src/payload/                 Collections、hooks、access
migrations/                  Payload migration
tests/integration/            PostgreSQL/API 集成测试
```

`(payload)` 是 Next.js Route Group，仅用于给 Payload Admin 应用专属 layout，不会出现在 URL 中；实际访问路径仍为 `/cms`。

Payload 是唯一 schema/migration 管理入口；统计可以使用参数化 SQL，但不得引入第二套 ORM 或 migration。

## 3. 域名与路由

- 浏览器只访问 `hub.company.com`，业务请求使用相对路径 `/api/v1/*`。
- 网关保留 Host、`X-Forwarded-For`、`X-Forwarded-Proto` 和 `X-Request-Id`。
- Web SSR 使用 `API_INTERNAL_BASE_URL=http://api:3000`，并转发当前请求 Cookie；不得把该变量暴露为 `NEXT_PUBLIC_*`。
- Payload Admin 独立使用 `hub-cms.company.com`，避免两个 Next.js 服务的 `/_next/*` 冲突。
- `/api/cms/*` 只在 CMS 域名开放；应用域名不得暴露 Payload CRUD。
- 本地由 Docker Compose/Nginx 复现相同路由。

## 4. 身份与权限

### 员工应用

1. `GET /api/v1/auth/feishu/start` 设置 OAuth state Cookie 并跳转飞书。
2. 回调地址固定为 `https://hub.company.com/api/v1/auth/feishu/callback`。
3. API 校验 state、Tenant Key，幂等同步用户并分配默认培训。
4. API 创建数据库会话，Cookie 名为 `inside_session`，仅保存随机 token；数据库只保存 token hash。
5. Cookie 使用 `HttpOnly + Secure + SameSite=Lax + Path=/`，有效期 8 小时。
6. 每次 API 请求读取会话和用户当前 `active/role`；Web 不解析 Cookie，不持有会话密钥。
7. Web 布局通过 `GET /api/v1/auth/me` 判断登录和管理权限。
8. 所有写接口校验 `Origin`，并限制请求频率。

### Payload Admin

- 使用独立 `cms-admins` Auth Collection，不与员工 `users` 共用密码。
- 一期使用 Payload 本地账号，至少配置两名管理员；CMS 域名同时受公司内网/网关保护。
- 生产关闭公开的 create-first-user；管理员通过一次性 bootstrap 命令创建，密码只从 Secret Manager 注入。
- CMS 管理员角色为 `contentEditor`、`cmsAdmin`；所有发布、删除和媒体操作写审计日志。
- Payload Admin 接入飞书 SSO 不属于首批范围。

## 5. API 约定

- 统一前缀 `/api/v1`；响应 JSON 使用 camelCase，时间使用 UTC ISO 8601，ID 使用 string。
- 错误结构：`{ code, message, requestId, details? }`。
- 列表结构：`{ items, page, pageSize, total }`，`pageSize` 最大 100。
- 创建测评、提交测评、批量分配和角色变更使用 `Idempotency-Key`；视频进度使用 `sessionId + sequence` 幂等。
- API 仓库生成并提交 `openapi.json`；Web 生成 TypeScript Client，CI 检查生成文件未过期。
- `/api/v1` 保持至少一个 Web 生产版本的向后兼容。

### 首批员工 API

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/auth/feishu/start` | 发起飞书登录 |
| GET | `/auth/feishu/callback` | 完成登录并跳转 `/home` |
| POST | `/auth/logout` | 删除当前会话 |
| GET | `/auth/me` | 当前用户与角色 |
| GET | `/learning/enrollments` | 当前用户培训列表 |
| GET | `/learning/enrollments/:id` | 培训、课程、单元和聚合进度 |
| GET | `/learning/units/:unitId` | 已分配单元、内容与本人进度 |
| PUT | `/learning/units/:unitId/video-progress` | 幂等上报视频进度 |
| POST | `/learning/units/:unitId/quiz-attempts` | 创建或恢复未提交测评 |
| POST | `/quiz-attempts/:attemptId/submit` | 幂等提交、评分并更新完成状态 |
| GET | `/me/quiz-attempts` | 本人测评记录 |
| GET | `/media/:mediaId/signed-url` | 授权后签发 15 分钟 URL |

### 首批管理 API

| 方法 | 路径 | 权限 |
| --- | --- | --- |
| GET | `/admin/feishu/organization` | admin |
| POST | `/admin/enrollments/batch` | admin |
| PATCH | `/admin/enrollments/:id` | admin |
| PATCH | `/admin/users/:id/role` | superAdmin |
| GET | `/admin/analytics/overview` | admin |
| GET | `/admin/analytics/users/:id` | admin |
| GET | `/admin/analytics/videos/:id` | admin |
| GET | `/admin/analytics/quizzes/:id` | admin |
| GET | `/admin/exports/training.csv` | admin |

所有管理查询统一支持 `dateFrom/dateTo/departmentId/pathId/courseId`；页面、详情和 CSV 共享同一筛选解析器与查询层。

## 6. 数据与业务规则

必须保留现有产品口径：

- 测评可以直接开始，视频达到 90% 只记为完播，不作为测评解锁条件。
- 测评达到 QuizRule 的通过分后完成单元、课程和 Enrollment。
- `overdue` 查询时按 `dueAt` 计算，不作为可变状态落库。
- 已提交测评保存题目、选项、正确答案、员工答案、解析和规则快照。
- 已被 Enrollment、Progress 或 Attempt 引用的路径、课程、单元不得硬删除或更改结构关系；新结构通过新记录发布。
- 员工只能读取本人已分配内容；所有 userId 从服务端会话取得。

必须新增或调整：

- 新增 `app-sessions`、`cms-admins`、`audit-logs` 集合；
- `app-sessions` 至少包含 `tokenHash/user/expiresAt/revokedAt/lastSeenAt`，token 明文只写入 Cookie；
- `audit-logs` 至少包含 `actor/actorType/action/resource/before/after/requestId/createdAt`；
- `video-playback-sessions.sessionKey = userId:unitId:sessionId` 唯一；
- `enrollments.assignmentKey`、各 progressKey 和飞书 eventId 保持唯一；
- 同一用户同时只允许一个未提交的 unit QuizAttempt；
- 新增 `system-settings` Global，以 `defaultOnboardingPath` 关系明确默认路径；不再查询第一条 `isDefaultOnboarding=true` 记录；
- 题目删除改为 `active=false`；历史记录不可被内容更新覆盖。

事务边界：

1. 用户同步、默认 Enrollment 和会话创建；
2. VideoProgress 与 VideoPlaybackSession；
3. QuizAttempt、AttemptItems、UnitProgress 和 Enrollment 完成；
4. 角色变更与 AuditLog；
5. 批量分配与对应审计记录。

## 7. 管理端划分

| 能力 | 唯一入口 |
| --- | --- |
| 课程、单元、题库、QuizRule、文章、公告、媒体、草稿与发布 | Payload Admin |
| 培训分配、期限调整、统计、详情、CSV | Web `/admin/*` |
| 员工角色变更 | Web 发起、API 执行 |

Web 中现有 `/admin/training`、`/admin/questions`、`/admin/services`、`/admin/content` 在 Payload Admin 可用后删除或跳转 CMS，不保留第二套编辑器。题库批量导入作为 Payload Admin 自定义视图实现。

## 8. 迁移步骤与门禁

1. **冻结基线**：记录 commit SHA；将现有核心流程固化为验收用例。
2. **建立 API**：挂载 Payload Admin/REST，创建初始 migration、seed、OpenAPI、`/api/v1/health/live` 和 `/api/v1/health/ready`。
3. **身份切片**：完成网关、飞书登录、数据库会话、`auth/me` 和 CMS 管理员登录。
4. **学习读取切片**：完成默认分配、Enrollment/Unit 查询和授权媒体。
5. **学习写入切片**：完成视频进度、测评快照、提交和完成状态事务。
6. **管理切片**：完成批量分配、角色、统计、详情和 CSV。
7. **Web 切换**：按登录 → 首页/学习 → 视频 → 测评 → 我的 → 管理页逐页切换 API。
8. **CMS 切换**：导入正式内容，验证发布态读取，删除 Web 重复内容后台。
9. **试点上线**：10–20 人试点；稳定后再迁移员工服务、公告和搜索。

每个切片必须同时完成 API 集成测试和对应浏览器 E2E，未通过不得进入下一切片。

## 9. 首批验收

- 飞书登录后幂等获得默认培训；普通员工无法访问他人数据。
- API/前端重启、换浏览器或设备后，视频进度和测评结果不丢失。
- 视频上报可拒绝重复/乱序请求，最大进度和完播状态只增不减。
- 刷新页面可恢复未提交题组；重复提交返回同一结果。
- 测评通过后完成状态在一个事务中生效。
- 媒体接口不能通过猜测 ID/key 获取未分配资源。
- 管理员降权或停用后下一次请求立即失效；最后一名 superAdmin 不可撤销。
- Payload Admin 发布内容后员工端只读取发布态。
- 概览、详情与 CSV 在相同筛选下结果一致。
- Web 和 API 可独立构建、部署；生产不包含演示登录或演示业务数据回退。

## 10. 首批非目标

- 员工服务、公告和全文搜索迁移；
- Payload Admin 飞书 SSO；
- 视频转码、DRM、严格防作弊；
- 提醒通知、审批流、部门管理员；
- Redis、队列、数据仓库、外部 BI 和微服务。
