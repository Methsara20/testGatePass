import React, { useEffect, useState } from 'react';
import { 
  Table, Button, Modal, Form, Spinner, Badge, InputGroup, Row, Col 
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { 
  fetchEligibleReturnPasses, 
  createReturnRequest, 
  fetchReturnRequests,
  fetchAllReturnRequests,
  fetchApprovedReturnRequests,
  fetchRejectedReturnRequests
} from '../services/returnService';
import { fetchGatePassWithMaterials } from '../services/approvalService';
import { BiSearch, BiRefresh } from 'react-icons/bi';
import { toast } from 'react-toastify';
import 'bootstrap-icons/font/bootstrap-icons.css';


const ReturnProcess = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('eligible');
  const [lists, setLists] = useState({
    eligible: [],
    pending: [],
    approved: [],
    rejected: [],
    all: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPasses, setFilteredPasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedPass, setSelectedPass] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [originalMaterials, setOriginalMaterials] = useState([]);
  const [itemRemarks, setItemRemarks] = useState({});
  const [overallRemark, setOverallRemark] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Transport details state
  const [transportDetails, setTransportDetails] = useState({
    transport_mode: '',
    vehicle_no: '',
    driver_name: '',
    driver_contact: ''
  });

  // Load all return-related data
  const loadData = async () => {
    if (!user?.location || !user?.department) return;
    setLoading(true);
    try {
      const [
        eligibleRes, 
        pendingRes, 
        approvedRes, 
        rejectedRes, 
        allRes
      ] = await Promise.all([
        fetchEligibleReturnPasses(user.location, user.department),
        fetchReturnRequests(user.location, user.department),
        fetchApprovedReturnRequests(user.location, user.department),
        fetchRejectedReturnRequests(user.location, user.department),
        fetchAllReturnRequests(user.location, user.department)
      ]);

      const newLists = {
        eligible: eligibleRes.data || [],
        pending: pendingRes.data || [],
        approved: approvedRes.data || [],
        rejected: rejectedRes.data || [],
        all: allRes.data || []
      };
      
      setLists(newLists);
      setFilteredPasses(newLists[activeTab] || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadData(); 
  }, [user]);

  // Search filter
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredPasses(lists[activeTab] || []);
    } else {
      const filtered = (lists[activeTab] || []).filter(
        (p) =>
          p.gate_pass_id.toString().includes(searchTerm.toLowerCase()) ||
          (p.requester_name && p.requester_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.department && p.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPasses(filtered);
    }
  }, [searchTerm, lists, activeTab]);

  // View details handler
  const handleViewDetails = async (id) => {
    try {
      setDetailsLoading(true);
      const response = await fetchGatePassWithMaterials(id);
      const passData = response.data;

      setDetailRow(passData);
      setOriginalMaterials(passData.materials || []);

      // Prepare remarks state
      const remarksInit = {};
      (passData.materials || []).forEach(m => {
        remarksInit[m.material_id] = m.return_remark || '';
      });
      setItemRemarks(remarksInit);

      // Pre-fill transport details from original gate pass
      setTransportDetails({
        transport_mode: passData.transport_mode || '',
        vehicle_no: passData.vehicle_no || '',
        driver_name: passData.driver_name || '',
        driver_contact: passData.driver_contact || ''
      });

    } catch (error) {
      console.error("Error fetching gate pass details:", error);
      toast.error("Failed to load gate pass details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleItemRemarkChange = (materialId, value) => {
    setItemRemarks(prev => ({
      ...prev,
      [materialId]: value
    }));
  };

  const handleTransportChange = (field, value) => {
    setTransportDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStartReturn = async () => {
    // Validate at least one remark exists
    const hasItemRemarks = Object.values(itemRemarks).some(remark => remark.trim());
    if (!overallRemark.trim() && !hasItemRemarks) {
      toast.error('Please add at least one return remark (overall or item-specific)');
      return;
    }

    // Validate transport details if transport mode is not 'None'
    if (transportDetails.transport_mode && 
        transportDetails.transport_mode !== 'None' && 
        transportDetails.transport_mode !== '') {
      if (!transportDetails.vehicle_no.trim() || !transportDetails.driver_name.trim()) {
        toast.error('Vehicle number and driver name are required when transport mode is specified');
        return;
      }
    }
  
    try {
      setLoading(true);
      
      // Prepare materials array in format backend expects
      const materialsForBackend = originalMaterials.map(mat => ({
        description: mat.description,
        serial_number: mat.serial_number,
        qty: mat.qty,
        uom: mat.uom,
        returnable: mat.returnable,
        return_date: mat.return_date,
        return_remark: itemRemarks[mat.material_id] || null
      }));
  
      // Prepare request data matching backend expectations
      const requestData = {
        reference_gate_pass_id: selectedPass.gate_pass_id,
        created_by: user.id,
        materials: materialsForBackend,
        return_remark: overallRemark.trim() || null,
        transport_mode: transportDetails.transport_mode || null,
        vehicle_no: transportDetails.vehicle_no.trim() || null,
        driver_name: transportDetails.driver_name.trim() || null,
        driver_contact: transportDetails.driver_contact.trim() || null
      };
  
      await createReturnRequest(requestData);
      
      toast.success('Return request submitted successfully!');
      
      // Reset form
      setItemRemarks({});
      setOverallRemark('');
      setTransportDetails({
        transport_mode: '',
        vehicle_no: '',
        driver_name: '',
        driver_contact: ''
      });
      setSelectedPass(null);
      setActiveTab('pending');
      await loadData();
    } catch (err) {
      console.error('Return submission failed:', err);
      toast.error(err.response?.data?.error || 'Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'Pending': return <Badge bg="warning">Pending</Badge>;
      case 'Approved': return <Badge bg="success">Approved</Badge>;
      case 'Rejected': return <Badge bg="danger">Rejected</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const RowComponent = ({ r, tab }) => (
    <tr>
      <td className="fw-bold">
        {tab === 'eligible' ? `REQ-${r.gate_pass_id}` : `RET-${r.gate_pass_id}`}
      </td>
      <td>{r.requester_name || r.created_by}</td>
      <td>{r.department}</td>
      <td>{r.return_remark || '-'}</td>
      <td><StatusBadge status={r.return_status || r.status} /></td>
      <td>{formatDate(r.request_date || r.created_at)}</td>
      <td>
        <i className="bi bi-eye text-primary me-3 cursor-pointer" onClick={() => handleViewDetails(r.gate_pass_id)}></i> 
        {tab === 'eligible' && (
          <i 
            className="bi bi-arrow-return-left text-success cursor-pointer" 
            onClick={() => {
              setSelectedPass(r);
              handleViewDetails(r.gate_pass_id);
            }}
          ></i>
        )}
      </td>
    </tr>
  );

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="d-flex">
      
            <div className="flex-grow-1">
        
      <div className="p-4 flex-grow-1 w-100">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="mb-1">Returnable Gate Passes</h4>
            <p className="text-muted">Manage returnable gate pass requests</p>
          </div>
          <Button variant="outline-primary" onClick={loadData} disabled={loading}>
            <BiRefresh className={`me-1 ${loading ? 'spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="mb-3">
          <InputGroup>
            <InputGroup.Text><BiSearch /></InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by ID, requester, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button variant="outline-secondary" onClick={() => setSearchTerm("")}>
                Clear
              </Button>
            )}
          </InputGroup>
        </div>

        <ul className="nav nav-tabs mb-3">
          {[
            { key: 'eligible', label: 'Eligible' },
            { key: 'pending', label: 'Pending Approval' },
            { key: 'approved', label: 'Approved Returns' }
          ].map((t) => (
            <li className="nav-item" key={t.key}>
              <button
                className={`nav-link ${activeTab === t.key ? "active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                <span className="badge bg-light text-dark ms-1">
                  {lists[t.key]?.length ?? 0}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="table-responsive">
          <Table striped bordered hover className="align-middle">
            <thead className="table-light">
              <tr>
                <th>Gate Pass No</th>
                <th>Requester</th>
                <th>Department</th>
                <th>Remark</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : filteredPasses.length > 0 ? (
                filteredPasses.map((r) => (
                  <RowComponent r={r} key={r.gate_pass_id} tab={activeTab} />
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Return Request Modal */}
        <Modal show={!!selectedPass} onHide={() => setSelectedPass(null)} centered size="xl">
          <Modal.Header closeButton>
            <Modal.Title>Start Return - REQ-{selectedPass?.gate_pass_id}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Overall Return Remark */}
            <Form.Group className="mb-4">
              <Form.Label>Overall Return Remark</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Enter overall return remark..."
                value={overallRemark}
                onChange={(e) => setOverallRemark(e.target.value)}
              />
            </Form.Group>

            {/* Transport Details Section */}
            <div className="mb-4">
              <h5>Transport Details</h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Transport Mode</Form.Label>
                    <Form.Select
                      value={transportDetails.transport_mode}
                      onChange={(e) => handleTransportChange('transport_mode', e.target.value)}
                    >
                      <option value="">Select Transport Mode</option>
                      <option value="Company Vehicle">Company Vehicle</option>
                      <option value="Personal Vehicle">Personal Vehicle</option>
                      <option value="Courier">Courier</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vehicle Number</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter vehicle number"
                      value={transportDetails.vehicle_no}
                      onChange={(e) => handleTransportChange('vehicle_no', e.target.value)}
                      disabled={transportDetails.transport_mode === 'None' || transportDetails.transport_mode === 'Walking' || transportDetails.transport_mode === ''}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Driver Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter driver name"
                      value={transportDetails.driver_name}
                      onChange={(e) => handleTransportChange('driver_name', e.target.value)}
                      disabled={transportDetails.transport_mode === 'None' || transportDetails.transport_mode === 'Walking' || transportDetails.transport_mode === ''}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Driver Contact</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter driver contact number"
                      value={transportDetails.driver_contact}
                      onChange={(e) => handleTransportChange('driver_contact', e.target.value)}
                      disabled={transportDetails.transport_mode === 'None' || transportDetails.transport_mode === 'Walking' || transportDetails.transport_mode === ''}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Item-wise Return Remarks */}
            <h5>Item-wise Return Remarks</h5>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Serial Number</th>
                    <th>Qty</th>
                    <th>UOM</th>
                    <th>Return Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {originalMaterials.length > 0 ? (
                    originalMaterials.map((material) => (
                      <tr key={material.material_id}>
                        <td>{material.description}</td>
                        <td>{material.serial_number || '-'}</td>
                        <td>{material.qty}</td>
                        <td>{material.uom}</td>
                        <td>
                            <Form.Control
                              type="text"
                              placeholder="Misplaced / Lost, Damaged, Incorrect Item Delivered, Not Required Anymore, Wrong Quantity Supplied"
                              value={itemRemarks[material.material_id] || ''}
                              onChange={(e) => handleItemRemarkChange(material.material_id, e.target.value)}
                              style={{ 
                              fontSize: '0.775rem',
                              minWidth: '300px',  
                              padding: '8px 12px' 
                              }}
                            />
                          </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">No materials found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedPass(null)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={handleStartReturn}
              disabled={loading || (!overallRemark.trim() && Object.values(itemRemarks).every(val => !val.trim()))}
            >
              {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
              Submit Return
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Details Modal */}
        <Modal
          show={!!detailRow}
          onHide={() => setDetailRow(null)}
          centered
          size="xl"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Return Gate Pass Details - {detailRow?.is_return ? 'RET' : 'REQ'}-{detailRow?.gate_pass_id}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {detailsLoading ? (
              <div className="text-center py-4">
                <Spinner animation="border" />
              </div>
            ) : (
              <div className="container-fluid">
                <div className="row mb-4">
                  <div className="col-md-4">
                    <h6>Basic Information</h6>
                    <p><strong>Status:</strong> {detailRow?.return_status || detailRow?.status}</p>
                    <p><strong>Date:</strong> {formatDate(detailRow?.request_date)}</p>
                    <p><strong>Location:</strong> {detailRow?.location}</p>
                    <p><strong>Department:</strong> {detailRow?.department}</p>
                  </div>
                  <div className="col-md-4">
                    <h6>Requester Details</h6>
                    <p><strong>Name:</strong> {detailRow?.requester_name}</p>
                    <p><strong>Department:</strong> {detailRow?.department}</p>
                    <p><strong>Location:</strong> {detailRow?.location}</p>
                  </div>
                  <div className="col-md-4">
                    <h6>Destination Details</h6>
                    <p><strong>Destination:</strong> {detailRow?.destination_address}</p>
                    <p><strong>Vehicle No:</strong> {detailRow?.vehicle_no || 'N/A'}</p>
                    <p><strong>Driver:</strong> {detailRow?.driver_name || 'N/A'}</p>
                  </div>
                </div>

                {/* Transport Details Section in Details Modal */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h6>Transport Details</h6>
                    <div className="row">
                      <div className="col-md-3">
                        <p><strong>Transport Mode:</strong> {detailRow?.transport_mode || 'N/A'}</p>
                      </div>
                      <div className="col-md-3">
                        <p><strong>Vehicle No:</strong> {detailRow?.vehicle_no || 'N/A'}</p>
                      </div>
                      <div className="col-md-3">
                        <p><strong>Driver Name:</strong> {detailRow?.driver_name || 'N/A'}</p>
                      </div>
                      <div className="col-md-3">
                        <p><strong>Driver Contact:</strong> {detailRow?.driver_contact || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-12">
                    <h6>Material Details</h6>
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Serial Number</th>
                            <th>Quantity</th>
                            <th>UOM</th>
                            <th>Returnable</th>
                            <th>Return Date</th>
                            <th>Return Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {originalMaterials.length > 0 ? (
                            originalMaterials.map((material) => (
                              <tr key={material.material_id}>
                                <td>{material.description}</td>
                                <td>{material.serial_number || '-'}</td>
                                <td>{material.qty}</td>
                                <td>{material.uom}</td>
                                <td>{material.returnable ? 'Yes' : 'No'}</td>
                                <td>{material.return_date || '-'}</td>
                                <td>{itemRemarks[material.material_id] || material.return_remark || '-'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="7" className="text-center">
                                No materials listed
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setDetailRow(null)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
    </div>
  );
};

export default ReturnProcess;