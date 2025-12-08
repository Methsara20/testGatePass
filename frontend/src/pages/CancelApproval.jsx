import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchCancellableApprovals, fetchCancelledApprovals, cancelApprovalRequest } from '../services/cancelApprovalService';
import { useAuth } from '../context/AuthContext';
import { Table, Button, InputGroup, Form, Modal, Spinner, Badge, Alert, Dropdown, Pagination } from 'react-bootstrap';
import { BiSearch } from "react-icons/bi";
import { fetchGatePassWithMaterials } from '../services/approvalService';
import { getUserById } from '../services/userService';
import { CheckCircleFill, XCircleFill, ThreeDotsVertical, EyeFill, XCircle } from "react-bootstrap-icons";

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
  const [requesterDetails, setRequesterDetails] = useState(null);
  const [banner, setBanner] = useState({ show: false, message: '', type: 'success' });
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'gate_pass_id', direction: 'ascending' });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Tab configuration constants
  const TABS = [
    { id: 'waiting', label: 'Waiting' },
    { id: 'cancelled', label: 'Cancelled' }
  ];
  
  // Date formatting function
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  }, []);
  
  // Format date and time function
  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const dateStr = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      const timeStr = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${dateStr} ${timeStr}`;
    } catch (e) {
      console.error('Error formatting date/time:', e);
      return 'Invalid date/time';
    }
  }, []);
  
  // Helper function to render materials
  const renderMaterials = useCallback((materials) => {
    if (!materials) {
      return (
        <tr>
          <td colSpan="6" className="text-center py-3">
            <div className="text-muted">
              <i className="bi bi-inbox me-2" style={{ fontSize: '1.5rem' }}></i>No materials listed
            </div>
          </td>
        </tr>
      );
    }
    const materialsArray = typeof materials === 'string' ? JSON.parse(materials) : materials;
    
    return materialsArray.map((material, index) => (
      <tr key={index}>
        <td>{material.description || material.item_name || 'N/A'}</td>
        <td>{material.serialNumber || material.serial_number || 'N/A'}</td>
        <td>{material.quantity || material.qty || 'N/A'}</td>
        <td>{material.uom || 'N/A'}</td>
        <td>
          <span className={`badge ${material.isReturnable || material.returnable ? 'bg-success' : 'bg-secondary'}`}>
            {material.isReturnable || material.returnable ? 'Yes' : 'No'}
          </span>
        </td>
        <td>{formatDate(material.returnDate || material.return_date)}</td>
      </tr>
    ));
  }, [formatDate]);
  
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
      setBanner({ show: true, message: 'Failed to fetch approvals. Please try again.', type: 'danger' });
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
  
  // Filter and sort by search term
  const memoizedFilteredPasses = useMemo(() => {
    let result = activeTab === 'waiting' ? waitingPasses : cancelledPasses;
    
    // Apply search term for both tabs
    if (searchTerm !== "") {
      result = result.filter((p) =>
        p.gate_pass_id.toString().includes(searchTerm.toLowerCase()) ||
        (p.request_type && p.request_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.destination_address && p.destination_address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.requester_name && p.requester_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (activeTab === 'cancelled' && p.cancel_remark && p.cancel_remark.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle date sorting
        if (sortConfig.key === 'request_date' || sortConfig.key === 'cancelled_at') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
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
  }, [searchTerm, waitingPasses, cancelledPasses, activeTab, sortConfig]);
  
  useEffect(() => {
    setFilteredPasses(memoizedFilteredPasses);
    setCurrentPage(1); // Reset to first page when filters change
  }, [memoizedFilteredPasses]);
  
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
  
  // Export to CSV function
  const exportToCSV = () => {
    const headers = activeTab === 'waiting' 
      ? ["Gate Pass ID", "Request Type", "Destination", "Requester", "Date"]
      : ["Gate Pass ID", "Request Type", "Destination", "Requester", "Cancelled At", "Remarks"];
    
    const csvContent = [
      headers.join(","),
      ...filteredPasses.map(pass => 
        activeTab === 'waiting'
          ? [
              pass.gate_pass_id, 
              pass.request_type,
              pass.destination_address,
              pass.requester_name,
              formatDate(pass.request_date)
            ].join(",")
          : [
              pass.gate_pass_id, 
              pass.request_type,
              pass.destination_address,
              pass.requester_name,
              formatDateTime(pass.cancelled_at),
              pass.cancel_remark || 'N/A'
            ].join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cancel-approvals-${activeTab}.csv`);
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
  
  // Cancel approval action
  const handleCancelApproval = async () => {
    try {
      await cancelApprovalRequest(cancelId, cancelRemark, user.id);
      setBanner({ show: true, message: 'Approval cancelled successfully!', type: 'success' });
      fetchWaitingApprovals();
      fetchCancelled();
      setCancelId(null);
      setCancelRemark('');
    } catch (err) {
      console.error('Cancel failed:', err);
      setBanner({ show: true, message: 'Failed to cancel approval. Please try again.', type: 'danger' });
    }
  };
  
  // View details
  const handleViewDetails = async (id) => {
    try {
      const res = await fetchGatePassWithMaterials(id);
      const passData = res.data;
      
      // Fetch requester details if created_by exists
      if (passData.created_by) {
        try {
          const userRes = await getUserById(passData.created_by);
          setRequesterDetails(userRes.data);
        } catch (error) {
          console.error("Error fetching user details:", error);
          setRequesterDetails(null);
        }
      }
      
      setDetailRow(passData);
    } catch (err) {
      console.error('Error fetching details:', err);
      setBanner({ show: true, message: 'Failed to load details. Please try again.', type: 'danger' });
    }
  };
  
  // Row component for memoization
  const Row = React.memo(({ p, activeTab, handleViewDetails, setCancelId, formatDate, formatDateTime }) => (
    <tr className="align-middle transition-hover">
      <td className="fw-bold">
        <div className="d-flex align-items-center">
          <span className="badge bg-primary bg-opacity-10 me-2" style={{ color: '#0d6efd' }}>
            REQ
          </span>
          {p.gate_pass_id}
        </div>
      </td>
      <td>{p.request_type}</td>
      <td>{p.destination_address}</td>
      <td>{p.requester_name}</td>
      <td>{activeTab === 'waiting' ? formatDate(p.request_date) : formatDateTime(p.cancelled_at)}</td>
      {activeTab === 'cancelled' && (
        <td>{p.cancel_remark || 'N/A'}</td>
      )}
      <td className="text-center">
        {/* Desktop Actions */}
        <div className="d-none d-md-flex justify-content-center">
          <Button 
            variant="light" 
            className="rounded-circle me-1 p-2 action-btn"
            onClick={() => handleViewDetails(p.gate_pass_id)}
            title="View details"
          >
            <EyeFill className="text-primary" />
          </Button>
          {activeTab === 'waiting' && (
            <Button 
              variant="light" 
              className="rounded-circle p-2 action-btn text-danger"
              onClick={() => setCancelId(p.gate_pass_id)}
              title="Cancel"
            >
              <XCircle />
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
              <Dropdown.Item onClick={() => handleViewDetails(p.gate_pass_id)}>
                <EyeFill className="me-2" /> View Details
              </Dropdown.Item>
              {activeTab === 'waiting' && (
                <Dropdown.Item onClick={() => setCancelId(p.gate_pass_id)}>
                  <XCircle className="me-2 text-danger" /> Cancel
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </td>
    </tr>
  ));
  
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
              <h3 className="mb-2 fw-bold">Gate Pass Cancellation</h3>
              <p className="text-muted mb-1">View and cancel approved requests, or review cancelled history</p>
            </div>
            <div className="d-flex">
              <InputGroup style={{ width: "320px" }} className="me-3 shadow-sm">
                <InputGroup.Text className="bg-white border-end-0">
                  <BiSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={activeTab === 'waiting' 
                    ? "Search by ID, type, or destination..." 
                    : "Search by ID, type, destination, or remarks..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0 border-end-0"
                />
                {searchTerm && (
                  <Button
                    variant="light"
                    onClick={() => setSearchTerm('')}
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
                onClick={() => { fetchWaitingApprovals(); fetchCancelled(); }} 
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
                    {t.id === 'waiting' ? waitingPasses.length : cancelledPasses.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-3 shadow-sm p-1">
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
              <h5 className="mb-0 fw-semibold">
                {activeTab === 'waiting' ? 'Approvals Waiting for Cancellation' : 'Cancelled Approvals'} 
                <span className="badge bg-secondary rounded-pill ms-2">{filteredPasses.length}</span>
              </h5>
            </div>
            
            {/* Loading Spinner */}
            {loading && (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading approval data...</p>
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
                          Gate Pass ID
                          {sortConfig.key === 'gate_pass_id' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        <th>Request Type</th>
                        <th>Destination</th>
                        <th>Requester</th>
                        <th 
                          onClick={() => requestSort(activeTab === 'waiting' ? 'request_date' : 'cancelled_at')}
                          style={{ cursor: 'pointer' }}
                        >
                          {activeTab === 'waiting' ? 'Date' : 'Cancelled At'}
                          {sortConfig.key === (activeTab === 'waiting' ? 'request_date' : 'cancelled_at') && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        {activeTab === 'cancelled' && <th>Remarks</th>}
                        <th style={{ width: 140 }} className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPasses.length > 0 ? (
                        currentPasses.map((p) => (
                          <Row 
                            p={p} 
                            key={p.gate_pass_id} 
                            activeTab={activeTab}
                            handleViewDetails={handleViewDetails}
                            setCancelId={setCancelId}
                            formatDate={formatDate}
                            formatDateTime={formatDateTime}
                          />
                        ))
                      ) : (
                        <tr>
                          <td colSpan={activeTab === 'cancelled' ? 7 : 6} className="text-center py-5">
                            <div className="py-3">
                              <div className="mb-3 text-muted">
                                <i className="bi bi-inbox" style={{ fontSize: '4rem' }}></i>
                              </div>
                              <h5 className="text-muted">
                                {activeTab === 'waiting' 
                                  ? 'No approvals available for cancellation' 
                                  : 'No cancelled approvals found'}
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
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPasses.length)} of {filteredPasses.length} approvals
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
          
          {/* Cancel Modal */}
          <Modal show={!!cancelId} onHide={() => setCancelId(null)} centered className="fade" fullscreen="sm-down">
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold">Cancel Approval</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              <div className="text-center mb-3">
                <div className="bg-danger bg-opacity-10 rounded-circle p-4 d-inline-block mb-3">
                  <i className="bi bi-x-lg" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
                </div>
              </div>
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
            <Modal.Footer className="border-top-0 pt-0">
              <Button variant="outline-secondary" onClick={() => setCancelId(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleCancelApproval}>
                Confirm Cancel
              </Button>
            </Modal.Footer>
          </Modal>
          
          {/* Full Details Modal */}
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
                Gate Pass Request Details - REQ-{detailRow?.gate_pass_id}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              {detailRow && (
                <div className="container-fluid">
                  <div className="row mb-4">
                    <div className="col-md-4 mb-3">
                      <div className="detail-card">
                        <h6 className="detail-card-title">
                          <i className="bi bi-info-circle me-2" style={{ fontSize: '1.2rem' }}></i>
                          Basic Information
                        </h6>
                        <div className="detail-item">
                          <span className="detail-label">Request Type:</span>
                          <span>{detailRow.request_type}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Status:</span>
                          <span>
                            <span className={`badge ${
                              detailRow.status === 'Approved' ? 'bg-success' :
                              detailRow.status === 'Rejected' ? 'bg-danger' : 'bg-warning'
                            }`}>
                              {detailRow.status}
                            </span>
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Date:</span>
                          <span>{formatDate(detailRow.request_date)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Time:</span>
                          <span>{detailRow.request_time}</span>
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
                          <span>
                            {requesterDetails?.full_name ||
                              detailRow.requester_name ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Email:</span>
                          <span>
                            {requesterDetails?.email ||
                              detailRow.requester_email ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Department:</span>
                          <span>
                            {requesterDetails?.requester_role ||
                              detailRow.requester_role ||
                              detailRow.requester_role ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Phone:</span>
                          <span>
                            {requesterDetails?.phone_number ||
                              detailRow.requester_phone ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Location:</span>
                          <span>
                            {requesterDetails?.location ||
                              detailRow.requester_location ||
                              "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="detail-card">
                        <h6 className="detail-card-title">
                          <i className="bi bi-geo-alt me-2" style={{ fontSize: '1.2rem' }}></i>
                          Location Details
                        </h6>
                        <div className="detail-item">
                          <span className="detail-label">From Location:</span>
                          <span>
                            {detailRow.from_location || detailRow.location}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Department:</span>
                          <span>
                            {detailRow.department || "N/A"}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Destination:</span>
                          <span>
                            {detailRow.destination_type === "internal"
                              ? `${
                                  detailRow.to_location_internal ||
                                  detailRow.destination_address
                                }${
                                  detailRow.to_department_internal
                                    ? ` (${detailRow.to_department_internal})`
                                    : ""
                                }`
                              : detailRow.destination_address}
                          </span>
                        </div>
                        {detailRow.destination_type === "external" && (
                          <div className="detail-item">
                            <span className="detail-label">Receiver Name:</span>
                            <span>
                              {detailRow.receiver_name || "N/A"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                      <div className="detail-card">
                        <h6 className="detail-card-title">
                          <i className="bi bi-card-text me-2" style={{ fontSize: '1.2rem' }}></i>
                          Purpose & Notes
                        </h6>
                        <div className="detail-item">
                          <span className="detail-label">Purpose:</span>
                        </div>
                        <p className="detail-content">{detailRow.purpose}</p>
                        {detailRow.additional_notes && (
                          <>
                            <div className="detail-item mt-3">
                              <span className="detail-label">Additional Notes:</span>
                            </div>
                            <p className="detail-content">{detailRow.additional_notes}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="detail-card">
                        <h6 className="detail-card-title">
                          <i className="bi bi-truck me-2" style={{ fontSize: '1.2rem' }}></i>
                          Transport Details
                        </h6>
                        <div className="detail-item">
                          <span className="detail-label">Transport Mode:</span>
                          <span>{detailRow.transport_mode || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Vehicle Number:</span>
                          <span>
                            {detailRow.vehicle_number ||
                              detailRow.vehicle_no ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Driver Name:</span>
                          <span>{detailRow.driver_name || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Driver Contact:</span>
                          <span>{detailRow.driver_contact || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Delivery Comments:</span>
                          <span>{detailRow.delivery_comment || "N/A"}</span>
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
                              </tr>
                            </thead>
                            <tbody>
                              {renderMaterials(detailRow.materials)}
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-12">
                      <div className="detail-card">
                        <h6 className="detail-card-title">
                          <i className="bi bi-chat-left-text me-2" style={{ fontSize: '1.2rem' }}></i>
                          Remarks
                        </h6>
                        <p className="detail-content">{detailRow.remarks || "No remarks provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="border-top-0 pt-0">
              <Button variant="outline-secondary" onClick={() => setDetailRow(null)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
      
      {/* Modern CSS Styles */}
      <style jsx>{`
        .cancel-approval-container {
          min-height: 0; /* Changed from 100vh to prevent forced scrollbar */
          height: auto; /* Let content determine height */
        }
        
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
        
        .detail-content {
          color: #495057;
          line-height: 1.6;
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

export default CancelApproval;