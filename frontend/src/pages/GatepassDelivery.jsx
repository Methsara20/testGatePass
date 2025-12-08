import React, { useEffect, useState, useCallback } from "react";
import {
  fetchDeliveries,
  acceptDelivery,
  rejectDelivery,
} from "../services/deliveryService";
import { fetchGatePassWithMaterials } from "../services/approvalService";
import { useAuth } from "../context/AuthContext";
import {
  Modal,
  Button,
  Form,
  InputGroup,
  Table,
  Spinner,
  Badge,
  Alert,
  Dropdown,
  Pagination,
} from "react-bootstrap";
import { BiSearch } from "react-icons/bi";
import "bootstrap-icons/font/bootstrap-icons.css";
import { CheckCircleFill, XCircleFill, ThreeDotsVertical, EyeFill, CheckCircle, ExclamationOctagon } from "react-bootstrap-icons";

const GatepassDelivery = () => {
  const { user } = useAuth();
  const [passes, setPasses] = useState([]);
  const [filteredPasses, setFilteredPasses] = useState([]);
  const [rejectId, setRejectId] = useState(null);
  const [comment, setComment] = useState("");
  const [acceptId, setAcceptId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [detailRow, setDetailRow] = useState(null);
  const [activeTab, setActiveTab] = useState("Pending");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: '', type: 'success' });
  const [counts, setCounts] = useState({
    Pending: 0,
    Accepted: 0,
    Rejected: 0,
  });
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'gate_pass_id', direction: 'ascending' });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
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
  
  // Mapping tab names to backend status values
  const statusMap = {
    Pending: "Waiting",
    Accepted: "Accepted",
    Rejected: "Rejected",
  };
  
  // Fetch passes based on active tab
  const fetchData = async (tab) => {
    if (!user?.location || !user?.department) return;
    setLoading(true);
    try {
      const res = await fetchDeliveries(
        user.location,
        user.department,
        statusMap[tab]
      );
      setPasses(res.data);
      setFilteredPasses(res.data);
    } catch (err) {
      console.error("Fetch Deliveries Error:", err);
      setBanner({ show: true, message: 'Failed to load delivery data. Please try again.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch counts for badges
  const fetchCounts = async () => {
    if (!user?.location || !user?.department) return;
    const newCounts = {};
    for (const tab of ["Pending", "Accepted", "Rejected"]) {
      try {
        const res = await fetchDeliveries(
          user.location,
          user.department,
          statusMap[tab]
        );
        newCounts[tab] = res.data.length;
      } catch (err) {
        console.error(`Error fetching count for ${tab}`, err);
        newCounts[tab] = 0;
      }
    }
    setCounts(newCounts);
  };
  
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
  
  // On mount & when activeTab changes, fetch passes & counts
  useEffect(() => {
    if (user?.location && user?.department) {
      fetchCounts();
      fetchData(activeTab);
    }
  }, [user?.location, user?.department, activeTab]);
  
  // Filter and sort passes based on search term and sort config
  useEffect(() => {
    let result = passes;
    
    // Apply search term
    if (searchTerm.trim() !== "") {
      result = result.filter(
        (p) =>
          p.gate_pass_id.toString().includes(searchTerm.toLowerCase()) ||
          (p.description &&
            p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.location &&
            p.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle date sorting
        if (sortConfig.key === 'request_date') {
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
    
    setFilteredPasses(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, passes, sortConfig]);
  
  // Fetch detailed data for a gate pass on clicking details button
  const handleViewDetails = async (id) => {
    try {
      const res = await fetchGatePassWithMaterials(id);
      const data = res.data;
      const requesterDetails = {
        requester_name: data.requester_name || "N/A",
        requester_email: data.requester_email || "N/A",
        requester_role: data.requester_role || "N/A",
        requester_phone: data.requester_phone || "N/A",
        requester_location: data.requester_location || "N/A",
      };
      setDetailRow({ ...data, ...requesterDetails });
    } catch (error) {
      console.error("Error fetching gate pass details:", error);
      setBanner({ show: true, message: 'Failed to load details. Please try again.', type: 'danger' });
    }
  };
  
  // Accept a pass
  const handleAccept = async (id) => {
    try {
      await acceptDelivery(id, user.id);
      setBanner({ show: true, message: 'Delivery accepted successfully!', type: 'success' });
      await fetchData(activeTab); // reload current tab data
      await fetchCounts(); // refresh badges
      setAcceptId(null);
    } catch (error) {
      console.error("Accept failed:", error);
      setBanner({ show: true, message: 'Failed to accept delivery. Please try again.', type: 'danger' });
    }
  };
  
  // Reject a pass
  const handleReject = async () => {
    if (!comment.trim()) {
      setBanner({ show: true, message: 'Please enter a problem description.', type: 'warning' });
      return;
    }
    try {
      await rejectDelivery(rejectId, comment, user.id);
      setBanner({ show: true, message: 'Delivery issue reported successfully!', type: 'success' });
      await fetchData(activeTab); // reload current tab data
      await fetchCounts(); // refresh badges
      setRejectId(null);
      setComment("");
    } catch (error) {
      console.error("Reject failed:", error);
      setBanner({ show: true, message: 'Failed to report issue. Please try again.', type: 'danger' });
    }
  };
  
  // Export to CSV function
  const exportToCSV = () => {
    const headers = ["Gate Pass ID", "Date", "From Location", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredPasses.map(pass => 
        [
          pass.gate_pass_id, 
          formatDate(pass.request_date), 
          pass.location || "",
          activeTab
        ].join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `gatepass-deliveries-${activeTab.toLowerCase()}.csv`);
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
  
  // Tab configuration
  const TABS = [
    { id: 'Pending', label: 'Pending' },
    { id: 'Accepted', label: 'Accepted' },
    { id: 'Rejected', label: 'Rejected' },
  ];
  
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
              <h3 className="mb-2 fw-bold">Gate Pass Delivery Acceptance </h3>
              <p className="text-muted mb-1">Manage and track gate pass deliveries</p>
            </div>
            <div className="d-flex">
              <InputGroup style={{ width: "320px" }} className="me-3 shadow-sm">
                <InputGroup.Text className="bg-white border-end-0">
                  <BiSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by ID, description, or location..."
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
                onClick={() => { fetchCounts(); fetchData(activeTab); }} 
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
                    {counts[t.id] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-3 shadow-sm p-1">
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
              <h5 className="mb-0 fw-semibold">
                {activeTab} Deliveries 
                <span className="badge bg-secondary rounded-pill ms-2">{filteredPasses.length}</span>
              </h5>
            </div>
            
            {/* Loading Spinner */}
            {loading && (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading delivery data...</p>
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
                          onClick={() => requestSort('location')}
                          style={{ cursor: 'pointer' }}
                        >
                          From Location
                          {sortConfig.key === 'location' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        <th>Status</th>
                        <th style={{ width: 140 }} className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPasses.length > 0 ? (
                        currentPasses.map((p) => (
                          <tr key={p.gate_pass_id} className="transition-hover">
                            <td className="fw-bold">
                              <div className="d-flex align-items-center">
                                <span className="badge bg-primary bg-opacity-10 me-2" style={{ color: '#0d6efd' }}>
                                  REQ
                                </span>
                                {p.gate_pass_id}
                              </div>
                            </td>
                            <td>{formatDate(p.request_date)}</td>
                            <td>{p.location || "N/A"}</td>
                            <td>
                              <span className={`badge ${
                                activeTab === 'Accepted' ? 'bg-success' :
                                activeTab === 'Rejected' ? 'bg-danger' : 'bg-warning'
                              }`}>
                                {activeTab}
                              </span>
                            </td>
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
                                
                                {/* Only show accept/reject buttons on Pending tab */}
                                {activeTab === "Pending" && (
                                  <>
                                    <Button
                                      variant="light"
                                      className="rounded-circle me-1 p-2 action-btn text-success"
                                      onClick={() => setAcceptId(p.gate_pass_id)}
                                      title="Accept"
                                    >
                                      <CheckCircle />
                                    </Button>
                                    <Button
                                      variant="light"
                                      className="rounded-circle p-2 action-btn text-danger"
                                      onClick={() => setRejectId(p.gate_pass_id)}
                                      title="Report Issue"
                                    >
                                      <ExclamationOctagon />
                                    </Button>
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
                                    <Dropdown.Item onClick={() => handleViewDetails(p.gate_pass_id)}>
                                      <EyeFill className="me-2" /> View Details
                                    </Dropdown.Item>
                                    {activeTab === "Pending" && (
                                      <>
                                        <Dropdown.Item onClick={() => setAcceptId(p.gate_pass_id)}>
                                          <CheckCircle className="me-2 text-success" /> Accept
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => setRejectId(p.gate_pass_id)}>
                                          <ExclamationOctagon className="me-2 text-danger" /> Report Issue
                                        </Dropdown.Item>
                                      </>
                                    )}
                                  </Dropdown.Menu>
                                </Dropdown>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-5">
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
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPasses.length)} of {filteredPasses.length} deliveries
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
                Gate Pass Details - REQ-{detailRow?.gate_pass_id}
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
                          <span>{detailRow.request_type || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Status:</span>
                          <span>
                            <span className={`badge ${
                              detailRow.status === 'Accepted' ? 'bg-success' :
                              detailRow.status === 'Rejected' ? 'bg-danger' : 'bg-warning'
                            }`}>
                              {detailRow.status || "N/A"}
                            </span>
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Date:</span>
                          <span>{formatDate(detailRow.request_date)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Time:</span>
                          <span>{detailRow.request_time || "N/A"}</span>
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
                          <span>{detailRow.requester_name}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Email:</span>
                          <span>{detailRow.requester_email}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Role:</span>
                          <span>{detailRow.requester_role}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Phone:</span>
                          <span>{detailRow.requester_phone}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Location:</span>
                          <span>{detailRow.requester_location}</span>
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
                          <span>{detailRow.from_location || detailRow.location || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Destination:</span>
                          <span>{detailRow.destination_address || "N/A"}</span>
                        </div>
                        {detailRow.receiver_name && (
                          <div className="detail-item">
                            <span className="detail-label">Receiver Name:</span>
                            <span>{detailRow.receiver_name}</span>
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
                        <p className="detail-content">{detailRow.purpose || "N/A"}</p>
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
                          <span>{detailRow.vehicle_number || detailRow.vehicle_no || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Driver Name:</span>
                          <span>{detailRow.driver_name || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Driver Contact:</span>
                          <span>{detailRow.driver_contact || "N/A"}</span>
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
                        <div className="table-container">
                          <Table striped bordered hover className="w-100">
                            <thead>
                              <tr>
                                <th style={{ width: '25%' }}>Description</th>
                                <th style={{ width: '15%' }}>Serial Number</th>
                                <th style={{ width: '10%' }}>Quantity</th>
                                <th style={{ width: '10%' }}>UOM</th>
                                <th style={{ width: '10%' }}>Returnable</th>
                                <th style={{ width: '15%' }}>Return Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailRow.materials &&
                              typeof detailRow.materials === "string" ? (
                                JSON.parse(detailRow.materials).map(
                                  (material, index) => (
                                    <tr key={index}>
                                      <td>{material.description}</td>
                                      <td>
                                        {material.serialNumber ||
                                          material.serial_number ||
                                          "N/A"}
                                      </td>
                                      <td>{material.quantity || material.qty}</td>
                                      <td>{material.uom || "N/A"}</td>
                                      <td>
                                        <span className={`badge ${material.isReturnable || material.returnable ? 'bg-success' : 'bg-secondary'}`}>
                                          {material.isReturnable || material.returnable
                                            ? "Yes"
                                            : "No"}
                                        </span>
                                      </td>
                                      <td>
                                        {formatDate(material.returnDate || material.return_date)}
                                      </td>
                                    </tr>
                                  )
                                )
                              ) : detailRow.materials ? (
                                detailRow.materials.map((material, index) => (
                                  <tr key={index}>
                                    <td>
                                      {material.description || material.item_name}
                                    </td>
                                    <td>
                                      {material.serialNumber ||
                                        material.serial_number ||
                                        "N/A"}
                                    </td>
                                    <td>{material.quantity || material.qty}</td>
                                    <td>{material.uom || "N/A"}</td>
                                    <td>
                                      <span className={`badge ${material.isReturnable || material.returnable ? 'bg-success' : 'bg-secondary'}`}>
                                        {material.isReturnable || material.returnable
                                          ? "Yes"
                                          : "No"}
                                      </span>
                                    </td>
                                    <td>
                                      {formatDate(material.returnDate || material.return_date)}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="6" className="text-center py-3">
                                    <div className="text-muted">
                                      <i className="bi bi-inbox me-2" style={{ fontSize: '1.5rem' }}></i>No materials listed
                                    </div>
                                  </td>
                                </tr>
                              )}
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
          
          {/* Accept Confirmation Modal */}
          <Modal show={!!acceptId} onHide={() => setAcceptId(null)} centered className="fade" fullscreen="sm-down">
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold">Confirm Acceptance</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              <div className="text-center">
                <div className="mb-3">
                  <div className="bg-success bg-opacity-10 rounded-circle p-4 d-inline-block">
                    <i className="bi bi-check-lg" style={{ fontSize: '3rem', color: '#198754' }}></i>
                  </div>
                </div>
                <p>Are you sure you received all the items in good condition?</p>
              </div>
            </Modal.Body>
            <Modal.Footer className="border-top-0 pt-0">
              <Button variant="outline-secondary" onClick={() => setAcceptId(null)}>
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={async () => {
                  await handleAccept(acceptId);
                }}
              >
                Confirm Accept
              </Button>
            </Modal.Footer>
          </Modal>
          
          {/* Reject Issue Modal */}
          <Modal show={!!rejectId} onHide={() => setRejectId(null)} centered className="fade" fullscreen="sm-down">
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold">Report Delivery Issue</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              <div className="text-center mb-3">
                <div className="bg-danger bg-opacity-10 rounded-circle p-4 d-inline-block mb-3">
                  <i className="bi bi-exclamation-octagon" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
                </div>
              </div>
              <Form.Group>
                <Form.Label>Describe the problem</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. items damaged"
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="border-top-0 pt-0">
              <Button variant="outline-secondary" onClick={() => setRejectId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await handleReject();
                }}
              >
                Submit Issue
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
      
      {/* Modern CSS Styles */}
      <style jsx>{`
        .delivery-container {
          min-height: 100vh;
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
        
        .table-container {
          width: 100%;
          overflow-x: auto;
        }
        
        .table-container table {
          min-width: 800px;
        }
        
        /* Mobile-specific styles */
        @media (max-width: 767px) {
          .delivery-container {
            padding: 0;
          }
          
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
          
          .table-container table {
            min-width: 600px;
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

export default GatepassDelivery;