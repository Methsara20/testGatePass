import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const login = async (email, password, location) => {
  return axios.post(`${API_URL}/users/login`, { email, password, location });
};

export const logout = () => {
  localStorage.removeItem('users');
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('users'));
};
