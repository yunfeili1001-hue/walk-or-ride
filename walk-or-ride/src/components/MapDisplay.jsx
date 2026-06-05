export default function MapDisplay({ from, to }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  if (!from?.trim() || !to?.trim()) {
    return (
      <div className="map-display map-display--empty">
        Enter From and To to preview the walking route.
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="map-display map-display--empty">
        Add VITE_GOOGLE_MAPS_KEY in .env to show the map.
      </div>
    );
  }

  const params = new URLSearchParams({
    key: apiKey,
    origin: from.trim(),
    destination: to.trim(),
    mode: 'walking',
  });

  const embedUrl = `https://www.google.com/maps/embed/v1/directions?${params}`;

  return (
    <div className="map-display">
      <iframe
        title={`Walking route from ${from} to ${to}`}
        className="map-display__iframe"
        src={embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
