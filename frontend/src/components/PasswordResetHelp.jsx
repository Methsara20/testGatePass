// src/components/PasswordResetHelp.jsx
import React, { useState } from "react";
import { Modal, Button, ListGroup } from "react-bootstrap";
import { Clipboard, Check } from "react-bootstrap-icons";
import { IT_SUPPORT } from "../utils/support";

const PasswordResetHelp = ({ show, onHide }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [hoverStates, setHoverStates] = useState({
    contactItems: {},
    copyButtons: {}
  });

  const copy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleContactItemHover = (index, isHovering) => {
    setHoverStates(prev => ({
      ...prev,
      contactItems: {
        ...prev.contactItems,
        [index]: isHovering
      }
    }));
  };

  const handleCopyButtonHover = (index, isHovering) => {
    setHoverStates(prev => ({
      ...prev,
      copyButtons: {
        ...prev.copyButtons,
        [index]: isHovering
      }
    }));
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      size="md"
      style={{
        border: 'none',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold"> Assistance</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="pt-3">
        <p className="text-muted mb-4">
          Having trouble accessing your account? Please contact our IT support team for prompt assistance.
        </p>
        
        <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '5px' }}>
          <ListGroup variant="flush">
            {IT_SUPPORT.map((contact, index) => (
              <ListGroup.Item 
                key={contact.value} 
                className="d-flex align-items-center py-3 border-0"
                style={{
                  transition: 'all 0.2s ease',
                  borderRadius: '6px',
                  marginBottom: '5px',
                  ...(hoverStates.contactItems[index] ? {
                    backgroundColor: '#ffffff',
                    transform: 'translateX(5px)'
                  } : {})
                }}
                onMouseEnter={() => handleContactItemHover(index, true)}
                onMouseLeave={() => handleContactItemHover(index, false)}
              >
                <div className="flex-grow-1">
                  <div className="fw-medium text-secondary">{contact.type}</div>
                  {contact.type === "Email" ? (
                    <a 
                      href={`mailto:${contact.value}`} 
                      style={{ 
                        color: '#495057', 
                        fontWeight: 500, 
                        textDecoration: 'none',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#0d6efd'}
                      onMouseLeave={(e) => e.target.style.color = '#495057'}
                    >
                      {contact.value}
                    </a>
                  ) : (
                    <a 
                      href={`tel:${contact.value.replace(/\s+/g, "")}`} 
                      style={{ 
                        color: '#495057', 
                        fontWeight: 500, 
                        textDecoration: 'none',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#0d6efd'}
                      onMouseLeave={(e) => e.target.style.color = '#495057'}
                    >
                      {contact.value}
                    </a>
                  )}
                </div>
                
                <Button
                  variant="outline-primary"
                  size="sm"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...(hoverStates.copyButtons[index] ? {
                      transform: 'scale(1.1)',
                      backgroundColor: '#e7f1ff'
                    } : {})
                  }}
                  onClick={() => copy(contact.value, index)}
                  aria-label={`Copy ${contact.type}`}
                  onMouseEnter={() => handleCopyButtonHover(index, true)}
                  onMouseLeave={() => handleCopyButtonHover(index, false)}
                >
                  {copiedIndex === index ? (
                    <Check size={16} className="text-success" />
                  ) : (
                    <Clipboard size={16} />
                  )}
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
        
        <div className="mt-4 text-center">
          <small className="text-muted">
            Support available Monday-Friday, 8.30AM-5.30PM (UTC+05:30)
          </small>
        </div>
      </Modal.Body>
      
      <Modal.Footer className="border-0 pt-0">
        <Button 
          variant="primary" 
          onClick={onHide}
          className="fw-medium px-4"
        >
          Got it, thanks
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PasswordResetHelp;