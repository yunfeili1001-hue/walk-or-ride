import { useState } from 'react';
import ResultPanel from '../components/ResultPanel';
import SavedRoutes from '../components/SavedRoutes';
import SearchPanel from '../components/SearchPanel';
import { useSavedRoutes } from '../hooks/useSavedRoutes';
import { useRouteSearch } from '../hooks/useRouteSearch';

export default function MainPage() {
  const [from, setFrom] = useState('University of Washington, Seattle');
  const [to, setTo] = useState('Capitol Hill Station, Seattle');
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const { results, loading, error, search } = useRouteSearch();
  const {
    routes,
    loading: routesLoading,
    error: routesError,
    addRoute,
    deleteRoute,
    isRouteSaved,
  } = useSavedRoutes();

  const handleSelectRoute = async (route) => {
    setFrom(route.from);
    setTo(route.to);
    setSelectedRouteId(route.id);
    setHasSearched(true);

    try {
      await search(route.from, route.to);
    } catch {
      // error state handled by useRouteSearch
    }
  };

  const handleSearch = async () => {
    setHasSearched(true);
    try {
      await search(from, to);
    } catch {
      // error state handled by useRouteSearch
    }
  };

  return (
    <div className="main-page">
      <div className="main-layout">
        <SavedRoutes
          routes={routes}
          selectedId={selectedRouteId}
          loading={routesLoading}
          error={routesError}
          onSelect={handleSelectRoute}
          onDelete={deleteRoute}
        />
        <SearchPanel
          from={from}
          to={to}
          loading={loading}
          isSaved={isRouteSaved(from, to)}
          onFromChange={setFrom}
          onToChange={setTo}
          onSearch={handleSearch}
          onSave={addRoute}
        />
        {hasSearched ? (
          <ResultPanel
            loading={loading}
            error={error}
            bus={results?.bus}
            weather={results?.weather}
            walk={results?.walk}
            walkWarning={results?.walkWarning}
            recommendation={results?.recommendation}
          />
        ) : (
          <p className="results-placeholder">Click Search to fetch live data.</p>
        )}
      </div>
    </div>
  );
}
