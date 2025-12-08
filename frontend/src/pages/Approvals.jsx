import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchSummary, approvePass, rejectPass, fetchGatePassWithMaterials } from '../services/approvalService';
import { fetchReturnRequests, approveReturnRequest, rejectReturnRequest } from '../services/returnService';
import { Modal, Button, Table, InputGroup, Form, Spinner, Alert, Dropdown, Pagination } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { BiSearch } from "react-icons/bi";
import { getUserById } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { CheckCircleFill, XCircleFill, ThreeDotsVertical, EyeFill, CheckCircle, XCircle } from "react-bootstrap-icons";

const Approvals = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('Pending');
  const [lists, setLists] = useState({ Pending: [], Approved: [], Rejected: [], ReturnApprovals: [] });
  const [approveId, setApproveId] = useState(null);
  const [rejectId, setRejectId] = useState(null); 
  const [detailRow, setDetailRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPasses, setFilteredPasses] = useState([]);
  const [requesterDetails, setRequesterDetails] = useState(null);
  const [isReturnApproval, setIsReturnApproval] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: '', type: 'success' });
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'gate_pass_id', direction: 'ascending' });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Tab configuration constants
  const TABS = [
    { id: 'Pending', label: 'Pending' },
    { id: 'Approved', label: 'Approved' },
    { id: 'Rejected', label: 'Rejected' },
    { id: 'ReturnApprovals', label: 'Return Approvals' }
  ];
  
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
  
  const renderMaterials = useCallback((materials) => {
    if (!materials) {
      return (
        <tr>
          <td colSpan="7" className="text-center py-3">
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
        <td>{material.return_remark || 'N/A'}</td>
      </tr>
    ));
  }, [formatDate]);
  
  const memoizedFilteredPasses = useMemo(() => {
    let result = lists[tab] || [];
    
    // Apply search term
    if (searchTerm !== "") {
      result = result.filter(
        (p) =>
          p.gate_pass_id.toString().includes(searchTerm.toLowerCase()) ||
          (p.description &&
            p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.location &&
            p.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.department &&
            p.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.requester_name && p.requester_name.toLowerCase().includes(searchTerm.toLowerCase()))
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
        if (sortConfig.key === 'status') {
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
  }, [searchTerm, lists, tab, sortConfig]);
  
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);
  
  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);
  
  const load = useCallback(async () => {
    if (!user?.location || !user?.department) {
      console.log('User location or department not available:', { location: user?.location, department: user?.department });
      return;
    }
    setIsLoading(true);
    try {
      console.log('Fetching for:', { location: user.location, department: user.department });
      
      const approvalResponse = await fetchSummary(user.location, user.department);
      console.log('Fetched data:', approvalResponse.data);
      setLists((prev) => ({ ...prev, ...approvalResponse.data }));
      
      const returnResponse = await fetchReturnRequests(user.location, user.department);
      setLists((prev) => ({ ...prev, ReturnApprovals: returnResponse.data }));
    } catch (error) {
      console.error('Error loading approvals:', error);
      toast.error('Failed to load approval data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.location, user?.department]);
  
  useEffect(() => {      
    load();              
  }, [load]);
  
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
    const headers = ["Gate Pass ID", "Type", "Status", "Date", "User"];
    const csvContent = [
      headers.join(","),
      ...filteredPasses.map(pass => 
        [
          pass.gate_pass_id, 
          tab === 'ReturnApprovals' ? 'Returnable (Return Request)' : (pass.request_type || 'Gate Pass'),
          tab === 'ReturnApprovals' ? (pass.return_status || pass.status) : pass.status,
          formatDate(pass.request_date) || formatDate(pass.created_at),
          pass.requester_name || pass.created_by
        ].join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `approvals-${tab.toLowerCase()}.csv`);
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
  
  const doApprove = async () => {
    try {
      if (!user?.id) {
        toast.error('You must be logged in to approve requests');
        return;
      }
      
      const toastId = toast.loading('Approving request...');
      
      if (isReturnApproval) {
        await approveReturnRequest(approveId, user.id);
      } else {
        await approvePass(approveId, user.id);
      }
      
      toast.update(toastId, {
        render: 'Request approved successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      
      setApproveId(null);
      load();
    } catch (error) {
      console.error('Approval failed:', error);
      
      let errorMessage = 'Failed to approve request';
      if (error.response?.status === 404) {
        errorMessage = 'Approval endpoint not found (404)';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast.error(errorMessage, { autoClose: 5000 });
    }
  };
  
  const doReject = async () => {
    try {
      if (!user?.id) {
        toast.error('You must be logged in to reject requests');
        return;
      }
  
      const toastId = toast.loading('Rejecting request...');
      await rejectPass(rejectId, user.id);  
  
      toast.update(toastId, {
        render: 'Request rejected successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
  
      setRejectId(null);
      load();
    } catch (error) {
      console.error('Rejection failed:', error);
      toast.error(
        error.response?.data?.message || 'Failed to reject request. Please try again.',
        { autoClose: 5000 }
      );
    }
  };
  
  const handleViewDetails = async (id) => {
    try {
      const res = await fetchGatePassWithMaterials(id);
      const passData = res.data;
      
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
    } catch (error) {
      console.error("Error fetching gate pass details:", error);
    }
  };
  
  const Row = React.memo(({ r, tab, handleViewDetails, setApproveId, setRejectId, setIsReturnApproval, formatDate }) => (
    <tr className="align-middle transition-hover">
      <td className="fw-bold">
        <div className="d-flex align-items-center">
          <span className={`badge ${tab === 'ReturnApprovals' ? 'bg-purple' : 'bg-primary bg-opacity-10'} me-2`} 
                style={tab === 'ReturnApprovals' ? {} : { color: '#0d6efd' }}>
            {tab === 'ReturnApprovals' ? 'RET' : 'REQ'}
          </span>
          {r.gate_pass_id}
        </div>
      </td>
      <td>
        {tab === 'ReturnApprovals' ? 'Returnable (Return Request)' : (r.request_type || 'Gate Pass')}
      </td>
      <td>
        <span className={`badge ${
          (r.status === 'Approved' || r.return_status === 'Approved')
            ? 'bg-success'
            : (r.status === 'Rejected' || r.return_status === 'Rejected')
            ? 'bg-danger'
            : 'bg-warning'
        }`}>
          {tab === 'ReturnApprovals' ? (r.return_status || r.status) : r.status}
        </span>
      </td>
      <td>{formatDate(r.request_date) || formatDate(r.created_at)}</td>
      <td>{r.full_name}</td>
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
          {(tab === 'Pending' || tab === 'ReturnApprovals') && (
            <>
              <Button 
                variant="light" 
                className="rounded-circle me-1 p-2 action-btn text-success"
                onClick={() => { 
                  setApproveId(r.gate_pass_id); 
                  setIsReturnApproval(tab === 'ReturnApprovals'); 
                }}
                title="Approve"
              >
                <CheckCircle />
              </Button>
              {tab !== 'ReturnApprovals' && (
                <Button 
                  variant="light" 
                  className="rounded-circle p-2 action-btn text-danger"
                  onClick={() => setRejectId(r.gate_pass_id)}
                  title="Reject"
                >
                  <XCircle />
                </Button>
              )}
            </>
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
              {(tab === 'Pending' || tab === 'ReturnApprovals') && (
                <>
                  <Dropdown.Item onClick={() => { 
                    setApproveId(r.gate_pass_id); 
                    setIsReturnApproval(tab === 'ReturnApprovals'); 
                  }}>
                    <CheckCircle className="me-2 text-success" /> Approve
                  </Dropdown.Item>
                  {tab !== 'ReturnApprovals' && (
                    <Dropdown.Item onClick={() => setRejectId(r.gate_pass_id)}>
                      <XCircle className="me-2 text-danger" /> Reject
                    </Dropdown.Item>
                  )}
                </>
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
              <h3 className="mb-2 fw-bold">Gate Pass Approvals</h3>
              <p className="text-muted mb-1">Review and manage gate pass & return request approvals</p>
            </div>
            <div className="d-flex">
              <InputGroup style={{ width: "320px" }} className="me-3 shadow-sm">
                <InputGroup.Text className="bg-white border-end-0">
                  <BiSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by ID, requester, location or department..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="border-start-0 border-end-0"
                />
                {searchTerm && (
                  <Button
                    variant="light"
                    onClick={handleClearSearch}
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
                onClick={load} 
                disabled={isLoading}
              >
                {isLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Refresh'}
              </Button>
            </div>
          </div>
          
          {/* Modern Tabs */}
          <div className="mb-3">
            <div className="d-flex flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`tab-button ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
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
                {tab === 'ReturnApprovals' ? 'Return Approvals' : 'Gate Pass Approvals'} 
                <span className="badge bg-secondary rounded-pill ms-2">{filteredPasses.length}</span>
              </h5>
            </div>
            
            {/* Loading Spinner */}
            {isLoading && (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading approval data...</p>
              </div>
            )}
            
            {/* Modern Table */}
            {!isLoading && (
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
                        <th>Type</th>
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
                        <th 
                          onClick={() => requestSort('requester_name')}
                          style={{ cursor: 'pointer' }}
                        >
                          User
                          {sortConfig.key === 'requester_name' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        <th style={{ width: 140 }} className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPasses.map((r) => (
                        <Row 
                          r={r} 
                          key={r.gate_pass_id} 
                          tab={tab}
                          handleViewDetails={handleViewDetails}
                          setApproveId={setApproveId}
                          setRejectId={setRejectId}
                          setIsReturnApproval={setIsReturnApproval}
                          formatDate={formatDate}
                        />
                      ))}
                      {currentPasses.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-5">
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
          
          {/* Modern Approve Modal */}
          <Modal show={!!approveId} onHide={() => setApproveId(null)} centered className="fade" fullscreen="sm-down">
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold">Confirm Approval</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              <div className="text-center">
                <div className="mb-3">
                  <div className="bg-success bg-opacity-10 rounded-circle p-4 d-inline-block">
                    <i className="bi bi-check-lg" style={{ fontSize: '3rem', color: '#198754' }}></i>
                  </div>
                </div>
                <p>Are you sure you want to approve this {isReturnApproval ? 'return' : 'gate pass'} request?</p>
              </div>
            </Modal.Body>
            <Modal.Footer className="border-top-0 pt-0">
              <Button variant="outline-secondary" onClick={() => setApproveId(null)}>
                Cancel
              </Button>
              <Button variant="success" onClick={doApprove}>
                Approve
              </Button>
            </Modal.Footer>
          </Modal>
          
          {/* Modern Reject Modal */}
          <Modal show={!!rejectId} onHide={() => setRejectId(null)} centered className="fade" fullscreen="sm-down">
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold">Confirm Rejection</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              <div className="text-center">
                <div className="mb-3">
                  <div className="bg-danger bg-opacity-10 rounded-circle p-4 d-inline-block">
                    <i className="bi bi-x-lg" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
                  </div>
                </div>
                <p>Are you sure you want to reject this gate pass request?</p>
              </div>
            </Modal.Body>
            <Modal.Footer className="border-top-0 pt-0">
              <Button variant="outline-secondary" onClick={() => setRejectId(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={doReject}>
                Reject
              </Button>
            </Modal.Footer>
          </Modal>
          
          {/* Modern Details Modal */}
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
                Gate Pass Request Details - {tab === 'ReturnApprovals' ? 'RET' : 'REQ'}-{detailRow?.gate_pass_id}
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
                              (detailRow.status === 'Approved' || detailRow.return_status === 'Approved')
                                ? 'bg-success'
                                : (detailRow.status === 'Rejected' || detailRow.return_status === 'Rejected')
                                ? 'bg-danger'
                                : 'bg-warning'
                            }`}>
                              {tab === 'ReturnApprovals' ? (detailRow.return_status || detailRow.status) : detailRow.status}
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
                                <th>Return Remark</th>
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

export default Approvals;