interface Props {
  title: string;
  subtitle: string;
  type?: 'company' | 'institution' | 'grant';
  statusLabel?: string;
  statusColor?: 'active' | 'closed' | 'pending';
  onClick?: () => void;
}

export function RelatedEntityCard({ title, subtitle, type, statusLabel, statusColor, onClick }: Props) {
  return (
    <div
      className={`entity-card ${type ? `type-${type}` : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="entity-card-body">
        <div className="entity-card-title">{title}</div>
        <div className="entity-card-subtitle">
          {subtitle}
          {statusLabel && (
            <>
              {' · '}
              <span className={`status-pill ${statusColor || ''}`}>{statusLabel}</span>
            </>
          )}
        </div>
      </div>
      {onClick && <span className="entity-card-arrow">&#8250;</span>}
    </div>
  );
}
