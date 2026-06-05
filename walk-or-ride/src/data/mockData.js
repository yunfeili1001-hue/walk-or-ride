export const MOCK_SAVED_ROUTES = [
  { id: '1', from: 'University of Washington, Seattle', to: 'Capitol Hill Station, Seattle', label: 'Campus → Capitol Hill' },
  { id: '2', from: 'Pike Place Market, Seattle', to: 'Seattle Center, Seattle', label: 'Market → Seattle Center' },
  { id: '3', from: 'Westlake Station, Seattle', to: 'Ballard, Seattle', label: 'Downtown → Ballard' },
];

export const MOCK_BUS = {
  route: 'Route 44',
  destination: 'Montlake',
  arrivalMinutes: 5,
  stopName: 'UW Campus Pkwy & 15th Ave NE',
};

export const MOCK_WEATHER = {
  condition: 'Clear',
  description: 'clear sky',
  tempF: 68,
};

export const MOCK_WALK = {
  minutes: 12,
  distance: '0.6 mi',
};

export const MOCK_RECOMMENDATION = {
  mode: 'walk',
  reason: 'sunny day, walk 12 minutes',
};
