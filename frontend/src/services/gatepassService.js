import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

export const getPasses = () => axios.get(`${BASE_URL}/passes`);
export const addPass = (data) => axios.post(`${BASE_URL}/passes`, data);
export const updatePass = (id, data) => axios.put(`${BASE_URL}/passes/${id}`, data);
export const deletePass = (id) => axios.delete(`${BASE_URL}/passes/${id}`);
export const fetchMyRequests = (userId) => axios.get(`${BASE_URL}/passes/my/${userId}`);

