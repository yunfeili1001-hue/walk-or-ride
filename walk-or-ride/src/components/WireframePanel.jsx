export default function WireframePanel({ title, children, className = '' }) {
  return (
    <section className={`wireframe-panel ${className}`.trim()}>
      {title ? <div className="wireframe-panel__title">{title}</div> : null}
      <div className="wireframe-panel__body">{children}</div>
    </section>
  );
}
