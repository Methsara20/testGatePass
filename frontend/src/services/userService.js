import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/users';

export const getUsers = () => axios.get(BASE_URL);
export const addUser = (data) => axios.post(BASE_URL, data);
export const updateUser = (id, data) => axios.put(`${BASE_URL}/${id}`, data);
export const deleteUser = (id) => axios.delete(`${BASE_URL}/${id}`);
