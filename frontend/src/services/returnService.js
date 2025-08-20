import axios from 'axios';
const BASE = 'http://192.168.10.144:5000/api/return-gatepass';

// Eligible passes
export const fetchEligibleReturnPasses = (location, department) =>
  axios.get(`${BASE}/eligible`, { params: { location, department } });

// Return requests
export const fetchReturnRequests = (location, department) =>
  axios.get(`${BASE}/list`, { params: { location, department } });

// Pending returns  
export const fetchPendingReturnRequests = (location, department) =>
  axios.get(`${BASE}/pending`, { params: { location, department } });

// All returns
export const fetchAllReturnRequests = (location, department) =>
  axios.get(`${BASE}/all`, { params: { location, department } });

// // Create return
// export const createReturnRequest = (reference_gate_pass_id, return_remark, created_by) =>
//   axios.post(`${BASE}/create`, { reference_gate_pass_id, return_remark, created_by });


// Update this in services/returnService.js
export const createReturnRequest = (data) => 
  axios.post(`${BASE}/create`, {
    reference_gate_pass_id: data.reference_gate_pass_id,
    created_by: data.created_by,
    materials: data.materials,
    return_remark: data.overall_remark 
  });

// Approve return
export const approveReturnRequest = (gate_pass_id, approved_by) =>
  axios.put(`${BASE}/${gate_pass_id}/approve-return`, { approved_by });

// Reject return  
export const rejectReturnRequest = (gate_pass_id, rejected_by, rejection_reason) =>
  axios.put(`${BASE}/${gate_pass_id}/reject-return`, { rejected_by, rejection_reason });


// Approved returns  
export const fetchApprovedReturnRequests = (location, department) =>
  axios.get(`${BASE}/return-approve`, { params: { location, department } });

// Rejected returns
export const fetchRejectedReturnRequests = (location, department) =>
  axios.get(`${BASE}/return-reject`, { params: { location, department } });



// import axios from 'axios';
// const BASE = 'http://192.168.10.144:5000/api/return-gatepass';



// // ✅ Eligible passes
// export const fetchEligibleReturnPasses = (location, department) =>
//   axios.get(`${BASE}/eligible`, { params: { location, department } });

// // ✅ All return requests (location/department scope — admin/approver use)
// export const fetchReturnRequests = (location, department) =>
//   axios.get(`${BASE}/list`, { params: { location, department } });

// export const fetchPendingReturnRequests = (location, department) =>
//   axios.get(`${BASE}/pending`, { params: { location, department } });

// export const fetchAllReturnRequests = (location, department) =>
//   axios.get(`${BASE}/all`, { params: { location, department } });

// // ✅ Create return request
// export const createReturnRequest = (reference_gate_pass_id, return_remark, created_by) =>
//   axios.post(`${BASE}/create`, { reference_gate_pass_id, return_remark, created_by });

// // ✅ Approve / Reject return
// export const approveReturnRequest = (gate_pass_id, approved_by) =>
//   axios.put(`${BASE}/${gate_pass_id}/approve-return`, { approved_by });

// export const rejectReturnRequest = (gate_pass_id, rejected_by, rejection_reason) =>
//   axios.put(`${BASE}/${gate_pass_id}/reject`, { rejected_by, rejection_reason });

// // 🔹 NEW — Fetch only the logged-in user's return requests
// export const fetchMyReturnRequests = (userId) =>
//   axios.get(`${BASE}/my`, { params: { userId } });

// export const fetchMyPendingReturnRequests = (userId) =>
//   axios.get(`${BASE}/my/pending`, { params: { userId } });

// export const fetchMyApprovedReturnRequests = (userId) =>
//   axios.get(`${BASE}/my/approved`, { params: { userId } });

// export const fetchMyRejectedReturnRequests = (userId) =>
//   axios.get(`${BASE}/my/rejected`, { params: { userId } });

// // 🔹 NEW — Get full return request details (with materials)
// export const fetchReturnRequestDetails = (gate_pass_id) =>
//   axios.get(`${BASE}/details/${gate_pass_id}`);



