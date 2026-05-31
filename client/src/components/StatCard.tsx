type StatCardProps = {
  label: string
  value: string | number
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div>
      <span>{value}</span>
      <p>{label}</p>
    </div>
  )
}
