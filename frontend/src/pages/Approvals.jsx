import React, { useEffect, useState } from 'react';
import { fetchSummary, approvePass, rejectPass } from '../services/approvalService';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Sidebar from '../components/Sidebar';


const Approvals = () => {
  const [tab, setTab] = useState('Pending');
  const [lists, setLists] = useState({ Pending: [], Approved: [], Rejected: [] });
  const [approveId, setApproveId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);

  /* fetch helper */
  const load = () =>
    fetchSummary()
      .then((r) => setLists(r.data))
      .catch((e) => console.error('Load error', e));

      useEffect(() => {      
        load();              
      }, []); /* initial load */

  /* actions */
  const doApprove = async () => {
    await approvePass(approveId);
    setApproveId(null);
    load();
  };
  const doReject = async () => {
    await rejectPass(rejectId);
    setRejectId(null);
    load();
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
          onClick={() => setDetailRow(r)}
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
        <p className="text-muted">Review and manage pending gate-pass approvals.</p>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-3">
          {['Pending', 'Approved', 'Rejected'].map((t) => (
            <li className="nav-item" key={t}>
              <button
                className={`nav-link ${tab === t ? 'active' : ''}`}
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
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>User</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lists[tab]?.map((r) => (
                <Row r={r} key={r.gate_pass_id} />
              ))}
              {lists[tab]?.length === 0 && (
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

        {/* Details modal */}
        <Modal show={!!detailRow} onHide={() => setDetailRow(null)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Request Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {detailRow && (
              <div className="row g-3">
                <div className="col-md-6">
                  <strong>ID:</strong> REQ-{detailRow.gate_pass_id}
                </div>
                <div className="col-md-6">
                  <strong>Status:</strong> {detailRow.status}
                </div>
                <div className="col-md-6">
                  <strong>Type:</strong> {detailRow.request_type}
                </div>
                <div className="col-md-6">
                  <strong>Date:</strong> {detailRow.request_date}
                </div>
                <div className="col-md-6">
                  <strong>Time:</strong> {detailRow.request_time}
                </div>
                <div className="col-md-6">
                  <strong>Quantity:</strong> {detailRow.quantity}
                </div>
                <div className="col-12">
                  <strong>Item Name:</strong> {detailRow.item_name}
                </div>
                <div className="col-12">
                  <strong>Description:</strong>
                  <p className="mb-0">{detailRow.description}</p>
                </div>
                <div className="col-12">
                  <strong>Purpose:</strong>
                  <p className="mb-0">{detailRow.purpose}</p>
                </div>
                {detailRow.additional_notes && (
                  <div className="col-12">
                    <strong>Notes:</strong>
                    <p className="mb-0">{detailRow.additional_notes}</p>
                  </div>
                )}
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
