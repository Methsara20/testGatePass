// authService.js
import axios from 'axios';

const API_URL = 'http://192.168.10.144:5000/api';

export const login = async (email, password, location) => {
  try {
    const response = await axios.post(`${API_URL}/users/login`, { email, password, location });
    if (response.data) {
      localStorage.setItem('users', JSON.stringify(response.data));
    }
    return response;
  } catch (error) {
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('users');
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('users'));
};