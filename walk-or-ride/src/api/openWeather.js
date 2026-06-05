const WEATHER_CODE_MAP = {
  0: 'Clear',
  1: 'Clear',
  2: 'Clouds',
  3: 'Clouds',
  45: 'Clouds',
  48: 'Clouds',
  51: 'Drizzle',
  53: 'Drizzle',
  55: 'Drizzle',
  61: 'Rain',
  63: 'Rain',
  65: 'Rain',
  71: 'Snow',
  73: 'Snow',
  75: 'Snow',
  80: 'Rain',
  81: 'Rain',
  82: 'Rain',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
};

async function getWeatherFromOpenMeteo(lat, lng) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lng);
  url.searchParams.set('current', 'temperature_2m,weather_code');
  url.searchParams.set('temperature_unit', 'fahrenheit');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Weather fallback request failed');
  }

  const data = await response.json();
  const code = data.current?.weather_code ?? 0;
  const condition = WEATHER_CODE_MAP[code] ?? 'Clear';

  return {
    condition,
    description: condition.toLowerCase(),
    tempF: Math.round(data.current.temperature_2m),
  };
}

export async function getWeather(lat, lng) {
  const key = import.meta.env.VITE_OPENWEATHER_KEY;

  if (!key || key === 'your_openweather_api_key') {
    return getWeatherFromOpenMeteo(lat, lng);
  }

  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lng);
  url.searchParams.set('appid', key);
  url.searchParams.set('units', 'imperial');

  try {
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return {
      condition: data.weather[0].main,
      description: data.weather[0].description,
      tempF: Math.round(data.main.temp),
    };
  } catch {
    return getWeatherFromOpenMeteo(lat, lng);
  }
}
