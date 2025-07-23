import React, { useEffect, useState } from 'react';
import { fetchMyRequests } from '../services/gatepassService';
import { fetchGatePassWithMaterials } from '../services/approvalService'; // Add this import
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

  const handleViewDetails = async (id) => {
    try {
      const res = await fetchGatePassWithMaterials(id);
      setDetailRow(res.data);
    } catch (error) {
      console.error("Error fetching gate pass details:", error);
    }
  };

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
          onClick={() => handleViewDetails(r.gate_pass_id)} // Updated to use the new handler
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

      {/* Enhanced Details modal */}
      <Modal show={!!detailRow} onHide={() => setDetailRow(null)} centered size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Request Details - REQ-{detailRow?.gate_pass_id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailRow && (
            <div className="container-fluid">
              <div className="row mb-4">
                <div className="col-md-4">
                  <h6>Basic Information</h6>
                  <p><strong>Request Type:</strong> {detailRow.request_type}</p>
                  <p><strong>Status:</strong> {detailRow.status}</p>
                  <p><strong>Date:</strong> {detailRow.request_date}</p>
                  <p><strong>Time:</strong> {detailRow.request_time}</p>
                </div>
                <div className="col-md-4">
                  <h6>Requester Details</h6>
                  <p><strong>Name:</strong> {detailRow.full_name || detailRow.created_by}</p>
                  <p><strong>Department:</strong> {detailRow.role || 'N/A'}</p>
                  <p><strong>Email:</strong> {detailRow.email || 'N/A'}</p>
                </div>
                <div className="col-md-4">
                  <h6>Location Details</h6>
                  <p><strong>From Location:</strong> {detailRow.from_location || detailRow.location}</p>
                  <p><strong>Destination:</strong> {detailRow.destination_address}</p>
                  {detailRow.receiver_name && (
                    <p><strong>Receiver Name:</strong> {detailRow.receiver_name}</p>
                  )}
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h6>Purpose & Notes</h6>
                  <p><strong>Purpose:</strong></p>
                  <p className="mb-3">{detailRow.purpose}</p>
                  {detailRow.additional_notes && (
                    <>
                      <p><strong>Additional Notes:</strong></p>
                      <p>{detailRow.additional_notes}</p>
                    </>
                  )}
                </div>
                <div className="col-md-6">
                  <h6>Transport Details</h6>
                  <p><strong>Transport Mode:</strong> {detailRow.transport_mode || 'N/A'}</p>
                  <p><strong>Vehicle Number:</strong> {detailRow.vehicle_number || detailRow.vehicle_no || 'N/A'}</p>
                  <p><strong>Driver Name:</strong> {detailRow.driver_name || 'N/A'}</p>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-12">
                  <h6>Material Details</h6>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Serial Number</th>
                        <th>Quantity</th>
                        <th>UOM</th>
                        <th>Returnable</th>
                        <th>Return Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRow.materials && typeof detailRow.materials === 'string' ? (
                        JSON.parse(detailRow.materials).map((material, index) => (
                          <tr key={index}>
                            <td>{material.description}</td>
                            <td>{material.serialNumber || material.serial_number || 'N/A'}</td>
                            <td>{material.quantity || material.qty}</td>
                            <td>{material.uom}</td>
                            <td>{material.isReturnable ? 'Yes' : material.returnable ? 'Yes' : 'No'}</td>
                            <td>{material.returnDate || material.return_date || 'N/A'}</td>
                          </tr>
                        ))
                      ) : detailRow.materials ? (
                        detailRow.materials.map((material, index) => (
                          <tr key={index}>
                            <td>{material.description || material.item_name}</td>
                            <td>{material.serialNumber || material.serial_number || 'N/A'}</td>
                            <td>{material.quantity || material.qty}</td>
                            <td>{material.uom}</td>
                            <td>{material.isReturnable ? 'Yes' : material.returnable ? 'Yes' : 'No'}</td>
                            <td>{material.returnDate || material.return_date || 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">No materials listed</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>

              <div className="row">
                <div className="col-12">
                  <h6>Remarks</h6>
                  <p>{detailRow.remarks || 'No remarks provided'}</p>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDetailRow(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyRequests;