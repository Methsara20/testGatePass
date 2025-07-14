// src/pages/GoodsRequestForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const GoodsRequestForm = () => {
  const { user } = useAuth();          
  const navigate = useNavigate();      
  

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
    status: 'Pending'
  });

  /* handle form field edits */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* submit */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please log in first.');
      return;
    }

    try {
      const payload = { ...form, created_by: user.id };

      await axios.post('http://localhost:5000/api/passes', payload);
      alert('Request submitted successfully!');
      navigate('/my-requests');         
    } catch (err) {
      console.error('Submit error', err);
      alert('Failed to submit request');
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="container p-4 flex-grow-1">
        <h4>New Gate-Pass Request</h4>

        <form onSubmit={handleSubmit}>
          {/* Goods details */}
          <h6 className="mt-4">Goods Details</h6>

          <div className="mb-3">
            <label className="form-label">Item Name</label>
            <input
              name="item_name"
              className="form-control"
              value={form.item_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              name="quantity"
              className="form-control"
              value={form.quantity}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              rows="3"
              className="form-control"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          {/* Date & time */}
          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Date</label>
              <input
                type="date"
                name="request_date"
                className="form-control"
                value={form.request_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col">
              <label className="form-label">Time</label>
              <input
                type="time"
                name="request_time"
                className="form-control"
                value={form.request_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="mb-3">
            <label className="form-label">Location</label>
            <input
              name="location"
              className="form-control"
              value={form.location}
              onChange={handleChange}
              required
            />
          </div>

          {/* Purpose & notes */}
          <h6 className="mt-4">Purpose & Notes</h6>

          <div className="mb-3">
            <label className="form-label">Purpose</label>
            <input
              name="purpose"
              className="form-control"
              value={form.purpose}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Additional Notes</label>
            <textarea
              name="additional_notes"
              rows="3"
              className="form-control"
              value={form.additional_notes}
              onChange={handleChange}
            />
          </div>

          {/* Buttons */}
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary">
              Submit Request
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/my-requests')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoodsRequestForm;
