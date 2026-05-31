import { PageHeader } from './PageHeader'

type LockedPageProps = {
  body: string
  onLogin: () => void
  title: string
}

export function LockedPage({ body, onLogin, title }: LockedPageProps) {
  return (
    <section className="content-page narrow-page page-enter">
      <PageHeader eyebrow="Access required" title={title} body={body} />
      <button className="primary-button" type="button" onClick={onLogin}>
        Login with Google
      </button>
    </section>
  )
}
