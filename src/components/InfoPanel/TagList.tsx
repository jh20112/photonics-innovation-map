import type { RticEntry } from '../../types/api';

interface TagListProps {
  label?: string;
  tags: string[];
  variant?: 'primary' | 'secondary' | 'default';
}

export function TagList({ label, tags, variant = 'default' }: TagListProps) {
  if (tags.length === 0) return null;

  return (
    <div className="tag-group">
      {label && <div className="tag-group-label">{label}</div>}
      <div className="tag-list">
        {tags.map((t, i) => (
          <span key={i} className={`tag ${variant}`}>{t}</span>
        ))}
      </div>
    </div>
  );
}

interface RticTagsProps {
  rtic: RticEntry[];
}

export function RticTags({ rtic }: RticTagsProps) {
  const sectors = rtic.filter(r => r.type === 'sector');
  const subsectors = rtic.filter(r => r.type === 'subsector');

  if (sectors.length === 0 && subsectors.length === 0) return null;

  // Group subsectors by parent sector code
  const grouped: Record<string, RticEntry[]> = {};
  for (const sub of subsectors) {
    const key = sub.parent_code || 'other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(sub);
  }

  return (
    <div className="tag-group">
      <div className="tag-group-label">RTIC Classification</div>
      {sectors.map(s => (
        <div key={s.code} className="rtic-sector-block">
          <div className="rtic-sector-header">
            <span className="rtic-code">{s.code}</span>
            <span className="rtic-name">{s.name}</span>
          </div>
          {grouped[s.code] && grouped[s.code].length > 0 && (
            <div className="rtic-subsector-list">
              {grouped[s.code].map(sub => (
                <span key={sub.code} className="rtic-subsector">
                  <span className="rtic-sub-code">{sub.code}</span> {sub.name}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
