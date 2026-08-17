# 内部培训与员工服务中心

统一的员工端与管理端内部网站，包含飞书登录、入职学习路径、视频进度、随机测评、员工服务与学习统计。

## 本地运行

建议使用 Node.js 22（仓库提供 `.nvmrc`；Payload CLI 暂不兼容 Node.js 25）。

```bash
nvm use
cp .env.example .env
npm install
npm run dev
```

默认启用演示模式，可在登录页分别体验员工和管理员身份。生产环境将 `DEMO_MODE` 设为 `false`，并配置飞书、PostgreSQL 与 MinIO 凭证。

## 常用命令

```bash
npm run typecheck
npm run lint
npm test
npm run build
docker compose up --build
```

首次建立或更新生产数据库结构时，先在与生产一致的环境中创建并执行 Payload migration：

```bash
npm run payload:migrate:create
npm run payload:migrate
```

## 路由

- 员工端：`/home`、`/learn`、`/services`、`/me`
- 管理端：`/admin`、`/admin/training`、`/admin/questions`、`/admin/people`、`/admin/services`、`/admin/content`、`/admin/settings`
- Payload 内容接口：`/api/cms/*`

本地演示模式使用内置员工、课程与统计数据，便于在没有飞书、PostgreSQL 和 MinIO 的情况下验收完整界面与交互。关闭 `DEMO_MODE` 后启用飞书身份同步和 Payload/PostgreSQL 用户存储；正式上线前还需将课程、员工服务、学习进度与统计查询从演示仓储切换到对应 Payload 集合。

当前仓库可作为研发接管的交互原型与技术骨架，但不是生产成品。管理端的培训、题库、分配、员工服务和管理员配置主要保存在当前浏览器 `localStorage`；员工侧学习、服务和统计仍大量读取演示数据。请先阅读交付手册中的 P0 与交付审计结论，再制定生产开发计划。

## 上线前配置

- 将 `DEMO_MODE` 设为 `false`，替换 `SESSION_SECRET`、`PAYLOAD_SECRET` 和所有 MinIO 默认凭证。
- 配置飞书 OAuth 回调 `/api/auth/feishu/callback`、事件回调 `/api/feishu/events`、允许的租户和首批超级管理员 Open ID。
- 创建 PostgreSQL 数据库并执行 migration；创建私有 MinIO bucket，确保视频采用浏览器可播放的 H.264/AAC MP4。
- Nginx 只代理应用请求；媒体下载使用 15 分钟签名地址，不由 Next.js 转发视频内容。

完整的接管、开发、上线和运维说明见 [系统交付与维护手册](./docs/SYSTEM_HANDOVER.md)。产品边界与验收口径见 [PRODUCT.md](./PRODUCT.md)，视觉与交互约束见 [DESIGN.md](./DESIGN.md)。
