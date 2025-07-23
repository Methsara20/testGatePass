import React, { useEffect, useState } from 'react';
import { fetchMyRequests } from '../services/gatepassService';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Modal, Button, Table, InputGroup, Form } from 'react-bootstrap';
import { BiSearch } from "react-icons/bi";

const MyRequests = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('Pending');
  const [lists, setLists] = useState({ Pending: [], Approved: [], Rejected: [] });
  const [detailRow, setDetailRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPasses, setFilteredPasses] = useState([]);

  useEffect(() => {
    if (user) {
      fetchMyRequests(user.id)
        .then(res => {
          setLists(res.data);
          setFilteredPasses(res.data[tab] || []);
        })
        .catch(err => console.error('MyRequests load', err));
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredPasses(lists[tab] || []);
    } else {
      const filtered = (lists[tab] || []).filter(
        (p) =>
          p.gate_pass_id.toString().includes(searchTerm.toLowerCase()) ||
          (p.description &&
            p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.location &&
            p.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPasses(filtered);
    }
  }, [searchTerm, lists, tab]);

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

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="p-4 flex-grow-1 w-100">
        <h4 className="mb-3">My Gate-Pass Requests</h4>

        {/* Improved Search Input */}
        <div className="mb-3">
          <InputGroup>
            <InputGroup.Text>
              <BiSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="outline-secondary"
                onClick={() => setSearchTerm("")}
              >
                Clear
              </Button>
            )}
          </InputGroup>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-3">
          {['Pending', 'Approved', 'Rejected'].map(t => (
            <li className="nav-item" key={t}>
              <button
                className={`nav-link ${tab === t ? 'active' : ''}`}
                onClick={() => {
                  setTab(t);
                  setFilteredPasses(lists[t] || []);
                }}
              >
                {t}
                <span className="badge bg-light text-dark ms-1">
                  {lists[t]?.length ?? 0}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Table */}
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="table-light">
              <tr>
                <th>ID</th><th>Type</th><th>Status</th><th>Date</th><th>Location</th><th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredPasses.map(r => <Row key={r.gate_pass_id} r={r} />)}
              {filteredPasses.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">No records</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Details modal */}
      <Modal show={!!detailRow} onHide={() => setDetailRow(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Request Details - REQ-{detailRow?.gate_pass_id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailRow && (
            <div className="container-fluid">
              <div className="row g-3 mb-3">
                <div className="col-md-6"><strong>Status:</strong> {detailRow.status}</div>
                <div className="col-md-6"><strong>Type:</strong> {detailRow.request_type}</div>
                <div className="col-md-6"><strong>Date:</strong> {detailRow.request_date}</div>
                <div className="col-md-6"><strong>Time:</strong> {detailRow.request_time}</div>
              </div>
              
              <div className="row g-3 mb-3">
                <div className="col-md-6"><strong>From Location:</strong> {detailRow.location}</div>
                <div className="col-md-6"><strong>Destination:</strong> {detailRow.destination_address}</div>
              </div>

              <div className="mb-3">
                <h6>Item Details</h6>
                <Table striped bordered size="sm">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Description</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{detailRow.item_name}</td>
                      <td>{detailRow.description}</td>
                      <td>{detailRow.quantity}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              <div className="mb-3">
                <h6>Purpose</h6>
                <p>{detailRow.purpose}</p>
              </div>

              {detailRow.additional_notes && (
                <div className="mb-3">
                  <h6>Additional Notes</h6>
                  <p>{detailRow.additional_notes}</p>
                </div>
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