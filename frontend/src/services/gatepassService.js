import axios from 'axios';

const BASE_URL = 'http://192.168.10.144:5000/api';

export const getPasses = () => axios.get(`${BASE_URL}/passes`);
export const addPass = (data) => axios.post(`${BASE_URL}/passes`, data);
export const updatePass = (id, data) => axios.put(`${BASE_URL}/passes/${id}`, data);
export const deletePass = (id) => axios.delete(`${BASE_URL}/passes/${id}`);
export const fetchMyRequests = (userId) => axios.get(`${BASE_URL}/passes/my/${userId}`);


// Fixed PDF service function
export const generateGatePassPDF = (id) => {
    return axios.get(`${BASE_URL}/passes/${id}/pdf`, {
      responseType: 'blob', // This ensures binary data is handled correctly
      headers: {
        'Accept': 'application/pdf',
        'Content-Type': 'application/json'
      },
      timeout: 30000, // 30 second timeout
      validateStatus: function (status) {
        // Accept both 200 and other success codes
        return status >= 200 && status < 300;
      }
    }).catch(error => {
      console.error('PDF service error:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || 'PDF generation failed'}`);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Something else happened
        throw new Error(`Request error: ${error.message}`);
      }
    });
  };