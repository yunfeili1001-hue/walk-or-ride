export default function BusInfo({ bus, walk, walkWarning }) {
  return (
    <div className="wireframe-block">
      <div className="wireframe-block__title">Bus/Link</div>
      <div className="wireframe-block__body">
        <p>
          {bus.route} → {bus.destination}
        </p>
        <p>{bus.stopName}</p>
        <p>
          {bus.isScheduled ? 'Scheduled in' : 'Arrives in'} {bus.arrivalMinutes} min
          {bus.isScheduled ? ' (static schedule)' : ''}
        </p>
        {walk ? (
          <p>
            Walk: {walk.minutes} min ({walk.distance})
            {walk.estimated ? ' — estimated' : ''}
          </p>
        ) : null}
        {walkWarning ? <p className="status-message">{walkWarning}</p> : null}
      </div>
    </div>
  );
}
