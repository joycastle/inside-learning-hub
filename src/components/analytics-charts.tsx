'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface TrendPoint {
  date: string
  completed: number
  started: number
}

interface BucketPoint {
  label: string
  value: number
}

export interface CompletionTrendChartProps {
  data: TrendPoint[]
  ariaLabel?: string
}

export interface VideoDistributionChartProps {
  data: BucketPoint[]
}

const tooltipStyle = {
  border: '1px solid var(--paper-200)',
  borderRadius: '8px',
  boxShadow: 'var(--shadow-sm)',
  color: 'var(--ink-950)',
}

export function CompletionTrendChart({ data, ariaLabel = '筛选日期范围内已开始与已完成人数趋势' }: CompletionTrendChartProps) {
  return (
    <div className="chart-frame" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--paper-200)" vertical={false} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--ink-500)', fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--ink-500)', fontSize: 12 }} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line name="已开始" type="monotone" dataKey="started" stroke="var(--paper-300)" strokeWidth={2} dot={false} />
          <Line name="已完成" type="monotone" dataKey="completed" stroke="var(--brand-700)" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function VideoDistributionChart({ data }: VideoDistributionChartProps) {
  return (
    <div className="chart-frame" role="img" aria-label="员工视频观看进度分布">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--paper-200)" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--ink-500)', fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--ink-500)', fontSize: 12 }} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar name="员工数" dataKey="value" fill="var(--brand-700)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
