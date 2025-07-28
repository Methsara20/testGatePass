// src/services/approvalService.js
import axios from 'axios';
const API = 'http://192.168.10.144:5000/api/passes';

export const fetchSummary = () => axios.get(`${API}/summary`);
//export const approvePass  =  id => axios.put(`${API}/${id}/approve`);
export const rejectPass   =  id => axios.put(`${API}/${id}/reject`);
export const fetchGatePassWithMaterials = (id) =>
    axios.get(`http://192.168.10.144:5000/api/passes/${id}/materials`);


// Updated approvePass function to accept userId parameter
export const approvePass = async (gatePassId, userId) => {
    try {
      const response = await axios.put(
        `${API}/${gatePassId}/approve`,
        { approved_by: userId } // Use the passed userId
      );
      return response.data;
    } catch (error) {
      console.error('Approval error:', error.response?.data || error.message);
      throw error;
    }
};