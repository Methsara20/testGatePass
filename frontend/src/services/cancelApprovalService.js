import axios from 'axios';
const BASE = 'http://192.168.10.144:5000/api/cancel-approval';

// Fetch approvals eligible for cancellation (Approved + Waiting)
export const fetchCancellableApprovals = (location, department) => 
  axios.get(`${BASE}/cancellable`, { params: { location, department } });

// Fetch cancelled approvals
export const fetchCancelledApprovals = (location, department) =>
  axios.get(`${BASE}/cancelled`, { params: { location, department } });

// Cancel approval
export const cancelApprovalRequest = (gate_pass_id, cancel_remark, cancelled_by) =>
  axios.put(`${BASE}/cancel`, { gate_pass_id, cancel_remark, cancelled_by });
