import axios from 'axios';
const BASE = 'http://192.168.10.144:5000/api/passes';

export const fetchDeliveries  = () => axios.get(`${BASE}/deliveries`);
export const acceptDelivery   = (id) => axios.put(`${BASE}/${id}/accept`);
export const rejectDelivery   = (id, comment) =>
  axios.put(`${BASE}/${id}/issue`, { comment });
