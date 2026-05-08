export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="topbar">
      <div className="stack">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="toolbar">{actions}</div> : null}
    </header>
  );
}
