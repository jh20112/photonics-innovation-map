import { useState } from 'react';
import './SidebarSection.css';

interface Props {
  title: string;
  defaultOpen?: boolean;
  badge?: string | number | null;
  children: React.ReactNode;
}

export function SidebarSection({ title, defaultOpen = false, badge, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`sidebar-section-group ${open ? 'open' : ''}`}>
      <button className="sidebar-section-header" onClick={() => setOpen(!open)}>
        <span className="sidebar-section-chevron">{open ? '▾' : '▸'}</span>
        <span className="sidebar-section-title">{title}</span>
        {!open && badge != null && badge !== 0 && (
          <span className="sidebar-section-badge">{badge}</span>
        )}
      </button>
      {open && <div className="sidebar-section-body">{children}</div>}
    </div>
  );
}
