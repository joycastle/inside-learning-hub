---
task: 研发交付文档与工程完整性审计
prd: docs/SYSTEM_HANDOVER.md
status: done
agent: codex
updated_at: 2026-08-14 19:31
---

## 🎯 下一步（最关键）
由 PM 确认正式 Git 仓库、commit SHA、内部原始资料地址和研发接手人；研发在有 Docker 的环境补跑 Compose 实测。

## 📌 任务目标
核对交付文档与当前代码、路由、数据源和运行行为，修正过期口径并完成打包前工程校验。

## ✅ 已完成
- [x] 新增四章 HTML 新人培训讲义，插入视频与测评之间。
- [x] 依据培训资料扩充 8 道随机题，测评可直接开始，90% 仅作为完播口径。
- [x] 依据员工手册重写 6 篇 HR、行政、IT 服务文章，并标注制度来源与版本提示。
- [x] 增加全站明暗主题切换，员工端和管理端均可使用并记忆选择。
- [x] 合并管理端起止日期组件、压缩题目弹窗、调整培训工具栏与首页细节。
- [x] ESLint、12 项单测、生产构建和关键页面浏览器验证通过。
- [x] 管理端页面标题滚动吸顶，移动端保持普通文档流。
- [x] 趋势图、部门完成率、视频列表和员工明细统一使用顶部起止日期筛选口径。
- [x] 视频“查看详情”改为强调按钮，操作列在横向表格中固定于右侧。
- [x] 新会话默认白色主题，用户主动切换后继续记忆选择。
- [x] 员工端 Logo 与品牌名同步放大并校正行盒对齐。
- [x] 员工端当前导航增加品牌色文字与底线状态。
- [x] 首页公告移除“8 月 18 日前阅读”。
- [x] 搜索命令面板输入框移除重复蓝色焦点边框。
- [x] 新人培训讲义拆为独立 HTML 页面，视频下方仅保留讲义入口。
- [x] 管理端品牌区和导航区增加结构分隔线。
- [x] 移除培训视频页底部“自动保存”和“返回新人入职”整块区域。
- [x] 独立 HTML 讲义在 998px 与移动端安全换行，不产生横向溢出。
- [x] 培训路径名称、选择器与新建按钮在同一水平基线排列。
- [x] 题目增加课程关联，支持按课程筛选、新建和批量导入；抽题接口只使用当前课程题库。
- [x] 员工服务支持页面新建与 PDF、DOC、DOCX 文档上传创建，并保存在原型本地数据中。
- [x] 系统设置中的管理员配置移动至首位。
- [x] TypeScript、ESLint、12 项单测、生产构建及关键页面浏览器验证通过。
- [x] 管理端侧栏 Logo 放大至 34px，品牌名称放大至 16px，并校正展开/收起状态对齐。
- [x] 按 PM 验收反馈回滚自动描摹 SVG，员工端与管理端恢复原始 PNG Logo；保留尺寸与名称光学对齐。
- [x] 将 PRODUCT、DESIGN、SYSTEM_HANDOVER 与当前测评、主题、课程题库、员工服务和统计筛选行为统一。
- [x] SYSTEM_HANDOVER 升级至 1.1，并新增交付前一致性审计、打包边界与研发接包命令。
- [x] 新增 `.dockerignore`，避免 `.env`、构建缓存、Git 与本地 AI 工作区进入 Docker 构建上下文。
- [x] 修正 MinIO 健康检查为 `/minio/health/live`。
- [x] Markdown 本地链接、TypeScript、ESLint、12 项单测和 Next.js 生产构建通过；在 Node 24.19.0 受支持范围复验通过。

## ⏳ 未完成（按优先级）
- [ ] 在安装 Docker 的接手环境执行 `docker compose config --quiet` 与 `docker compose up --build`。
- [ ] 提供正式 Git 仓库 URL、commit SHA/tag、CI/CD 与维护人。
- [ ] 建立初始 Payload migration、可重复 seed 和生产数据接入计划。

## 📂 涉及文件
- `src/components/onboarding-training-document.tsx`
- `src/components/video-lesson.tsx`
- `src/components/video-player.tsx`
- `src/components/theme-toggle.tsx`
- `src/components/admin-filters.tsx`
- `src/components/admin-dialog.tsx`
- `src/components/admin-question-manager.tsx`
- `src/components/admin-training-manager.tsx`
- `src/lib/demo-data.ts`
- `src/lib/types.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/(employee)/learn/[courseId]/[unitId]/page.tsx`
- `src/app/(employee)/learn/onboarding-handout/page.tsx`
- `src/app/(employee)/home/page.tsx`
- `src/app/(employee)/services/[articleId]/page.tsx`
- `docs/SYSTEM_HANDOVER.md`
- `src/components/analytics-charts.tsx`
- `src/app/admin/page.tsx`
- `src/components/admin-service-manager.tsx`
- `src/app/admin/services/page.tsx`
- `src/app/admin/settings/page.tsx`
- `src/app/admin/questions/page.tsx`
- `src/app/api/quizzes/[unitId]/attempts/route.ts`
- `src/lib/question-import.ts`
- `PRODUCT.md`
- `DESIGN.md`
- `README.md`
- `.dockerignore`
- `docker-compose.yml`

## 🚧 阻塞点
当前机器无 Docker CLI，无法完成 Compose 实际启动；当前目录无 `.git`，无法确认版本追溯；仓库无 migration/seed，不能按生产就绪交付。现有全局 CSS 与 DESIGN.md/sidecar 仍存在少量历史设计 token 漂移，本轮未扩展为设计系统迁移。

## 🤝 交接记录（append，勿覆盖）
- 2026-08-14 18:00 codex：管理端底部账户区已改为头像与侧栏开关同组布局，功能与移动端行为保持不变。
- 2026-08-14 18:26 codex：培训讲义、8 道测评题、员工手册服务文章、主题切换及上一轮 UI 细节已完成并通过构建与浏览器验证。
- 2026-08-14 18:32 codex：管理端标题吸顶、日期范围驱动全部数据区、查看详情固定强调入口和默认白色主题已完成，构建及 1920px 浏览器验证通过。
- 2026-08-14 18:42 codex：品牌与导航精修、公告日期删除、搜索焦点修正、独立 HTML 讲义页和管理侧栏分区已完成；ESLint、12 项单测、生产构建及浏览器验收通过。
- 2026-08-14 19:06 codex：视频页底部精简、讲义响应式排版、培训工具栏对齐、课程题库关联、员工服务内容新建与管理员配置上移已完成；TypeScript、ESLint、12 项单测、生产构建和 998px 浏览器验收通过。
- 2026-08-14 19:14 codex：管理端品牌 Logo 与名称完成放大和对齐；ESLint、TypeScript 与 998px 浏览器尺寸检查通过。
- 2026-08-14 19:15 codex：员工端与管理端已统一使用透明平滑 SVG Logo，名称下移 1px 完成光学对齐；ESLint、TypeScript 与两端浏览器检查通过。
- 2026-08-14 19:20 codex：PM 认为自动描摹 SVG 效果较差，已删除该资源并恢复原始 PNG Logo；保留两端品牌尺寸与文字基线校正。
- 2026-08-14 19:31 codex：完成研发交付前一致性审计，修正文档旧口径，新增 Docker 构建上下文保护并修复 MinIO 健康检查；链接、类型、Lint、12 项单测和生产构建通过，Docker 实跑因本机无 CLI 待研发环境补验。
