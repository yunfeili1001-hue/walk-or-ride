import { Navigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register, isAuthenticated, loading, isFirebaseConfigured } = useAuth();

  if (loading) {
    return (
      <div className="login-page">
        <p className="status-message">Checking login status...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-page">
      <h1>{isFirebaseConfigured ? 'Login' : 'Firebase Setup Required'}</h1>
      {isFirebaseConfigured ? (
        <LoginForm onLogin={login} onRegister={register} />
      ) : (
        <p className="status-message status-error">
          Add your Firebase config to <code>.env</code> (see <code>.env.example</code>), then
          restart the dev server.
        </p>
      )}
    </div>
  );
}
