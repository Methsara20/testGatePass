import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  fetchMyRequests,
  generateGatePassPDF,
  updatePass,
} from "../services/gatepassService";
import { fetchGatePassWithMaterials } from "../services/approvalService";
import { useAuth } from "../context/AuthContext";
import { Modal, Button, Table, InputGroup, Form, Spinner, Badge, Alert, Dropdown, Pagination } from "react-bootstrap";
import { BiSearch } from "react-icons/bi";
import { CheckCircleFill, XCircleFill, ThreeDotsVertical, EyeFill, PencilSquare, Printer, Download } from "react-bootstrap-icons";

const MyRequests = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("Pending");
  const [lists, setLists] = useState({
    Pending: [],
    Approved: [],
    Rejected: [],
    Cancelled: [],
  });
  const [detailRow, setDetailRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPasses, setFilteredPasses] = useState([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: '', type: 'success' });
  
  // Print confirmation states
  const [showPrintConfirmation, setShowPrintConfirmation] = useState(false);
  const [gatePassToPrint, setGatePassToPrint] = useState(null);
  const [isDuplicatePrint, setIsDuplicatePrint] = useState(false);
  const [printCount, setPrintCount] = useState(0);
  
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
    { id: 'Cancelled', label: 'Cancelled' }
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
  
  useEffect(() => {
    if (user) {
      fetchMyRequests(user.id)
        .then((res) => {
          setLists(res.data);
          setFilteredPasses(res.data[tab] || []);
        })
        .catch((err) => {
          console.error("MyRequests load", err);
          setBanner({ show: true, message: 'Failed to load requests. Please try again.', type: 'danger' });
        });
    }
  }, [user]);
  
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
            p.department.toLowerCase().includes(searchTerm.toLowerCase()))
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
        
        // Handle status sorting
        if (sortConfig.key === 'status') {
          const statusOrder = { 'Approved': 1, 'Rejected': 2, 'Cancelled': 3, 'Pending': 4 };
          aValue = statusOrder[aValue] || 5;
          bValue = statusOrder[bValue] || 5;
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
  
  useEffect(() => {
    setFilteredPasses(memoizedFilteredPasses);
    setCurrentPage(1); // Reset to first page when filters change
  }, [memoizedFilteredPasses]);
  
  // Export to CSV function
  const exportToCSV = () => {
    const headers = ["Gate Pass ID", "Type", "Status", "Date", "Location"];
    const csvContent = [
      headers.join(","),
      ...filteredPasses.map(pass => 
        [
          pass.gate_pass_id, 
          pass.request_type,
          pass.status,
          formatDate(pass.request_date),
          pass.location
        ].join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `my-requests-${tab.toLowerCase()}.csv`);
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
  
  const handleViewDetails = async (id) => {
    try {
      const res = await fetchGatePassWithMaterials(id);
      setDetailRow({
        ...res.data,
        requester_name:
          res.data.requester_name || res.data.full_name || res.data.created_by,
        requester_email: res.data.requester_email || res.data.email || "N/A",
        requester_role: res.data.requester_role || res.data.role || "N/A",
        requester_phone: res.data.requester_phone || "N/A",
        requester_location: res.data.requester_location || "N/A",
        from_department:
          res.data.department || res.data.requester_role || "N/A",
        to_department:
          res.data.to_department_internal || res.data.to_department || "N/A",
      });
    } catch (error) {
      console.error("Error fetching gate pass details:", error);
      setBanner({ show: true, message: 'Failed to load details. Please try again.', type: 'danger' });
    }
  };
  
  const handleEditRequest = async (id) => {
    try {
      const res = await fetchGatePassWithMaterials(id);
      console.log("Edit API Response:", res.data);
      
      let materials = [];
      if (res.data.materials) {
        try {
          materials = typeof res.data.materials === 'string' 
            ? JSON.parse(res.data.materials) 
            : res.data.materials;
        } catch (e) {
          console.error('Error parsing materials for edit:', e);
          materials = [];
        }
      }
      setEditRow({
        ...res.data,
        materials: materials || []
      });
    } catch (error) {
      console.error("Error loading edit request:", error);
      setBanner({ show: true, message: 'Failed to load gate pass for editing. Please try again.', type: 'danger' });
    }
  };
  
  const handleSaveEdit = async () => {
    try {
      console.log('Saving edit for gate pass:', editRow.gate_pass_id);
      
      const updateData = {
        ...editRow,
        materials: JSON.stringify(editRow.materials || [])
      };
      
      console.log('Data being sent to backend:', updateData);
      
      const response = await updatePass(editRow.gate_pass_id, updateData);
      console.log('Backend response:', response);
      
      setBanner({ show: true, message: 'Gate pass updated successfully!', type: 'success' });
      setEditRow(null);
      
      const refreshed = await fetchMyRequests(user.id);
      setLists(refreshed.data);
      setFilteredPasses(refreshed.data[tab] || []);
    } catch (error) {
      console.error("Error saving edit:", error);
      setBanner({ show: true, message: 'Failed to update gate pass. Please try again.', type: 'danger' });
    }
  };
  
  const handleEditMaterialChange = (index, field, value) => {
    const updatedMaterials = [...editRow.materials];
    updatedMaterials[index][field] = value;
    setEditRow({ ...editRow, materials: updatedMaterials });
  };
  
  const handleAddMaterial = () => {
    const newMaterial = {
      description: '',
      serial_number: '',
      quantity: '',
      uom: '',
      returnable: false,
      return_date: ''
    };
    setEditRow({
      ...editRow,
      materials: [...(editRow.materials || []), newMaterial]
    });
  };
  
  const handleRemoveMaterial = (index) => {
    const updatedMaterials = editRow.materials.filter((_, i) => i !== index);
    setEditRow({ ...editRow, materials: updatedMaterials });
  };
  
  // Print confirmation functions
  const handlePrintConfirmation = (gatePassId) => {
    const gatePass = lists.Approved.find((p) => p.gate_pass_id === gatePassId);
    if (!gatePass) {
      setBanner({ show: true, message: 'Only approved gate passes can be printed', type: 'warning' });
      return;
    }
    
    // Check if this is a duplicate print
    const currentPrintCount = gatePass.print_count || 0;
    const isDuplicate = currentPrintCount > 0;
    
    setGatePassToPrint(gatePassId);
    setIsDuplicatePrint(isDuplicate);
    setPrintCount(currentPrintCount);
    setShowPrintConfirmation(true);
  };
  
  const confirmPrint = async () => {
    setShowPrintConfirmation(false);
    if (!gatePassToPrint) return;
    
    try {
      const gatePass = lists.Approved.find((p) => p.gate_pass_id === gatePassToPrint);
      if (!gatePass) {
        setBanner({ show: true, message: 'Only approved gate passes can be printed', type: 'warning' });
        return;
      }
      
      console.log("Attempting to generate PDF for gate pass:", gatePassToPrint);
      const response = await generateGatePassPDF(gatePassToPrint);
      console.log("PDF response received:", response.status);
      
      if (!response.data || response.data.size === 0) {
        throw new Error("Empty or invalid PDF response from server");
      }
      
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      console.log("PDF blob created, size:", pdfBlob.size);
      const fileURL = URL.createObjectURL(pdfBlob);
      const filename = `gate_pass_${gatePassToPrint}.pdf`;
      
      const newWindow = window.open(fileURL, "_blank");
      if (!newWindow) {
        downloadPDF(fileURL, filename);
      } else {
        setTimeout(() => {
          if (confirm("Would you like to download the PDF as well?")) {
            downloadPDF(fileURL, filename);
          }
        }, 1000);
      }
      
      setTimeout(() => {
        URL.revokeObjectURL(fileURL);
      }, 30000);
      
      // Update print count in the local state
      const updatedLists = { ...lists };
      const gatePassIndex = updatedLists.Approved.findIndex(p => p.gate_pass_id === gatePassToPrint);
      if (gatePassIndex !== -1) {
        updatedLists.Approved[gatePassIndex] = {
          ...updatedLists.Approved[gatePassIndex],
          print_count: (updatedLists.Approved[gatePassIndex].print_count || 0) + 1
        };
        setLists(updatedLists);
      }
      
      console.log("PDF processed successfully");
      setBanner({ show: true, message: 'PDF generated successfully!', type: 'success' });
    } catch (error) {
      console.error("PDF generation error:", error);
      if (error.response) {
        const status = error.response.status;
        if (status === 403) {
          setBanner({ show: true, message: 'This gate pass is not approved for printing', type: 'danger' });
        } else if (status === 404) {
          setBanner({ show: true, message: 'Gate pass not found', type: 'danger' });
        } else if (status === 500) {
          setBanner({ show: true, message: 'Server error while generating PDF. Please try again.', type: 'danger' });
        } else {
          setBanner({ 
            show: true, 
            message: `Error ${status}: ${error.response.data?.message || 'Failed to generate PDF'}`, 
            type: 'danger' 
          });
        }
      } else if (error.message.includes("Popup blocked")) {
        setBanner({ show: true, message: 'Please allow popups for this site to view the PDF', type: 'warning' });
      } else {
        setBanner({ show: true, message: `Failed to generate PDF: ${error.message}`, type: 'danger' });
      }
    } finally {
      setGatePassToPrint(null);
    }
  };
  
  const cancelPrint = () => {
    setShowPrintConfirmation(false);
    setGatePassToPrint(null);
  };
  
  const downloadPDF = (fileURL, filename) => {
    const link = document.createElement("a");
    link.href = fileURL;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadGatePass = async (gatePassId) => {
    try {
      const gatePass = lists.Approved.find((p) => p.gate_pass_id === gatePassId);
      if (!gatePass) {
        setBanner({ show: true, message: 'Only approved gate passes can be downloaded', type: 'warning' });
        return;
      }
      const response = await generateGatePassPDF(gatePassId);
      if (!response.data || response.data.size === 0) {
        throw new Error("Empty or invalid PDF response from server");
      }
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(pdfBlob);
      const filename = `gate_pass_${gatePassId}.pdf`;
      downloadPDF(fileURL, filename);
      setTimeout(() => {
        URL.revokeObjectURL(fileURL);
      }, 1000);
      setBanner({ show: true, message: 'PDF downloaded successfully!', type: 'success' });
    } catch (error) {
      console.error("PDF download error:", error);
      setBanner({ show: true, message: `Failed to download PDF: ${error.message}`, type: 'danger' });
    }
  };
  
  const Row = React.memo(({ r, formatDate, handleViewDetails, handleEditRequest, handlePrintConfirmation, handleDownloadGatePass }) => (
    <tr className="align-middle transition-hover">
      <td className="fw-bold">
        <div className="d-flex align-items-center">
          <span className="badge bg-primary bg-opacity-10 me-2" style={{ color: '#0d6efd' }}>
            REQ
          </span>
          {r.gate_pass_id}
        </div>
      </td>
      <td>{r.request_type}</td>
      <td>
        <span
          className={`badge ${
            r.status === "Approved"
              ? "bg-success"
              : r.status === "Rejected"
              ? "bg-danger"
              : r.status === "Cancelled"
              ? "bg-secondary"
              : "bg-warning"
          }`}
        >
          {r.status}
        </span>
      </td>
      <td>{formatDate(r.request_date)}</td>
      <td>{r.location}</td>
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
          {r.status === "Pending" && (
            <Button 
              variant="light" 
              className="rounded-circle me-1 p-2 action-btn text-warning"
              onClick={() => handleEditRequest(r.gate_pass_id)}
              title="Edit Request"
            >
              <PencilSquare />
            </Button>
          )}
          {r.status === "Approved" && (
            <>
              <Button 
                variant="light" 
                className="rounded-circle me-1 p-2 action-btn text-success"
                onClick={() => handlePrintConfirmation(r.gate_pass_id)}
                title={r.print_count > 0 ? "Print Duplicate" : "Print Original"}
              >
                <Printer />
                {r.print_count > 0 && (
                  <Badge pill bg="warning" className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: '0.6rem' }}>
                    {r.print_count}
                  </Badge>
                )}
              </Button>
              {/* <Button 
                variant="light" 
                className="rounded-circle p-2 action-btn text-info"
                onClick={() => handleDownloadGatePass(r.gate_pass_id)}
                title="Download PDF"
              >
                <Download />
              </Button> */}
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
              {r.status === "Pending" && (
                <Dropdown.Item onClick={() => handleEditRequest(r.gate_pass_id)}>
                  <PencilSquare className="me-2 text-warning" /> Edit Request
                </Dropdown.Item>
              )}
              {r.status === "Approved" && (
                <>
                  <Dropdown.Item onClick={() => handlePrintConfirmation(r.gate_pass_id)}>
                    <Printer className="me-2 text-success" /> 
                    {r.print_count > 0 ? `Print (${r.print_count} prints)` : 'Print PDF'}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDownloadGatePass(r.gate_pass_id)}>
                    <Download className="me-2 text-info" /> Download PDF
                  </Dropdown.Item>
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
              <h3 className="mb-2 fw-bold">My Gate Pass Requests</h3>
              <p className="text-muted mb-1">View and manage your gate pass requests</p>
            </div>
            <div className="d-flex">
              <InputGroup style={{ width: "320px" }} className="me-3 shadow-sm">
                <InputGroup.Text className="bg-white border-end-0">
                  <BiSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by ID, location or department..."
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
                onClick={() => {
                  fetchMyRequests(user.id)
                    .then((res) => {
                      setLists(res.data);
                      setFilteredPasses(res.data[tab] || []);
                    })
                    .catch((err) => {
                      console.error("MyRequests load", err);
                      setBanner({ show: true, message: 'Failed to load requests. Please try again.', type: 'danger' });
                    });
                }}
              >
                Refresh
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
                  onClick={() => {
                    setTab(t.id);
                    setFilteredPasses(lists[t.id] || []);
                  }}
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
                My Requests - {tab}
                <span className="badge bg-secondary rounded-pill ms-2">{filteredPasses.length}</span>
              </h5>
            </div>
            
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
                    <th>Location</th>
                    <th style={{ width: 140 }} className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPasses.length > 0 ? (
                    currentPasses.map((r) => (
                      <Row 
                        key={r.gate_pass_id} 
                        r={r} 
                        formatDate={formatDate}
                        handleViewDetails={handleViewDetails}
                        handleEditRequest={handleEditRequest}
                        handlePrintConfirmation={handlePrintConfirmation}
                        handleDownloadGatePass={handleDownloadGatePass}
                      />
                    ))
                  ) : (
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
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPasses.length)} of {filteredPasses.length} requests
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
          </div>
          
          {/* Enhanced Edit Modal with Add Materials Button */}
          <Modal show={!!editRow} onHide={() => setEditRow(null)} centered size="lg" className="fade" fullscreen="sm-down">
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold">Edit Request - REQ-{editRow?.gate_pass_id}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              {editRow && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Purpose</Form.Label>
                    <Form.Control
                      type="text"
                      value={editRow.purpose || ''}
                      onChange={(e) => setEditRow({ ...editRow, purpose: e.target.value })}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Additional Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={editRow.additional_notes || ''}
                      onChange={(e) => setEditRow({ ...editRow, additional_notes: e.target.value })}
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="detail-card-title">
                      <i className="bi bi-box-seam me-2" style={{ fontSize: '1.2rem' }}></i>
                      Materials
                    </h6>
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={handleAddMaterial}
                    >
                      <i className="bi bi-plus-circle me-1"></i>
                      Add Material
                    </Button>
                  </div>
                  
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Serial No.</th>
                        <th>Qty</th>
                        <th>UOM</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editRow.materials && editRow.materials.length > 0 ? (
                        editRow.materials.map((m, idx) => (
                          <tr key={idx}>
                            <td>
                              <Form.Control
                                type="text"
                                value={m.description || ''}
                                onChange={(e) => handleEditMaterialChange(idx, 'description', e.target.value)}
                                placeholder="Enter description"
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="text"
                                value={m.serial_number || m.serialNumber || ''}
                                onChange={(e) => handleEditMaterialChange(idx, 'serial_number', e.target.value)}
                                placeholder="Serial number"
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="number"
                                value={m.quantity || m.qty || ''}
                                onChange={(e) => handleEditMaterialChange(idx, 'quantity', e.target.value)}
                                placeholder="Qty"
                                min="1"
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="text"
                                value={m.uom || ''}
                                onChange={(e) => handleEditMaterialChange(idx, 'uom', e.target.value)}
                                placeholder="Unit"
                              />
                            </td>
                            <td>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleRemoveMaterial(idx)}
                                title="Remove material"
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-3">
                            No materials added yet. Click "Add Material" to add items.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </>
              )}
            </Modal.Body>
            <Modal.Footer className="border-top-0 pt-0">
              <Button variant="outline-secondary" onClick={() => setEditRow(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
            </Modal.Footer>
          </Modal>
          
          {/* Enhanced Details modal */}
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
                Request Details - REQ-{detailRow?.gate_pass_id}
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
                              detailRow.status === 'Rejected' ? 'bg-danger' :
                              detailRow.status === 'Cancelled' ? 'bg-secondary' : 'bg-warning'
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
                        {detailRow.print_count > 0 && (
                          <div className="detail-item">
                            <span className="detail-label">Print Count:</span>
                            <span>
                              <Badge bg="warning" text="dark">
                                {detailRow.print_count} {detailRow.print_count === 1 ? 'print' : 'prints'}
                              </Badge>
                            </span>
                          </div>
                        )}
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
                          <span>{detailRow.requester_name || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Email:</span>
                          <span>{detailRow.requester_email || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Phone:</span>
                          <span>{detailRow.requester_phone || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Location:</span>
                          <span>{detailRow.requester_location || "N/A"}</span>
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
                          <span className="detail-label">From Location:</span>
                          <span>{detailRow.from_location || detailRow.location}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">From Department:</span>
                          <span>{detailRow.from_department || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Destination:</span>
                          <span>
                            {detailRow.destination_type === "internal"
                              ? `${
                                  detailRow.to_location_internal ||
                                  detailRow.destination_address
                                }`
                              : detailRow.destination_address}
                          </span>
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
                          <span>{detailRow.vehicle_number || detailRow.vehicle_no || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Driver Name:</span>
                          <span>{detailRow.driver_name || "N/A"}</span>
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
                                      <td>{material.uom}</td>
                                      <td>
                                        {material.isReturnable
                                          ? "Yes"
                                          : material.returnable
                                          ? "Yes"
                                          : "No"}
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
                                    <td>{material.uom}</td>
                                    <td>
                                      {material.isReturnable
                                        ? "Yes"
                                        : material.returnable
                                        ? "Yes"
                                        : "No"}
                                    </td>
                                    <td>
                                      {formatDate(material.returnDate || material.return_date)}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="6" className="text-center">
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
              <Button variant="outline-secondary" onClick={() => setDetailRow(null)}>Close</Button>
            </Modal.Footer>
          </Modal>
          
          {/* Print Confirmation Modal - Updated for Duplicate Print Warning */}
          <Modal show={showPrintConfirmation} onHide={cancelPrint} centered>
            <Modal.Header closeButton>
              <Modal.Title>
                {isDuplicatePrint ? "Duplicate Print Alert" : "Confirm Print"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {isDuplicatePrint ? (
                <>
                  <div className="alert alert-warning d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>
                      <strong>This is a duplicate print.</strong> Do you want to re-print?
                    </div>
                  </div>
                  <p>
                    This gate pass has already been printed {printCount} time{printCount !== 1 ? 's' : ''}.
                    This print will be recorded as print #{printCount + 1}.
                  </p>
                  <p>Please ensure your printer is ready before proceeding.</p>
                </>
              ) : (
                <>
                  <p>Are you sure you want to print this gate pass?</p>
                  <div className="alert alert-info">
                    <strong>Important:</strong> This will be considered as the <strong>original print</strong>. 
                    Any subsequent prints will be marked as <strong>duplicates</strong>.
                  </div>
                  <p>Please ensure your printer is ready before proceeding.</p>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={cancelPrint}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmPrint}>
                {isDuplicatePrint ? "Yes, Re-print Now" : "Yes, Print Now"}
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
        
        .action-btn {
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: relative;
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

export default MyRequests;