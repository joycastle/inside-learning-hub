import { ArrowUpRight, BookOpen, Building2, Gamepad2, Users2 } from 'lucide-react'

const glossary = [
  ['Casual / Hyper-casual', '轻度与超轻度游戏，通常上手门槛低、单局节奏快。'],
  ['Merge / Match 3', '合成与三消，是休闲游戏中常见的核心玩法。'],
  ['Puzzle / Simulation / Idle', '解谜、模拟经营与放置类玩法。'],
  ['CPI / LTV / ROAS / ARPU', '用于评估获客成本、用户价值、广告回报与人均收入的关键指标。'],
]

export function OnboardingTrainingDocument() {
  return (
    <article className="onboarding-document" aria-labelledby="onboarding-document-title">
      <header className="onboarding-document__header">
        <div>
          <span className="eyebrow"><BookOpen size={15} aria-hidden="true" />视频配套讲义</span>
          <h2 id="onboarding-document-title">新人培训手册</h2>
          <p>这份讲义与入职视频使用同一内容框架。建议先通读，再开始下方测评。</p>
        </div>
        <span className="document-version">更新于 2026.08.14</span>
      </header>

      <nav className="onboarding-document__toc" aria-label="培训文档目录">
        <a href="#industry"><span>01</span>游戏行业基础</a>
        <a href="#company"><span>02</span>认识乐堡</a>
        <a href="#workplace"><span>03</span>职场协作</a>
        <a href="#first-week"><span>04</span>第一周清单</a>
      </nav>

      <section className="training-chapter" id="industry">
        <div className="training-chapter__index"><Gamepad2 size={20} aria-hidden="true" /><span>01</span></div>
        <div className="training-chapter__body">
          <p className="eyebrow">行业认知</p>
          <h3>先看懂一款游戏如何从想法走向全球玩家</h3>
          <p>游戏业务通常经历市场调研、研发制作、全球发行与长期运营四个阶段。休闲游戏面向更广泛的用户群，核心挑战是在低学习成本下持续提供目标、反馈和成长感。</p>
          <ol className="training-flow">
            <li><strong>市场调研</strong><span>分析品类、用户与竞品，判断机会和风险。</span></li>
            <li><strong>研发制作</strong><span>策划、美术、程序、测试与项目管理共同完成产品。</span></li>
            <li><strong>全球发行</strong><span>通过本地化、商店运营和市场投放触达不同地区玩家。</span></li>
            <li><strong>产品运营</strong><span>依据数据与玩家反馈持续更新内容、活动和体验。</span></li>
          </ol>
          <div className="training-callout"><strong>三类常见变现方式</strong><span>广告变现、应用内购买（IAP）与订阅制。具体组合取决于产品定位和用户体验。</span></div>
          <dl className="training-glossary">
            {glossary.map(([term, description]) => <div key={term}><dt>{term}</dt><dd>{description}</dd></div>)}
          </dl>
        </div>
      </section>

      <section className="training-chapter" id="company">
        <div className="training-chapter__index"><Building2 size={20} aria-hidden="true" /><span>02</span></div>
        <div className="training-chapter__body">
          <p className="eyebrow">公司认知</p>
          <h3>认识乐堡互娱与我们的产品协作方式</h3>
          <p>北京乐堡互娱科技有限公司（JoyCastle）成立于 2014 年，专注全球手机游戏研发与发行，在新加坡、北京和上海设有团队。主要产品包括 Matching Story、Bingo Frenzy 与 Bingo Voyage，重点服务欧美休闲游戏用户。</p>
          <div className="training-facts">
            <div><strong>全球发行</strong><span>面向不同地区进行本地化、市场投放与玩家运营。</span></div>
            <div><strong>项目协作</strong><span>策划、前后端、测试、美术、项目管理、AI、社区与客服共同交付。</span></div>
            <div><strong>公共支持</strong><span>人力、财务、数据与美术等公共职能为项目提供专业支持。</span></div>
          </div>
          <a className="training-inline-link" href="https://www.joycastle.com/" target="_blank" rel="noreferrer">访问公司官网<ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
      </section>

      <section className="training-chapter" id="workplace">
        <div className="training-chapter__index"><Users2 size={20} aria-hidden="true" /><span>03</span></div>
        <div className="training-chapter__body">
          <p className="eyebrow">职场协作</p>
          <h3>专业、透明、及时反馈，让协作可以被信任</h3>
          <div className="training-principles">
            <div><span>01</span><strong>使用正式协作渠道</strong><p>需求、进度与结论在项目约定的渠道中同步，不私下绕过流程找同事推进需求。</p></div>
            <div><span>02</span><strong>先说清目标和约束</strong><p>沟通时交代背景、期望结果、截止时间与影响范围，减少反复确认。</p></div>
            <div><span>03</span><strong>风险及时上报</strong><p>发现延期、质量或资源风险时立即同步负责人，并提出可执行的备选方案。</p></div>
            <div><span>04</span><strong>形成工作闭环</strong><p>任务完成后确认结果、记录关键结论，并让相关协作者知道事项已经结束。</p></div>
          </div>
          <div className="training-callout training-callout--warning"><strong>信息与设备安全</strong><span>敏感信息仅在公司认可的系统内流转；软件、设备与权限需求通过 IT 或对应审批流程申请。</span></div>
        </div>
      </section>

      <section className="training-chapter" id="first-week">
        <div className="training-chapter__index"><BookOpen size={20} aria-hidden="true" /><span>04</span></div>
        <div className="training-chapter__body">
          <p className="eyebrow">入职行动</p>
          <h3>第一周完成这四件事</h3>
          <ul className="first-week-list">
            <li><span>01</span><div><strong>完成账号与设备检查</strong><p>确认飞书、邮箱、办公设备及岗位所需权限可以正常使用。</p></div></li>
            <li><span>02</span><div><strong>认识团队与协作角色</strong><p>明确直属负责人、指导人、核心协作者及常用沟通渠道。</p></div></li>
            <li><span>03</span><div><strong>阅读员工手册</strong><p>重点了解考勤、假期、信息安全和行政管理要求。</p></div></li>
            <li><span>04</span><div><strong>完成培训测评</strong><p>从题库随机抽取题目，提交后可以查看解析并重新尝试。</p></div></li>
          </ul>
        </div>
      </section>

      <footer className="onboarding-document__footer">内容依据《新人培训》整理；员工制度以《员工手册 V2026.08.01》及公司最新公告为准。</footer>
    </article>
  )
}
