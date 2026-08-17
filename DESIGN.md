---
name: 乐堡家园
description: 为员工学习与内部服务打造的精密、安静且有生命力的工作界面
colors:
  accent: "#009fdf"
  accent-strong: "#007da9"
  accent-soft: "#e8f7fc"
  canvas: "#fafafa"
  surface: "#fefefe"
  surface-raised: "#ffffff"
  border: "#e5e5e5"
  border-strong: "#d4d4d4"
  text-primary: "#171717"
  text-secondary: "#525252"
  text-muted: "#737373"
typography:
  display:
    fontFamily: "Geist Local, PingFang SC, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "clamp(32px, 4vw, 44px)"
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist Local, PingFang SC, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "28px"
    fontWeight: 660
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist Local, PingFang SC, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "21px"
    fontWeight: 620
    lineHeight: 1.35
    letterSpacing: "-0.012em"
  body:
    fontFamily: "Geist Local, PingFang SC, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "15px"
    fontWeight: 420
    lineHeight: 1.6
    letterSpacing: "-0.006em"
  label:
    fontFamily: "Geist Local, PingFang SC, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "13px"
    fontWeight: 580
    lineHeight: 1.4
  data:
    fontFamily: "Geist Mono Local, SFMono-Regular, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
  "16": "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface-raised}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: 乐堡家园

## Overview

**Creative North Star: “精密的内部工作台”**

乐堡家园不是传统企业门户，也不是课程商城。它是一套安静、可信、可快速操作的内部工作界面：员工能立即继续入职视频或找到办事答案，管理员能在更高密度的信息中定位完成率、题目和人员。视觉上吸收 Linear 与 Vercel 的精密秩序、Stripe 的信息清晰度，以及 Apple 对动效节奏的克制。

近单色背景、严格网格、紧凑字距和充足留白构成主要质感。Logo 蓝只承担主操作、当前状态和关键反馈；层级主要由字号、字重、间距和轻微表面差异建立。动效必须解释状态变化或引导注意力，不作为装饰。

**Key Characteristics:**

- 近白或近黑的中性工作表面，只使用一种品牌强调色。
- 员工端偏阅读与继续任务，管理端偏扫描与批量操作，但共享同一视觉语法。
- 细边框、小圆角、微阴影；不依赖厚重卡片和大面积颜色分区。
- 120–260ms 的短促动效，所有交互稳定、可中断并尊重减少动态效果设置。

## Colors

色彩策略是“一个声音”：中性色负责结构，Logo 青蓝负责行动和状态。新会话默认浅色主题，员工可通过主题入口手动切换，选择保存在 `lebao-theme-v2`；暗色模式使用近黑表面、低透明白色边框与提高亮度后的同色相品牌蓝。`prefers-color-scheme` 不覆盖用户选择。

### Primary

- **乐堡蓝**：用于主要按钮、当前导航、进度、焦点和关键状态，不用于大面积装饰。
- **深乐堡蓝**：用于浅色模式中的悬停、链接强调和高对比文字状态。
- **雾蓝**：用于选中项、搜索结果悬停和温和状态背景。

### Neutral

- **工作台底色**：页面最底层背景，保持接近白色而非纯白。
- **基础表面**：卡片、侧栏与内容容器的默认底色。
- **抬升表面**：弹窗、菜单、输入和悬停状态使用的最亮表面。
- **主文字 / 次文字 / 弱文字**：依次承载标题、正文和辅助元数据。
- **细线 / 强细线**：用于分隔、输入框和结构边界，绝不承担视觉主角。

**The One Accent Rule.** 一个视口内只有 Logo 蓝可以成为色彩焦点；成功、信息和选中状态沿用同一色系并通过文字或图标补足语义。

**The Neutral First Rule.** 新区域先用留白、字号和中性表面建立层级，只有确认属于主要操作或关键状态后才使用强调色。

## Typography

**Display Font:** Geist Local，中文回退至 PingFang SC / Noto Sans SC。  
**Body Font:** Geist Local，使用同一字族维持统一的工具感。  
**Label/Mono Font:** Geist Mono Local 用于日期、进度、编号和统计数字。

**Character:** 字体呈现代 grotesque 的清晰与紧凑。标题依靠略紧字距和中高字重形成精度，正文保持舒展行高；数字启用等宽数字，便于表格和指标横向比较。

### Hierarchy

- **Display**（650，响应式 32–44px，1.12）：员工端页面主标题，只允许每个页面一个。
- **Headline**（660，28px，1.2）：管理端页面标题与高优先级内容标题。
- **Title**（620，21px，约 1.35）：区域标题和主卡片标题。
- **Body**（420，15px，1.6）：说明、文章和表格正文；移动端提升至 16px。
- **Label**（580，13px，1.4）：按钮、导航、字段标签和表头。
- **Data**（500，13px，1.4）：日期、进度、编号、分数与统计值，使用 tabular nums。

**The Sans-Only Rule.** 产品界面不再混用衬线展示字体；品牌的高级感来自排版比例和间距，而不是字体风格冲突。

## Layout

员工端正文最大宽度为 1120px，页面两侧桌面留白为 64px，900px 以下收敛为 32px，640px 以下为 16px。顶部导航固定 56px，品牌和主导航靠左，搜索、通知与账户靠右；移动端保留核心动作并使用底部导航承接三个主入口。

管理端桌面使用 208px 可收起侧栏，收起后为 64px；内容区域最大宽度为 1480px。筛选器和页面操作允许换行，表格横向滚动必须封装在局部容器中，页面本身不得横向溢出。间距只从 4/8/12/16/24/32/48/64px 标尺取值。

**The Space Before Container Rule.** 优先用留白和分隔线组织内容；只有需要独立交互语义、抬升层级或明显边界时才增加容器。

**The Task Density Rule.** 员工端保持较低密度和适宜行长，管理端可提高密度，但不能缩减键盘焦点、触控尺寸或信息标签。

## Elevation & Depth

系统默认平面化。常规表面使用 1px 低对比边框；静态卡片仅使用极轻的 `0 1px 2px` 微阴影，悬停时允许短暂柔化扩散，弹窗和菜单才使用更明显的环境阴影。深度必须来自真实层级，不能通过装饰制造。

### Shadow Vocabulary

- **微抬升**：用于静态卡片、按钮和输入，提供与背景的最小分离。
- **交互抬升**：仅在卡片或主操作悬停时短暂出现，不可常驻在所有列表项上。
- **浮层抬升**：只用于菜单、命令面板与对话框，并配合遮罩表达模态层级。

**The Flat by Default Rule.** 表面在静止状态尽量平；阴影只确认交互或解释浮层，不作为版式装饰。

## Shapes

形状语言保持精密的小圆角：6px 用于小型标记和键帽，8px 用于按钮、输入、导航项与列表交互，10px 用于卡片、菜单和弹窗。细边框始终贴合轮廓；状态胶囊只用于真正的状态信息，不把普通标签做成胶囊。

## Components

### Buttons

- **Shape:** 稳定的小圆角矩形（8px），最小高度 40px。
- **Primary:** 乐堡蓝底、白字，每个区域最多一个主操作。
- **Hover / Focus:** 悬停只上移 1px并产生轻微阴影；按下缩放至 0.98；键盘焦点以 180ms 动画扩展为 3px 柔和焦点环。
- **Secondary / Quiet:** 次按钮使用抬升表面和细边框，低优先级操作仅改变文字与背景，不争夺色彩焦点。

### Chips

- **Style:** 状态徽标使用中性抬升表面与弱文字，圆点可使用品牌蓝；普通筛选不做高饱和彩色胶囊。
- **State:** 选中状态必须同时有文字、背景或标记变化，不能只靠颜色。

### Cards / Containers

- **Corner Style:** 大型内容容器统一使用 10px 圆角。
- **Background:** 基础表面承载静态内容，抬升表面承载浮层和交互状态。
- **Shadow Strategy:** 静态为微抬升或无阴影；悬停只在可点击卡片上轻微增强。
- **Border:** 1px 低对比细线。
- **Internal Padding:** 常规 24px；重点学习卡片可使用 32–48px；移动端收敛至 16–24px。

### Inputs / Fields

- **Style:** 44px 最小高度、8px 圆角、抬升表面、1px 细边框。
- **Focus:** 边框向强调色过渡，并在 180ms 内展开 3px 焦点环。
- **Error / Disabled:** 错误必须有文字说明；禁用态降低透明度但保持可读，不能仅靠颜色区分。

### Navigation

导航默认为次文字色，悬停使用轻表面与 1px 上移，当前项使用抬升表面或雾蓝背景。员工端主导航的活动状态保持安静；管理端活动项使用雾蓝强调层级。账户切换入口统一收纳在头像菜单。

### Motion

进入使用 `cubic-bezier(0.22, 1, 0.36, 1)`，状态变化使用 `cubic-bezier(0.4, 0, 0.2, 1)`。快速反馈 120ms，常规状态 180ms，大表面与浮层 260ms。页面内容淡入并上移 8px，兄弟区域以 40ms 级差进入；菜单与弹窗使用轻微缩放和位移；跨页面启用 View Transitions。所有位移动效只操作 `transform` 和 `opacity`，且在 `prefers-reduced-motion: reduce` 下退化为近即时透明度变化。

## Do's and Don'ts

### Do:

- **Do** 使用语义 token，而不是在组件中增加新的临时颜色、圆角、阴影或动效时长。
- **Do** 让标题、正文、元数据和操作形成明确阅读顺序，并保持 4px 基础网格。
- **Do** 为 hover、active、focus、disabled、loading、empty 和 error 提供稳定、可访问的反馈。
- **Do** 保持按钮锚定；悬停位移不超过 2px，按下反馈不改变布局。
- **Do** 在员工端和管理端复用视觉语言，但根据阅读与运营任务调整信息密度。

### Don't:

- **Don't** 使用渐变文字、玻璃拟态、厚重投影、硬偏移阴影、彩色大面积背景或装饰性数据图。
- **Don't** 使用无语义的 eyebrow/kicker、emoji 图标、巨型营销标题或侧边强调条制造层级。
- **Don't** 让按钮追随鼠标、磁吸移动、漂移或使用不可中断的长动画。
- **Don't** 用更多卡片解决分组问题，也不要把所有状态都做成高饱和胶囊。
- **Don't** 只在 hover 中暴露关键操作；移动端和键盘用户必须获得同等信息与控制。
