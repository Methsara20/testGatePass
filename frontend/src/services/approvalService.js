// src/services/approvalService.js
import axios from 'axios';
const API = 'http://localhost:5000/api/passes';

export const fetchSummary = () => axios.get(`${API}/summary`);
export const approvePass  =  id => axios.put(`${API}/${id}/approve`);
export const rejectPass   =  id => axios.put(`${API}/${id}/reject`);
export const fetchGatePassWithMaterials = (id) =>
    axios.get(`http://localhost:5000/api/passes/${id}/materials`);
  