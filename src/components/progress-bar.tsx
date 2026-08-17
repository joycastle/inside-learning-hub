export interface ProgressBarProps {
  value: number
  label?: string
}

export function ProgressBar({ value, label = '完成进度' }: ProgressBarProps) {
  const normalizedValue = Math.min(100, Math.max(0, value))

  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalizedValue}
    >
      {/* 进度值为运行时数据；使用缩放避免动画触发布局重排。 */}
      <div className="progress-fill" style={{ transform: `scaleX(${normalizedValue / 100})` }} />
    </div>
  )
}
