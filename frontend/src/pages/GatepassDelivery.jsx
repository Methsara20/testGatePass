import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  fetchDeliveries,
  acceptDelivery,
  rejectDelivery,
} from "../services/deliveryService";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import { BiSearch } from "react-icons/bi";

const GatepassDelivery = () => {
  const [passes, setPasses] = useState([]);
  const [filteredPasses, setFilteredPasses] = useState([]);
  const [rejectId, setRejectId] = useState(null);
  const [comment, setComment] = useState("");
  const [acceptId, setAcceptId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isMounted = true;
    fetchDeliveries().then((res) => {
      if (isMounted) {
        setPasses(res.data);
        setFilteredPasses(res.data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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

  /* ----------  Accept with confirmation  ---------- */
  const handleAccept = async (id) => {
    if (
      !window.confirm("Confirm that all items were received in good condition?")
    )
      return;

    try {
      await acceptDelivery(id);
      const res = await fetchDeliveries();
      setPasses(res.data);
    } catch (error) {
      console.error("Accept failed:", error);
    }
  };

  /* ----------  Reject flow stays identical  ---------- */
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

        {/* Improved Search Input */}
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
                <th>Description</th>
                <th>Qty</th>
                <th>Date</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPasses.map((p) => (
                <tr key={p.gate_pass_id}>
                  <td className="fw-bold">{`REQ-${p.gate_pass_id}`}</td>
                  <td>{p.description}</td>
                  <td>{p.qty}</td>
                  <td>{p.request_date}</td>
                  <td>{p.location}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => setAcceptId(p.gate_pass_id)}
                    >
                      <i className="bi bi-check-lg me-1" />
                    </Button>{" "}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setRejectId(p.gate_pass_id)}
                    >
                      <i className="bi bi-exclamation-octagon me-1" />
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

      {/* Modals remain unchanged */}
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