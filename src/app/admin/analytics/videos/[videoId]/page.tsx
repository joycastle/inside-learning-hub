import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin-page-header'
import { VideoDistributionChart } from '@/components/analytics-charts'
import { getVideoAnalytics } from '@/lib/api/server'
import { requireAdmin } from '@/lib/auth'
import { formatDateTime, formatDuration } from '@/lib/format'

export default async function VideoAnalyticsPage({ params }: { params: Promise<{ videoId: string }> }) {
  await requireAdmin()
  const { videoId } = await params
  const { video, rates, employees } = await getVideoAnalytics(videoId)

  return (
    <>
      <Link className="admin-back-link" href="/admin"><ArrowLeft size={15} aria-hidden="true" />返回数据概览</Link>
      <AdminPageHeader
        eyebrow="视频学习统计"
        title={video.title}
        description={`最近观看 ${formatDateTime(video.lastWatchedAt)}。达到 90% 记为完播，统计用于培训运营。`}
        actions={<a className="button button--secondary" href={`/api/v1/admin/exports/videos/${videoId}.csv`}><Download size={16} aria-hidden="true" />导出名单</a>}
      />
      <section className="metric-strip metric-strip--six" aria-label="视频学习指标">
        <div className="metric-item"><span>应学习人数</span><strong className="tabular">{video.assigned}<small>人</small></strong></div>
        <div className="metric-item"><span>开播人数</span><strong className="tabular">{video.started}<small>人</small></strong></div>
        <div className="metric-item"><span>开播率</span><strong className="tabular">{rates.startRate}<small>%</small></strong></div>
        <div className="metric-item"><span>完播率</span><strong className="tabular">{rates.completionRate}<small>%</small></strong></div>
        <div className="metric-item"><span>触达完播率</span><strong className="tabular">{rates.reachedCompletionRate}<small>%</small></strong></div>
        <div className="metric-item"><span>平均观看时长</span><strong className="tabular">{formatDuration(video.averageWatchMinutes)}</strong></div>
      </section>
      <div className="admin-grid admin-grid--video-detail">
        <section className="admin-panel" aria-labelledby="distribution-title">
          <div className="panel-heading"><div><h2 id="distribution-title">观看进度分布</h2><p>按员工最大观看进度归档 · 单位：人</p></div></div>
          <VideoDistributionChart data={video.buckets} />
        </section>
        <section className="admin-panel progress-summary" aria-labelledby="average-title">
          <div className="panel-heading"><div><h2 id="average-title">平均观看进度</h2><p>覆盖全部应学习员工</p></div></div>
          <strong className="progress-summary__value tabular">{video.averageProgress}%</strong>
          <progress max="100" value={video.averageProgress} aria-label="平均观看进度" />
          <dl><div><dt>未开播</dt><dd>{video.assigned - video.started} 人</dd></div><div><dt>未完播</dt><dd>{video.started - video.completed} 人</dd></div><div><dt>已完播</dt><dd>{video.completed} 人</dd></div></dl>
        </section>
      </div>
      <section className="admin-panel admin-panel--flush" aria-labelledby="video-people-title">
        <div className="panel-heading panel-heading--padded"><div><h2 id="video-people-title">员工名单</h2><p>按观看进度区分未开播、未完播与已完播</p></div></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>员工</th><th>部门</th><th>观看状态</th><th>最大进度</th><th>累计观看</th><th>测评成绩</th></tr></thead>
            <tbody>
              {employees.map((record) => {
                const viewingStatus = record.progress >= 90 ? '已完播' : record.progress > 0 ? '未完播' : '未开播'
                return <tr key={record.userId}><td><strong>{record.userName}</strong></td><td>{record.departmentName}</td><td><span className="publish-state" data-state={viewingStatus}>{viewingStatus}</span></td><td className="tabular">{record.progress}%</td><td className="tabular">{record.watchedSeconds ? formatDuration(Math.round(record.watchedSeconds / 60)) : '—'}</td><td className="tabular">—</td></tr>
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
