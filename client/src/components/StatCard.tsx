type StatCardProps = {
  label: string
  value: string | number
  icon?: React.ReactNode
  accentColor?: string
}

export function StatCard({ label, value, icon, accentColor }: StatCardProps) {
  return (
    <div className="stat-card">
      {icon && <div className="stat-card-icon">{icon}</div>}
      <div className="stat-card-body">
        <span className="stat-card-value" style={accentColor ? { color: accentColor } : undefined}>
          {value}
        </span>
        <p className="stat-card-label">{label}</p>
      </div>
    </div>
  )
}
