interface Props {
  name: string;
  subtitleParts: (string | null | undefined)[];
}

export function EntityHeader({ name, subtitleParts }: Props) {
  const parts = subtitleParts.filter(Boolean) as string[];

  return (
    <div className="entity-header">
      <h2>{name}</h2>
      {parts.length > 0 && (
        <div className="entity-subtitle">
          {parts.map((part, i) => (
            <span key={i}>
              {i > 0 && <span className="dot"> · </span>}
              {part}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
