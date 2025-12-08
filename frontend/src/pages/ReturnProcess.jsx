import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Table, Button, Modal, Form, Spinner, Badge, InputGroup, Row, Col, Alert, Dropdown, Pagination
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
import { BiSearch } from "react-icons/bi";
import { toast } from 'react-toastify';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { CheckCircleFill, XCircleFill, ThreeDotsVertical, EyeFill, ArrowReturnLeft } from "react-bootstrap-icons";

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
  const [banner, setBanner] = useState({ show: false, message: '', type: 'success' });
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'gate_pass_id', direction: 'ascending' });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Transport details state
  const [transportDetails, setTransportDetails] = useState({
    transport_mode: '',
    vehicle_no: '',
    driver_name: '',
    driver_contact: ''
  });
  
  // Tab configuration constants
  const TABS = [
    { id: 'eligible', label: 'Eligible' },
    { id: 'pending', label: 'Pending Approval' },
    { id: 'approved', label: 'Approved Returns' },
    { id: 'rejected', label: 'Rejected Returns' },
    { id: 'all', label: 'All Returns' }
  ];
  
  // Load all return-related data
  const loadData = useCallback(async () => {
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
      setBanner({ show: true, message: 'Failed to load data. Please try again.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [user?.location, user?.department, activeTab]);
  
  useEffect(() => { 
    loadData(); 
  }, [loadData]);
  
  // Auto-close banner after 5 seconds
  useEffect(() => {
    let timer;
    if (banner.show) {
      timer = setTimeout(() => {
        setBanner({ ...banner, show: false });
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [banner.show]);
  
  // Search and sort filter
  const memoizedFilteredPasses = useMemo(() => {
    let result = lists[activeTab] || [];
    
    // Apply search term
    if (searchTerm !== "") {
      result = result.filter(
        (p) =>
          p.gate_pass_id.toString().includes(searchTerm.toLowerCase()) ||
          (p.requester_name && p.requester_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.department && p.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle date sorting
        if (sortConfig.key === 'request_date' || sortConfig.key === 'created_at') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
        // Handle status sorting
        if (sortConfig.key === 'status' || sortConfig.key === 'return_status') {
          const statusOrder = { 'Approved': 1, 'Rejected': 2, 'Pending': 3 };
          aValue = statusOrder[aValue] || 4;
          bValue = statusOrder[bValue] || 4;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  }, [searchTerm, lists, activeTab, sortConfig]);
  
  useEffect(() => {
    setFilteredPasses(memoizedFilteredPasses);
    setCurrentPage(1); // Reset to first page when filters change
  }, [memoizedFilteredPasses]);
  
  // Export to CSV function
  const exportToCSV = () => {
    const headers = ["Gate Pass ID", "Requester", "Department", "Remark", "Status", "Date"];
    const csvContent = [
      headers.join(","),
      ...filteredPasses.map(pass => 
        [
          `${activeTab === 'eligible' ? 'REQ' : 'RET'}-${pass.gate_pass_id}`,
          pass.requester_name || pass.created_by,
          pass.department,
          pass.return_remark || '-',
          pass.return_status || pass.status,
          pass.request_date || pass.created_at
        ].join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `return-process-${activeTab}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Sorting function
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPasses = filteredPasses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPasses.length / itemsPerPage);
  
  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // View details handler
  const handleViewDetails = useCallback(async (id, isReturn = false) => {
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
  }, []);
  
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
  
  const handleStartReturn = useCallback(async () => {
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
        return_remark: overallRemark ? overallRemark.trim() : null,
        transport_mode: transportDetails.transport_mode || null,
        vehicle_no: transportDetails.vehicle_no ? String(transportDetails.vehicle_no).trim() : null,
        driver_name: transportDetails.driver_name ? String(transportDetails.driver_name).trim() : null,
        driver_contact: transportDetails.driver_contact ? String(transportDetails.driver_contact).trim() : null,
      };
      
      await createReturnRequest(requestData);
      
      setBanner({ show: true, message: 'Return request submitted successfully!', type: 'success' });
      
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
      setBanner({ show: true, message: err.response?.data?.error || 'Failed to submit return request', type: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [selectedPass, user, originalMaterials, itemRemarks, overallRemark, transportDetails, loadData]);
  
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);
  
  const StatusBadge = useCallback(({ status }) => {
    switch(status) {
      case 'Pending': return <Badge bg="warning">Pending</Badge>;
      case 'Approved': return <Badge bg="success">Approved</Badge>;
      case 'Rejected': return <Badge bg="danger">Rejected</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  }, []);
  
  const RowComponent = useCallback(({ r, tab }) => (
    <tr className="align-middle transition-hover">
      <td className="fw-bold">
        <div className="d-flex align-items-center">
          <span className={`badge ${tab === 'eligible' ? 'bg-primary bg-opacity-10' : 'bg-purple bg-opacity-10'} me-2`} 
                style={tab === 'eligible' ? { color: '#0d6efd' } : { color: '#6f42c1' }}>
            {tab === 'eligible' ? 'REQ' : 'RET'}
          </span>
          {r.gate_pass_id}
        </div>
      </td>
      <td>{r.requester_name || r.created_by}</td>
      <td>{r.department}</td>
      <td>{r.return_remark || '-'}</td>
      <td><StatusBadge status={r.return_status || r.status} /></td>
      <td>{formatDate(r.request_date || r.created_at)}</td>
      <td className="text-center">
        {/* Desktop Actions */}
        <div className="d-none d-md-flex justify-content-center">
          <Button 
            variant="light" 
            className="rounded-circle me-1 p-2 action-btn"
            onClick={() => handleViewDetails(r.gate_pass_id)}
            title="View details"
          >
            <EyeFill className="text-primary" />
          </Button>
          {tab === 'eligible' && (
            <Button 
              variant="light" 
              className="rounded-circle p-2 action-btn text-success"
              onClick={() => {
                setSelectedPass(r);
                handleViewDetails(r.gate_pass_id);
              }}
              title="Start Return"
            >
              <ArrowReturnLeft />
            </Button>
          )}
        </div>
        
        {/* Mobile Actions */}
        <div className="d-md-none d-flex justify-content-center">
          <Dropdown>
            <Dropdown.Toggle variant="light" size="sm" className="action-btn">
              <ThreeDotsVertical />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleViewDetails(r.gate_pass_id)}>
                <EyeFill className="me-2" /> View Details
              </Dropdown.Item>
              {tab === 'eligible' && (
                <Dropdown.Item onClick={() => {
                  setSelectedPass(r);
                  handleViewDetails(r.gate_pass_id);
                }}>
                  <ArrowReturnLeft className="me-2 text-success" /> Start Return
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </td>
    </tr>
  ), [handleViewDetails, StatusBadge, formatDate]);
  
  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }
  
  return (
    <div className="d-flex">
      {/* Main Content Area */}
      <div className="flex-grow-1">
        <div className="p-1 flex-grow-0 w-100">
          {/* Banner Notification */}
          {banner.show && (
            <Alert 
              variant={banner.type} 
              className="mb-3 d-flex align-items-center justify-content-between"
            >
              <div className="d-flex align-items-center">
                {banner.type === 'success' ? (
                  <CheckCircleFill className="me-2" />
                ) : (
                  <XCircleFill className="me-2" />
                )}
                {banner.message}
              </div>
              <Button 
                variant={banner.type}
                size="sm" 
                onClick={() => setBanner({ ...banner, show: false })}
                className="text-white border-white"
              >
                Dismiss
              </Button>
            </Alert>
          )}
          
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h3 className="mb-2 fw-bold">Gate Pass Returns </h3>
              <p className="text-muted mb-1">Manage returnable gate pass requests</p>
            </div>
            <div className="d-flex">
              <InputGroup style={{ width: "320px" }} className="me-3 shadow-sm">
                <InputGroup.Text className="bg-white border-end-0">
                  <BiSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by ID, requester, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0 border-end-0"
                />
                {searchTerm && (
                  <Button
                    variant="light"
                    onClick={() => setSearchTerm("")}
                    className="border-start-0"
                  >
                    <XCircleFill />
                  </Button>
                )}
              </InputGroup>
              <Button 
                variant="outline-secondary" 
                className="me-2"
                onClick={exportToCSV}
              >
                Export CSV
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={loadData} 
                disabled={loading}
              >
                {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Refresh'}
              </Button>
            </div>
          </div>
          
          {/* Modern Tabs */}
          <div className="mb-3">
            <div className="d-flex flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`tab-button ${activeTab === t.id ? "active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                  <span className="badge bg-light text-dark ms-2">
                    {lists[t.id]?.length ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-3 shadow-sm p-1">
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
              <h5 className="mb-0 fw-semibold">
                {activeTab === 'eligible' ? 'Eligible for Return' : 
                 activeTab === 'pending' ? 'Pending Approval' :
                 activeTab === 'approved' ? 'Approved Returns' :
                 activeTab === 'rejected' ? 'Rejected Returns' : 'All Returns'}
                <span className="badge bg-secondary rounded-pill ms-2">{filteredPasses.length}</span>
              </h5>
            </div>
            
            {/* Loading Spinner */}
            {loading && (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading return data...</p>
              </div>
            )}
            
            {/* Modern Table */}
            {!loading && (
              <>
                <div className="table-responsive">
                  <Table hover responsive className="align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th 
                          onClick={() => requestSort('gate_pass_id')}
                          style={{ cursor: 'pointer' }}
                        >
                          Gate Pass No
                          {sortConfig.key === 'gate_pass_id' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        <th>Requester</th>
                        <th>Department</th>
                        <th>Remark</th>
                        <th 
                          onClick={() => requestSort('status')}
                          style={{ cursor: 'pointer' }}
                        >
                          Status
                          {sortConfig.key === 'status' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        <th 
                          onClick={() => requestSort('request_date')}
                          style={{ cursor: 'pointer' }}
                        >
                          Date
                          {sortConfig.key === 'request_date' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        <th style={{ width: 140 }} className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPasses.length > 0 ? (
                        currentPasses.map((r) => (
                          <RowComponent r={r} key={r.gate_pass_id} tab={activeTab} />
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-5">
                            <div className="py-3">
                              <div className="mb-3 text-muted">
                                <i className="bi bi-inbox" style={{ fontSize: '4rem' }}></i>
                              </div>
                              <h5 className="text-muted">
                                No records found
                              </h5>
                              <p className="text-muted">
                                Try adjusting your search or filters
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {filteredPasses.length > itemsPerPage && (
                  <div className="d-flex justify-content-between align-items-center px-3 py-3 border-top">
                    <div className="text-muted small">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPasses.length)} of {filteredPasses.length} returns
                    </div>
                    <Pagination className="mb-0">
                      <Pagination.Prev 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      />
                      
                      {pageNumbers.map(number => (
                        <Pagination.Item 
                          key={number} 
                          active={number === currentPage}
                          onClick={() => paginate(number)}
                        >
                          {number}
                        </Pagination.Item>
                      ))}
                      
                      <Pagination.Next 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Return Request Modal */}
          <Modal show={!!selectedPass} onHide={() => setSelectedPass(null)} centered size="xl" className="fade" fullscreen="sm-down">
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold">Start Return - REQ-{selectedPass?.gate_pass_id}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
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
                <h5 className="detail-card-title">
                  <i className="bi bi-truck me-2" style={{ fontSize: '1.2rem' }}></i>
                  Transport Details
                </h5>
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
              <h5 className="detail-card-title">
                <i className="bi bi-box-seam me-2" style={{ fontSize: '1.2rem' }}></i>
                Item-wise Return Remarks
              </h5>
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
            <Modal.Footer className="border-top-0 pt-0">
              <Button variant="outline-secondary" onClick={() => setSelectedPass(null)}>Cancel</Button>
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
            className="fade"
            fullscreen="sm-down"
          >
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold">
                <i className="bi bi-file-text me-2" style={{ fontSize: '1.5rem' }}></i>
                Return Gate Pass Details - {detailRow?.is_return ? 'RET' : 'REQ'}-{detailRow?.gate_pass_id}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              {detailsLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              ) : (
                <div className="container-fluid">
                  <div className="row mb-4">
                    <div className="col-md-4 mb-3">
                      <div className="detail-card">
                        <h6 className="detail-card-title">
                          <i className="bi bi-info-circle me-2" style={{ fontSize: '1.2rem' }}></i>
                          Basic Information
                        </h6>
                        <div className="detail-item">
                          <span className="detail-label">Status:</span>
                          <span>
                            <StatusBadge status={detailRow?.return_status || detailRow?.status} />
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Date:</span>
                          <span>{formatDate(detailRow?.request_date)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Location:</span>
                          <span>{detailRow?.location}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Department:</span>
                          <span>{detailRow?.department}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="detail-card">
                        <h6 className="detail-card-title">
                          <i className="bi bi-person-circle me-2" style={{ fontSize: '1.2rem' }}></i>
                          Requester Details
                        </h6>
                        <div className="detail-item">
                          <span className="detail-label">Name:</span>
                          <span>{detailRow?.requester_name}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Department:</span>
                          <span>{detailRow?.department}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Location:</span>
                          <span>{detailRow?.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="detail-card">
                        <h6 className="detail-card-title">
                          <i className="bi bi-geo-alt me-2" style={{ fontSize: '1.2rem' }}></i>
                          Destination Details
                        </h6>
                        <div className="detail-item">
                          <span className="detail-label">Destination:</span>
                          <span>{detailRow?.destination_address}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Vehicle No:</span>
                          <span>{detailRow?.vehicle_no || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Driver:</span>
                          <span>{detailRow?.driver_name || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Transport Details Section in Details Modal */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="detail-card">
                        <h6 className="detail-card-title">
                          <i className="bi bi-truck me-2" style={{ fontSize: '1.2rem' }}></i>
                          Transport Details
                        </h6>
                        <div className="row">
                          <div className="col-md-3">
                            <div className="detail-item">
                              <span className="detail-label">Transport Mode:</span>
                              <span>{detailRow?.transport_mode || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="detail-item">
                              <span className="detail-label">Vehicle No:</span>
                              <span>{detailRow?.vehicle_no || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="detail-item">
                              <span className="detail-label">Driver Name:</span>
                              <span>{detailRow?.driver_name || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="detail-item">
                              <span className="detail-label">Driver Contact:</span>
                              <span>{detailRow?.driver_contact || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="detail-card">
                        <h6 className="detail-card-title">
                          <i className="bi bi-box-seam me-2" style={{ fontSize: '1.2rem' }}></i>
                          Material Details
                        </h6>
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
                                    <td>
                                      <span className={`badge ${material.returnable ? 'bg-success' : 'bg-secondary'}`}>
                                        {material.returnable ? 'Yes' : 'No'}
                                      </span>
                                    </td>
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
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="border-top-0 pt-0">
              <Button variant="outline-secondary" onClick={() => setDetailRow(null)}>Close</Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
      
      {/* Modern CSS Styles */}
      <style jsx>{`
        .search-box {
          max-width: 500px;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .search-box .form-control:focus {
          box-shadow: none;
        }
        
        .tab-button {
          background: white;
          border: none;
          padding: 10px 20px;
          margin-right: 5px;
          margin-bottom: 5px;
          border-radius: 8px;
          font-weight: 500;
          color: #495057;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .tab-button:hover {
          background: #f1f3f5;
        }
        
        .tab-button.active {
          background: #0d6efd;
          color: white;
          box-shadow: 0 4px 8px rgba(13, 110, 253, 0.3);
        }
        
        .detail-card {
          background: white;
          border-radius: 10px;
          padding: 1.5rem;
          height: 100%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border: 1px solid #f1f3f5;
        }
        
        .detail-card-title {
          font-weight: 600;
          margin-bottom: 1rem;
          color: #343a40;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
        }
        
        .detail-item {
          display: flex;
          margin-bottom: 0.75rem;
        }
        
        .detail-label {
          font-weight: 500;
          color: #6c757d;
          min-width: 140px;
        }
        
        .bg-purple {
          background-color: #6f42c1 !important;
        }
        
        .action-btn {
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .action-btn svg {
          width: 20px;
          height: 20px;
        }
        
        .transition-hover {
          transition: background-color 0.2s;
        }
        
        /* Mobile-specific styles */
        @media (max-width: 767px) {
          .p-1 {
            padding: 0.5rem !important;
          }
          
          .search-box {
            max-width: 100%;
          }
          
          .tab-button {
            flex: 1;
            margin-right: 5px;
            margin-bottom: 5px;
            min-width: 100px;
            padding: 8px 12px;
            font-size: 0.9rem;
          }
          
          .tab-button .badge {
            font-size: 0.75rem;
          }
          
          .detail-card {
            padding: 1rem;
            margin-bottom: 1rem;
          }
          
          .detail-item {
            flex-direction: column;
            margin-bottom: 0.5rem;
          }
          
          .detail-label {
            min-width: auto;
            margin-bottom: 0.25rem;
            font-weight: 600;
          }
          
          .action-btn {
            width: 36px;
            height: 36px;
          }
          
          .action-btn svg {
            width: 20px;
            height: 20px;
          }
          
          .modal-fullscreen {
            max-width: none;
            margin: 0;
          }
          
          .modal-fullscreen .modal-content {
            height: 100vh;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ReturnProcess;