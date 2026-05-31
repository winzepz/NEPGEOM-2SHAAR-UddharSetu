import type { ReactNode } from 'react'

type FeatureCardProps = {
  icon: ReactNode
  title: string
  body: string
}

export function FeatureCard({ body, icon, title }: FeatureCardProps) {
  return (
    <article className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{body}</p>
    </article>
  )
}
