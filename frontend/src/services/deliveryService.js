import axios from 'axios';
const BASE = 'http://192.168.10.144:5000/api/passes';

// Fetch deliveries with filters
// export const fetchDeliveries = (location, department) => 
//   axios.get(`${BASE}/deliveries`, { params: { location, department } });

// Fetch deliveries with filters - add status parameter
export const fetchDeliveries = (location, department, status) => 
  axios.get(`${BASE}/deliveries`, { 
    params: { 
      location, 
      department,
      delivery_status: status // Add this parameter
    } 
  });


// Accept delivery (include accepted_by)
export const acceptDelivery = (id, accepted_by) => 
  axios.put(`${BASE}/${id}/accept`, { accepted_by }); 

// Reject delivery with comment and rejected_by
export const rejectDelivery = (id, comment, accepted_by) => 
  axios.put(`${BASE}/${id}/issue`, { comment, accepted_by });

