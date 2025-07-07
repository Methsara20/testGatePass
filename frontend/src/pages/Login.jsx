// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validateRequired } from '../utils/validators';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { setUser } = useAuth();


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
  
      // 🔁 Role-based redirect
      switch (user.role) {
        case 'Admin':
          navigate('/dashboard');
          break;
        case 'HOD':
          navigate('/requests');
          break;
        
        default:
          navigate('/dashboard'); // fallback
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
            <select className="form-select" value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">Select your location</option>
              <option value="Head Office">Head Office</option>
              <option value="Colombo Office">Colombo Office</option>
              <option value="Branch B">Branch B</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="alert alert-danger py-1">{error}</div>}
          <div className="d-grid">
            <button type="submit" className="btn btn-primary">Sign In</button>
          </div>
        </form>
        <div className="text-center mt-2">
          <a href="#" className="text-decoration-none">Forgot password?</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
