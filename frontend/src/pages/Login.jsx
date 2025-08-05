import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { getLocations } from '../services/locationService';
import { useAuth } from '../context/AuthContext';
import { validateRequired } from '../utils/validators';
import PasswordResetHelp from "../components/PasswordResetHelp";
import companyLogo from '../assets/LOGO.png';
import { FiUser, FiLock, FiMapPin, FiLoader, FiAlertCircle } from 'react-icons/fi';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    location: ''
  });
  const [locations, setLocations] = useState([]); 
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locationsData = await getLocations();
        if (Array.isArray(locationsData)) {
          const sortedLocations = [...locationsData].sort((a, b) => 
            a.location_id - b.location_id
          );
          setLocations(sortedLocations);
        } else {
          console.error('Unexpected locations format:', locationsData);
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
        setError('Failed to load locations. Please refresh the page.');
      } finally {
        setLoadingLocations(false);
      }
    };
  
    fetchLocations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!validateRequired(formData.location) || 
        !validateRequired(formData.username) || 
        !validateRequired(formData.password)) {
      setIsSubmitting(false);
      return setError('Please fill all fields correctly.');
    }

    try {
      const response = await login(formData.username, formData.password, formData.location);
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
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center min-vh-100 p-3">
      {/* Company Logo & Header */}
      <div className="text-center mb-4">
        <img
          src={companyLogo}
          alt="Company Logo"
          className="mb-3 img-fluid" 
          style={{
            width: "250px", 
            height: "auto",
            maxHeight: "150px", 
            filter: "brightness(1.1) contrast(1.1)",
            mixBlendMode: "multiply",
            objectFit: "contain", // Ensures proper scaling
          }}
        />
        <h1 className="h5 text-black">Material Gate Pass System</h1>
      </div>

      {/* Login Card */}
      <div
        className="card p-4 shadow-sm border-0 rounded-lg"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        <h2 className="h5 text-center mb-4">Welcome Back</h2>

        <form onSubmit={handleSubmit}>
          {/* Location Field */}
          <div className="mb-3">
            <label
              htmlFor="location"
              className="form-label d-flex align-items-center"
            >
              <FiMapPin className="me-2" /> Location
            </label>
            <select
              id="location"
              className="form-select ps-4"
              name="location"
              value={formData.location}
              onChange={handleChange}
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
              <small className="text-muted d-flex align-items-center mt-1">
                <FiLoader className="me-1 spin" /> Loading locations...
              </small>
            )}
          </div>

          {/* Username Field */}
          <div className="mb-3">
            <label
              htmlFor="username"
              className="form-label d-flex align-items-center"
            >
              <FiUser className="me-2" /> Username / Employee ID
            </label>
            <div className="position-relative">
              <input
                id="username"
                type="text"
                className="form-control ps-4"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username or employee number"
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="form-label d-flex align-items-center"
            >
              <FiLock className="me-2" /> Password
            </label>
            <div className="position-relative">
              <input
                id="password"
                type="password"
                className="form-control ps-4"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center py-2 mb-3">
              <FiAlertCircle className="me-2" />
              <small>{error}</small>
            </div>
          )}

          {/* Submit Button */}
          <div className="d-grid mb-3">
            <button
              type="submit"
              className="btn btn-primary py-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="spin me-2" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>

        {/* Password Reset Link */}
        <div className="text-center mt-3">
          <button
            type="button"
            className="btn btn-link text-decoration-none p-0 small"
            onClick={() => setShowHelp(true)}
          >
            Forgot your password?
          </button>
        </div>
      </div>

      {/* Password Reset Modal */}
      <PasswordResetHelp show={showHelp} onHide={() => setShowHelp(false)} />
    </div>
  );
};

export default Login;