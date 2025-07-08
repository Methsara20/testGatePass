// src/services/dashboardService.js
import axios from 'axios';
export const fetchDashboardData = () => axios.get('http://localhost:5000/api/dashboard/summary');
