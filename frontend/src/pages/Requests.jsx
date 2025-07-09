import React, { useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const GoodsRequestForm = ({ currentUser }) => {
  const [form, setForm] = useState({
    item_name: '',
    quantity: '',
    description: '',
    request_date: '',
    request_time: '',
    location: '',
    purpose: '',
    additional_notes: '',
    request_type: 'Goods',
    created_by: currentUser?.id || 1, // Replace with actual user ID logic
    status: 'Pending'
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/passes', form);
      alert('Request submitted successfully!');
      setForm({ ...form, item_name: '', quantity: '', description: '', location: '', purpose: '', additional_notes: '' });
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request');
    }
  };

  return (

    <div className='d-flex'>
      <Sidebar/>
      <div className="container p-4">
      <h4>New Gatepass Request</h4>
      <form onSubmit={handleSubmit}>
        <h6 className="mt-4">Goods Details</h6>
        <div className="mb-3">
          <label className="form-label">Item Name</label>
          <input className="form-control" name="item_name" value={form.item_name} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Quantity</label>
          <input type="number" className="form-control" name="quantity" value={form.quantity} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea className="form-control" name="description" rows="3" value={form.description} onChange={handleChange}></textarea>
        </div>

        <div className="row mb-3">
          <div className="col">
            <label className="form-label">Date</label>
            <input type="date" className="form-control" name="request_date" value={form.request_date} onChange={handleChange} required />
          </div>
          <div className="col">
            <label className="form-label">Time</label>
            <input type="time" className="form-control" name="request_time" value={form.request_time} onChange={handleChange} required />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Location</label>
          <input className="form-control" name="location" value={form.location} onChange={handleChange} required />
        </div>

        <h6 className="mt-4">Purpose & Notes</h6>
        <div className="mb-3">
          <label className="form-label">Purpose</label>
          <input className="form-control" name="purpose" value={form.purpose} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Additional Notes</label>
          <textarea className="form-control" name="additional_notes" rows="3" value={form.additional_notes} onChange={handleChange}></textarea>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary">Submit Request</button>
          <button type="button" className="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
    </div>
    
  );
};

export default GoodsRequestForm;
