import { MOCK_HISTORY } from '../data/mockData';

export default function HistoryPage() {
  const walkCount = MOCK_HISTORY.filter((h) => h.result === 'walk').length;

  return (
    <div className="history-page">
      <h1>History</h1>
      <p>
        Total: {MOCK_HISTORY.length} | Walk this week: {walkCount}
      </p>
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
          {MOCK_HISTORY.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.date}</td>
              <td>{entry.from}</td>
              <td>{entry.to}</td>
              <td>{entry.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
