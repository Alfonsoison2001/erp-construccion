export default function ProgressBar({ value = 0, max = 100, color = 'primary', showLabel = true }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0

  const colors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  }

  const barColor = pct > 100 ? 'bg-danger' : pct > 75 ? colors[color] : colors[color]

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-600 min-w-[40px] text-right">
          {pct.toFixed(1)}%
        </span>
      )}
    </div>
  )
}
