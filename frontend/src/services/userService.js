import axios from 'axios';

const BASE_URL = 'http://192.168.10.144:5000/api/users';


export const getUsers = () => axios.get(BASE_URL);
export const addUser = (data) => axios.post(BASE_URL, data);
export const loginUser = (credentials) => axios.post(`${BASE_URL}/login`, credentials);
export const updateUser = (id, data) => axios.put(`${BASE_URL}/${id}`, data);
export const deleteUser = (id) => axios.delete(`${BASE_URL}/${id}`);
//
export const getUserById = (id) => axios.get(`${BASE_URL}/${id}`);
export const updatePassword = (id, currentPassword, newPassword) => 
    axios.put(`${BASE_URL}/${id}/password`, { 
      currentPassword, 
      newPassword 
    });