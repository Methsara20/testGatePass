import React, { useEffect, useState } from 'react';
import { fetchCancellableApprovals, fetchCancelledApprovals, cancelApprovalRequest } from '../services/cancelApprovalService';
import { useAuth } from '../context/AuthContext';
import { Table, Button, InputGroup, Form, Modal, Spinner, Tabs, Tab, Badge } from 'react-bootstrap';
import { BiSearch, BiDetail, BiXCircle } from 'react-icons/bi';
import { fetchGatePassWithMaterials } from '../services/approvalService';

const CancelApproval = () => {
  const { user } = useAuth();
  const [waitingPasses, setWaitingPasses] = useState([]);
  const [cancelledPasses, setCancelledPasses] = useState([]);
  const [filteredPasses, setFilteredPasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('waiting');

  const [cancelId, setCancelId] = useState(null);
  const [cancelRemark, setCancelRemark] = useState('');
  const [detailRow, setDetailRow] = useState(null);

  // Fetch waiting approvals
  const fetchWaitingApprovals = async () => {
    if (!user?.location || !user?.department) return;
    setLoading(true);
    try {
      const res = await fetchCancellableApprovals(user.location, user.department);
      setWaitingPasses(res.data);
      setFilteredPasses(res.data);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cancelled approvals
  const fetchCancelled = async () => {
    if (!user?.location || !user?.department) return;
    try {
      const res = await fetchCancelledApprovals(user.location, user.department);
      setCancelledPasses(res.data);
    } catch (err) {
      console.error('Failed to fetch cancelled approvals:', err);
    }
  };

  useEffect(() => {
    fetchWaitingApprovals();
    fetchCancelled();
  }, [user?.location, user?.department]);

  // Filter by search term (only affects waiting tab)
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredPasses(waitingPasses);
    } else {
      const filtered = waitingPasses.filter((p) =>
        p.gate_pass_id.toString().includes(searchTerm.toLowerCase()) ||
        (p.request_type && p.request_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.destination_address && p.destination_address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPasses(filtered);
    }
  }, [searchTerm, waitingPasses]);

  // Cancel approval action
  const handleCancelApproval = async () => {
    try {
      await cancelApprovalRequest(cancelId, cancelRemark, user.id);
      fetchWaitingApprovals();
      fetchCancelled();
      setCancelId(null);
      setCancelRemark('');
    } catch (err) {
      console.error('Cancel failed:', err);
      alert('Failed to cancel approval. Try again.');
    }
  };

  // View details
  const handleViewDetails = async (id) => {
    try {
      const res = await fetchGatePassWithMaterials(id);
      setDetailRow(res.data);
    } catch (err) {
      console.error('Error fetching details:', err);
      alert('Failed to load details.');
    }
  };

  return (
    <div className="d-flex">
      
            <div className="flex-grow-1">
            
      <div className="flex-grow-1 p-4">
        <h4 className="mb-3">Manage Gate Pass Cancellations</h4>
        <p className="text-muted">View and cancel approved requests, or review cancelled history.</p>
        {/* Search */}
            <InputGroup className="mb-3">
              <InputGroup.Text><BiSearch /></InputGroup.Text>
              <Form.Control
                placeholder="Search by ID, type, or destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>Clear</Button>
              )}
            </InputGroup>

        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
          {/* Waiting Tab */}
          <Tab eventKey="waiting" title={<span>Waiting <Badge bg="secondary">{waitingPasses.length}</Badge></span>}>

            {/* Waiting Table */}
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-light">
                  <tr>
                    <th>Gate Pass ID</th>
                    <th>Request Type</th>
                    <th>Destination</th>
                    <th>Requester</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" className="text-center"><Spinner animation="border" /></td></tr>
                  ) : filteredPasses.length > 0 ? (
                    filteredPasses.map((p) => (
                      <tr key={p.gate_pass_id}>
                        <td className="fw-bold">REQ-{p.gate_pass_id}</td>
                        <td>{p.request_type}</td>
                        <td>{p.destination_address}</td>
                        <td>{p.requester_name}</td>
                        <td>{new Date(p.request_date).toLocaleDateString()}</td>
                        <td>
                          <Button variant="light" size="sm" className="me-2" onClick={() => handleViewDetails(p.gate_pass_id)}>
                            <BiDetail />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => setCancelId(p.gate_pass_id)}>
                            <BiXCircle />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="text-center text-muted">No approvals available for cancellation</td></tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Tab>

          {/* Cancelled Tab */}
          <Tab eventKey="cancelled" title={<span>Cancelled <Badge bg="danger">{cancelledPasses.length}</Badge></span>}>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-light">
                  <tr>
                    <th>Gate Pass ID</th>
                    <th>Request Type</th>
                    <th>Destination</th>
                    <th>Requester</th>
                    <th>Cancelled At</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelledPasses.length > 0 ? (
                    cancelledPasses.map((p) => (
                      <tr key={p.gate_pass_id}>
                        <td className="fw-bold">REQ-{p.gate_pass_id}</td>
                        <td>{p.request_type}</td>
                        <td>{p.destination_address}</td>
                        <td>{p.requester_name}</td>
                        <td>{new Date(p.cancelled_at).toLocaleString()}</td>
                        <td>{p.cancel_remark || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="text-center text-muted">No cancelled approvals found</td></tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Tab>
        </Tabs>
      </div>
      </div>

      {/* Cancel Modal */}
      <Modal show={!!cancelId} onHide={() => setCancelId(null)} centered>
        <Modal.Header closeButton><Modal.Title>Cancel Approval</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Reason for cancellation</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={cancelRemark}
              onChange={(e) => setCancelRemark(e.target.value)}
              placeholder="e.g., sale canceled or no longer required"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCancelId(null)}>Close</Button>
          <Button variant="danger" onClick={handleCancelApproval}>Confirm Cancel</Button>
        </Modal.Footer>
      </Modal>

      {/* Details Modal */}
      <Modal show={!!detailRow} onHide={() => setDetailRow(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Gate Pass Details - REQ-{detailRow?.gate_pass_id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailRow ? (
            <>
              <p><strong>Request Type:</strong> {detailRow.request_type}</p>
              <p><strong>Purpose:</strong> {detailRow.purpose}</p>
              <p><strong>From:</strong> {detailRow.location}</p>
              <p><strong>To:</strong> {detailRow.destination_address}</p>
              <p><strong>Date:</strong> {new Date(detailRow.request_date).toLocaleDateString()}</p>
              <p><strong>Notes:</strong> {detailRow.additional_notes || 'N/A'}</p>
            </>
          ) : (
            <p>Loading details...</p>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CancelApproval;
