import React, { useState } from "react";
import { Form, Button, Table, Row, Col, Alert } from "react-bootstrap";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const GatePassForm = ({ user = {} }) => {
  const [formData, setFormData] = useState({
    request_type: "Outward",
    request_date: new Date().toISOString().split("T")[0],
    request_time: new Date().toTimeString().substring(0, 5),
    employee_id: user?.id || "",
    created_by: user?.id || 1,
    full_name: user?.full_name || "",
    department: user?.department || "",
    email: user?.email || "",
    phone: user?.phone_number || "",
    from_location: user?.location || "",
    destination_type: "internal",
    to_location_internal: "",
    destination_address: "",
    purpose: "",
    additional_notes: "",
    document: null,
    transport_mode: "",
    vehicle_number: "",
    driver_name: "",
    driver_contact: "",
    receiver_name: "",
    delivery_comment: "",
    remarks: "",
    status: "Pending",
    is_draft: false
  });

  const [materials, setMaterials] = useState([{ 
    id: Date.now(),
    description: "",
    serialNumber: "",
    quantity: 1,
    uom: "",
    isReturnable: false,
    returnDate: ""
  }]);

  const [submitted, setSubmitted] = useState(false);
  const [gatePassId, setGatePassId] = useState(null);
  const [error, setError] = useState("");
  const [isDraft, setIsDraft] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMaterialChange = (id, field, value) => {
    setMaterials(materials.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const toggleReturnable = (id, checked) => {
    handleMaterialChange(id, 'isReturnable', checked);
    if (!checked) {
      handleMaterialChange(id, 'returnDate', '');
    }
  };

  const addMaterialRow = () => {
    setMaterials([...materials, { 
      id: Date.now(),
      description: "",
      serialNumber: "",
      quantity: 1,
      uom: "",
      isReturnable: false,
      returnDate: ""
    }]);
  };

  const removeMaterialRow = (id) => {
    setMaterials(materials.filter(item => item.id !== id));
  };

  const handleSubmit = async (e, isDraftSubmit = false) => {
    e.preventDefault();
    setError("");

    if (!isDraftSubmit) {
      if (!formData.purpose) {
        setError("Please enter a purpose");
        return;
      }

      if (materials.some(m => !m.description || !m.quantity || !m.uom)) {
        setError("Please fill all required material fields");
        return;
      }

      if (formData.destination_type === "external" && !formData.receiver_name) {
        setError("Please enter receiver name for external destinations");
        return;
      }
    }

    try {
      const formDataToSend = new FormData();
      
      const dbPayload = {
        request_type: formData.request_type,
        request_date: formData.request_date,
        request_time: formData.request_time,
        location: formData.from_location,
        purpose: formData.purpose,
        additional_notes: formData.additional_notes || "",
        status: isDraftSubmit ? "Pending" : "Approved",
        is_draft: isDraftSubmit,
        is_printable: 0,
        delivery_status: "Waiting",
        destination_address: formData.destination_type === "internal" 
          ? formData.to_location_internal 
          : formData.destination_address,
        transport_mode: formData.transport_mode,
        vehicle_no: formData.vehicle_number,
        driver_name: formData.driver_name,
        driver_contact: formData.driver_contact,
        remarks: formData.remarks,
        created_by: formData.created_by,
        receiver_name: formData.receiver_name || "",
        delivery_comment: formData.delivery_comment || ""
      };

      Object.entries(dbPayload).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      formDataToSend.append('materials', JSON.stringify(materials));
      
      if (formData.document) {
        formDataToSend.append('document', formData.document);
      }

      const response = await axios.post("http://localhost:5000/api/passes", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSubmitted(true);
      setIsDraft(isDraftSubmit);
      setGatePassId(response.data.gatePassId);
      
      if (!isDraftSubmit) {
        // Reset form after successful submission
        setFormData({
          ...formData,
          request_type: "Outward",
          request_date: new Date().toISOString().split("T")[0],
          request_time: new Date().toTimeString().substring(0, 5),
          destination_type: "internal",
          to_location_internal: "",
          destination_address: "",
          purpose: "",
          additional_notes: "",
          transport_mode: "",
          vehicle_number: "",
          driver_name: "",
          driver_contact: "",
          receiver_name: "",
          delivery_comment: "",
          remarks: "",
          status: "Pending",
          is_draft: false,
          document: null
        });
        setMaterials([{ 
          id: Date.now(),
          description: "",
          serialNumber: "",
          quantity: 1,
          uom: "",
          isReturnable: false,
          returnDate: ""
        }]);
      }
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to submit. Please try again.";
      setError(errorMessage);
      console.error("Submission error:", err.response?.data || err.message);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="p-4 flex-grow-1 w-100">
        <h3 className="mb-3">Material Gate Pass Request Form</h3>

        {submitted && (
          <Alert variant="success">
            {isDraft ? "Draft saved successfully!" : "Gate pass submitted successfully!"}
            {gatePassId && ` Gate Pass ID: ${gatePassId}`}
          </Alert>
        )}
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={(e) => handleSubmit(e, false)}>
          <div className="mb-3 fw-bold">
            Gate Pass No: <span className="text-primary">{gatePassId || "Auto-generated"}</span>
          </div>

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Request Type</Form.Label>
                <Form.Control
                  as="select"
                  value={formData.request_type}
                  onChange={(e) => handleChange('request_type', e.target.value)}
                  required
                >
                  <option value="Outward">Outward</option>
                  <option value="Returnable">Returnable</option>
                  <option value="Non-returnable">Non-returnable</option>
                </Form.Control>
              </Form.Group>
            </Col>

            <Col>
              <Form.Group>
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.request_date}
                  onChange={(e) => handleChange('request_date', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Time</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.request_time}
                  onChange={(e) => handleChange('request_time', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Purpose</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formData.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Additional Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formData.additional_notes}
              onChange={(e) => handleChange('additional_notes', e.target.value)}
            />
          </Form.Group>

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Employee ID</Form.Label>
                <Form.Control type="text" value={formData.employee_id} disabled />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control type="text" value={formData.full_name} disabled />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Department</Form.Label>
                <Form.Control type="text" value={formData.department} disabled />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control type="text" value={formData.email} disabled />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Phone</Form.Label>
                <Form.Control type="text" value={formData.phone} disabled />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>From Location</Form.Label>
                <Form.Control type="text" value={formData.from_location} disabled />
              </Form.Group>
            </Col>
          </Row>

          <h5 className="mt-4 mb-3">Destination & Transport Details</h5>
          
          <Form.Group className="mb-3">
            <Form.Label>Is Destination Internal?</Form.Label>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="destination_type"
                id="internal"
                value="internal"
                checked={formData.destination_type === "internal"}
                onChange={() => handleChange('destination_type', 'internal')}
              />
              <label className="form-check-label" htmlFor="internal">
                Yes (Internal)
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="destination_type"
                id="external"
                value="external"
                checked={formData.destination_type === "external"}
                onChange={() => handleChange('destination_type', 'external')}
              />
              <label className="form-check-label" htmlFor="external">
                No (External)
              </label>
            </div>
          </Form.Group>

          {formData.destination_type === "internal" ? (
            <Form.Group className="mb-3">
              <Form.Label>To Location (Internal)</Form.Label>
              <Form.Control
                as="select"
                value={formData.to_location_internal}
                onChange={(e) => handleChange('to_location_internal', e.target.value)}
                required
              >
                <option value="">Select Location</option>
                <option value="CPHO">CPHO</option>
                <option value="CPH">CPH</option>
                <option value="CPM">CPM</option>
                <option value="CPN">CPN</option>
                <option value="CPW">CPW</option>
                <option value="CPK">CPK</option>
                <option value="CPP">CPP</option>
                <option value="CPC">CPC</option>
                <option value="CPR">CPR</option>
                <option value="OGF">OGF</option>
                <option value="CPG">CPG</option>
                <option value="MONSTONE">CPP</option>
              </Form.Control>
            </Form.Group>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Destination Address (External)</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.destination_address}
                  onChange={(e) => handleChange('destination_address', e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Receiver Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.receiver_name}
                  onChange={(e) => handleChange('receiver_name', e.target.value)}
                  required
                />
              </Form.Group>
            </>
          )}

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Transport Mode</Form.Label>
                <Form.Control
                  as="select"
                  value={formData.transport_mode}
                  onChange={(e) => handleChange('transport_mode', e.target.value)}
                >
                  <option value="">Select Transport</option>
                  <option value="Company Vehicle">Company Vehicle</option>
                  <option value="Courier">Courier</option>
                  <option value="Personal Vehicle">Personal Vehicle</option>
                  <option value="Other">Other</option>
                </Form.Control>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Vehicle Number</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.vehicle_number}
                  onChange={(e) => handleChange('vehicle_number', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Driver Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.driver_name}
                  onChange={(e) => handleChange('driver_name', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Driver Contact</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.driver_contact}
                  onChange={(e) => handleChange('driver_contact', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Delivery Comments</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formData.delivery_comment}
              onChange={(e) => handleChange('delivery_comment', e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Remarks</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
            />
          </Form.Group>

          <h5 className="mt-4">Material Details</h5>
          <Table bordered responsive>
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Serial Number / Item Code</th>
                <th>Qty</th>
                <th>UOM</th>
                <th>Returnable</th>
                <th>Return Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(item => (
                <tr key={item.id}>
                  <td>
                    <Form.Control
                      type="text"
                      value={item.description}
                      onChange={e => handleMaterialChange(item.id, 'description', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="text"
                      value={item.serialNumber}
                      onChange={e => handleMaterialChange(item.id, 'serialNumber', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => handleMaterialChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      required
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="text"
                      value={item.uom}
                      onChange={e => handleMaterialChange(item.id, 'uom', e.target.value)}
                      required
                    />
                  </td>
                  <td className="text-center">
                    <Form.Check
                      type="checkbox"
                      checked={item.isReturnable}
                      disabled={formData.request_type === "Non-returnable"}
                      onChange={e => toggleReturnable(item.id, e.target.checked)}
                      className="mt-2"
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="date"
                      value={item.returnDate}
                      onChange={e => handleMaterialChange(item.id, 'returnDate', e.target.value)}
                      disabled={!item.isReturnable || formData.request_type === "Non-returnable"}
                    />
                  </td>
                  <td className="text-center">
                    {materials.length > 1 && (
                      <Button
                        variant="danger"
                        onClick={() => removeMaterialRow(item.id)}
                        title="Remove row"
                        size="sm"
                      >
                        Remove
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Button variant="secondary" onClick={addMaterialRow} className="mb-3">
            Add Material
          </Button>

          <Form.Group className="mb-3">
            <Form.Label>Supporting Document (optional)</Form.Label>
            <Form.Control
              type="file"
              onChange={(e) => handleChange('document', e.target.files[0])}
            />
          </Form.Group>

          <div className="d-flex justify-content-between mt-4">
            <Button 
              variant="secondary" 
              onClick={(e) => {
                setIsDraft(true);
                handleSubmit(e, true);
              }}
            >
              Save as Draft
            </Button>
            <Button type="submit" variant="primary">
              Submit Gate Pass
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default GatePassForm;