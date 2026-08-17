# Inside Learning Hub Frontend

员工端与运营管理 Web。当前 Git 历史保留在本目录；Payload、PostgreSQL、对象存储、飞书密钥和业务会话均已迁到相邻的 `inside-learning-hub-backend` 目录。

## 双服务本地运行

先启动 PostgreSQL，然后分别运行后端和前端：

```bash
cd ../inside-learning-hub-backend
cp .env.example .env
npm install
npm run seed
npm run dev

cd ../inside-learning-hub-fronted
cp .env.example .env
npm install
npm run dev
```

- Web：`http://localhost:3000`
- API：`http://localhost:3001/api/v1`
- Payload Admin：`http://localhost:3001/cms`

也可以在本目录执行 `docker compose up --build`，通过 `http://localhost:8080` 访问 Web，通过 `http://hub-cms.localhost:8080/cms` 访问 CMS。Nginx 会将同域 `/api/v1/*` 路由到 API。

## 仓库边界

前端只包含页面、UI 组件、纯展示类型与 `src/lib/api` Client。业务进度、测评、分配和角色不再写入 `localStorage`；仅主题和欢迎提示等 UI 偏好继续使用浏览器存储。

内容编辑入口统一跳转 Payload Admin；Web `/admin/people`、`/admin` 和 `/admin/settings` 分别负责分配、统计和员工角色。

## 验证

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

拆分依据见 [前后端双仓拆分实施规范](./docs/FRONTEND_BACKEND_SPLIT_SPEC.md)。后端目录按要求暂未初始化 Git。
