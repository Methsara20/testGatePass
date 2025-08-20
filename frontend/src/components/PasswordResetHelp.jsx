// src/components/PasswordResetHelp.jsx
import React from "react";
import { Modal, Button, ListGroup, InputGroup, FormControl } from "react-bootstrap";
import { Clipboard } from "react-bootstrap-icons";
import { IT_SUPPORT } from "../utils/support";

const PasswordResetHelp = ({ show, onHide }) => {
  const copy = (text) => navigator.clipboard.writeText(text);

  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title>Password Reset Help</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="small text-muted">
          Can’t log in?  Contact IT support and we’ll reset your password.
        </p>

        <ListGroup variant="flush">
          {IT_SUPPORT.map(({ type, value }) => (
            <ListGroup.Item key={value} className="d-flex align-items-center">
              <span className="me-auto">
                {type === "Email" ? (
                  <a href={`mailto:${value}`}>{value}</a>
                ) : (
                  <a href={`tel:${value.replace(/\s+/g, "")}`}>{value}</a>
                )}
              </span>

              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => copy(value)}
                title="Copy"
              >
                <Clipboard size={14} />
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="primary" onClick={onHide}>
          Got it
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PasswordResetHelp;
