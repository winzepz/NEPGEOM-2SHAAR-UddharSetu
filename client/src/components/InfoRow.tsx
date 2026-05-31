type InfoRowProps = {
  label: string
  value: string
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
