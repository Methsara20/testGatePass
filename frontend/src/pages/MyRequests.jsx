import React, { useEffect, useState } from "react";
import {
  fetchMyRequests,
  generateGatePassPDF,
  updatePass,
} from "../services/gatepassService";
import { fetchGatePassWithMaterials } from "../services/approvalService";
import { useAuth } from "../context/AuthContext";
import { Modal, Button, Table, InputGroup, Form } from "react-bootstrap";
import { BiSearch } from "react-icons/bi";


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

  useEffect(() => {
    if (user) {
      fetchMyRequests(user.id)
        .then((res) => {
          setLists(res.data);
          setFilteredPasses(res.data[tab] || []);
        })
        .catch((err) => console.error("MyRequests load", err));
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
            p.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.department &&
            p.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPasses(filtered);
    }
  }, [searchTerm, lists, tab]);

  const handleViewDetails = async (id) => {
    try {
      const res = await fetchGatePassWithMaterials(id);
      setDetailRow({
        ...res.data,
        // Add fallbacks for user details
        requester_name:
          res.data.requester_name || res.data.full_name || res.data.created_by,
        requester_email: res.data.requester_email || res.data.email || "N/A",
        requester_role: res.data.requester_role || res.data.role || "N/A",
        requester_phone: res.data.requester_phone || "N/A",
        requester_location: res.data.requester_location || "N/A",
        // Add department fields
        from_department:
          res.data.department || res.data.requester_role || "N/A",
        to_department:
          res.data.to_department_internal || res.data.to_department || "N/A",
      });
    } catch (error) {
      console.error("Error fetching gate pass details:", error);
    }
  };

  const handleEditRequest = async (id) => {
    try {
      const res = await fetchGatePassWithMaterials(id);
      console.log("Edit API Response:", res.data);
      
      // Parse materials if they're stored as string
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
      alert("Failed to load gate pass for editing. Please try again.");
    }
  };

  const handleSaveEdit = async () => {
    try {
      console.log('Saving edit for gate pass:', editRow.gate_pass_id);
      
      // Prepare data for update
      const updateData = {
        ...editRow,
        materials: JSON.stringify(editRow.materials || [])
      };
      
      console.log('Data being sent to backend:', updateData);
      
      const response = await updatePass(editRow.gate_pass_id, updateData);
      console.log('Backend response:', response);
      
      alert("Gate pass updated successfully!");
      setEditRow(null);
      
      // Refresh the data
      const refreshed = await fetchMyRequests(user.id);
      setLists(refreshed.data);
      setFilteredPasses(refreshed.data[tab] || []);
    } catch (error) {
      console.error("Error saving edit:", error);
      alert("Failed to update gate pass. Please try again.");
    }
  };

  const handleEditMaterialChange = (index, field, value) => {
    const updatedMaterials = [...editRow.materials];
    updatedMaterials[index][field] = value;
    setEditRow({ ...editRow, materials: updatedMaterials });
  };

  // Add new material function
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

  // Remove material function
  const handleRemoveMaterial = (index) => {
    const updatedMaterials = editRow.materials.filter((_, i) => i !== index);
    setEditRow({ ...editRow, materials: updatedMaterials });
  };

  // Updated frontend function with custom filename and both view/download options
  const handlePrintGatePass = async (gatePassId) => {
    try {
      const gatePass = lists.Approved.find(
        (p) => p.gate_pass_id === gatePassId
      );
      if (!gatePass) {
        alert("Only approved gate passes can be printed");
        return;
      }

      console.log("Attempting to generate PDF for gate pass:", gatePassId);

      const response = await generateGatePassPDF(gatePassId);

      console.log("PDF response received:", response.status);

      // Check if response contains data
      if (!response.data || response.data.size === 0) {
        throw new Error("Empty or invalid PDF response from server");
      }

      // Create a blob from the PDF data
      const pdfBlob = new Blob([response.data], {
        type: "application/pdf",
      });

      console.log("PDF blob created, size:", pdfBlob.size);

      // Create a URL for the blob
      const fileURL = URL.createObjectURL(pdfBlob);

      // Custom filename
      const filename = `gate_pass_${gatePassId}.pdf`;

      // Option 1: Open in new tab for viewing
      const newWindow = window.open(fileURL, "_blank");
      if (!newWindow) {
        // Fallback if popup blocked - download instead
        downloadPDF(fileURL, filename);
      } else {
        // Also provide download option
        setTimeout(() => {
          if (confirm("Would you like to download the PDF as well?")) {
            downloadPDF(fileURL, filename);
          }
        }, 1000);
      }

      // Clean up the URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(fileURL);
      }, 30000); // 30 seconds delay

      console.log("PDF processed successfully");
    } catch (error) {
      console.error("PDF generation error:", error);

      // More specific error messages
      if (error.response) {
        const status = error.response.status;
        if (status === 403) {
          alert("This gate pass is not approved for printing");
        } else if (status === 404) {
          alert("Gate pass not found");
        } else if (status === 500) {
          alert("Server error while generating PDF. Please try again.");
        } else {
          alert(
            `Error ${status}: ${
              error.response.data?.message || "Failed to generate PDF"
            }`
          );
        }
      } else if (error.message.includes("Popup blocked")) {
        alert("Please allow popups for this site to view the PDF");
      } else {
        alert(`Failed to generate PDF: ${error.message}`);
      }
    }
  };

  // Helper function to download PDF with custom filename
  const downloadPDF = (fileURL, filename) => {
    const link = document.createElement("a");
    link.href = fileURL;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Alternative: Direct download function (if you want download only)
  const handleDownloadGatePass = async (gatePassId) => {
    try {
      const gatePass = lists.Approved.find(
        (p) => p.gate_pass_id === gatePassId
      );
      if (!gatePass) {
        alert("Only approved gate passes can be downloaded");
        return;
      }

      const response = await generateGatePassPDF(gatePassId);

      if (!response.data || response.data.size === 0) {
        throw new Error("Empty or invalid PDF response from server");
      }

      const pdfBlob = new Blob([response.data], {
        type: "application/pdf",
      });

      const fileURL = URL.createObjectURL(pdfBlob);
      const filename = `gate_pass_${gatePassId}.pdf`;

      // Direct download
      downloadPDF(fileURL, filename);

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(fileURL);
      }, 1000);
    } catch (error) {
      console.error("PDF download error:", error);
      alert(`Failed to download PDF: ${error.message}`);
    }
  };

  // Updated Row component with edit option for pending requests only
  const Row = ({ r }) => (
    <tr>
      <td className="fw-bold">{`REQ-${r.gate_pass_id}`}</td>
      <td>{r.request_type}</td>
      <td>
        <span
          className={`badge ${
            r.status === "Approved"
              ? "bg-success"
              : r.status === "Rejected"
              ? "bg-danger"
              : "bg-warning"
          }`}
        >
          {r.status}
        </span>
      </td>
      <td>{r.request_date}</td>
      <td>{r.location}</td>
      <td>
        <i
          className="bi bi-eye text-primary cursor-pointer me-2"
          onClick={() => handleViewDetails(r.gate_pass_id)}
          title="View Details"
          style={{ cursor: 'pointer' }}
        />
        {/* Edit option only for pending requests */}
        {r.status === "Pending" && (
          <i
            className="bi bi-pencil-square text-warning cursor-pointer me-2"
            onClick={() => handleEditRequest(r.gate_pass_id)}
            title="Edit Request"
            style={{ cursor: 'pointer' }}
          />
        )}
        {r.status === "Approved" && (
          <>
            <i
              className="bi bi-printer text-success cursor-pointer me-2"
              onClick={() => handlePrintGatePass(r.gate_pass_id)}
              title={r.print_count > 0 ? "Print Duplicate" : "Print Original"}
              style={{ cursor: 'pointer' }}
            />
            <i
              className="bi bi-download text-info cursor-pointer"
              onClick={() => handleDownloadGatePass(r.gate_pass_id)}
              title="Download PDF"
              style={{ cursor: 'pointer' }}
            />
          </>
        )}
      </td>
    </tr>
  );

  return (
    <div className="d-flex">
      
            <div className="flex-grow-1">
        
      <div className="p-4 flex-grow-1 w-100">
        <h4 className="mb-3">My Gate Pass Requests</h4>

        {/* Improved Search Input */}
        <div className="mb-3">
          <InputGroup>
            <InputGroup.Text>
              <BiSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by ID, location or department..."
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
          {["Pending", "Approved", "Rejected", "Cancelled"].map((t) => (
            <li className="nav-item" key={t}>
              <button
                className={`nav-link ${tab === t ? "active" : ""}`}
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
                <th>Gate Pass No</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Location</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredPasses.map((r) => (
                <Row key={r.gate_pass_id} r={r} />
              ))}
              {filteredPasses.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No records
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Enhanced Edit Modal with Add Materials Button */}
      <Modal show={!!editRow} onHide={() => setEditRow(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Request - REQ-{editRow?.gate_pass_id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
                <h6>Materials</h6>
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
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      {/* Enhanced Details modal */}
      <Modal
        show={!!detailRow}
        onHide={() => setDetailRow(null)}
        centered
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Request Details - REQ-{detailRow?.gate_pass_id}
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
                    <strong>Status:</strong> {detailRow.status}
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
                    <strong>Name:</strong> {detailRow.requester_name || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong> {detailRow.requester_email || "N/A"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {detailRow.requester_phone || "N/A"}
                  </p>
                  <p>
                    <strong>Location:</strong>{" "}
                    {detailRow.requester_location || "N/A"}
                  </p>
                </div>
                <div className="col-md-4">
                  <h6>Destination Details</h6>
                  <p>
                    <strong>From Location:</strong>{" "}
                    {detailRow.from_location || detailRow.location}
                  </p>
                  <p>
                    <strong>To Department:</strong>{" "}
                    {detailRow.from_department || "N/A"}
                  </p>

                  <p>
                    <strong>Destination:</strong>{" "}
                    {detailRow.destination_type === "internal"
                      ? `${
                          detailRow.to_location_internal ||
                          detailRow.destination_address
                        }`
                      : detailRow.destination_address}
                  </p>
                  {detailRow.receiver_name && (
                    <p>
                      <strong>Receiver Name:</strong> {detailRow.receiver_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Rest of the modal content remains the same */}
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
                    {detailRow.vehicle_number || detailRow.vehicle_no || "N/A"}
                  </p>
                  <p>
                    <strong>Driver Name:</strong>{" "}
                    {detailRow.driver_name || "N/A"}
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
                                {material.returnDate ||
                                  material.return_date ||
                                  "N/A"}
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
                              {material.returnDate ||
                                material.return_date ||
                                "N/A"}
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
  );
};

export default MyRequests;