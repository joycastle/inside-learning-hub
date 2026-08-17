import { requireAdmin } from '@/lib/auth'
import { trainingRecords } from '@/lib/demo-data'
import { statusLabel } from '@/lib/format'
import { getTrainingRecords } from '@/lib/payload-data'

const escapeCsv = (value: string | number | undefined) => {
  const text = value === undefined ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export async function GET() {
  await requireAdmin()
  const headers = ['员工', '部门', '学习路径', '课程', '分配时间', '截止时间', '状态', '完成时间', '视频进度', '最高分', '尝试次数']
  const records = process.env.DEMO_MODE === 'false' ? await getTrainingRecords() : trainingRecords
  const rows = records.map((record) => [
    record.userName,
    record.departmentName,
    record.pathTitle,
    record.courseTitle,
    record.assignedAt,
    record.dueAt,
    statusLabel[record.status],
    record.completedAt,
    `${record.videoProgress}%`,
    record.bestScore,
    record.attempts,
  ])
  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n')}`
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="training-records.csv"',
    },
  })
}
