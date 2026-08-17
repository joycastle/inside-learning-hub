import { ArrowRight, Download, Info } from 'lucide-react'
import Link from 'next/link'
import { AdminFilters } from '@/components/admin-filters'
import { AdminPageHeader } from '@/components/admin-page-header'
import { CompletionTrendChart } from '@/components/analytics-charts'
import { StatusBadge } from '@/components/status-badge'
import { buildCourseFunnel, calculateOverviewMetrics, filterTrainingRecords, getVideoRates } from '@/lib/analytics'
import {
  demoFeishuOrganization,
  trainingRecords,
  videoAnalytics,
} from '@/lib/demo-data'
import { formatDateTime, formatDuration } from '@/lib/format'
import { getTrainingRecords, getVideoAnalytics } from '@/lib/payload-data'

export const metadata = { title: '数据概览' }

const toDateInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDefaultDateRange = () => {
  const dateTo = new Date()
  const dateFrom = new Date(dateTo)
  dateFrom.setDate(dateTo.getDate() - 29)
  return { dateFrom: toDateInput(dateFrom), dateTo: toDateInput(dateTo) }
}

const formatShortDate = (date: Date) => `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`

/** 将趋势横轴和聚合值统一约束在筛选日期内，避免固定“最近 7 天”与筛选器口径冲突。 */
const buildCompletionTrend = (dateFrom: string, dateTo: string, records: typeof trainingRecords) => {
  const start = new Date(`${dateFrom}T00:00:00`)
  const end = new Date(`${dateTo}T00:00:00`)
  const dayCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
  const pointCount = Math.min(7, dayCount)

  return Array.from({ length: pointCount }, (_, index) => {
    const ratio = pointCount === 1 ? 0 : index / (pointCount - 1)
    const date = new Date(start.getTime() + (end.getTime() - start.getTime()) * ratio)
    const cutoff = toDateInput(date)
    return {
      date: formatShortDate(date),
      started: records.filter((record) => record.assignedAt <= cutoff && record.status !== 'notStarted').length,
      completed: records.filter((record) => record.completedAt && record.completedAt <= cutoff).length,
    }
  })
}

export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const records = process.env.DEMO_MODE === 'false' ? await getTrainingRecords() : trainingRecords
  const videos = process.env.DEMO_MODE === 'false' ? await getVideoAnalytics() : videoAnalytics
  const params = await searchParams
  const valueOf = (key: string) => typeof params[key] === 'string' ? params[key] : undefined
  const defaultDateRange = getDefaultDateRange()
  const dateFrom = valueOf('dateFrom') ?? defaultDateRange.dateFrom
  const dateTo = valueOf('dateTo') ?? defaultDateRange.dateTo
  const department = valueOf('department')
  const filteredRecords = filterTrainingRecords(records, { dateFrom, dateTo, department, path: valueOf('path'), course: valueOf('course') })
  const metrics = calculateOverviewMetrics(filteredRecords)
  const funnel = buildCourseFunnel(filteredRecords)
  const completionTrend = buildCompletionTrend(dateFrom, dateTo, filteredRecords)
  const rangeLabel = `${dateFrom.replaceAll('-', '/')} — ${dateTo.replaceAll('-', '/')}`
  const exportQuery = new URLSearchParams({ dateFrom, dateTo, department: department ?? 'all', path: valueOf('path') ?? 'onboarding' }).toString()
  const departmentCompletion = Array.from(new Set(filteredRecords.map((record) => record.departmentName))).map((departmentName) => {
    const departmentRecords = filteredRecords.filter((record) => record.departmentName === departmentName)
    return {
      department: departmentName,
      rate: Math.round((departmentRecords.filter((record) => record.status === 'completed').length / departmentRecords.length) * 100),
    }
  }).sort((a, b) => b.rate - a.rate)
  const filteredVideos = videos.filter((video) => video.lastWatchedAt.slice(0, 10) >= dateFrom && video.lastWatchedAt.slice(0, 10) <= dateTo)
  const metricItems = [
    { label: '应分配人数', value: metrics.assigned, suffix: '人' },
    { label: '已开始人数', value: metrics.started, suffix: '人' },
    { label: '已完成人数', value: metrics.completed, suffix: '人' },
    { label: '完成率', value: metrics.completionRate, suffix: '%' },
    { label: '逾期人数', value: metrics.overdue, suffix: '人', tone: 'danger' },
    { label: '平均完成用时', value: metrics.averageCompletionDays, suffix: '天' },
    { label: '测评平均分', value: metrics.averageScore, suffix: '分' },
    { label: '首次通过率', value: metrics.firstPassRate, suffix: '%' },
  ]

  return (
    <>
      <AdminPageHeader
        eyebrow="培训运营"
        title="数据概览"
        description={process.env.DEMO_MODE === 'false' ? '核对入职培训的完成、完播与测评情况，数据来自 PostgreSQL 聚合查询。' : '核对入职培训的完成、完播与测评情况。当前为演示数据。'}
        actions={(
          <a className="button button--secondary" href={`/api/admin/exports/training.csv?${exportQuery}`}>
            <Download size={16} aria-hidden="true" />导出明细
          </a>
        )}
      />
      <AdminFilters
        organization={demoFeishuOrganization}
        defaults={{
          dateFrom,
          dateTo,
          department,
          path: valueOf('path'),
        }}
      />

      <section className="metric-strip" aria-label="学习概览指标">
        {metricItems.map((metric) => (
          <div className="metric-item" data-tone={metric.tone} key={metric.label}>
            <span>{metric.label}</span>
            <strong className="tabular">{metric.value}<small>{metric.suffix}</small></strong>
          </div>
        ))}
      </section>

      <div className="admin-grid admin-grid--two">
        <section className="admin-panel" aria-labelledby="trend-title">
          <div className="panel-heading">
            <div><h2 id="trend-title">学习完成趋势</h2><p>{rangeLabel} · 单位：人</p></div>
            <div className="chart-legend"><span data-series="started">已开始</span><span data-series="completed">已完成</span></div>
          </div>
          <CompletionTrendChart data={completionTrend} ariaLabel={`${rangeLabel} 已开始与已完成人数趋势`} />
        </section>

        <section className="admin-panel" aria-labelledby="department-title">
          <div className="panel-heading"><div><h2 id="department-title">部门完成率</h2><p>按当前筛选范围计算</p></div></div>
          <div className="ranking-list">
            {departmentCompletion.map((item, index) => (
              <div className="ranking-row" key={item.department}>
                <span className="tabular">{String(index + 1).padStart(2, '0')}</span>
                <strong>{item.department}</strong>
                <progress className="compact-progress" max="100" value={item.rate} aria-label={`${item.department}完成率`} />
                <span className="tabular">{item.rate}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="admin-panel admin-panel--flush" aria-labelledby="funnel-title">
        <div className="panel-heading panel-heading--padded">
          <div><h2 id="funnel-title">课程漏斗</h2><p>认识我们与协作方式 · 人数与上一阶段转化率</p></div>
          <Link className="panel-link" href="/admin/training">查看课程<ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        <div className="funnel-row">
          {funnel.map((step, index) => {
            const previous = index === 0 ? step.value : funnel[index - 1].value
            const conversion = previous === 0 ? 0 : Math.round((step.value / previous) * 100)
            return (
              <div className="funnel-step" key={step.label}>
                <span>{step.label}</span>
                <strong className="tabular">{step.value}</strong>
                <small>{index === 0 ? '当前分配' : `${conversion}% 转化`}</small>
              </div>
            )
          })}
        </div>
      </section>

      <section className="admin-panel admin-panel--flush" aria-labelledby="video-title">
        <div className="panel-heading panel-heading--padded">
          <div><h2 id="video-title">视频学习情况</h2><p>90% 观看进度记为完播</p></div>
          <span className="definition-note"><Info size={14} aria-hidden="true" />内部运营口径，不作为监考证据</span>
        </div>
        <div className="table-scroll">
          <table className="data-table data-table--video">
            <thead><tr><th>视频</th><th>应学习</th><th>开播率</th><th>完播率</th><th>触达完播率</th><th>平均观看</th><th>最近观看</th><th>操作</th></tr></thead>
            <tbody>
              {filteredVideos.map((video) => {
                const rates = getVideoRates(video)
                return (
                  <tr key={video.id}>
                    <td><strong>{video.title}</strong><small>MP4 · 必修</small></td>
                    <td className="tabular">{video.assigned}</td>
                    <td className="tabular">{rates.startRate}%</td>
                    <td className="tabular">{rates.completionRate}%</td>
                    <td className="tabular">{rates.reachedCompletionRate}%</td>
                    <td className="tabular">{formatDuration(video.averageWatchMinutes)}</td>
                    <td className="tabular">{formatDateTime(video.lastWatchedAt)}</td>
                    <td><Link className="table-action table-action--prominent" href={`/admin/analytics/videos/${video.id}`}>查看详情<ArrowRight size={14} aria-hidden="true" /></Link></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel admin-panel--flush" aria-labelledby="recent-title">
        <div className="panel-heading panel-heading--padded"><div><h2 id="recent-title">员工学习明细</h2><p>{rangeLabel} · {filteredRecords.length} 条记录</p></div></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>员工</th><th>部门</th><th>课程</th><th>状态</th><th>视频进度</th><th>最高分</th><th>尝试</th></tr></thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.userId}>
                  <td><strong>{record.userName}</strong></td>
                  <td>{record.departmentName}</td>
                  <td>{record.courseTitle}</td>
                  <td><StatusBadge status={record.status} /></td>
                  <td className="tabular">{record.videoProgress}%</td>
                  <td className="tabular">{record.bestScore ?? '—'}</td>
                  <td className="tabular">{record.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
