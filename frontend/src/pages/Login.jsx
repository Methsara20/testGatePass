import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { getLocations } from '../services/locationService';
import { useAuth } from '../context/AuthContext';
import { validateRequired } from '../utils/validators';
import PasswordResetHelp from "../components/PasswordResetHelp";
import companyLogo from '../assets/LOGO.png';
 import backgroundImage from '../assets/backg.png';
import {
  FiUser, FiLock, FiMapPin, FiLoader, FiAlertCircle,
  FiSettings, FiHelpCircle, FiInfo, FiChevronLeft,
  FiChevronRight, FiShield, FiGlobe, FiEye, FiEyeOff, FiChevronDown,
  FiWifi, FiWifiOff, FiRefreshCw, FiAlertTriangle, FiInfo as FiInfoIcon
} from 'react-icons/fi';

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
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const [networkError, setNetworkError] = useState(null);
  const [featureErrors, setFeatureErrors] = useState({});
  const [showVersionInfo, setShowVersionInfo] = useState(false);
  const dropdownRef = useRef(null);
  
  // Version information - could be fetched from config or API
  const appVersion = "v1.1.0";
  const buildDate = "2025-08-15";
  const environment = process.env.NODE_ENV || 'production';
  
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
      // Retry failed requests when coming back online
      if (retryCount > 0) {
        fetchLocations();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError('You are currently offline. Please check your internet connection.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [retryCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLocationDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check for required features
  useEffect(() => {
    const checkFeatures = () => {
      const errors = {};
      
      // Check for localStorage
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
      } catch (e) {
        errors.localStorage = 'Local storage is not available. "Remember me" feature may not work properly.';
      }
      
      // Check for sessionStorage
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
      } catch (e) {
        errors.sessionStorage = 'Session storage is not available. Session management may be affected.';
      }
      
      // Check for required APIs
      if (!window.fetch) {
        errors.fetch = 'Fetch API is not supported. Please use a modern browser.';
      }
      
      setFeatureErrors(errors);
    };
    
    checkFeatures();
  }, []);

  // Enhanced fetchLocations with error handling and retry
  const fetchLocations = async (isRetry = false) => {
    if (!isOnline) {
      setNetworkError('Cannot fetch locations while offline. Please connect to the internet.');
      setLoadingLocations(false);
      return;
    }
    
    try {
      setLoadingLocations(true);
      setError('');
      
      const response = await getLocations();
      
      if (Array.isArray(response)) {
        const sortedLocations = [...response].sort((a, b) =>
          a.location_id - b.location_id
        );
        setLocations(sortedLocations);
        setRetryCount(0);
      } else {
        console.error('Unexpected locations format:', response);
        setError('Received invalid data format from server. Please try again later.');
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
      
      // Error logging
      console.group('Location Fetch Error');
      console.error('Error:', err);
      console.error('Error Type:', err.constructor.name);
      console.error('Error Message:', err.message);
      console.error('Retry Count:', retryCount);
      console.groupEnd();
      
      // Network error detection
      if (!navigator.onLine || err.message.includes('Network Error') || err.code === 'NETWORK_ERROR') {
        setNetworkError('Network connection issue. Please check your internet connection.');
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchLocations(true);
          }, 2000 * (retryCount + 1)); // Exponential backoff
        }
      } else if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        let errorMessage = 'Server error occurred.';
        
        switch (status) {
          case 400:
            errorMessage = 'Bad request. Please check your input.';
            break;
          case 401:
            errorMessage = 'Unauthorized. Please check your credentials.';
            break;
          case 403:
            errorMessage = 'Access forbidden. You dont have permission.';
            break;
          case 404:
            errorMessage = 'Locations service not found. Please contact support.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = `Server error (${status}). Please try again.`;
        }
        
        setError(errorMessage);
      } else if (err.request) {
        // Request was made but no response received
        setError('No response from server. Please check your connection.');
      } else {
        // Other errors
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationSelect = (locationName) => {
    setFormData(prev => ({
      ...prev,
      location: locationName
    }));
    setIsLocationDropdownOpen(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setNetworkError(null);
    setIsSubmitting(true);
    
    if (!isOnline) {
      setNetworkError('Cannot login while offline. Please connect to the internet.');
      setIsSubmitting(false);
      return;
    }
    
    if (
      !validateRequired(formData.location) ||
      !validateRequired(formData.username) ||
      !validateRequired(formData.password)
    ) {
      setIsSubmitting(false);
      return setError('Please fill all fields correctly.');
    }
    
    try {
      const response = await login(
        formData.username,
        formData.password,
        formData.location
      );
      
      const user = response.data;
      
      // Graceful degradation for storage issues
      try {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(user));
      } catch (storageError) {
        console.error('Storage error:', storageError);
        // Continue without storing if storage fails
      }
      
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
      console.error('Login error:', err);
      
      // Error logging
      console.group('Login Error');
      console.error('Error:', err);
      console.error('Error Type:', err.constructor.name);
      console.error('Error Message:', err.message);
      console.error('Form Data:', formData);
      console.groupEnd();
      
      // Network error detection
      if (!navigator.onLine || err.message.includes('Network Error') || err.code === 'NETWORK_ERROR') {
        setNetworkError('Network connection issue. Please check your internet connection.');
      } else if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        let errorMessage = 'Login failed.';
        
        switch (status) {
          case 400:
            errorMessage = 'Invalid login credentials. Please check your username and password.';
            break;
          case 401:
            errorMessage = 'Authentication failed. Please check your credentials.';
            break;
          case 403:
            errorMessage = 'Access denied. You dont have permission to access this system.';
            break;
          case 404:
            errorMessage = 'Login service not found. Please contact support.';
            break;
          case 429:
            errorMessage = 'Too many login attempts. Please wait before trying again.';
            break;
          case 500:
            errorMessage = 'Server error during login. Please try again later.';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Login service temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = `Login failed (${status}). Please try again.`;
        }
        
        setError(errorMessage);
      } else if (err.request) {
        // Request was made but no response received
        setError('No response from login server. Please check your connection.');
      } else {
        // Other errors
        setError('An unexpected error occurred during login. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retry failed requests
  const handleRetry = () => {
    setError('');
    setNetworkError(null);
    setRetryCount(0);
    fetchLocations();
  };

  // Panel widths
  const bgLeft = isLeftPanelCollapsed ? 0 : 320;
  const bgRight = 400;
  
  // Main container with optional background image or gradient
  const containerStyle = {
    minHeight: '100vh',
    width: '100vw',
    position: 'relative',
    zIndex: 0,
    // Use gradient background by default
    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
    // If you want to use an image, uncomment the import above and use this instead:
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    overflow: 'hidden'
  };

  // Background overlay for better readability (only needed if using image background)
  const backgroundOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(10, 10, 26, 0.7)',
    zIndex: 1,
    // Comment out the display property if using image background
    display: 'none'
  };

  // Background between panels
  const backgroundContainerStyle = {
    position: 'fixed',
    top: 0,
    left: `${bgLeft}px`,
    right: `${bgRight}px`,
    height: '100vh',
    zIndex: 2,
    overflow: 'hidden',
    // Subtle radial gradient for depth
    background: 'radial-gradient(circle at center, rgba(0, 123, 255, 0.05) 0%, transparent 70%)'
  };

  // Left panel
  const leftPanelStyle = {
    position: 'fixed',
    top: 0,
    left: isLeftPanelCollapsed ? '-300px' : '0',
    width: '320px',
    height: '100vh',
    background: '#101030b3',
    backdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '10px 0 30px rgba(0,0,0,0.3)',
    transition: 'left 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
    zIndex: 1000,
    color: 'white',
    overflow: 'auto'
  };

  // Center content aligned with background container
  const centerContentStyle = {
    position: 'fixed',
    top: 0,
    left: `${bgLeft}px`,
    right: `${bgRight}px`,
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'none',
    transition: 'all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)'
  };

  // Right panel
  const rightPanelStyle = {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '500px',
    height: '100vh',
    background: '#ffffff',
    backdropFilter: 'blur(20px)',
    borderLeft: '1px solid rgba(0,0,0,0.1)',
    boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
    color: '#1a1a2e',
    overflowY: 'auto',    // Enable vertical scrolling
    overflowX: 'hidden',  // Hide horizontal scrollbar
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    zIndex: 1000,
  };

  // Left toggle button style
  const leftToggleButtonStyle = {
    position: 'fixed',
    top: '50%',
    left: isLeftPanelCollapsed ? '10px' : '330px',
    transform: 'translateY(-50%)',
    background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
    zIndex: 1001,
    boxShadow: '0 8px 25px rgba(255, 107, 107, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px'
  };

  // Login card style
  const loginCardStyle = {
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(25px)',
    border: '1px solid rgba(0,0,0,0.1)',
    boxShadow: '0 25px 45px rgba(0,0,0,0.1), 0 0 50px rgba(0,123,255,0.1)',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '450px',
    width: '100%',
    animation: 'cardGlow 2s ease-in-out infinite alternate',
    color: '#1a1a2e',
    marginTop: '20px',
  };

  // Input style
  const inputStyle = {
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(0,0,0,0.2)',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    fontSize: '16px',
    color: '#1a1a2e',
    backdropFilter: 'blur(10px)'
  };

  const dropdownButtonStyle = {
    ...inputStyle,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '0.75rem 1rem',
    width: '100%',
    textAlign: 'left',
    position: 'relative'
  };

  // Dropdown menu style
  const dropdownMenuStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '12px',
    marginTop: '5px',
    zIndex: 1000,
    maxHeight: '200px',
    overflowY: 'auto',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
  };

  // Version label style
  const versionLabelStyle = {
    position: 'absolute',
    bottom: '10px',
    left: '20px',
    right: '20px',
    textAlign: 'center',
    fontSize: '12px',
    color: 'rgba(0, 0, 0, 1)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: '8px',
    borderRadius: '8px',
    background: 'rgba(0,0,0,0.03)',
    border: '1px solid rgba(0,0,0,0.1)'
  };

  // Keyframes with updated styles
  const keyframes = `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    @keyframes cardGlow {
      0% { box-shadow: 0 25px 45px rgba(0,0,0,0.1), 0 0 50px rgba(0,123,255,0.1); }
      100% { box-shadow: 0 30px 50px rgba(0,0,0,0.2), 0 0 60px rgba(0,123,255,0.2); }
    }
    @keyframes pulse {
      0%,100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.1); opacity: 1; }
    }
    @keyframes arrowBounce {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(3px); }
    }
    @keyframes arrowGlow {
      0%, 100% { 
        filter: drop-shadow(0 0 2px rgba(255,255,255,0.8));
        transform: scale(1);
      }
      50% { 
        filter: drop-shadow(0 0 8px rgba(255,255,255,1));
        transform: scale(1.1);
      }
    }
    .btn-futuristic:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 30px rgba(0, 123, 255, 0.4) !important;
    }
    .form-control-futuristic:focus {
      border-color: rgba(0,123,255,0.4) !important;
      box-shadow: 0 0 20px rgba(0,123,255,0.3) !important;
      background: rgba(255,255,255,0.95) !important;
    }
    .form-control-futuristic::placeholder {
      color: rgba(0,0,0,0.4) !important;
    }
    .spinning {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .panel-item {
      padding: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      backdropFilter: blur(10px);
    }
    .panel-item:hover {
      background: rgba(255, 255, 255, 0.1);
      padding-left: 30px;
      transform: translateX(5px);
    }
    .panel-item:last-child { border-bottom: none; }
    .toggle-btn:hover {
      transform: translateY(-50%) scale(1.1);
      box-shadow: 0 12px 35px rgba(146, 24, 24, 0.6) !important;
      border-color: rgba(255,255,255,0.5) !important;
    }
    .toggle-btn svg {
      transition: all 0.3s ease;
    }
    .toggle-btn:hover svg {
      animation: arrowGlow 1s ease-in-out infinite;
    }
    .toggle-btn.collapsed svg {
      animation: arrowBounce 1s ease-in-out infinite;
    }
    .toggle-btn.expanded svg {
      animation: arrowBounce 1s ease-in-out infinite reverse;
    }
    .glass-effect {
      background: rgba(255,255,255,0.1);
      backdropFilter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    }
    .neon-text {
      text-shadow: 0 0 10px rgba(0,123,255,0.8), 0 0 20px rgba(0,123,255,0.5);
    }
    .holographic-border {
      position: relative;
      background: linear-gradient(45deg, transparent, rgba(0,123,255,0.1), transparent);
    }
    .holographic-border::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(45deg, rgba(0,123,255,0.2), transparent, rgba(0,255,255,0.2));
      border-radius: inherit;
      z-index: -1;
      animation: holographic 3s ease-in-out infinite;
    }
    @keyframes holographic {
      0%,100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    .center-logo { animation: pulse 4s ease-in-out infinite; }
    .dropdown-item {
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 1px solid rgba(0,0,0,0.1);
      color: '#1a1a2e';
    }
    .dropdown-item:hover {
      background: rgba(0,123,255,0.1);
      padding-left: 1.25rem;
    }
    .dropdown-item:last-child {
      border-bottom: none;
    }
    .offline-indicator {
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(255, 71, 87, 0.9);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 1002;
      animation: pulse 2s ease-in-out infinite;
    }
    .feature-warning {
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(255, 193, 7, 0.9);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      max-width: 300px;
      z-index: 1002;
    }
    .version-label:hover {
      background: 'rgba(0,0,0,0.05)';
      color: 'rgba(0, 0, 0, 1)';
      transform: translateY(-2px);
    }
    .version-tooltip {
      position: absolute;
      bottom: 40px;
      left: 20px;
      right: 20px;
      background: rgba(26,26,46,0.95);
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 1001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 1);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .version-tooltip-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .version-tooltip-item:last-child {
      margin-bottom: 0;
    }
    .version-tooltip-label {
      font-weight: 600;
      color: rgba(255,255,255,0.8);
    }
    .version-tooltip-value {
      color: rgba(255,255,255,0.6);
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      {/* Main Container with optional background */}
      <div style={containerStyle}>
        {/* Background overlay for better readability (hidden by default) */}
        <div style={backgroundOverlayStyle} />
        
        {/* Offline indicator */}
        {!isOnline && (
          <div className="offline-indicator">
            <FiWifiOff />
            You are offline
          </div>
        )}
        
        {/* Feature warnings */}
        {Object.keys(featureErrors).length > 0 && (
          <div className="feature-warning">
            <FiAlertTriangle />
            {featureErrors[Object.keys(featureErrors)[0]]}
          </div>
        )}
        
        {/* Background container with subtle radial gradient */}
        <div style={backgroundContainerStyle} />
        
        {/* Left Panel */}
        <div style={leftPanelStyle}>
          <div className="h-100 d-flex flex-column">
            <div style={{
              padding: '30px 25px',
              borderBottom: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.2)',
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <h2 className="h4 fw-bold mb-2 neon-text">System Features</h2>
              <p className="small mb-0" style={{ opacity: '0.8' }}>Gate Pass Management</p>
            </div>
            <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
              <div className="panel-item">
                <FiShield className="me-3" style={{ fontSize: '24px' }} />
                <div>
                  <h6 className="mb-1 fw-semibold">Secure Access Control</h6>
                  <small style={{ opacity: '0.8' }}>Multi-layer authentication system</small>
                </div>
              </div>
              <div className="panel-item">
                <FiGlobe className="me-3" style={{ fontSize: '24px' }} />
                <div>
                  <h6 className="mb-1 fw-semibold">Multi-Location Support</h6>
                  <small style={{ opacity: '0.8' }}>Manage multiple facilities seamlessly</small>
                </div>
              </div>
              <div className="panel-item">
                <FiSettings className="me-3" style={{ fontSize: '24px' }} />
                <div>
                  <h6 className="mb-1 fw-semibold">Real-Time Tracking</h6>
                  <small style={{ opacity: '0.8' }}>Monitor material movement instantly</small>
                </div>
              </div>
              <div className="panel-item">
                <FiInfo className="me-3" style={{ fontSize: '24px' }} />
                <div>
                  <h6 className="mb-1 fw-semibold">Digital Documentation</h6>
                  <small style={{ opacity: '0.8' }}>Paperless approval workflow</small>
                </div>
              </div>
              <div className="panel-item">
                <FiHelpCircle className="me-3" style={{ fontSize: '24px' }} />
                <div>
                  <h6 className="mb-1 fw-semibold">Analytical Reports</h6>
                  <small style={{ opacity: '0.8' }}>Optimize operations</small>
                </div>
              </div>
            </div>
            <div style={{
              padding: '20px 25px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <small style={{ opacity: '0.7', color: 'white' }}>Powered by Cool Planet IT Team</small>
            </div>
          </div>
        </div>
        
        {/* Left panel toggle */}
        <button
          style={leftToggleButtonStyle}
          className={`toggle-btn ${isLeftPanelCollapsed ? 'collapsed' : 'expanded'}`}
          tabIndex={0}
          onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          onMouseEnter={e => {
            e.target.style.transform = 'translateY(-50%) scale(1.1)';
            e.target.style.boxShadow = '0 12px 35px rgba(255, 107, 107, 0.6)';
            e.target.style.borderColor = 'rgba(255,255,255,0.5)';
          }}
          onMouseLeave={e => {
            e.target.style.transform = 'translateY(-50%)';
            e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 107, 0.4)';
            e.target.style.borderColor = 'rgba(255,255,255,0.3)';
          }}
        >
          {isLeftPanelCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
        
        {/* Center content (empty) */}
        <div style={centerContentStyle} />
        
        {/* Right panel */}
        <div style={rightPanelStyle}>
          {/* Logo and title section */}
          <div className="text-center center-logo mb-4" style={{ 
            pointerEvents: 'auto',
            paddingTop: '20px'
          }}>
            <img
              src={companyLogo}
              alt="Company Logo"
              className="mb-3 img-fluid"
              style={{
                width: "120px",
                height: "auto",
                objectFit: "contain",
                filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.1))'
              }}
            />
            <h1 className="h5 fw-bold mb-2" style={{ color: '#1a1a2e' }}>Material Gate Pass System</h1>
         
          </div>
          
          {/* Login form */}
          <div style={loginCardStyle} className="holographic-border">
            <div className="text-center mb-4">
              <FiLock
                style={{
                  fontSize: '48px',
                  color: '#007bff',
                  marginBottom: '15px',
                  filter: 'drop-shadow(0 5px 15px rgba(0,123,255,0.4))'
                }}
              />
              <h3 className="h4 fw-bold mb-2" style={{ color: '#1a1a2e' }}>Secure Login</h3>
              <p className="small" style={{ color: 'rgba(26,26,46,0.8)' }}>
                Enter your credentials to access the system
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="location" className="form-label d-flex align-items-center fw-semibold small" style={{ color: '#1a1a2e' }}>
                  <FiMapPin className="me-2" style={{ color: '#007bff' }} /> Location
                </label>
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="form-control form-control-futuristic"
                    style={dropdownButtonStyle}
                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                    disabled={loadingLocations}
                  >
                    <span>{formData.location || "Select location"}</span>
                    <FiChevronDown 
                      style={{ 
                        transition: 'transform 0.3s ease',
                        transform: isLocationDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                        color: '#1a1a2e'
                      }} 
                    />
                  </button>
                  
                  {isLocationDropdownOpen && (
                    <div style={dropdownMenuStyle}>
                      {loadingLocations ? (
                        <div className="dropdown-item d-flex align-items-center justify-content-center">
                          <FiLoader className="spinning me-2" /> Loading...
                        </div>
                      ) : locations.length > 0 ? (
                        locations.map((loc) => (
                          <div
                            key={loc.location_id || loc.id}
                            className="dropdown-item"
                            onClick={() => handleLocationSelect(loc.name)}
                          >
                            {loc.name}
                          </div>
                        ))
                      ) : (
                        <div className="dropdown-item">
                          No locations available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="username" className="form-label d-flex align-items-center fw-semibold small" style={{ color: '#1a1a2e' }}>
                  <FiUser className="me-2" style={{ color: '#007bff' }} /> Username
                </label>
                <input
                  id="username"
                  type="text"
                  className="form-control form-control-futuristic"
                  style={inputStyle}
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label d-flex align-items-center fw-semibold small" style={{ color: '#1a1a2e' }}>
                  <FiLock className="me-2" style={{ color: '#007bff' }} /> Password
                </label>
                <div className="input-group">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="form-control form-control-futuristic"
                    style={inputStyle}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      border: '1px solid rgba(0,0,0,0.2)',
                      background: 'rgba(255,255,255,0.8)',
                      color: '#1a1a2e'
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              
              <div className="mb-4 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={featureErrors.localStorage && featureErrors.sessionStorage}
                />
                <label className="form-check-label" htmlFor="rememberMe" style={{ color: '#1a1a2e' }}>
                  Remember me
                  {featureErrors.localStorage && featureErrors.sessionStorage && (
                    <span className="text-warning ms-2" title="Storage not available">
                      <FiAlertTriangle />
                    </span>
                  )}
                </label>
              </div>
              
              {/* Network error display */}
              {networkError && (
                <div
                  className="alert alert-warning d-flex align-items-center py-2 mb-3 border-0 small"
                  style={{ 
                    borderRadius: '8px', 
                    color: '#856404',
                    background: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)'
                  }}
                  role="alert"
                >
                  <FiWifiOff className="me-2" />
                  <div className="flex-grow-1">
                    {networkError}
                    {retryCount > 0 && (
                      <small className="d-block mt-1">
                        Retry attempt {retryCount} of 3
                      </small>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-warning ms-2"
                    onClick={handleRetry}
                    disabled={loadingLocations}
                  >
                    <FiRefreshCw className="me-1" />
                    Retry
                  </button>
                </div>
              )}
              
              {/* General error display */}
              {error && (
                <div
                  className="alert alert-danger d-flex align-items-center py-2 mb-3 border-0 small"
                  style={{ 
                   borderRadius: '8px', 
                   color: '#fff',
                    background: 'rgba(220, 53, 69, 0.9)', // Changed to a more solid red background
                    border: '1px solid rgba(220, 53, 69, 1)', // More prominent border
                    fontWeight: '500', // Added font weight
                    boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)' // Added shadow for better visibility
                  }}
                  role="alert"
                  aria-live="polite"
                >
                  <FiAlertCircle className="me-2" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="d-grid mb-3">
                <button
                  type="submit"
                  className="btn text-white fw-semibold btn-futuristic"
                  style={{
                    padding: '15px',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(0,123,255,0.3)',
                    background: 'linear-gradient(135deg, #007bff, #0056b3)'
                  }}
                  disabled={isSubmitting || loadingLocations || !isOnline}
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="spinning me-2" />
                      Authenticating...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-decoration-none p-0 small"
                  style={{ color: '#007bff' }}
                  onClick={() => setShowHelp(true)}
                >
                  Need assistance?
                </button>
              </div>
            </form>
          </div>
          
          {/* Version label at the bottom */}
          <div 
            style={versionLabelStyle}
            onClick={() => setShowVersionInfo(!showVersionInfo)}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(0,0,0,0.05)';
              e.target.style.color = 'rgba(0, 0, 0, 0.8)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'rgba(0,0,0,0.03)';
              e.target.style.color = 'rgba(0, 0, 0, 0.6)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <span>{appVersion}</span>
            {showVersionInfo && (
              <div className="version-tooltip">
                <div className="version-tooltip-item">
                  <span className="version-tooltip-label">Version:</span>
                  <span className="version-tooltip-value">{appVersion}</span>
                </div>
                <div className="version-tooltip-item">
                  <span className="version-tooltip-label">Build Date:</span>
                  <span className="version-tooltip-value">{buildDate}</span>
                </div>
                <div className="version-tooltip-item">
                  <span className="version-tooltip-label">Environment:</span>
                  <span className="version-tooltip-value">{environment}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Password Reset Modal */}
        <PasswordResetHelp show={showHelp} onHide={() => setShowHelp(false)} />
      </div>
    </>
  );
};

export default Login;