// src/pages/MyRequests.jsx
import React, { useEffect, useState } from 'react';
import { fetchMyRequests } from '../services/gatepassService';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Modal, Button } from 'react-bootstrap';           // ✅ import

const MyRequests = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('Pending');
  const [lists, setLists] = useState({ Pending: [], Approved: [], Rejected: [] });
  const [detailRow, setDetailRow] = useState(null);

  useEffect(() => {
    if (user) {
      fetchMyRequests(user.id)
        .then(res => setLists(res.data))
        .catch(err => console.error('MyRequests load', err));
    }
  }, [user]);

  const Row = ({ r }) => (
    <tr>
      <td className="fw-bold">{`REQ-${r.gate_pass_id}`}</td>
      <td>{r.request_type}</td>
      <td>
        <span className={`badge ${
          r.status === 'Approved'
            ? 'bg-success'
            : r.status === 'Rejected'
              ? 'bg-danger'
              : 'bg-warning'
        }`}>{r.status}</span>
      </td>
      <td>{r.request_date}</td>
      <td>{r.location}</td>
      <td>
        <i
          className="bi bi-eye text-primary cursor-pointer"
          onClick={() => setDetailRow(r)}
        />
      </td>
    </tr>
  );

  const list = lists[tab] || [];

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="p-4 flex-grow-1 w-100">
        <h4 className="mb-3">My Gate-Pass Requests</h4>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-3">
          {['Pending', 'Approved', 'Rejected'].map(t => (
            <li className="nav-item" key={t}>
              <button
                className={`nav-link ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
                <span className="badge bg-light text-dark ms-1">
                  {lists[t]?.length ?? 0}               {/* ✅ correct count */}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Table */}
        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th><th>Type</th><th>Status</th><th>Date</th><th>Location</th><th>Details</th>
              </tr>
            </thead>
            <tbody>
              {list.map(r => <Row key={r.gate_pass_id} r={r} />)}
              {list.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">No records</td>  {/* ✅ span 6 */}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details modal */}
      <Modal show={!!detailRow} onHide={() => setDetailRow(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Request Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailRow && (
            <div className="row g-3">
              <div className="col-md-6"><strong>ID:</strong> REQ-{detailRow.gate_pass_id}</div>
              <div className="col-md-6"><strong>Status:</strong> {detailRow.status}</div>
              <div className="col-md-6"><strong>Type:</strong> {detailRow.request_type}</div>
              <div className="col-md-6"><strong>Date:</strong> {detailRow.request_date}</div>
              <div className="col-md-6"><strong>Time:</strong> {detailRow.request_time}</div>
              <div className="col-md-6"><strong>Quantity:</strong> {detailRow.quantity}</div>
              <div className="col-12"><strong>Item Name:</strong> {detailRow.item_name}</div>
              <div className="col-12"><strong>Description:</strong><p className="mb-0">{detailRow.description}</p></div>
              <div className="col-12"><strong>Purpose:</strong><p className="mb-0">{detailRow.purpose}</p></div>
              {detailRow.additional_notes && (
                <div className="col-12"><strong>Notes:</strong><p className="mb-0">{detailRow.additional_notes}</p></div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDetailRow(null)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyRequests;
