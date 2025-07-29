import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  fetchDeliveries,
  acceptDelivery,
  rejectDelivery,
} from "../services/deliveryService";
import { fetchGatePassWithMaterials } from "../services/approvalService";
import { useAuth } from "../context/AuthContext";
import { Modal, Button, Form, InputGroup, Table } from "react-bootstrap";
import { BiSearch, BiDetail } from "react-icons/bi";
import "bootstrap-icons/font/bootstrap-icons.css";

const GatepassDelivery = () => {
  const { user } = useAuth();
  const [passes, setPasses] = useState([]);
  const [filteredPasses, setFilteredPasses] = useState([]);
  const [rejectId, setRejectId] = useState(null);
  const [comment, setComment] = useState("");
  const [acceptId, setAcceptId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [detailRow, setDetailRow] = useState(null);


  // useEffect(() => {
  //   let isMounted = true;
  //   if (user?.location) { 
  //     fetchDeliveries(user.location).then((res) => {
  //       if (isMounted) {
  //         setPasses(res.data);
  //         setFilteredPasses(res.data);
  //       }
  //     });
  //   }
  //   return () => { isMounted = false; };
  // }, [user?.location]);

  useEffect(() => {
    let isMounted = true;
    if (user?.location && user?.department) {
      fetchDeliveries(user.location, user.department).then((res) => {
        if (isMounted) {
          setPasses(res.data);
          setFilteredPasses(res.data);
        }
      }).catch(err => console.error("Fetch Deliveries Error:", err));
    }
    return () => { isMounted = false; };
  }, [user?.location, user?.department]);
  

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredPasses(passes);
    } else {
      const filtered = passes.filter(
        (p) =>
          p.gate_pass_id.toString().includes(searchTerm.toLowerCase()) ||
          (p.description &&
            p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.location &&
            p.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPasses(filtered);
    }
  }, [searchTerm, passes]);

  const handleViewDetails = async (id) => {
    try {
      const res = await fetchGatePassWithMaterials(id);
      const data = res.data;
      
      
      const requesterDetails = {
        requester_name: data.requester_name || 'N/A',
        requester_email: data.requester_email || 'N/A',
        requester_role:  data.requester_role || 'N/A',
        requester_phone:  data.requester_phone || 'N/A',
        requester_location:  data.requester_location || 'N/A'
      };
  
      setDetailRow({
        ...data,
        ...requesterDetails
      });
    } catch (error) {
      console.error("Error fetching gate pass details:", error);
      alert("Failed to load details. Please try again.");
    }
  };

  const handleAccept = async (id) => {
    if (!window.confirm("Confirm all items were received in good condition?")) {
      return;
    }

    try {
      await acceptDelivery(id);
      const res = await fetchDeliveries();
      setPasses(res.data);
    } catch (error) {
      console.error("Accept failed:", error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectDelivery(rejectId, comment);
      const res = await fetchDeliveries();
      setPasses(res.data);
      setRejectId(null);
      setComment("");
    } catch (error) {
      console.error("Reject failed:", error);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="p-4 flex-grow-1 w-100">
        <h4 className="mb-3">Gate-Pass Delivery</h4>

        <div className="mb-3">
          <InputGroup>
            <InputGroup.Text>
              <BiSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by ID, description, or location..."
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

        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>From Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPasses.map((p) => (
                <tr key={p.gate_pass_id}>
                  <td className="fw-bold">{`REQ-${p.gate_pass_id}`}</td>
                  
                  <td>{p.request_date}</td>
                  <td>{p.location}</td>
                  <td>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => handleViewDetails(p.gate_pass_id)}
                      className="me-2"
                    >
                      <BiDetail />
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => setAcceptId(p.gate_pass_id)}
                      className="me-2"
                    >
                      <i className="bi bi-check-lg" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setRejectId(p.gate_pass_id)}
                    >
                      <i className="bi bi-exclamation-octagon" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredPasses.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    {passes.length === 0
                      ? "No deliverable passes"
                      : "No matching results found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Details Modal */}
      <Modal show={!!detailRow} onHide={() => setDetailRow(null)} centered size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Gate Pass Details - REQ-{detailRow?.gate_pass_id}</Modal.Title>
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
                  <p><strong>Name:</strong> {detailRow.requester_name}</p>
                  <p><strong>Email:</strong> {detailRow.requester_email}</p>
                  <p><strong>Role:</strong> {detailRow.requester_role}</p>
                  <p><strong>Phone:</strong> {detailRow.requester_phone}</p>
                  <p><strong>Location:</strong> {detailRow.requester_location}</p>
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

      {/* Accept Modal */}
      <Modal show={!!acceptId} onHide={() => setAcceptId(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Acceptance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you received all the items in good condition?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAcceptId(null)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={async () => {
              try {
                await acceptDelivery(acceptId);
                const res = await fetchDeliveries();
                setPasses(res.data);
                setAcceptId(null);
              } catch (error) {
                console.error("Accept failed:", error);
              }
            }}
          >
            Confirm Accept
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal show={!!rejectId} onHide={() => setRejectId(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Report Delivery Issue</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRejectId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleReject}>
            Submit Issue
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GatepassDelivery;