// src/services/dashboardService.js
import axios from 'axios';
export const fetchDashboardData = () => axios.get('http://192.168.10.144:5000/api/dashboard/summary');
