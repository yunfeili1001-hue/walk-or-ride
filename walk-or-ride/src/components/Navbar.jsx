import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="wireframe-nav">
      <Link to="/" className="wireframe-nav__brand">
        Walk or Ride?
      </Link>
      <ul className="wireframe-nav__links">
        {isAuthenticated && (
          <>
            <li>
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
                Main
              </NavLink>
            </li>
            <li>
              <NavLink to="/history" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                History
              </NavLink>
            </li>
          </>
        )}
      </ul>
      <span className="wireframe-nav__spacer" />
      <ul className="wireframe-nav__links">
        {isAuthenticated ? (
          <>
            <li className="wireframe-nav__user">{user?.email}</li>
            <li>
              <button type="button" onClick={() => logout().then(() => navigate('/login'))}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link to="/login">Login</Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
