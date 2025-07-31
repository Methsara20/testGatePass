import axios from 'axios';

const API_URL = 'http://localhost:5000/api/reports';

// Gate Pass Summary
export const getGatePassSummary = (filters) => {
  return axios.get(`${API_URL}/gatepass-summary`, { params: filters });
};
export const exportGatePassSummary = (filters) => {
  return axios.get(`${API_URL}/export/gatepass-summary`, {
    params: filters,
    responseType: 'blob'
  });
};

// Overdue Materials
export const getOverdueMaterials = (filters) => {
  return axios.get(`${API_URL}/overdue-materials`, { params: filters });
};
export const exportOverdueMaterials = (filters) => {
  return axios.get(`${API_URL}/export/overdue-materials`, {
    params: filters,
    responseType: 'blob'
  });
};

// Approved vs Rejected
export const getApprovedVsRejected = (filters) => {
  return axios.get(`${API_URL}/approved-vs-rejected`, { params: filters });
};
export const exportApprovedVsRejected = (filters) => {
  return axios.get(`${API_URL}/export/approved-vs-rejected`, {
    params: filters,
    responseType: 'blob'
  });
};

// Audit Log
// export const getAuditLog = (filters) => {
//   return axios.get(`${API_URL}/audit-log`, { params: filters });
// };
// export const exportAuditLog = (filters) => {
//   return axios.get(`${API_URL}/export/audit-log`, {
//     params: filters,
//     responseType: 'blob'
//   });
// };

// Material Movement
export const getMaterialMovement = (filters) => {
  return axios.get(`${API_URL}/material-movement`, { params: filters });
};
export const exportMaterialMovement = (filters) => {
  return axios.get(`${API_URL}/export/material-movement`, {
    params: filters,
    responseType: 'blob'
  });
};

// Acceptance Report
export const getAcceptanceReport = (filters) => {
  return axios.get(`${API_URL}/acceptance-report`, { params: filters });
};
export const exportAcceptanceReport = (filters) => {
  return axios.get(`${API_URL}/export/acceptance-report`, {
    params: filters,
    responseType: 'blob'
  });
};
