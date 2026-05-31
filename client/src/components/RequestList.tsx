import { FileCheck2 } from 'lucide-react'
import type { HelpRequest } from '../types/app'
import { InfoRow } from './InfoRow'

type RequestListProps = {
  title: string
  requests: HelpRequest[]
}

export function RequestList({ requests, title }: RequestListProps) {
  return (
    <div className="request-list">
      <div className="list-heading">
        <h2>{title}</h2>
        <span>{requests.length}</span>
      </div>
      {requests.length === 0 ? (
        <p className="empty-state">No database records yet.</p>
      ) : (
        <div className="request-items">
          {requests.map((request) => (
            <article className="request-card" key={request.id}>
              <div>
                <strong>{request.title}</strong>
                <p>{request.description}</p>
              </div>
              <dl>
                <InfoRow label="Category" value={request.category} />
                <InfoRow label="Urgency" value={request.urgency} />
                <InfoRow label="Quantity" value={`${request.fulfilledQuantity}/${request.targetQuantity}`} />
              </dl>
              {request.localAuthDocUrl && (
                <a className="document-link" href={request.localAuthDocUrl} target="_blank" rel="noreferrer">
                  <FileCheck2 size={16} />
                  Authority document
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
