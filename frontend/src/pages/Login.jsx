import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { getLocations } from '../services/locationService'; // Import location service
import { useAuth } from '../context/AuthContext';
import { validateEmail, validateRequired } from '../utils/validators';
import PasswordResetHelp from "../components/PasswordResetHelp";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [locations, setLocations] = useState([]); // State for locations
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Fetch locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const locationsData = await getLocations();
        if (Array.isArray(locationsData)) {
          setLocations(locationsData);
        } else {
          console.error('Unexpected locations format:', locationsData);
          setLocations([]);
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
        setLocations([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateRequired(location) || !validateEmail(email) || !validateRequired(password)) {
      return setError('Please fill all fields correctly.');
    }

    try {
      const response = await login(email, password, location);
      const user = response.data;

      localStorage.setItem('users', JSON.stringify(user));
      setUser(user);

      // Role-based redirect
      switch (user.role) {
        case 'Admin':
          navigate('/dashboard');
          break;
        case 'HOD':
        case 'User':
          navigate('/gatepass/new');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      setError('Invalid credentials or server error.');
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div className="card p-4 shadow" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 className="text-center mb-3">Sign In</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Location</label>
            <select
              className="form-select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loadingLocations}
              required
            >
              <option value="">Select your location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
            {loadingLocations && (
              <small className="text-muted">Loading locations...</small>
            )}
            {!loadingLocations && locations.length === 0 && (
              <small className="text-danger">No locations available</small>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="alert alert-danger py-1">{error}</div>}
          <div className="d-grid">
            <button type="submit" className="btn btn-primary">
              Sign In
            </button>
          </div>
        </form>
        <div className="text-end mt-2">
          <button
            type="button"
            className="btn btn-link p-0 small"
            onClick={() => setShowHelp(true)}
          >
            Password Reset
          </button>
        </div>

        <PasswordResetHelp show={showHelp} onHide={() => setShowHelp(false)} />
      </div>
    </div>
  );
};

export default Login;