import WireframePanel from './WireframePanel';

export default function SavedRoutes({ routes, selectedId, loading, error, onSelect, onDelete }) {
  return (
    <WireframePanel title="Saved Routes">
      {loading ? <p className="status-message">Loading saved routes...</p> : null}
      {error ? <p className="status-message status-error">{error}</p> : null}

      {!loading && routes.length === 0 ? (
        <p className="status-message">No saved routes yet. Use ☆ in Search to add one.</p>
      ) : (
        <ul className="wireframe-list">
          {routes.map((route) => (
            <li
              key={route.id}
              className={route.id === selectedId ? 'selected' : ''}
              onClick={() => onSelect(route)}
            >
              <div className="saved-route-item__label">{route.label}</div>
              <small className="saved-route-item__detail">
                {route.from} → {route.to}
              </small>
              <button
                type="button"
                className="icon-button delete-route-button"
                title="Delete route"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(route.id);
                }}
              >
                delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </WireframePanel>
  );
}
