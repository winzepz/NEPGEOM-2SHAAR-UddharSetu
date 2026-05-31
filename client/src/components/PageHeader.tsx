type PageHeaderProps = {
  eyebrow: string
  title: string
  body: string
}

export function PageHeader({ body, eyebrow, title }: PageHeaderProps) {
  return (
    <div className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="lead compact-lead">{body}</p>
    </div>
  )
}
