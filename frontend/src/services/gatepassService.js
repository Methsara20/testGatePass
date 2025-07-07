import axios from 'axios';
const API_URL = 'http://localhost:5000/api/passes';

export const getPasses = () => axios.get(API_URL);
export const addPass = (data) => axios.post(API_URL, data);
export const updatePass = (id, data) => axios.put(`${API_URL}/${id}`, data);
export const deletePass = (id) => axios.delete(`${API_URL}/${id}`);
