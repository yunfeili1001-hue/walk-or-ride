import { useState } from 'react';
import MapDisplay from './MapDisplay';
import WireframePanel from './WireframePanel';

export default function SearchPanel({
  from,
  to,
  loading,
  isSaved,
  onFromChange,
  onToChange,
  onSearch,
  onSave,
}) {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const canSave = Boolean(from.trim() && to.trim());

  const handleSave = async () => {
    setSaveMessage('');
    setSaving(true);

    try {
      await onSave({ from, to });
      setSaveMessage('Saved');
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <WireframePanel title="Search">
      <div className="route-inputs-row">
        <div className="route-inputs">
          <p>
            <label htmlFor="routeFrom">
              From:{' '}
              <input
                id="routeFrom"
                type="text"
                value={from}
                disabled={loading}
                onChange={(e) => {
                  setSaveMessage('');
                  onFromChange(e.target.value);
                }}
              />
            </label>
          </p>
          <p>
            <label htmlFor="routeTo">
              To:{' '}
              <input
                id="routeTo"
                type="text"
                value={to}
                disabled={loading}
                onChange={(e) => {
                  setSaveMessage('');
                  onToChange(e.target.value);
                }}
              />
            </label>
          </p>
        </div>
        <button
          type="button"
          className="icon-button save-icon-button"
          title={isSaved ? 'Route saved' : 'Save this route'}
          onClick={handleSave}
          disabled={loading || saving || !canSave || isSaved}
        >
          {saving ? '…' : isSaved ? '★' : '☆'}
        </button>
      </div>

      {saveMessage ? (
        <p className={`status-message ${saveMessage === 'Saved' ? 'status-success' : 'status-error'}`}>
          {saveMessage}
        </p>
      ) : null}

      <MapDisplay from={from} to={to} />
      <p>
        <button type="button" onClick={onSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </p>
    </WireframePanel>
  );
}
