export default function WeatherInfo({ weather }) {
  return (
    <div className="wireframe-block">
      <div className="wireframe-block__title">Weather</div>
      <div className="wireframe-block__body">
        <p>
          {weather.tempF}°F — {weather.description} ({weather.condition})
        </p>
      </div>
    </div>
  );
}
