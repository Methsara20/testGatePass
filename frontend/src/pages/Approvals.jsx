import React, { useEffect, useState } from 'react';
import { fetchSummary, approvePass, rejectPass, fetchGatePassWithMaterials } from '../services/approvalService';
import { Modal, Button, Table, InputGroup, Form } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Sidebar from '../components/Sidebar';
import { BiSearch } from "react-icons/bi";
import { getUserById } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Approvals = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('Pending');
  const [lists, setLists] = useState({ Pending: [], Approved: [], Rejected: [] });
  const [approveId, setApproveId] = useState(null);
  const [rejectId, setRejectId] = useState(null); 
  const [detailRow, setDetailRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPasses, setFilteredPasses] = useState([]);
  const [requesterDetails, setRequesterDetails] = useState(null);

  /* fetch helper */
  // const load = () =>
  //   fetchSummary()
  //     .then((r) => {
  //       setLists(r.data);
  //       setFilteredPasses(r.data[tab] || []);
  //     })
  //     .catch((e) => console.error('Load error', e));

  // useEffect(() => {      
  //   load();              
  // }, []);



  const load = () => {
    if (!user?.location || !user?.department) {
      console.log('User location or department not available:', { location: user?.location, department: user?.department });
      return;
    }
  
    console.log('Fetching for:', { location: user.location, department: user.department }); // Add this line
    
    fetchSummary(user.location, user.department) 
      .then((r) => {
        console.log('Fetched data:', r.data);
        setLists(r.data);
        setFilteredPasses(r.data[tab] || []);
      })
      .catch((e) => console.error('Load error', e));
  };
  
  useEffect(() => {      
    load();              
  }, [user?.location, user?.department, tab]);
  

  const doApprove = async () => {
    try {
      if (!user?.id) {
        toast.error('You must be logged in to approve requests');
        return;
      }
      
      // Show loading toast
      const toastId = toast.loading('Approving request...');
      
      await approvePass(approveId, user.id);
      
      // Update to success
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
      
      
      toast.error(
        error.response?.data?.message || 
        'Failed to approve request. Please try again.',
        {
          autoClose: 5000,
        }
      );
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

  /* row */
  const Row = ({ r }) => (
    <tr>
      <td className="fw-bold">{`REQ-${r.gate_pass_id}`}</td>
      <td>{r.request_type}</td>
      <td>
        <span
          className={`badge ${
            r.status === 'Approved'
              ? 'bg-success'
              : r.status === 'Rejected'
              ? 'bg-danger'
              : 'bg-warning'
          }`}
        >
          {r.status}
        </span>
      </td>
      <td>{r.request_date}</td>
      <td>{r.created_by}</td>
      <td>
        <i
          className="bi bi-eye text-primary me-3 cursor-pointer"
          onClick={() => handleViewDetails(r.gate_pass_id)}
        />
        {tab === 'Pending' && (
          <>
            <i
              className="bi bi-check-lg text-success me-3 cursor-pointer"
              onClick={() => setApproveId(r.gate_pass_id)}
            />
            <i
              className="bi bi-x-lg text-danger cursor-pointer"
              onClick={() => setRejectId(r.gate_pass_id)}
            />
          </>
        )}
      </td>
    </tr>
  );

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="p-4 flex-grow-1 w-100">
        <h4 className="mb-1">Approvals</h4>
        <p className="text-muted">
          Review and manage pending gate pass approvals.
        </p>

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
          {["Pending", "Approved", "Rejected"].map((t) => (
            <li className="nav-item" key={t}>
              <button
                className={`nav-link ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
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
          <table className="table align-middle">
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
                <Row r={r} key={r.gate_pass_id} />
              ))}
              {filteredPasses.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Approve modal */}
        <Modal show={!!approveId} onHide={() => setApproveId(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Approval</Modal.Title>
          </Modal.Header>
          <Modal.Body>Approve this gate-pass request?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setApproveId(null)}>
              Cancel
            </Button>
            <Button variant="success" onClick={doApprove}>
              Approve
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Reject modal */}
        <Modal show={!!rejectId} onHide={() => setRejectId(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Rejection</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to reject this request?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={doReject}>
              Reject
            </Button>
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
              Gate Pass Request Details - REQ-{detailRow?.gate_pass_id}
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
                      {requesterDetails?.department ||
                        detailRow.department ||
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
                                    material.serial_number}
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
                                  material.serial_number}
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

export default Approvals;