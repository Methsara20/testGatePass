import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Table, Row, Col, Alert, Spinner, Card, ProgressBar, Tooltip, OverlayTrigger, Badge, Modal, InputGroup } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { getDepartments } from "../services/departmentService";
import { BiMap, BiBuilding, BiCar, BiPackage, BiChevronDown } from "react-icons/bi";
import "../styles/GatePassForm.css"; // We'll create this CSS file for animations

const GatePassForm = () => {
  const { user } = useAuth();
  const [loadingUser, setLoadingUser] = useState(true);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [formData, setFormData] = useState({
    request_type: "Outward",
    request_date: new Date().toISOString().split("T")[0],
    request_time: new Date().toTimeString().substring(0, 5),
    employee_id: "",
    created_by: "",
    full_name: "",
    department: "",
    email: "",
    phone: "",
    from_location: "CPHO",
    destination_type: "internal",
    to_location_internal: "",
    to_department_internal: "",
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
    serial_number: "",
    qty: 1,
    uom: "",
    returnable: false,
    return_date: ""
  }]);
  const [submitted, setSubmitted] = useState(false);
  const [gatePassId, setGatePassId] = useState(null);
  const [error, setError] = useState("");
  
  // New state variables for enhancements
  const [progress, setProgress] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [materialCatalog, setMaterialCatalog] = useState([
    { id: 1, description: "Laptop Computer", uom: "Unit" },
    { id: 2, description: "Printer", uom: "Unit" },
    { id: 3, description: "Office Chair", uom: "Unit" },
    { id: 4, description: "Monitor", uom: "Unit" },
    { id: 5, description: "Network Cable", uom: "Meter" },
    { id: 6, description: "Paper Ream", uom: "Unit" },
    { id: 7, description: "Ink Cartridge", uom: "Piece" },
    { id: 8, description: "Keyboard", uom: "Unit" },
  ]);
  const [priority, setPriority] = useState("Normal");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [signature, setSignature] = useState("");
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  
  // Update date and time in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setFormData(prev => ({
        ...prev,
        request_date: now.toISOString().split("T")[0],
        request_time: now.toTimeString().substring(0, 5)
      }));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);
  
  // Calculate form progress
  const calculateProgress = () => {
    let filledFields = 0;
    let totalFields = 0;
    
    // Basic fields
    const basicFields = ['purpose']; // Date and time are auto-filled
    basicFields.forEach(field => {
      totalFields++;
      if (formData[field]) filledFields++;
    });
    
    // Destination fields
    if (formData.destination_type === 'internal') {
      totalFields += 2;
      if (formData.to_location_internal) filledFields++;
      if (formData.to_department_internal) filledFields++;
    } else {
      totalFields += 2;
      if (formData.destination_address) filledFields++;
      if (formData.receiver_name) filledFields++;
    }
    
    // Material fields
    materials.forEach(material => {
      totalFields += 3;
      if (material.description) filledFields++;
      if (material.qty) filledFields++;
      if (material.uom) filledFields++;
    });
    
    return Math.round((filledFields / totalFields) * 100);
  };
  
  // Load templates on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('gatePassTemplates');
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (e) {
        console.error("Error loading templates:", e);
      }
    }
  }, []);
  
  // Update progress when form changes
  useEffect(() => {
    setProgress(calculateProgress());
  }, [formData, materials]);
  
  // Initialize canvas for signature
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.strokeStyle = '#000';
    
    const startDrawing = (e) => {
      isDrawing.current = true;
      const rect = canvas.getBoundingClientRect();
      context.beginPath();
      context.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };
    
    const draw = (e) => {
      if (!isDrawing.current) return;
      const rect = canvas.getBoundingClientRect();
      context.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      context.stroke();
    };
    
    const stopDrawing = () => {
      isDrawing.current = false;
    };
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
    };
  }, [showSignaturePad]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locationsResponse, departmentsResponse] = await Promise.all([
          axios.get("http://192.168.10.144:5000/api/locations"),
          getDepartments()
        ]);
        setLocations(locationsResponse.data);
        setDepartments(departmentsResponse.data);
        if (user) {
          setLoadingUser(false);
          setFormData(prev => ({
            ...prev,
            employee_id: user.id,
            created_by: user.id,
            full_name: user.full_name || "",
            department: user.department || user.role || "",
            email: user.email || "",
            phone: user.phone_number || "",
            from_location: user.location || ""
          }));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load required data. Please try again later.");
      } finally {
        setLoadingLocations(false);
        setLoadingDepartments(false);
      }
    };
    fetchData();
  }, [user]);
  
  // Reset form to initial state
  const resetForm = () => {
    const now = new Date();
    setFormData({
      request_type: "Outward",
      request_date: now.toISOString().split("T")[0],
      request_time: now.toTimeString().substring(0, 5),
      employee_id: user?.id || "",
      created_by: user?.id || "",
      full_name: user?.full_name || "",
      department: user?.department || user?.role || "",
      email: user?.email || "",
      phone: user?.phone_number || "",
      from_location: user?.location || "",
      destination_type: "internal",
      to_location_internal: "",
      to_department_internal: "",
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
    
    setMaterials([{
      id: Date.now(),
      description: "",
      serial_number: "",
      qty: 1,
      uom: "",
      returnable: false,
      return_date: ""
    }]);
    
    setPriority("Normal");
    setExpectedReturnDate("");
    setSignature("");
  };
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleMaterialChange = (id, field, value) => {
    setMaterials(materials.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };
  
  const toggleReturnable = (id, checked) => {
    handleMaterialChange(id, 'returnable', checked);
    if (!checked) {
      handleMaterialChange(id, 'return_date', '');
    }
  };
  
  const addMaterialRow = () => {
    setMaterials([...materials, {
      id: Date.now(),
      description: "",
      serial_number: "",
      qty: 1,
      uom: "",
      returnable: false,
      return_date: ""
    }]);
  };
  
  const removeMaterialRow = (id) => {
    setMaterials(materials.filter(item => item.id !== id));
  };
  
  const saveAsTemplate = () => {
    // Check if we've reached the maximum of 5 templates
    if (templates.length >= 5) {
      alert("You have reached the maximum limit of 5 templates. Please delete an existing template first.");
      return;
    }
    
    const templateName = prompt("Enter a name for this template:");
    if (templateName) {
      const newTemplate = {
        id: Date.now(),
        name: templateName,
        formData: { ...formData },
        materials: [...materials],
        timestamp: new Date().toISOString()
      };
      
      const updatedTemplates = [...templates, newTemplate];
      setTemplates(updatedTemplates);
      localStorage.setItem('gatePassTemplates', JSON.stringify(updatedTemplates));
      
      // Reset form after saving template
      resetForm();
      
      alert("Template saved successfully! Form has been reset.");
    }
  };
  
  const deleteTemplate = (id) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      const updatedTemplates = templates.filter(template => template.id !== id);
      setTemplates(updatedTemplates);
      localStorage.setItem('gatePassTemplates', JSON.stringify(updatedTemplates));
    }
  };
  
  const loadTemplate = (template) => {
    setFormData(template.formData);
    setMaterials(template.materials);
    setShowTemplates(false);
    alert(`Template "${template.name}" loaded!`);
  };
  
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      setSignature("");
    }
  };
  
  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
      setShowSignaturePad(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
  
    if (!formData.created_by) {
      setError("No valid user ID found. Please ensure you're logged in.");
      return;
    }
  
    if (!formData.purpose) {
      setError("Please enter a purpose");
      return;
    }
  
    if (materials.some(m => !m.description || !m.qty || !m.uom)) {
      setError("Please fill all required material fields");
      return;
    }
  
    if (formData.destination_type === "external" && !formData.receiver_name) {
      setError("Please enter receiver name for external destinations");
      return;
    }
  
    try {
      // Get current date and time at submission point
      const now = new Date();
      const currentDateTime = {
        request_date: now.toISOString().split("T")[0],
        request_time: now.toTimeString().substring(0, 5)
      };
      
      const formDataToSend = new FormData();
  
      const dbPayload = {
        ...currentDateTime, // Use current date and time
        request_type: formData.request_type,
        location: formData.from_location,
        purpose: formData.purpose,
        additional_notes: formData.additional_notes || "",
        status: "Pending",
        is_draft: false,
        is_printable: 0,
        delivery_status: "Waiting",
        department: formData.destination_type === "internal" 
          ? formData.to_department_internal 
          : "",
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
  
      const materialsToSend = materials.map(material => ({
        description: material.description,
        serial_number: material.serial_number || null,
        qty: material.qty,
        uom: material.uom,
        returnable: material.returnable ? 1 : 0,
        return_date: material.returnable ? material.return_date || null : null
      }));
  
      formDataToSend.append('materials', JSON.stringify(materialsToSend));
  
      if (formData.document) {
        formDataToSend.append('document', formData.document);
      }
  
      const response = await axios.post("http://192.168.10.144:5000/api/passes", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      setSubmitted(true);
      setGatePassId(response.data.gatePassId);
  
      // Reset form after successful submission
      resetForm();
  
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to submit. Please try again.";
      setError(errorMessage);
      console.error("Submission error:", err.response?.data || err.message);
    }
  };
  
  if (loadingUser) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading user data...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Alert variant="danger">Please log in to access the gate pass form.</Alert>
      </div>
    );
  }
  
  // Filter locations to exclude user's current location but always include "CPHO"
  let filteredLocations = locations.filter(location => 
    location.location_name !== formData.from_location
  );
  
  // Always include "CPHO" location
  const cphoLocation = locations.find(loc => 
    loc.location_name === "CPHO"
  );
  
  if (cphoLocation && !filteredLocations.some(loc => 
    loc.location_name === "CPHO"
  )) {
    filteredLocations = [...filteredLocations, cphoLocation];
  }
  
  // Filter departments to exclude user's current department but always include "retail"
  let filteredDepartments = departments.filter(dept => 
    dept.department_name !== formData.department
  );
  
  // Always include "retail" department
  const retailDepartment = departments.find(dept => 
    dept.department_name.toLowerCase() === 'retail'
  );
  
  if (retailDepartment && !filteredDepartments.some(dept => 
    dept.department_name.toLowerCase() === 'retail'
  )) {
    filteredDepartments = [...filteredDepartments, retailDepartment];
  }
  
  const renderTooltip = (props, text) => (
    <Tooltip id="button-tooltip" {...props}>
      {text}
    </Tooltip>
  );
  
  const selectFromCatalog = (catalogItem) => {
    const lastMaterial = materials[materials.length - 1];
    handleMaterialChange(lastMaterial.id, 'description', catalogItem.description);
    handleMaterialChange(lastMaterial.id, 'uom', catalogItem.uom);
  };
  
  // Custom dropdown component with arrow animation
  const CustomDropdown = ({ label, icon, value, onChange, options, loading, required, disabled, showIcon = true }) => (
    <div className="mb-3">
      <div className="d-flex align-items-center mb-1">
        {showIcon && icon}
        <Form.Label className="fw-bold small mb-0 ms-1">{label}</Form.Label>
      </div>
      <div className="position-relative dropdown-wrapper">
        {loading ? (
          <div className="d-flex align-items-center p-2 border rounded bg-white">
            <Spinner animation="border" size="sm" className="me-2" />
            <span className="small">Loading...</span>
          </div>
        ) : (
          <Form.Control
            as="select"
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className="py-2 custom-dropdown"
          >
            <option value="">{`Select ${label}`}</option>
            {options.map((option, index) => (
              <option key={index} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
          </Form.Control>
        )}
        <BiChevronDown className="dropdown-arrow" />
      </div>
    </div>
  );
  
  // Simple dropdown component for Request Type and Priority
  const SimpleDropdown = ({ label, value, onChange, options, required }) => (
    <Form.Group>
      <Form.Label className="fw-bold small">{label}</Form.Label>
      <div className="position-relative dropdown-wrapper">
        <Form.Control
          as="select"
          value={value}
          onChange={onChange}
          required={required}
          className="py-2 custom-dropdown"
        >
          {options.map((option, index) => (
            <option key={index} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </Form.Control>
        <BiChevronDown className="dropdown-arrow" />
      </div>
    </Form.Group>
  );
  
  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0">
      <div className="row flex-grow-1 g-0">
        <div className="col-12">
          <Card className="h-100 shadow-lg border-0">
            <Card.Header className="bg-primary text-white py-3 d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Material Gate Pass Request Form</h4>
              <div className="d-flex align-items-center gap-3">
                <Badge bg={priority === "Normal" ? "secondary" : priority === "High" ? "warning" : "danger"}>
                  {priority} Priority
                </Badge>
                <div className="d-flex align-items-center gap-2">
                  <span>Progress:</span>
                  <div style={{ width: '150px' }}>
                    <ProgressBar now={progress} label={`${progress}%`} />
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-5 overflow-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
              {submitted && (
                <Alert variant="success" className="py-2">
                  Gate pass submitted successfully!
                  {gatePassId && ` Gate Pass ID: ${gatePassId}`}
                </Alert>
              )}
              {error && <Alert variant="danger" className="py-2">{error}</Alert>}
              
              <div className="d-flex justify-content-between mb-4">
                <div>
                  <Button variant="outline-secondary" size="sm" onClick={() => setShowTemplates(true)} className="me-2">
                    <i className="bi bi-bookmark me-1"></i> Load Template
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={saveAsTemplate} className="me-2">
                    <i className="bi bi-save me-1"></i> Save as Template
                  </Button>
                  <Badge bg="light" text="dark" className="p-2">
                    {templates.length}/5 Templates
                  </Badge>
                </div>
                <div>
                  <OverlayTrigger
                    placement="top"
                    delay={{ show: 250, hide: 400 }}
                    overlay={(props) => renderTooltip(props, "Add your digital signature")}
                  >
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => setShowSignaturePad(true)}
                      className={signature ? "border-success text-success" : ""}
                    >
                      <i className="bi bi-pen me-1"></i> {signature ? "Signed" : "Sign"}
                    </Button>
                  </OverlayTrigger>
                </div>
              </div>
              
              <Form onSubmit={handleSubmit}>
                <div className="mb-4 p-4 bg-light rounded shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Request Information</h5>
                    <div className="fw-bold small">
                      Gate Pass No: <span className="text-primary">{gatePassId || "Auto-generated"}</span>
                    </div>
                  </div>
                  
                  <Row className="mb-3">
                    <Col md={2}>
                      <SimpleDropdown
                        label="Request Type"
                        size="sm"
                        value={formData.request_type}
                        onChange={(e) => handleChange('request_type', e.target.value)}
                        options={[
                          { value: "Non-returnable", label: "Non-returnable" },
                          { value: "Returnable", label: "Returnable" }
                        ]}
                        required
                      />
                    </Col>
                    <Col md={2}>
                      <SimpleDropdown
                        label="Priority"
                        size="sm"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        options={[
                          { value: "Normal", label: "Normal" },
                          { value: "High", label: "High" },
                          { value: "Urgent", label: "Urgent" }
                        ]}
                           className="py-2 bg-white"
                      />
                    </Col>
                    {/* <Col md={2}>
                      <Form.Group>
                        <Form.Label className="small mb-1">Date</Form.Label>
                        <Form.Control
                          type="date"
                          size="sm"
                          value={formData.request_date}
                          disabled
                          className="py-2 bg-white"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label className="small mb-1">Time</Form.Label>
                        <Form.Control
                          type="time"
                          size="sm"
                          value={formData.request_time}
                          disabled
                          className="py-2 bg-white"
                        />
                      </Form.Group>
                    </Col>
                     <Col md={2}>
                      <Form.Group>
                        <Form.Label className="small mb-1">From Location</Form.Label>
                        <Form.Control 
                          type="text" 
                          size="sm"
                          value={formData.from_location} 
                          disabled 
                          className="py-2 bg-white"
                        />
                      </Form.Group>
                    </Col> */}
                    {formData.request_type === "Returnable" && (
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label className="fw-bold small">Expected Return Date</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={expectedReturnDate}
                            onChange={(e) => setExpectedReturnDate(e.target.value)}
                            min={formData.request_date}
                            className="py-2"
                          />
                        </Form.Group>
                      </Col>
                    )}
                  </Row>
                  
                  
                  
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold small">Purpose *</Form.Label>
                        <Form.Control
                          as="textarea"
                          size="sm"
                          rows={3}
                          value={formData.purpose}
                          onChange={(e) => handleChange('purpose', e.target.value)}
                          required
                          className="py-2"
                          style={{ resize: "none" }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small mb-1">Additional Notes</Form.Label>
                        <Form.Control
                          as="textarea"
                          size="sm"
                          rows={3}
                          value={formData.additional_notes}
                          onChange={(e) => handleChange('additional_notes', e.target.value)}
                          className="py-2"
                          style={{ resize: "none" }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
                
                <div className="mb-4 p-4 bg-light rounded shadow-sm">
                  <h5 className="mb-3">Destination Information</h5>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small">Destination Type</Form.Label>
                    <div className="d-flex gap-3">
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
                        <label className="fw-bold small" htmlFor="internal">
                          Internal
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
                        <label className="fw-bold small" htmlFor="external">
                          External
                        </label>
                      </div>
                    </div>
                  </Form.Group>
                  
                  {formData.destination_type === "internal" ? (
                    <Row className="mb-3">
                      <Col md={4}>
                        <CustomDropdown
                          label="Location"
                          icon={<BiMap className="text-primary" />}
                          value={formData.to_location_internal}
                          onChange={(e) => handleChange('to_location_internal', e.target.value)}
                          options={filteredLocations.map(loc => ({
                            value: loc.location_name,
                            label: loc.location_name
                          }))}
                          loading={loadingLocations}
                          required
                        />
                      </Col>
                      <Col md={4}>
                        <CustomDropdown
                          label="Department"
                          icon={<BiBuilding className="text-primary" />}
                          value={formData.to_department_internal}
                          onChange={(e) => handleChange('to_department_internal', e.target.value)}
                          options={filteredDepartments.map(dept => ({
                            value: dept.department_name,
                            label: dept.department_name
                          }))}
                          loading={loadingDepartments}
                          required
                        />
                      </Col>
                    </Row>
                  ) : (
                    <Row className="mb-3">
                      <Col md={8}>
                        <Form.Group>
                          <Form.Label className="small mb-1">Destination Address (External)</Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            value={formData.destination_address}
                            onChange={(e) => handleChange('destination_address', e.target.value)}
                            required
                            className="py-2"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small mb-1">Receiver Name</Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            value={formData.receiver_name}
                            onChange={(e) => handleChange('receiver_name', e.target.value)}
                            required
                            className="py-2"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </div>
                
                <div className="mb-4 p-4 bg-light rounded shadow-sm">
                  <h5 className="mb-3">Transport Details</h5>
                  <Row className="mb-3">
                    <Col md={4}>
                      <CustomDropdown
                        label="Transport Mode"
                        icon={<BiCar className="text-primary" />}
                        value={formData.transport_mode}
                        onChange={(e) => handleChange('transport_mode', e.target.value)}
                        options={[
                          { value: "Company Vehicle", label: "Company Vehicle" },
                          { value: "Courier", label: "Courier" },
                          { value: "Personal Vehicle", label: "Personal Vehicle" },
                          { value: "Other", label: "Other" }
                        ]}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small mb-1">Vehicle Number</Form.Label>
                        <Form.Control
                          type="text"
                          size="sm"
                          value={formData.vehicle_number}
                          onChange={(e) => handleChange('vehicle_number', e.target.value)}
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small mb-1">Driver Name</Form.Label>
                        <Form.Control
                          type="text"
                          size="sm"
                          value={formData.driver_name}
                          onChange={(e) => handleChange('driver_name', e.target.value)}
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small mb-1">Driver Contact</Form.Label>
                        <Form.Control
                          type="text"
                          size="sm"
                          value={formData.driver_contact}
                          onChange={(e) => handleChange('driver_contact', e.target.value)}
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small mb-1">Delivery Comments</Form.Label>
                        <Form.Control
                          as="textarea"
                          size="sm"
                          rows={3}
                          value={formData.delivery_comment}
                          onChange={(e) => handleChange('delivery_comment', e.target.value)}
                          className="py-2"
                          style={{ resize: "none" }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small mb-1">Remarks</Form.Label>
                        <Form.Control
                          as="textarea"
                          size="sm"
                          rows={3}
                          value={formData.remarks}
                          onChange={(e) => handleChange('remarks', e.target.value)}
                          className="py-2"
                          style={{ resize: "none" }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
                
                <div className="mb-4 p-4 bg-light rounded shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Material Details</h5>
                    <div className="d-flex gap-2">
                      <div className="dropdown">
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          data-bs-toggle="dropdown"
                        >
                          <i className="bi bi-collection me-1"></i> Material Catalog
                        </Button>
                        <ul className="dropdown-menu">
                          {materialCatalog.map(item => (
                            <li key={item.id}>
                              <button 
                                className="dropdown-item" 
                                type="button"
                                onClick={() => selectFromCatalog(item)}
                              >
                                {item.description} ({item.uom})
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={addMaterialRow}
                      >
                        <i className="bi bi-plus-circle me-1"></i> Add Material
                      </Button>
                    </div>
                  </div>
                  
                  <Table bordered responsive size="sm" className="mb-3">
                    <thead className="table-light">
                      <tr style={{ fontSize: '0.8rem' }}>
                        <th>Item Description*</th>
                        <th>Serial Number*</th>
                        <th>Qty*</th>
                        <th>UOM*</th>
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
                              size="sm"
                              value={item.description}
                              onChange={e => handleMaterialChange(item.id, 'description', e.target.value)}
                              required
                              className="py-2"
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="text"
                              size="sm"
                              value={item.serial_number}
                              onChange={e => handleMaterialChange(item.id, 'serial_number', e.target.value)}
                              placeholder="SN-0001"
                              required
                              className="py-2"
                            />
                          </td>
                          <td style={{ width: '80px' }}>
                            <Form.Control
                              type="number"
                              size="sm"
                              min="1"
                              value={item.qty}
                              onChange={e => handleMaterialChange(item.id, 'qty', parseInt(e.target.value) || 0)}
                              required
                              className="py-2"
                            />
                          </td>
                          <td style={{ width: '100px' }}>
                            <div className="position-relative dropdown-wrapper">
                              <Form.Control
                                as="select"
                                size="sm"
                                value={item.uom}
                                onChange={e => handleMaterialChange(item.id, 'uom', e.target.value)}
                                required
                                className="py-2 custom-dropdown"
                              >
                                <option value="">Select</option>
                                <option value="Unit">Unit</option>
                                <option value="PC">Piece</option>
                                <option value="KG">Kilogram</option>
                                <option value="M">Meter</option>
                                <option value="L">Liter</option>
                                <option value="SET">Set</option>
                              </Form.Control>
                              <BiChevronDown className="dropdown-arrow" />
                            </div>
                          </td>
                          <td className="text-center" style={{ width: '80px' }}>
                            <Form.Check
                              type="checkbox"
                              size="sm"
                              checked={item.returnable}
                              disabled={formData.request_type === "Non-returnable"}
                              onChange={e => toggleReturnable(item.id, e.target.checked)}
                            />
                          </td>
                          <td style={{ width: '130px' }}>
                            <Form.Control
                              type="date"
                              size="sm"
                              value={item.return_date}
                              onChange={e => handleMaterialChange(item.id, 'return_date', e.target.value)}
                              disabled={!item.returnable || formData.request_type === "Non-returnable"}
                              min={formData.request_date}
                              className="py-2"
                            />
                          </td>
                          <td className="text-center" style={{ width: '60px' }}>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeMaterialRow(item.id)}
                              title="Remove row"
                              disabled={materials.length <= 1}
                            >
                              <i className="bi bi-trash" style={{ fontSize: '0.8rem' }}></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                
                <div className="d-flex justify-content-end mt-4">
                  <Button type="submit" variant="primary" size="sm">
                    Submit Gate Pass
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
      
      {/* Templates Modal */}
      <Modal show={showTemplates} onHide={() => setShowTemplates(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Load Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {templates.length === 0 ? (
            <p>No templates available. Save a template first.</p>
          ) : (
            <div className="list-group">
              {templates.map(template => (
                <div key={template.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1" onClick={() => loadTemplate(template)}>
                    <h6 className="mb-1">{template.name}</h6>
                    <small className="text-muted">
                      Created: {new Date(template.timestamp).toLocaleString()}
                    </small>
                  </div>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTemplate(template.id);
                    }}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>
      
      {/* Signature Modal */}
      <Modal show={showSignaturePad} onHide={() => setShowSignaturePad(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Digital Signature</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <canvas 
              ref={canvasRef}
              width="500" 
              height="200" 
              className="border border-secondary rounded mb-3"
              style={{ touchAction: 'none', maxWidth: '100%' }}
            />
            <div className="d-flex justify-content-center gap-2">
              <Button variant="outline-secondary" size="sm" onClick={clearSignature}>
                Clear
              </Button>
              <Button variant="primary" size="sm" onClick={saveSignature}>
                Save Signature
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default GatePassForm;