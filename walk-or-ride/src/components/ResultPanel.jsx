import BusInfo from './BusInfo';
import Recommendation from './Recommendation';
import WeatherInfo from './WeatherInfo';
import WireframePanel from './WireframePanel';

export default function ResultPanel({
  loading,
  error,
  bus,
  weather,
  walk,
  walkWarning,
  recommendation,
}) {
  const hasResults = !loading && bus && weather && recommendation;

  return (
    <WireframePanel title="Results">
      {loading && <p className="status-message">Loading walk, bus, and weather data...</p>}
      {error && !loading && <p className="status-message status-error">{error}</p>}
      {hasResults && (
        <>
          <BusInfo bus={bus} walk={walk} walkWarning={walkWarning} />
          <WeatherInfo weather={weather} />
          <Recommendation recommendation={recommendation} />
        </>
      )}
    </WireframePanel>
  );
}
