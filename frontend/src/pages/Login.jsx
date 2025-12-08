import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { getActiveLocations } from '../services/locationService';
import { useAuth } from '../context/AuthContext';
import { validateRequired } from '../utils/validators';
import PasswordResetHelp from "../components/PasswordResetHelp";
import companyLogo from '../assets/LOGO.png';
// Optional background image import - comment out if not using
import backgroundImage from '../assets/backg.png';
import {
  FiUser, FiLock, FiMapPin, FiLoader, FiAlertCircle,
  FiSettings, FiHelpCircle, FiInfo, FiChevronLeft,
  FiChevronRight, FiShield, FiGlobe, FiEye, FiEyeOff, FiChevronDown,
  FiWifi, FiWifiOff, FiRefreshCw, FiAlertTriangle, FiInfo as FiInfoIcon,
  FiMenu, FiX
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
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);
  
  
  // Version information - could be fetched from config or API
  const appVersion = "v1.1.0";
  const buildDate = "2025-08-15";
  const environment = process.env.NODE_ENV || 'production';
  
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
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
      
      const response = await getActiveLocations();
      
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
      [name]: name === 'username' ? value.toUpperCase() : value
    }));
  };

  // const handleLocationSelect = (locationName) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     location: locationName
  //   }));
  //   setIsLocationDropdownOpen(false);
  // };

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

  // Panel widths - responsive
  const bgLeft = isMobile ? 0 : (isLeftPanelCollapsed ? 0 : 320);
  const bgRight = isMobile ? 0 : 400;
  
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
    overflow: isMobile ? 'auto' : 'hidden'
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
    background: 'radial-gradient(circle at center, rgba(0, 123, 255, 0.05) 0%, transparent 70%)',
    display: isMobile ? 'none' : 'block'
  };

  // Left panel - responsive
  const leftPanelStyle = {
    position: 'fixed',
    top: 0,
    left: isMobile ? (isLeftPanelCollapsed ? '-100%' : '0') : (isLeftPanelCollapsed ? '-300px' : '0'),
    width: isMobile ? '80%' : '320px',
    maxWidth: isMobile ? '300px' : '320px',
    height: '100vh',
    background: '#101030b3',
    backdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(255,255,255,0.2)',
    boxShadow: isMobile ? '5px 0 15px rgba(0,0,0,0.5)' : '10px 0 30px rgba(0,0,0,0.3)',
    transition: 'left 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
    zIndex: 1000,
    color: 'white',
    overflow: 'auto'
  };

  // Center content aligned with background container - responsive
  const centerContentStyle = {
    position: isMobile ? 'relative' : 'fixed',
    top: 0,
    left: isMobile ? '0' : `${bgLeft}px`,
    right: isMobile ? '0' : `${bgRight}px`,
    height: isMobile ? 'auto' : '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'none',
    transition: 'all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)'
  };

  // Right panel - responsive
  const rightPanelStyle = {
    position: isMobile ? 'relative' : 'fixed',
    top: 0,
    right: 0,
    width: isMobile ? '100%' : '500px',
    height: isMobile ? 'auto' : '100vh',
    minHeight: isMobile ? '100vh' : 'auto',
    background: '#ffffff',
    backdropFilter: 'blur(20px)',
    borderLeft: isMobile ? 'none' : '1px solid rgba(0,0,0,0.1)',
    boxShadow: isMobile ? 'none' : '-10px 0 30px rgba(0,0,0,0.1)',
    color: '#1a1a2e',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: isMobile ? '15px' : '20px',
    zIndex: isMobile ? 10 : 1000,
  };

  // Left toggle button style - responsive
  const leftToggleButtonStyle = {
    position: 'fixed',
    top: isMobile ? '20px' : '50%',
    left: isMobile ? '20px' : (isLeftPanelCollapsed ? '10px' : '330px'),
    transform: isMobile ? 'none' : 'translateY(-50%)',
    background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '50%',
    width: isMobile ? '45px' : '50px',
    height: isMobile ? '45px' : '50px',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
    zIndex: 1001,
    boxShadow: '0 8px 25px rgba(255, 107, 107, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isMobile ? '18px' : '20px'
  };

  // Login card style - responsive
  const loginCardStyle = {
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(25px)',
    border: '1px solid rgba(0,0,0,0.1)',
    boxShadow: '0 25px 45px rgba(0,0,0,0.1), 0 0 50px rgba(0,123,255,0.1)',
    borderRadius: isMobile ? '15px' : '20px',
    padding: isMobile ? '25px' : '40px',
    maxWidth: isMobile ? '100%' : '450px',
    width: '100%',
    animation: 'cardGlow 2s ease-in-out infinite alternate',
    color: '#1a1a2e',
    marginTop: isMobile ? '10px' : '20px',
    margin: isMobile ? '0 auto' : undefined,
  };

  // Input style - responsive
  const inputStyle = {
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(0,0,0,0.2)',
    borderRadius: isMobile ? '10px' : '12px',
    transition: 'all 0.3s ease',
    fontSize: isMobile ? '16px' : '16px', // Prevent zoom on iOS
    color: '#1a1a2e',
    backdropFilter: 'blur(10px)',
    padding: isMobile ? '12px 16px' : '0.75rem 1rem'
  };

  const dropdownButtonStyle = {
    ...inputStyle,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    padding: isMobile ? '12px 16px' : '0.75rem 1rem',
    width: '100%',
    textAlign: 'left',
    position: 'relative'
  };

  // Dropdown menu style - responsive
  const dropdownMenuStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: isMobile ? '10px' : '12px',
    marginTop: '5px',
    zIndex: 1000,
    maxHeight: isMobile ? '150px' : '200px',
    overflowY: 'auto',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
  };

  // Version label style - responsive
  const versionLabelStyle = {
    position: isMobile ? 'static' : 'absolute',
    bottom: isMobile ? 'auto' : '10px',
    left: isMobile ? 'auto' : '20px',
    right: isMobile ? 'auto' : '20px',
    textAlign: 'center',
    fontSize: isMobile ? '11px' : '12px',
    color: 'rgba(0, 0, 0, 1)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: isMobile ? '6px' : '8px',
    borderRadius: '8px',
    background: 'rgba(0,0,0,0.03)',
    border: '1px solid rgba(0,0,0,0.1)',
    marginTop: isMobile ? '20px' : 'auto'
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
      box-shadow: 0 15px 30px #007bff66 !important;
    }
    .form-control-futuristic:focus {
      border-color: #007bff66 !important;
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
      padding: ${isMobile ? '15px' : '20px'};
      border-bottom: 1px solid rgba(255,255,255,0.1);
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      backdropFilter: blur(10px);
    }
    .panel-item:hover {
      background: rgba(255, 255, 255, 0.1);
      padding-left: ${isMobile ? '20px' : '30px'};
      transform: translateX(5px);
    }
    .panel-item:last-child { border-bottom: none; }
    .toggle-btn:hover {
      transform: ${isMobile ? 'scale(1.1)' : 'translateY(-50%) scale(1.1)'};
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
      text-shadow: 0 0 10px #007bffcc, 0 0 20px #007bff80;
    }
    .holographic-border {
      position: relative;
      background: linear-gradient(45deg, transparent, rgba(0,123,255,0.1), transparent);
    }
    .holographic-border::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(45deg, #007bff33, transparent, rgba(0,255,255,0.2));
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
      padding: ${isMobile ? '12px 16px' : '0.75rem 1rem'};
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 1px solid rgba(0,0,0,0.1);
      color: '#1a1a2e';
    }
    .dropdown-item:hover {
      background: rgba(0,123,255,0.1);
      padding-left: ${isMobile ? '20px' : '1.25rem'};
    }
    .dropdown-item:last-child {
      border-bottom: none;
    }
    .offline-indicator {
      position: fixed;
      top: ${isMobile ? '70px' : '10px'};
      right: '10px';
      background: rgba(255, 71, 87, 0.9);
      color: white;
      padding: ${isMobile ? '6px 12px' : '8px 16px'};
      border-radius: 20px;
      font-size: ${isMobile ? '12px' : '14px'};
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 1002;
      animation: pulse 2s ease-in-out infinite;
    }
    .feature-warning {
      position: fixed;
      bottom: '10px';
      right: '10px';
      background: rgba(255, 193, 7, 0.9);
      color: white;
      padding: ${isMobile ? '6px 12px' : '8px 16px'};
      border-radius: 20px;
      font-size: ${isMobile ? '11px' : '12px'};
      max-width: ${isMobile ? '250px' : '300px'};
      z-index: 1002;
    }
    .version-label:hover {
      background: 'rgba(0,0,0,0.05)';
      color: 'rgba(0, 0, 0, 1)';
      transform: translateY(-2px);
    }
    .version-tooltip {
      position: absolute;
      bottom: ${isMobile ? 'auto' : '40px'};
      top: ${isMobile ? '-120px' : 'auto'};
      left: ${isMobile ? '0' : '20px'};
      right: ${isMobile ? '0' : '20px'};
      background: rgba(26,26,46,0.95);
      color: white;
      padding: ${isMobile ? '10px' : '12px'};
      border-radius: 8px;
      font-size: ${isMobile ? '11px' : '12px'};
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
    
    /* Mobile-specific styles */
    @media (max-width: 768px) {
      .btn-futuristic:hover {
        transform: none;
      }
      
      .panel-item:hover {
        transform: none;
        padding-left: 20px;
      }
      
      /* Improve touch targets */
      button, .dropdown-item, .panel-item {
        min-height: 44px;
      }
      
      /* Improve readability on small screens */
      .small {
        font-size: 13px !important;
      }
      
      /* Adjust form spacing */
      .mb-3 {
        margin-bottom: 1rem !important;
      }
      
      .mb-4 {
        margin-bottom: 1.25rem !important;
      }
      
      /* Prevent zoom on input focus */
      input[type="text"], input[type="password"], select, textarea {
        font-size: 16px !important;
      }
      
      /* Improve scrolling on mobile */
      body {
        -webkit-overflow-scrolling: touch;
      }
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
            <div
              style={{
                padding: isMobile ? "20px 15px" : "30px 25px",
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.2)",
                textAlign: "center",
                backdropFilter: "blur(10px)",
              }}
            >
              <h2
                className={
                  isMobile
                    ? "h5 fw-bold mb-2 neon-text"
                    : "h4 fw-bold mb-2 neon-text"
                }
              >
                System Features
              </h2>
              <p className="small mb-0" style={{ opacity: "0.8" }}>
                Gate Pass Management
              </p>
            </div>
            <div className="flex-grow-1" style={{ overflowY: "auto" }}>
              <div className="panel-item">
                <FiShield
                  className="me-3"
                  style={{ fontSize: isMobile ? "20px" : "24px" }}
                />
                <div>
                  <h6
                    className={
                      isMobile ? "mb-1 fw-semibold small" : "mb-1 fw-semibold"
                    }
                  >
                    Secure Access Control
                  </h6>
                  <small style={{ opacity: "0.8" }}>
                    Multi-layer authentication system
                  </small>
                </div>
              </div>
              <div className="panel-item">
                <FiGlobe
                  className="me-3"
                  style={{ fontSize: isMobile ? "20px" : "24px" }}
                />
                <div>
                  <h6
                    className={
                      isMobile ? "mb-1 fw-semibold small" : "mb-1 fw-semibold"
                    }
                  >
                    Multi-Location Support
                  </h6>
                  <small style={{ opacity: "0.8" }}>
                    Manage multiple facilities seamlessly
                  </small>
                </div>
              </div>
              <div className="panel-item">
                <FiSettings
                  className="me-3"
                  style={{ fontSize: isMobile ? "20px" : "24px" }}
                />
                <div>
                  <h6
                    className={
                      isMobile ? "mb-1 fw-semibold small" : "mb-1 fw-semibold"
                    }
                  >
                    Real-Time Tracking
                  </h6>
                  <small style={{ opacity: "0.8" }}>
                    Monitor material movement instantly
                  </small>
                </div>
              </div>
              <div className="panel-item">
                <FiInfo
                  className="me-3"
                  style={{ fontSize: isMobile ? "20px" : "24px" }}
                />
                <div>
                  <h6
                    className={
                      isMobile ? "mb-1 fw-semibold small" : "mb-1 fw-semibold"
                    }
                  >
                    Digital Documentation
                  </h6>
                  <small style={{ opacity: "0.8" }}>
                    Paperless approval workflow
                  </small>
                </div>
              </div>
              <div className="panel-item">
                <FiHelpCircle
                  className="me-3"
                  style={{ fontSize: isMobile ? "20px" : "24px" }}
                />
                <div>
                  <h6
                    className={
                      isMobile ? "mb-1 fw-semibold small" : "mb-1 fw-semibold"
                    }
                  >
                    Analytical Reports
                  </h6>
                  <small style={{ opacity: "0.8" }}>Optimize operations</small>
                </div>
              </div>
            </div>
            <div
              style={{
                padding: isMobile ? "15px" : "20px 25px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.2)",
                textAlign: "center",
                backdropFilter: "blur(10px)",
              }}
            >
              <small
                style={{
                  opacity: "0.7",
                  color: "white",
                  fontSize: isMobile ? "11px" : "12px",
                }}
              >
                Powered by Cool Planet IT Team
              </small>
            </div>
          </div>
        </div>

        {/* Left panel toggle - Mobile shows hamburger/close icon */}
        <button
          style={leftToggleButtonStyle}
          className={`toggle-btn ${
            isLeftPanelCollapsed ? "collapsed" : "expanded"
          }`}
          tabIndex={0}
          onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.target.style.transform = "translateY(-50%) scale(1.1)";
              e.target.style.boxShadow = "0 12px 35px rgba(255, 107, 107, 0.6)";
              e.target.style.borderColor = "rgba(255,255,255,0.5)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.target.style.transform = "translateY(-50%)";
              e.target.style.boxShadow = "0 8px 25px rgba(255, 107, 107, 0.4)";
              e.target.style.borderColor = "rgba(255,255,255,0.3)";
            }
          }}
          onTouchStart={(e) => {
            e.target.style.transform = isMobile
              ? "scale(1.1)"
              : "translateY(-50%) scale(1.1)";
            e.target.style.boxShadow = "0 12px 35px rgba(255, 107, 107, 0.6)";
          }}
          onTouchEnd={(e) => {
            e.target.style.transform = isMobile
              ? "scale(1)"
              : "translateY(-50%)";
            e.target.style.boxShadow = "0 8px 25px rgba(255, 107, 107, 0.4)";
          }}
          aria-label={
            isLeftPanelCollapsed
              ? "Show navigation menu"
              : "Hide navigation menu"
          }
        >
          {isMobile ? (
            isLeftPanelCollapsed ? (
              <FiMenu />
            ) : (
              <FiX />
            )
          ) : isLeftPanelCollapsed ? (
            <FiChevronRight />
          ) : (
            <FiChevronLeft />
          )}
        </button>

        {/* Center content (empty on desktop, hidden on mobile) */}
        <div style={centerContentStyle} />

        {/* Right panel */}
        <div style={rightPanelStyle}>
          {/* Logo and title section */}
          <div
            className="text-center center-logo mb-5"
            style={{
              pointerEvents: "auto",
              paddingTop: isMobile ? "60px" : "20px",
            }}
          >
            <img
              src={companyLogo}
              alt="Company Logo"
              className="mb-3 img-fluid"
              style={{
                width: isMobile ? "120px" : "200px",
                height: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.1))",
              }}
            />
            <h2
              className={isMobile ? "h6 fw-bold mb-2" : "h5 fw-bold mb-2"}
              style={{ color: "#1a1a2e" }}
            >
              Material Gate Pass System
            </h2>
          </div>

          {/* Login form */}
          <div style={loginCardStyle} className="holographic-border">
            <div className="text-center mb-4">
              <FiLock
                style={{
                  fontSize: isMobile ? "36px" : "48px",
                  color: "#007bff",
                  marginBottom: "15px",
                  filter: "drop-shadow(0 5px 15px rgba(0,123,255,0.4))",
                }}
              />
              <h3
                className={isMobile ? "h5 fw-bold mb-2" : "h4 fw-bold mb-2"}
                style={{ color: "#1a1a2e" }}
              >
                Secure Login
              </h3>
              <p className="small" style={{ color: "rgba(26,26,46,0.8)" }}>
                Enter your credentials to access the system
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label
                  htmlFor="location"
                  className="form-label d-flex align-items-center fw-semibold small"
                  style={{ color: "#1a1a2e" }}
                >
                  <FiMapPin className="me-2" style={{ color: "#007bff" }} />{" "}
                  Location
                </label>
                <div style={{ position: "relative" }} ref={dropdownRef}>
                  <div
                    style={dropdownButtonStyle}
                    onClick={() =>
                      setIsLocationDropdownOpen(!isLocationDropdownOpen)
                    }
                  >
                    {formData.location || "Select Location"}
                    <FiChevronDown />
                  </div>

                  {isLocationDropdownOpen && (
                    <div style={dropdownMenuStyle}>
                      {locations.map((loc) => (
                        <div
                          key={loc.location_id}
                          className="dropdown-item"
                          onClick={() =>
                            handleLocationSelect(loc.location_name)
                          } // ✅ Use name
                        >
                          <FiMapPin style={{ marginRight: "8px" }} />
                          {loc.location_name} {/* ✅ Show name */}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <label
                  htmlFor="username"
                  className="form-label d-flex align-items-center fw-semibold small"
                  style={{ color: "#1a1a2e" }}
                >
                  <FiUser className="me-2" style={{ color: "#007bff" }} />{" "}
                  Username
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
                <label
                  htmlFor="password"
                  className="form-label d-flex align-items-center fw-semibold small"
                  style={{ color: "#1a1a2e" }}
                >
                  <FiLock className="me-2" style={{ color: "#007bff" }} />{" "}
                  Password
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
                      border: "1px solid rgba(0,0,0,0.2)",
                      background: "rgba(255,255,255,0.8)",
                      color: "#1a1a2e",
                      minHeight: isMobile ? "44px" : "auto",
                    }}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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
                  disabled={
                    featureErrors.localStorage && featureErrors.sessionStorage
                  }
                  style={{
                    minHeight: isMobile ? "20px" : "auto",
                    minWidth: isMobile ? "20px" : "auto",
                  }}
                />
                <label
                  className="form-check-label"
                  htmlFor="rememberMe"
                  style={{ color: "#1a1a2e" }}
                >
                  Remember me
                  {featureErrors.localStorage &&
                    featureErrors.sessionStorage && (
                      <span
                        className="text-warning ms-2"
                        title="Storage not available"
                      >
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
                    borderRadius: "8px",
                    color: "#856404",
                    background: "rgba(255, 193, 7, 0.1)",
                    border: "1px solid rgba(255, 193, 7, 0.3)",
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
                    style={{ minHeight: isMobile ? "36px" : "auto" }}
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
                    borderRadius: "8px",
                    color: "#fff",
                    background: "rgba(220, 53, 69, 0.9)",
                    border: "1px solid rgba(220, 53, 69, 1)",
                    fontWeight: "500",
                    boxShadow: "0 4px 12px rgba(220, 53, 69, 0.3)",
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
                    padding: isMobile ? "12px" : "15px",
                    borderRadius: isMobile ? "10px" : "12px",
                    transition: "all 0.3s ease",
                    border: "1px solid rgba(0,123,255,0.3)",
                    background: "linear-gradient(135deg, #007bff, #0056b3)",
                    minHeight: isMobile ? "48px" : "auto",
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
                  style={{
                    color: "#007bff",
                    minHeight: isMobile ? "44px" : "auto",
                  }}
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
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.target.style.background = "rgba(0,0,0,0.05)";
                e.target.style.color = "rgba(0, 0, 0, 0.8)";
                e.target.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.target.style.background = "rgba(0,0,0,0.03)";
                e.target.style.color = "rgba(0, 0, 0, 0.6)";
                e.target.style.transform = "translateY(0)";
              }
            }}
            onTouchStart={(e) => {
              e.target.style.background = "rgba(0,0,0,0.05)";
              e.target.style.color = "rgba(0, 0, 0, 0.8)";
            }}
            onTouchEnd={(e) => {
              e.target.style.background = "rgba(0,0,0,0.03)";
              e.target.style.color = "rgba(0, 0, 0, 0.6)";
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