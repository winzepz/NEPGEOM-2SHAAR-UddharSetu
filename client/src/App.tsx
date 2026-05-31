import { useEffect, useState } from 'react'

type HealthResponse = {
  status: string
  service: string
}

function App() {
  const [apiStatus, setApiStatus] = useState('Checking API...')

  useEffect(() => {
    fetch('/api/health')
      .then((response) => {
        if (!response.ok) {
          throw new Error('API request failed')
        }

        return response.json() as Promise<HealthResponse>
      })
      .then((data) => setApiStatus(`${data.service}: ${data.status}`))
      .catch(() => setApiStatus('API unavailable'))
  }, [])

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">UddharSetu</p>
        <h1>Disaster support requests, verified before donors act.</h1>
        <p className="lead">
          A React TypeScript client connected to a Node.js Express API, ready for
          building victim needs, social worker verification, and donor workflows.
        </p>
        <div className="status-row" aria-live="polite">
          <span className="status-dot" />
          <span>{apiStatus}</span>
        </div>
      </section>
    </main>
  )
}

export default App
