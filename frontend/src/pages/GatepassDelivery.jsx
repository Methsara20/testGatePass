import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  fetchDeliveries,
  acceptDelivery,
  rejectDelivery,
} from "../services/deliveryService";
import { Modal, Button, Form } from "react-bootstrap";

const GatepassDelivery = () => {
  const [passes, setPasses] = useState([]);
  const [rejectId, setRejectId] = useState(null);
  const [comment, setComment] = useState("");
  const [acceptId, setAcceptId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchDeliveries().then((res) => {
      if (isMounted) setPasses(res.data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  /* ----------  Accept with confirmation  ---------- */
  const handleAccept = async (id) => {
    // Quick, built-in confirmation. Swap for a Modal if you want fancier UX
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

        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Date</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {passes.map((p) => (
                <tr key={p.gate_pass_id}>
                  <td className="fw-bold">{`REQ-${p.gate_pass_id}`}</td>
                  <td>{p.item_name}</td>
                  <td>{p.quantity}</td>
                  <td>{p.request_date}</td>
                  <td>{p.location}</td>
                  <td>
                    {/* Accept button with confirmation modal */}
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => setAcceptId(p.gate_pass_id)}
                    >
                      <i className="bi bi-check-lg me-1" />
                      
                    </Button>{" "}

                    {/* Reject button with issue reporting modal */}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setRejectId(p.gate_pass_id)}
                    >
                      {/*  ! octagon icon before text  */}
                      <i className="bi bi-exclamation-octagon me-1" />
                    </Button>
                  </td>
                </tr>
              ))}
              {passes.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No deliverable passes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* Reject-Issue modal (unchanged) */}
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
