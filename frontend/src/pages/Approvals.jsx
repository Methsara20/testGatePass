import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchSummary, approvePass, rejectPass, fetchGatePassWithMaterials } from '../services/approvalService';
import { fetchReturnRequests, approveReturnRequest, rejectReturnRequest } from '../services/returnService';
import { Modal, Button, Table, InputGroup, Form } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { BiSearch } from "react-icons/bi";
import { getUserById } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';


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
  
  // Tab configuration constants
  const TABS = [
    { id: 'Pending', label: 'Pending' },
    { id: 'Approved', label: 'Approved' },
    { id: 'Rejected', label: 'Rejected' },
    { id: 'ReturnApprovals', label: 'Return Approvals' }
  ];

  // Helper function for consistent date formatting
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  }, []);

  // Helper function to render materials
  const renderMaterials = useCallback((materials) => {
    if (!materials) {
      return (
        <tr>
          <td colSpan="7" className="text-center">
            No materials listed
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
        <td>{material.isReturnable || material.returnable ? 'Yes' : 'No'}</td>
        <td>{material.returnDate || material.return_date || 'N/A'}</td>
        <td>{material.return_remark || 'N/A'}</td>
      </tr>
    ));
  }, []);

  // Memoized filtered passes
  const memoizedFilteredPasses = useMemo(() => {
    if (searchTerm === "") {
      return lists[tab] || [];
    } else {
      return (lists[tab] || []).filter(
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
  }, [searchTerm, lists, tab]);

  // Search handlers
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  // Enhanced load function with loading state
  const load = useCallback(async () => {
    if (!user?.location || !user?.department) {
      console.log('User location or department not available:', { location: user?.location, department: user?.department });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching for:', { location: user.location, department: user.department });
      
      // Load normal approvals
      const approvalResponse = await fetchSummary(user.location, user.department);
      console.log('Fetched data:', approvalResponse.data);
      setLists((prev) => ({ ...prev, ...approvalResponse.data }));
      if (tab !== "ReturnApprovals") setFilteredPasses(approvalResponse.data[tab] || []);
      
      // Load return approvals (filtered by requester's location/department)
      const returnResponse = await fetchReturnRequests(user.location, user.department);
      setLists((prev) => ({ ...prev, ReturnApprovals: returnResponse.data }));
      if (tab === "ReturnApprovals") setFilteredPasses(returnResponse.data || []);
    } catch (error) {
      console.error('Error loading approvals:', error);
      toast.error('Failed to load approval data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.location, user?.department, tab]);

  useEffect(() => {      
    load();              
  }, [load]);

  useEffect(() => {
    setFilteredPasses(memoizedFilteredPasses);
  }, [memoizedFilteredPasses]);

  const doApprove = async () => {
    try {
      if (!user?.id) {
        toast.error('You must be logged in to approve requests');
        return;
      }
      
      const toastId = toast.loading('Approving request...');
      
      if (isReturnApproval) {
        // For return approvals
        await approveReturnRequest(approveId, user.id);
      } else {
        // For normal approvals
        await approvePass(approveId, user.id);
      }
      
      toast.update(toastId, {
        render: 'Request approved successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      
      setApproveId(null);
      load(); // Refresh the data
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
    } catch (error) {
      console.error("Error fetching gate pass details:", error);
    }
  };

  // Memoized Row component
  const Row = React.memo(({ r, tab, handleViewDetails, setApproveId, setRejectId, setIsReturnApproval }) => (
    <tr>
      <td className="fw-bold">
        {tab === 'ReturnApprovals' ? `RET-${r.gate_pass_id}` : `REQ-${r.gate_pass_id}`}
      </td>
      <td>
        {tab === 'ReturnApprovals' ? 'Returnable (Return Request)' : (r.request_type || 'Gate Pass')}
      </td>
      <td>
        <span
          className={`badge ${
            (r.status === 'Approved' || r.return_status === 'Approved')
              ? 'bg-success'
              : (r.status === 'Rejected' || r.return_status === 'Rejected')
              ? 'bg-danger'
              : 'bg-warning'
          }`}
        >
          {tab === 'ReturnApprovals' ? (r.return_status || r.status) : r.status}
        </span>
      </td>
      <td>{r.request_date || formatDate(r.created_at)}</td>
      <td>{r.requester_name || r.created_by}</td>
      
      <td>
        <i
          className="bi bi-eye text-primary me-3 cursor-pointer"
          onClick={() => handleViewDetails(r.gate_pass_id)}
        />
        {(tab === 'Pending' || tab === 'ReturnApprovals') && (
          <>
            <i
              className="bi bi-check-lg text-success me-3 cursor-pointer"
              onClick={() => { 
                setApproveId(r.gate_pass_id); 
                setIsReturnApproval(tab === 'ReturnApprovals'); 
              }}
            />
            {/* Only show reject for regular gate passes, not return approvals */}
            {tab !== 'ReturnApprovals' && (
              <i
                className="bi bi-x-lg text-danger cursor-pointer"
                onClick={() => setRejectId(r.gate_pass_id)}
              />
            )}
          </>
        )}
      </td>
    </tr>
  ));

  return (
    <div className="d-flex">
      
      <div className="flex-grow-1">
        
      <div className="p-4 flex-grow-1 w-100">
        
        <h4 className="mb-1">Approvals</h4>
        <p className="text-muted">
          Review and manage normal & return gate pass approvals separately.
        </p>
        
        {/* Enhanced Search Input */}
        <div className="mb-3">
          <InputGroup>
            <InputGroup.Text>
              <BiSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by ID, requester, location or department..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <Button
                variant="outline-secondary"
                onClick={handleClearSearch}
              >
                Clear
              </Button>
            )}
          </InputGroup>
        </div>
        
        {/* Enhanced Tabs */}
        <ul className="nav nav-tabs mb-3">
          {TABS.map((t) => (
            <li className="nav-item" key={t.id}>
              <button
                className={`nav-link ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                <span className="badge bg-light text-dark ms-1">
                  {lists[t.id]?.length ?? 0}
                </span>
              </button>
            </li>
          ))}
        </ul>
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="text-center my-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        
        {/* Enhanced Table */}
        <div className="table-responsive">
          <Table striped bordered hover className="align-middle">
            <thead className="table-light">
              <tr>
                <th>Gate Pass No</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>User</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredPasses.map((r) => (
                <Row 
                  r={r} 
                  key={r.gate_pass_id} 
                  tab={tab}
                  handleViewDetails={handleViewDetails}
                  setApproveId={setApproveId}
                  setRejectId={setRejectId}
                  setIsReturnApproval={setIsReturnApproval}
                />
              ))}
              {filteredPasses.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
        
        {/* Enhanced Approve modal */}
        <Modal show={!!approveId} onHide={() => setApproveId(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Approval</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to approve this {isReturnApproval ? 'return' : 'gate pass'} request?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setApproveId(null)}>
              Cancel
            </Button>
            <Button variant="success" onClick={doApprove}>
              Approve
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Enhanced Reject modal */}
        <Modal show={!!rejectId} onHide={() => setRejectId(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Rejection</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to reject this gate pass request?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={doReject}>
              Reject
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Full Details modal */}
        <Modal
          show={!!detailRow}
          onHide={() => setDetailRow(null)}
          centered
          size="xl"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Gate Pass Request Details - {tab === 'ReturnApprovals' ? 'RET' : 'REQ'}-{detailRow?.gate_pass_id}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {detailRow && (
              <div className="container-fluid">
                <div className="row mb-4">
                  <div className="col-md-4">
                    <h6>Basic Information</h6>
                    <p>
                      <strong>Request Type:</strong> {detailRow.request_type}
                    </p>
                    <p>
                      <strong>Status:</strong> {tab === 'ReturnApprovals' ? (detailRow.return_status || detailRow.status) : detailRow.status}
                    </p>
                    <p>
                      <strong>Date:</strong> {detailRow.request_date}
                    </p>
                    <p>
                      <strong>Time:</strong> {detailRow.request_time}
                    </p>
                  </div>
                  <div className="col-md-4">
                    <h6>Requester Details</h6>
                    <p>
                      <strong>Name:</strong>{" "}
                      {requesterDetails?.full_name ||
                        detailRow.requester_name ||
                        "N/A"}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {requesterDetails?.email ||
                        detailRow.requester_email ||
                        "N/A"}
                    </p>
                    <p>
                      <strong>Department:</strong>{" "}
                      {requesterDetails?.requester_role ||
                        detailRow.requester_role ||
                        detailRow.requester_role ||
                        "N/A"}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {requesterDetails?.phone_number ||
                        detailRow.requester_phone ||
                        "N/A"}
                    </p>
                    <p>
                      <strong>Location:</strong>{" "}
                      {requesterDetails?.location ||
                        detailRow.requester_location ||
                        "N/A"}
                    </p>
                  </div>
                  <div className="col-md-4">
                    <h6>Location Details</h6>
                    <p>
                      <strong>From Location:</strong>{" "}
                      {detailRow.from_location || detailRow.location}
                    </p>
                    <p>
                      <strong>Department:</strong>{" "}
                      {detailRow.department || "N/A"}
                    </p>
                    <p>
                      <strong>Destination:</strong>
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
                    </p>
                    {detailRow.destination_type === "external" && (
                      <p>
                        <strong>Receiver Name:</strong>{" "}
                        {detailRow.receiver_name || "N/A"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6>Purpose & Notes</h6>
                    <p>
                      <strong>Purpose:</strong>
                    </p>
                    <p className="mb-3">{detailRow.purpose}</p>
                    {detailRow.additional_notes && (
                      <>
                        <p>
                          <strong>Additional Notes:</strong>
                        </p>
                        <p>{detailRow.additional_notes}</p>
                      </>
                    )}
                  </div>
                  <div className="col-md-6">
                    <h6>Transport Details</h6>
                    <p>
                      <strong>Transport Mode:</strong>{" "}
                      {detailRow.transport_mode || "N/A"}
                    </p>
                    <p>
                      <strong>Vehicle Number:</strong>{" "}
                      {detailRow.vehicle_number ||
                        detailRow.vehicle_no ||
                        "N/A"}
                    </p>
                    <p>
                      <strong>Driver Name:</strong>{" "}
                      {detailRow.driver_name || "N/A"}
                    </p>
                    <p>
                      <strong>Driver Contact:</strong>{" "}
                      {detailRow.driver_contact || "N/A"}
                    </p>
                    <p>
                      <strong>Delivery Comments:</strong>{" "}
                      {detailRow.delivery_comment || "N/A"}
                    </p>
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
                          <th>Return Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderMaterials(detailRow.materials)}
                      </tbody>
                    </Table>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12">
                    <h6>Remarks</h6>
                    <p>{detailRow.remarks || "No remarks provided"}</p>
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
      </div>
    </div>
  );
};

export default Approvals;