// import axios from 'axios';

// const API_URL = 'http://192.168.10.144:5000/api/departments';

// export const getDepartments = () => {
//   return axios.get(API_URL);
// };

// export const addDepartment = (department_name) => {
//   return axios.post(API_URL, { department_name });
// };

// export const deleteDepartment = (id) => {
//   return axios.delete(`${API_URL}/${id}`);
// };

// export const updateDepartment = (id, department_name) => {
//   return axios.put(`${API_URL}/${id}`, { department_name });
// };


// export const updateDepartment = (id, departmentData) => {
//   return axios.put(`${API_URL}/${id}`, departmentData); 
// };


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

// Update this function to include status parameter
export const updateDepartment = (id, department_name, status) => {
  return axios.put(`${API_URL}/${id}`, { department_name, status });
};



export const getActiveDepartments = async () => {
  const response = await axios.get(`${API}/dep-active`);
  return response.data; // ✅ return only the array
};

// Add a new function specifically for updating status
// export const updateDepartmentStatus = (id, status) => {
//   return axios.put(`${API_URL}/${id}`, { status });
// };