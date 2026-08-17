export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

export const formatHomeDate = (value = new Date()) =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
  }).format(value).replace(' ', ' · ')

export const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} 小时 ${remainder} 分钟` : `${hours} 小时`
}

export const statusLabel = {
  notStarted: '未开始',
  inProgress: '进行中',
  completed: '已完成',
  overdue: '已逾期',
} as const
