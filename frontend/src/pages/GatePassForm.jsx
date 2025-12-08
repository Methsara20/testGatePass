import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Table, Row, Col, Alert, Spinner, Card, ProgressBar, Tooltip, OverlayTrigger, Badge, Modal, InputGroup, Dropdown } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { getDepartments } from "../services/departmentService";
import { BiMap, BiBuilding, BiCar, BiPackage, BiChevronDown } from "react-icons/bi";
import "../styles/GatePassForm.css";

const GatePassForm = () => {
  const { user } = useAuth();
  const [loadingUser, setLoadingUser] = useState(true);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [formData, setFormData] = useState({
    request_type: "",
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
  const [progress, setProgress] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [materialCatalog] = useState([
    { id: 1, description: "Laptop Computer", uom: "Unit" },
    { id: 2, description: "Printer", uom: "Unit" },
    { id: 3, description: "Office Chair", uom: "Unit" },
    { id: 4, description: "Monitor", uom: "Unit" },
    { id: 5, description: "Network Cable", uom: "Meter" },
    { id: 6, description: "Paper Ream", uom: "Unit" },
    { id: 7, description: "Ink Cartridge", uom: "Piece" },
    { id: 8, description: "Keyboard", uom: "Unit" },
  ]);
  const [priority, setPriority] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [signature, setSignature] = useState("");
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  
  // Country codes with flags
  const countryCodes = [
    { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
    { code: '+1', country: 'United States', flag: '🇺🇸' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  ];
  
  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCodes[0]);
  const [driverPhoneNumber, setDriverPhoneNumber] = useState('');
  
  // Check if request type is selected
  const isRequestTypeSelected = formData.request_type !== "";
  
  // Check if priority is selected
  const isPrioritySelected = priority !== "";
  
  // Check if form is enabled (both request type and priority selected)
  const isFormEnabled = isRequestTypeSelected && isPrioritySelected;
  
  // Calculate form progress
  const calculateProgress = () => {
    if (!isRequestTypeSelected) return 0;
    
    let filledFields = 0;
    let totalFields = 0;
    
    // Basic fields
    const basicFields = ['purpose']; 
    basicFields.forEach(field => {
      totalFields++;
      if (formData[field]) filledFields++;
    });
    
    // Priority field
    totalFields++;
    if (priority) filledFields++;
    
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
      
      // Add return date field if returnable
      if (material.returnable) {
        totalFields++;
        if (material.return_date) filledFields++;
      }
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
  }, [formData, materials, isRequestTypeSelected, priority]);
  
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
  
  // Effect to handle returnable request type and expected return date
  useEffect(() => {
    if (formData.request_type === "Returnable" && expectedReturnDate) {
      setMaterials(prevMaterials => 
        prevMaterials.map(material => ({
          ...material,
          returnable: true,
          return_date: expectedReturnDate
        }))
      );
    } else if (formData.request_type === "Non-returnable") {
      setMaterials(prevMaterials => 
        prevMaterials.map(material => ({
          ...material,
          returnable: false,
          return_date: ""
        }))
      );
      setExpectedReturnDate("");
    }
  }, [formData.request_type, expectedReturnDate]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locationsResponse, departmentsResponse] = await Promise.all([
          axios.get("http://192.168.10.144:5000/api/locations/active"),
          // getDepartments()
          axios.get("http://192.168.10.144:5000/api/departments/dep-active"),
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
    setFormData({
      request_type: "",
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
    
    setPriority("");
    setExpectedReturnDate("");
    setSignature("");
    setSelectedCountryCode(countryCodes[0]);
    setDriverPhoneNumber('');
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
    if (formData.request_type !== "Returnable") {
      handleMaterialChange(id, 'returnable', checked);
      if (!checked) {
        handleMaterialChange(id, 'return_date', '');
      }
    }
  };
  
  const addMaterialRow = () => {
    const newMaterial = {
      id: Date.now(),
      description: "",
      serial_number: "",
      qty: 1,
      uom: "",
      returnable: formData.request_type === "Returnable",
      return_date: formData.request_type === "Returnable" ? expectedReturnDate : ""
    };
    setMaterials([...materials, newMaterial]);
  };
  
  const removeMaterialRow = (id) => {
    setMaterials(materials.filter(item => item.id !== id));
  };
  
  const saveAsTemplate = () => {
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
    
    // Parse driver contact if exists
    if (template.formData.driver_contact) {
      const countryCode = countryCodes.find(cc => 
        template.formData.driver_contact.startsWith(cc.code)
      );
      if (countryCode) {
        setSelectedCountryCode(countryCode);
        setDriverPhoneNumber(template.formData.driver_contact.substring(countryCode.code.length));
      } else {
        setDriverPhoneNumber(template.formData.driver_contact);
      }
    }
    
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
  
  const handleDriverPhoneChange = (e) => {
    // Only allow numbers and limit to 10 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
    setDriverPhoneNumber(value);
    
    // Update the combined driver contact in form data
    handleChange('driver_contact', selectedCountryCode.code + value);
  };
  
  const handleCountryCodeSelect = (countryCode) => {
    setSelectedCountryCode(countryCode);
    // Update the combined driver contact in form data
    handleChange('driver_contact', countryCode.code + driverPhoneNumber);
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
    
    if (!priority) {
      setError("Please select a priority level");
      return;
    }
  
    if (materials.some(m => !m.description || !m.qty || !m.uom)) {
      setError("Please fill all required material fields");
      return;
    }
  
    if (materials.some(m => m.returnable && !m.return_date)) {
      setError("Please specify return dates for all returnable items");
      return;
    }
  
    if (formData.destination_type === "external" && !formData.receiver_name) {
      setError("Please enter receiver name for external destinations");
      return;
    }
  
    try {
      const now = new Date();
      const currentDateTime = {
        request_date: now.toISOString().split("T")[0],
        request_time: now.toTimeString().substring(0, 5)
      };
      
      const formDataToSend = new FormData();
  
      const dbPayload = {
        ...currentDateTime,
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
        delivery_comment: formData.delivery_comment || "",
        priority: priority
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
      resetForm();
  
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to submit. Please try again.";
      setError(errorMessage);
      console.error("Submission error:", err.response?.data || err.message);
    }
  };
  
  if (loadingUser) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center p-4 p-md-5 bg-white rounded-4 shadow-lg">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted">Loading user data...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <Alert variant="danger" className="p-4 p-md-5 rounded-4 shadow-lg">
          Please log in to access the gate pass form.
        </Alert>
      </div>
    );
  }
  
  // Filter locations and departments
  let filteredLocations = locations.filter(location => 
    location.location_name !== formData.from_location
  );
  
  const cphoLocation = locations.find(loc => loc.location_name === "CPHO");
  if (cphoLocation && !filteredLocations.some(loc => loc.location_name === "CPHO")) {
    filteredLocations = [...filteredLocations, cphoLocation];
  }
  
  let filteredDepartments = departments.filter(dept => 
    dept.department_name !== formData.department
  );
  
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
  
  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0 bg-light">
      <div className="row flex-grow-1 g-0">
        <div className="col-12">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-primary text-white py-3 py-md-3 d-flex justify-content-between align-items-center flex-wrap">
              <div className="d-flex align-items-center mb-2 mb-md-0">
                <BiPackage className="me-2" size={24} />
                <h4 className="mb-0 d-none d-md-block">Material Gate Pass Request</h4>
                <h5 className="mb-0 d-md-none">Gate Pass Request</h5>
              </div>
              <div className="d-flex align-items-center gap-2 gap-md-3 flex-wrap">
                <Badge bg={priority === "Normal" ? "info" : priority === "High" ? "warning text-dark" : priority === "Urgent" ? "danger" : "secondary"}>
                  {priority ? `${priority} Priority` : "Select Priority"}
                </Badge>
                <div className="d-flex align-items-center gap-2 bg-white bg-opacity-10 px-3 py-1 rounded-3">
                  <span className="d-none d-sm-inline">Progress:</span>
                  <div className="progress-container">
                    <ProgressBar 
                      now={progress} 
                      className="progress-thin"
                      variant={priority === "Normal" ? "info" : priority === "High" ? "warning" : priority === "Urgent" ? "danger" : "secondary"}
                    />
                  </div>
                  <Badge bg="light" text="dark" className="progress-badge">
                    {progress}%
                  </Badge>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-3 p-md-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
              {submitted && (
                <Alert variant="success" className="py-3 rounded-3 border-0 shadow-sm">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    <div>
                      Gate pass submitted successfully!
                      {gatePassId && <span className="ms-2 fw-bold">ID: {gatePassId}</span>}
                    </div>
                  </div>
                </Alert>
              )}
              {error && (
                <Alert variant="danger" className="py-3 rounded-3 border-0 shadow-sm">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                </Alert>
              )}
              
              {!isFormEnabled && (
                <Alert variant="info" className="py-3 rounded-3 border-0 shadow-sm">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Please select both Request Type and Priority Level to continue filling the form.
                  </div>
                </Alert>
              )}
              
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
                <div className="d-flex flex-wrap gap-2">
                  <Button variant="outline-secondary" size="sm" onClick={() => setShowTemplates(true)} className="d-flex align-items-center px-3 rounded-3" disabled={!isRequestTypeSelected}>
                    <i className="bi bi-bookmark me-1"></i> <span className="d-none d-sm-inline">Load Template</span>
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={saveAsTemplate} className="d-flex align-items-center px-3 rounded-3" disabled={!isRequestTypeSelected}>
                    <i className="bi bi-save me-1"></i> <span className="d-none d-sm-inline">Save as Template</span>
                  </Button>
                  <Badge bg="light" text="dark" className="d-flex align-items-center px-3 py-1 rounded-3">
                    {templates.length}/5
                  </Badge>
                </div>
                <div>
                  <OverlayTrigger
                    placement="top"
                    delay={{ show: 250, hide: 400 }}
                    overlay={(props) => renderTooltip(props, "Add your digital signature")}
                  >
                    <Button 
                      variant={signature ? "outline-success" : "outline-primary"} 
                      size="sm" 
                      onClick={() => setShowSignaturePad(true)}
                      className="d-flex align-items-center px-3 rounded-3"
                      disabled={!isFormEnabled}
                    >
                      <i className="bi bi-pen me-1"></i> {signature ? "Signed" : "Sign"}
                    </Button>
                  </OverlayTrigger>
                </div>
              </div>
              
              <Form onSubmit={handleSubmit}>
                <div className="mb-4 p-3 p-md-4 bg-light dark rounded-4 shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0 fw-bold">Request Information</h5>
                    <div className="fw-bold small text-muted d-none d-md-block">
                      Gate Pass Number: <span className="text-primary">Auto-generated</span>
                    </div>
                  </div>
                  
                  <Row className="g-3">
                    <Col xs={12} md={6} lg={3}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Request Type *</Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            as="select"
                            value={formData.request_type}
                            onChange={(e) => handleChange('request_type', e.target.value)}
                            required
                            className="py-2 border-0 shadow-sm rounded-3 custom-dropdown"
                          >
                            <option value="">Select Request Type</option>
                            <option value="Non-returnable">Non-returnable</option>
                            <option value="Returnable">Returnable</option>
                          </Form.Control>
                          <BiChevronDown className="dropdown-arrow" />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4} lg={3}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Priority Level *</Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            as="select"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            required
                            className="py-2 border-0 shadow-sm rounded-3 custom-dropdown"
                            disabled={!isRequestTypeSelected}
                          >
                            <option value="">Select Priority Level</option>
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                          </Form.Control>
                          <BiChevronDown className="dropdown-arrow" />
                        </div>
                      </Form.Group>
                    </Col>
                    {formData.request_type === "Returnable" && (
                      <Col xs={12} md={6} lg={3}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Expected Return Date</Form.Label>
                          <Form.Control
                            type="date"
                            value={expectedReturnDate}
                            onChange={(e) => setExpectedReturnDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="py-2 border-1 shadow-sm rounded-2"
                            disabled={!isFormEnabled}
                          />
                        </Form.Group>
                      </Col>
                    )}
                  </Row>
                </div>
                
                <fieldset disabled={!isFormEnabled}>
                  <div className="mb-4 p-3 p-md-4 bg-light dardken rounded-4 shadow-sm">
                    <h5 className="mb-3 fw-bold">Destination Information</h5>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold mb-2">Destination Type</Form.Label>
                      <div className="d-flex gap-4">
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
                          <label className="fw-semibold" htmlFor="internal">
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
                          <label className="fw-semibold" htmlFor="external">
                            External
                          </label>
                        </div>
                      </div>
                    </Form.Group>
                    
                    {formData.destination_type === "internal" ? (
                      <Row className="g-3">
                        <Col xs={12} md={3}>
                          <Form.Group className="mb-3">
                            <div className="d-flex align-items-center mb-1">
                              <div className="me-2 text-primary"><BiMap size={18} /></div>
                              <Form.Label className="fw-semibold mb-0">Location</Form.Label>
                            </div>
                            <div className="position-relative">
                              {loadingLocations ? (
                                <div className="d-flex align-items-center p-2 border rounded-3 bg-white">
                                  <Spinner animation="border" size="sm" className="me-2" />
                                  <span className="small text-muted">Loading...</span>
                                </div>
                              ) : (
                                <Form.Control
                                  as="select"
                                  value={formData.to_location_internal}
                                  onChange={(e) => handleChange('to_location_internal', e.target.value)}
                                  required
                                  className="py-2 border-0 shadow-sm rounded-3 custom-dropdown"
                                >
                                  <option value="">Select Location</option>
                                  {filteredLocations.map((loc, index) => (
                                    <option key={index} value={loc.location_name}>
                                      {loc.location_name}
                                    </option>
                                  ))}
                                </Form.Control>
                              )}
                              <BiChevronDown className="dropdown-arrow" />
                            </div>
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Group className="mb-3">
                            <div className="d-flex align-items-center mb-1">
                              <div className="me-2 text-primary"><BiBuilding size={18} /></div>
                              <Form.Label className="fw-semibold mb-0">Department</Form.Label>
                            </div>
                            <div className="position-relative">
                              {loadingDepartments ? (
                                <div className="d-flex align-items-center p-2 border rounded-3 bg-white">
                                  <Spinner animation="border" size="sm" className="me-2" />
                                  <span className="small text-muted">Loading...</span>
                                </div>
                              ) : (
                                <Form.Control
                                  as="select"
                                  value={formData.to_department_internal}
                                  onChange={(e) => handleChange('to_department_internal', e.target.value)}
                                  required
                                  className="py-2 border-0 shadow-sm rounded-3 custom-dropdown"
                                >
                                  <option value="">Select Department</option>
                                  {filteredDepartments.map((dept, index) => (
                                    <option key={index} value={dept.department_name}>
                                      {dept.department_name}
                                    </option>
                                  ))}
                                </Form.Control>
                              )}
                              <BiChevronDown className="dropdown-arrow" />
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                    ) : (
                      <Row className="g-3">
                        <Col xs={12} md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Destination Address (External)</Form.Label>
                            <Form.Control
                              type="text"
                              value={formData.destination_address}
                              onChange={(e) => handleChange('destination_address', e.target.value)}
                              required
                              className="py-2 border-3  shadow-sm rounded-2"
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Receiver Name</Form.Label>
                            <Form.Control
                              type="text"
                              value={formData.receiver_name}
                              onChange={(e) => handleChange('receiver_name', e.target.value)}
                              required
                              className="py-2 border-3 shadow-sm rounded-3"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    )}
                  </div>
                  
                  <div className="mb-4 p-3 p-md-4 bg-light dardken rounded-4 shadow-sm">
                    <h5 className="mb-3 fw-bold">Additional Information</h5>
                    <Row className="g-3">
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Purpose *</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.purpose}
                            onChange={(e) => handleChange('purpose', e.target.value)}
                            required
                            className="py-2 border-2 shadow-sm rounded-3"
                            style={{ resize: "none" }}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Additional Notes</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.additional_notes}
                            onChange={(e) => handleChange('additional_notes', e.target.value)}
                            className="py-2 border-3 shadow-sm rounded-3"
                            style={{ resize: "none" }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                  
                  <div className="mb-4 p-3 p-md-4 bg-light dardken rounded-4 shadow-sm">
                    <h5 className="mb-3 fw-bold">Transport Details</h5>
                    <Row className="g-3">
                      <Col xs={12} md={6} lg={3}>
                        <Form.Group className="mb-3">
                          <div className="d-flex align-items-center mb-1">
                            <div className="me-2 text-primary"><BiCar size={18} /></div>
                            <Form.Label className="fw-semibold mb-0">Transport Mode</Form.Label>
                          </div>
                          <div className="position-relative">
                            <Form.Control
                              as="select"
                              value={formData.transport_mode}
                              onChange={(e) => handleChange('transport_mode', e.target.value)}
                              className="py-2 border-0 shadow-sm rounded-3 custom-dropdown"
                            >
                              <option value="">Select Transport Mode</option>
                              <option value="Company Vehicle">Company Vehicle</option>
                              <option value="Courier">Courier</option>
                              <option value="Personal Vehicle">Personal Vehicle</option>
                              <option value="Other">Other</option>
                            </Form.Control>
                            <BiChevronDown className="dropdown-arrow" />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6} lg={3}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Vehicle Number</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.vehicle_number}
                            onChange={(e) => handleChange('vehicle_number', e.target.value)}
                            className="py-1 border-3 shadow-sm rounded-2"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6} lg={3}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Driver Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.driver_name}
                            onChange={(e) => handleChange('driver_name', e.target.value)}
                            className="py-1 border-3 shadow-sm rounded-2"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6} lg={3}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Driver Contact</Form.Label>
                          <InputGroup className="phone-input-group">
                            <Dropdown as={InputGroup.Prepend}>
                              <Dropdown.Toggle variant="outline-link" id="dropdown-country-code">
                                <span className="country-flag">{selectedCountryCode.flag}</span>
                                <span className="country-code">{selectedCountryCode.code}</span>
                              </Dropdown.Toggle>
                              <Dropdown.Menu className="country-code-dropdown">
                                {countryCodes.map((country, index) => (
                                  <Dropdown.Item 
                                    key={index} 
                                    onClick={() => handleCountryCodeSelect(country)}
                                    className="d-flex align-items-center"
                                  >
                                    <span className="country-flag me-2">{country.flag}</span>
                                    <span>{country.country} ({country.code})</span>
                                  </Dropdown.Item>
                                ))}
                              </Dropdown.Menu>
                            </Dropdown>
                            <Form.Control
                              type="text"
                              value={driverPhoneNumber}
                              onChange={handleDriverPhoneChange}
                              placeholder="Enter phone number"
                              maxLength={9}
                              className="py-1 border-2 shadow-sm rounded-2"
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Delivery Comments</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.delivery_comment}
                            onChange={(e) => handleChange('delivery_comment', e.target.value)}
                            className="py-2 border-3 shadow-sm rounded-2"
                            style={{ resize: "none" }}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Remarks</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.remarks}
                            onChange={(e) => handleChange('remarks', e.target.value)}
                            className="py-2 border-3 shadow-sm rounded-2"
                            style={{ resize: "none" }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                  
                  <div className="mb-4 p-3 p-md-4 bg-light dardken rounded-4 shadow-sm">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
                      <h5 className="mb-0 fw-bold">Material Details</h5>
                      <div className="d-flex gap-2 flex-wrap">
                        <div className="dropdown">
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            className="d-flex align-items-center px-3 rounded-3"
                            data-bs-toggle="dropdown"
                          >
                            <i className="bi bi-collection me-1"></i> <span className="d-none d-sm-inline">Material Catalog</span>
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
                          className="d-flex align-items-center px-3 rounded-3"
                        >
                          <i className="bi bi-plus-circle me-1"></i> <span className="d-none d-sm-inline">Add Material</span>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="table-responsive">
                      <Table bordered hover size="sm" className="mb-3 rounded-3 overflow-hidden">
                        <thead className="table-light">
                          <tr>
                            <th className="d-none d-md-table-cell">Item Description*</th>
                            <th className="d-md-none">Item*</th>
                            <th className="d-none d-sm-table-cell">Serial Number*</th>
                            <th>Qty*</th>
                            <th>UOM*</th>
                            {formData.request_type !== "Non-returnable" && (
                              <>
                                <th className="d-none d-md-table-cell">Returnable</th>
                                <th className="d-none d-md-table-cell">Return Date</th>
                              </>
                            )}
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
                                  className="py-2 border-0 shadow-sm rounded-3"
                                  placeholder="Item description"
                                />
                              </td>
                              <td className="d-none d-sm-table-cell">
                                <Form.Control
                                  type="text"
                                  value={item.serial_number}
                                  onChange={e => handleMaterialChange(item.id, 'serial_number', e.target.value)}
                                  placeholder="SN-0001"
                                  required
                                  className="py-2 border-0 shadow-sm rounded-3"
                                />
                              </td>
                              <td>
                                <Form.Control
                                  type="number"
                                  min="1"
                                  value={item.qty}
                                  onChange={e => handleMaterialChange(item.id, 'qty', parseInt(e.target.value) || 0)}
                                  required
                                  className="py-2 border-0 shadow-sm rounded-3"
                                />
                              </td>
                              <td>
                                <div className="position-relative">
                                  <Form.Control
                                    as="select"
                                    value={item.uom}
                                    onChange={e => handleMaterialChange(item.id, 'uom', e.target.value)}
                                    required
                                    className="py-2 border-0 shadow-sm rounded-3 custom-dropdown"
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
                              {formData.request_type !== "Non-returnable" && (
                                <>
                                  <td className="text-center d-none d-md-table-cell">
                                    <Form.Check
                                      type="checkbox"
                                      checked={item.returnable}
                                      disabled={formData.request_type === "Returnable"}
                                      onChange={e => toggleReturnable(item.id, e.target.checked)}
                                    />
                                  </td>
                                  <td className="d-none d-md-table-cell">
                                    <Form.Control
                                      type="date"
                                      value={item.return_date}
                                      onChange={e => handleMaterialChange(item.id, 'return_date', e.target.value)}
                                      disabled={!item.returnable || formData.request_type === "Returnable"}
                                      min={new Date().toISOString().split("T")[0]}
                                      className="py-2 border-0 shadow-sm rounded-3"
                                    />
                                  </td>
                                </>
                              )}
                              <td className="text-center">
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => removeMaterialRow(item.id)}
                                  title="Remove row"
                                  disabled={materials.length <= 1}
                                  className="rounded-3"
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-end mt-4">
                    <Button type="submit" variant="primary" size="lg" className="px-4 rounded-3 shadow-sm w-100 w-md-auto">
                      Submit Gate Pass
                    </Button>
                  </div>
                </fieldset>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
      
      {/* Templates Modal */}
      <Modal show={showTemplates} onHide={() => setShowTemplates(false)} centered fullscreen="sm-down">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Load Template</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {templates.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-inbox fs-1 text-muted"></i>
              <p className="mt-2 text-muted">No templates available. Save a template first.</p>
            </div>
          ) : (
            <div className="list-group">
              {templates.map(template => (
                <div key={template.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0 mb-2 rounded-3 shadow-sm">
                  <div className="flex-grow-1" onClick={() => loadTemplate(template)}>
                    <h6 className="mb-1 fw-bold">{template.name}</h6>
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
                    className="rounded-3"
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
      <Modal show={showSignaturePad} onHide={() => setShowSignaturePad(false)} centered fullscreen="sm-down">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Digital Signature</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <div className="text-center">
            <canvas 
              ref={canvasRef}
              width="500" 
              height="200" 
              className="border border-secondary rounded-3 mb-3 bg-white w-100"
              style={{ touchAction: 'none', maxWidth: '100%' }}
            />
            <div className="d-flex justify-content-center gap-2">
              <Button variant="outline-secondary" size="sm" onClick={clearSignature} className="px-3 rounded-3">
                Clear
              </Button>
              <Button variant="primary" size="sm" onClick={saveSignature} className="px-3 rounded-3">
                Save Signature
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      
      {/* Custom CSS for progress bar and phone input */}
      <style jsx>{`
        .progress-container {
          width: 120px;
          margin-right: 8px;
        }
        
        .progress-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          min-width: 45px;
          text-align: center;
        }
        
        @media (max-width: 576px) {
          .progress-container {
            width: 80px;
          }
          
          .progress-badge {
            font-size: 0.7rem;
            padding: 0.2rem 0.4rem;
            min-width: 40px;
          }
        }
        
        .progress-thin {
          height: 8px;
        }
        
        fieldset {
          border: none;
          padding: 0;
          margin: 0;
        }
        
        fieldset:disabled {
          opacity: 0.6;
        }
        
        .phone-input-group {
          border-radius: 0.375rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
        }
        
        .phone-input-group .dropdown-toggle {
          background-color: #f8f9fa;
          border: 1px solid #ced4da;
          border-right: none;
          display: flex;
          align-items: center;
          padding: 0.375rem 0.75rem;
        }
        
        .phone-input-group .dropdown-toggle::after {
          margin-left: 0.5em;
        }
        
        .country-flag {
          font-size: 1.2em;
          margin-right: 0.3em;
        }
        
        .country-code {
          font-weight: 500;
        }
        
        .country-code-dropdown {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .phone-input-group .form-control {
          border-left: none;
        }
      `}</style>
    </div>
  );
};

export default GatePassForm;