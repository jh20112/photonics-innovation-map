import { useState } from 'react';

interface Props {
  title: string;
  badge?: string | number | null;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function SubSection({ title, badge, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="sidebar-subsection">
      <button className="subsection-header" onClick={() => setOpen(!open)}>
        <span className="subsection-chevron">{open ? '▾' : '▸'}</span>
        <span className="subsection-title">{title}</span>
        {badge != null && badge !== 0 && (
          <span className="subsection-badge">{badge}</span>
        )}
      </button>
      {open && <div className="subsection-body">{children}</div>}
    </div>
  );
}
