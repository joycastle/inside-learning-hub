# 认证态验收

项目提供了一个不依赖测试账号的认证态 API smoke test。它要求使用已经登录的测试浏览器会话，不会把飞书账号、密码或生产 Cookie 写入仓库。

```bash
E2E_BASE_URL=https://joyhome.toolnets.net \
E2E_SESSION_COOKIE='从测试浏览器会话导出的 Cookie' \
E2E_EXPECT_ADMIN=true \
E2E_MEDIA_ID='可预览媒体 ID' \
E2E_UNIT_ID='学习单元 ID' \
npm run test:e2e:auth
```

员工账号应设置 `E2E_EXPECT_ADMIN=false`，超级管理员/管理员账号设置为 `true`。这会检查登录用户、公告、服务、参考文档、培训、管理端组织架构、题库和媒体预览接口。

上传、删除、修改等写操作不在生产 smoke test 中自动执行；如需覆盖这些链路，应在隔离测试环境补充专用测试数据和清理步骤，避免误改生产数据。
