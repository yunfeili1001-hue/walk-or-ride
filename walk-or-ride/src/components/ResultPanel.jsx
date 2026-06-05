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
  recommendation,
}) {
  return (
    <WireframePanel title="Results">
      {loading && <p className="status-message">Loading walk, bus, and weather data...</p>}
      {error && !loading && <p className="status-message status-error">{error}</p>}
      {!loading && !error && bus && weather && walk && recommendation && (
        <>
          <BusInfo bus={bus} walk={walk} />
          <WeatherInfo weather={weather} />
          <Recommendation recommendation={recommendation} />
        </>
      )}
    </WireframePanel>
  );
}
