import axios from 'axios';

const API_URL = 'http://192.168.10.144:5000/api/departments';

export const getDepartments = () => {
  return axios.get(API_URL);
};

export const addDepartment = (department_name) => {
  return axios.post(API_URL, { department_name });
};

export const deleteDepartment = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};

export const updateDepartment = (id, department_name) => {
  return axios.put(`${API_URL}/${id}`, { department_name });
};
