export function recommend(walkMinutes, busWaitMinutes, weather) {
  const isRaining = ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(weather);

  if (isRaining && busWaitMinutes <= 10) {
    return {
      mode: 'bus',
      reason: `Rainy weather and the bus arrives in ${busWaitMinutes} min — take the bus`,
    };
  }

  if (!isRaining && walkMinutes <= 15) {
    return {
      mode: 'walk',
      reason: `Nice weather — walking takes only ${walkMinutes} min`,
    };
  }

  if (busWaitMinutes <= 3) {
    return {
      mode: 'bus',
      reason: `Bus arrives in ${busWaitMinutes} min — hurry to catch it!`,
    };
  }

  if (walkMinutes < busWaitMinutes) {
    return {
      mode: 'walk',
      reason: `Walking (${walkMinutes} min) is faster than waiting for the bus (${busWaitMinutes} min)`,
    };
  }

  return {
    mode: 'bus',
    reason: `Bus in ${busWaitMinutes} min is easier than walking (${walkMinutes} min)`,
  };
}
