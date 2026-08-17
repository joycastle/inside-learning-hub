import type { ServiceArticle } from '@/lib/types'

// 员工服务属于二期迁移范围；一期继续作为只读前端内容，不承载业务状态。
export const serviceArticles: ServiceArticle[] = [
  {
    id: 'service-leave', category: 'HR', title: '休假与请假怎么申请',
    summary: '年假、病假、事假、调休与请假审批的制度要点。', type: 'article', updatedAt: '2026-08-01',
    tags: ['请假', '年假', '病假', '调休'], source: '《员工手册 V2026.08.01》第 4 章',
    sections: [{ title: '申请原则', items: ['请假应在公司考勤系统中提交，并按照假期类型上传所需材料。', '除紧急情况外，应先完成审批再休假。'] }],
  },
  {
    id: 'service-expense', category: '行政', title: '差旅与费用报销',
    summary: '出差申请、费用真实性与财务报销的基本要求。', type: 'article', updatedAt: '2026-08-01',
    tags: ['差旅', '报销', '发票'], source: '《员工手册 V2026.08.01》第 9 章',
    sections: [{ title: '报销要求', items: ['报销人对费用的真实性、合理性和合规性负责。', '保存并提交符合财务要求的票据与证明材料。'] }],
  },
  {
    id: 'service-device', category: 'IT', title: '设备故障与软件申请',
    summary: '公司设备保管、软件安装、故障报修和资产申请规则。', type: 'article', updatedAt: '2026-08-01',
    tags: ['电脑', '软件', '设备'], source: '《员工手册 V2026.08.01》第 11 章',
    sections: [{ title: '设备与软件', items: ['只安装 IT 提供或批准的软件；特殊软件需求联系 IT。', '设备故障及时报修，不由非维修人员拆装。'] }],
  },
]
