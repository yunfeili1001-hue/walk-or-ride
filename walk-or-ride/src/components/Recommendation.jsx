export default function Recommendation({ recommendation }) {
  const label = recommendation.mode === 'bus' ? 'Take bus' : 'Walk';

  return (
    <div className="wireframe-block">
      <div className="wireframe-block__title">Recommendation: {label}</div>
      <div className="wireframe-block__body">
        <p>{recommendation.reason}</p>
      </div>
    </div>
  );
}
