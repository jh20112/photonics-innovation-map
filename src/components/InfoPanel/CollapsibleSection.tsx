import { useState, useEffect, useRef } from 'react';

interface Props {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  onExpand?: () => void;
  /** Unique key to reset expand state when entity changes */
  resetKey?: string;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, count, defaultOpen = false, onExpand, resetKey, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const expandedRef = useRef(false);
  const lastResetKey = useRef(resetKey);

  // Reset when entity changes
  useEffect(() => {
    if (resetKey !== lastResetKey.current) {
      lastResetKey.current = resetKey;
      expandedRef.current = false;
      if (!defaultOpen) setOpen(false);
    }
  }, [resetKey, defaultOpen]);

  useEffect(() => {
    if (open && !expandedRef.current && onExpand) {
      expandedRef.current = true;
      onExpand();
    }
  }, [open, onExpand]);

  return (
    <div className="collapsible-section">
      <div className="collapsible-header" onClick={() => setOpen(!open)}>
        <span className={`collapsible-chevron ${open ? 'open' : ''}`}>&#9654;</span>
        <span className="collapsible-title">{title}</span>
        {count != null && <span className="collapsible-count">{count}</span>}
      </div>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
}
