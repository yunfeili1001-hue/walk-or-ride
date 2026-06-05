import { useQueryHistory } from '../hooks/useQueryHistory';

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HistoryPage() {
  const { history, loading, error, walkThisWeek } = useQueryHistory();

  return (
    <div className="history-page">
      <h1>History</h1>
      <p>
        Total: {history.length} | Walk this week: {walkThisWeek}
      </p>

      {loading ? <p className="status-message">Loading search history...</p> : null}
      {error ? <p className="status-message status-error">{error}</p> : null}

      {!loading && history.length === 0 ? (
        <p className="status-message">No searches yet. Run a search on the Main page.</p>
      ) : (
        <table className="wireframe-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>From</th>
              <th>To</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.id}>
                <td>{formatTimestamp(entry.timestamp)}</td>
                <td>{entry.from}</td>
                <td>{entry.to}</td>
                <td>{entry.result === 'walk' ? 'Walk' : 'Bus'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
