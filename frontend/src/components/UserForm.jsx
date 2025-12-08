import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Row, Col, InputGroup, Card, Alert, ProgressBar } from "react-bootstrap";
import {
  PersonFill, EnvelopeFill, ShieldLockFill,
  TelephoneFill, PersonBadge, CheckCircleFill, XCircleFill
} from "react-bootstrap-icons";
import { getLocations } from "../services/locationService";
import { getDepartments } from "../services/departmentService";
const roles = ["Admin", "HOD", "User", "Audit"];
export default function UserForm({
  initialValues = null,
  submitLabel = "Create User",
  onSubmit,
}) {
  const empty = {
    username: "", password: "", full_name: "",
    role: "User", email: "", phone_number: "", 
    location: "", department: "", status: "active"  // Added status field with default value "active"
  };
  const [form, setForm] = useState(initialValues || empty);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [locationsError, setLocationsError] = useState(null);
  const [departmentsError, setDepartmentsError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const usernameRef = useRef(null);
  
  // Focus on username field when component mounts
  useEffect(() => {
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, []);
  
  useEffect(() => {
    setForm(initialValues || empty);
    setFieldErrors({});
    setSuccess(false);
  }, [initialValues]);
  
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locationsData = await getLocations();
        
        if (!Array.isArray(locationsData)) {
          throw new Error("Received non-array locations data");
        }
        
        setLocations(locationsData);
      } catch (error) {
        setLocationsError("Failed to load locations");
        setLocations([]);
      }
    };
    
    fetchLocations();
  }, []);
  
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await getDepartments();
        const departmentsData = response.data ? response.data : response;
        
        if (!Array.isArray(departmentsData)) {
          throw new Error("Expected array but got: " + typeof departmentsData);
        }
        
        setDepartments(departmentsData);
      } catch (error) {
        setDepartmentsError("Failed to load departments");
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);
  
  // Calculate password strength
  useEffect(() => {
    if (!form.password) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (form.password.length >= 8) strength += 25;
    if (/[A-Z]/.test(form.password)) strength += 25;
    if (/[0-9]/.test(form.password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(form.password)) strength += 25;
    setPasswordStrength(strength);
  }, [form.password]);
  
  const handleChange = e => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Apply specific formatting based on field name
    if (name === "username") {
      // Convert username to all uppercase
      processedValue = value.toUpperCase();
    } else if (name === "full_name") {
      // Convert full name to title case (first letter of each word uppercase, rest lowercase)
      processedValue = value.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    }
    
    setForm(f => ({ ...f, [name]: processedValue }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!form.username.trim()) {
      errors.username = "Username is required";
    }
    
    if (!form.full_name.trim()) {
      errors.full_name = "Full name is required";
    }
    
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = "Email is invalid";
    }
    
    if (!initialValues && !form.password) {
      errors.password = "Password is required";
    }
    
    if (form.password && form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(form);
      setSuccess(true);
      if (!initialValues) setForm(empty);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleReset = () => {
    setForm(initialValues || empty);
    setFieldErrors({});
    setError(null);
    setSuccess(false);
    setPasswordStrength(0);
  };
  
  const getPasswordStrengthVariant = () => {
    if (passwordStrength <= 25) return "danger";
    if (passwordStrength <= 50) return "warning";
    if (passwordStrength <= 75) return "info";
    return "success";
  };
  
  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 25) return "Weak";
    if (passwordStrength <= 50) return "Fair";
    if (passwordStrength <= 75) return "Good";
    return "Strong";
  };
  
  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-4">
        {success && (
          <Alert variant="success" className="d-flex align-items-center">
            <CheckCircleFill className="me-2" />
            User {initialValues ? "updated" : "created"} successfully!
          </Alert>
        )}
        
        {error && (
          <Alert variant="danger" className="d-flex align-items-center">
            <XCircleFill className="me-2" />
            {error}
          </Alert>
        )}
        
        {locationsError && (
          <Alert variant="warning" className="d-flex align-items-center">
            <XCircleFill className="me-2" />
            {locationsError}
          </Alert>
        )}
        
        {departmentsError && (
          <Alert variant="warning" className="d-flex align-items-center">
            <XCircleFill className="me-2" />
            {departmentsError}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit} autoComplete="off" noValidate>
          {/* username */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Username / Employee No</Form.Label>
            <InputGroup hasValidation>
              <InputGroup.Text className="bg-light">
                <PersonFill className="text-primary" />
              </InputGroup.Text>
              <Form.Control
                ref={usernameRef}
                name="username"
                value={form.username}
                onChange={handleChange}
                isInvalid={!!fieldErrors.username}
                required
                className="border-start-0"
                placeholder="Enter username"
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.username}
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
          
          {/* full_name */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Full Name</Form.Label>
            <InputGroup hasValidation>
              <InputGroup.Text className="bg-light">
                <PersonBadge className="text-primary" />
              </InputGroup.Text>
              <Form.Control
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                isInvalid={!!fieldErrors.full_name}
                required
                className="border-start-0"
                placeholder="Enter full name"
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.full_name}
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
          
          {/* email */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Email Address</Form.Label>
            <InputGroup hasValidation>
              <InputGroup.Text className="bg-light">
                <EnvelopeFill className="text-primary" />
              </InputGroup.Text>
              <Form.Control
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                isInvalid={!!fieldErrors.email}
                required
                className="border-start-0"
                placeholder="Enter email address"
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.email}
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
          
          {/* phone */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Phone Number</Form.Label>
            <InputGroup>
              <InputGroup.Text className="bg-light">
                <TelephoneFill className="text-primary" />
              </InputGroup.Text>
              <Form.Control
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                className="border-start-0"
                placeholder="Enter phone number"
              />
            </InputGroup>
          </Form.Group>
          
          {/* role, location & department */}
          <Row className="mb-3">
            <Col md={4}>
              <Form.Label className="fw-medium">Role</Form.Label>
              <Form.Select 
                name="role" 
                value={form.role} 
                onChange={handleChange}
                className="shadow-sm"
              >
                {roles.map(r => <option key={r}>{r}</option>)}
              </Form.Select>
            </Col>
            
            <Col md={4}>
              <Form.Label className="fw-medium">Location</Form.Label>
              <InputGroup>
                <Form.Select
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  disabled={locationsError || locations.length === 0}
                  className="shadow-sm"
                >
                  <option value="">-- Select Location --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </Form.Select>
                {locations.length === 0 && !locationsError && (
                  <InputGroup.Text className="bg-light">
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  </InputGroup.Text>
                )}
              </InputGroup>
              {locations.length === 0 && !locationsError && (
                <small className="text-muted d-flex align-items-center mt-1">
                  Loading locations...
                </small>
              )}
            </Col>
            
            <Col md={4}>
              <Form.Label className="fw-medium">Department</Form.Label>
              <InputGroup>
                <Form.Select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  disabled={departmentsError || departments.length === 0}
                  className="shadow-sm"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map(dep => (
                    <option 
                      key={dep.department_id || dep.id} 
                      value={dep.department_name || dep.name}
                    >
                      {dep.department_name || dep.name}
                    </option>
                  ))}
                </Form.Select>
                {departments.length === 0 && !departmentsError && (
                  <InputGroup.Text className="bg-light">
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  </InputGroup.Text>
                )}
              </InputGroup>
              {departments.length === 0 && !departmentsError && (
                <small className="text-muted d-flex align-items-center mt-1">
                  Loading departments...
                </small>
              )}
            </Col>
          </Row>
          
          {/* status field */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Status</Form.Label>
            <Form.Select 
              name="status" 
              value={form.status} 
              onChange={handleChange}
              className="shadow-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Form.Select>
          </Form.Group>
          
          {/* password */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-medium">
              Password {initialValues && <span className="text-muted">(Leave blank to keep current)</span>}
            </Form.Label>
            <InputGroup hasValidation>
              <InputGroup.Text className="bg-light">
                <ShieldLockFill className="text-primary" />
              </InputGroup.Text>
              <Form.Control
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                isInvalid={!!fieldErrors.password}
                required={!initialValues}
                className="border-start-0"
                placeholder={initialValues ? "Enter new password" : "Enter password"}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.password}
              </Form.Control.Feedback>
            </InputGroup>
            
            {form.password && (
              <div className="mt-2">
                <div className="d-flex justify-content-between mb-1">
                  <small>Password strength:</small>
                  <small className={`text-${getPasswordStrengthVariant()}`}>
                    {getPasswordStrengthLabel()}
                  </small>
                </div>
                <ProgressBar 
                  now={passwordStrength} 
                  variant={getPasswordStrengthVariant()}
                  className="mt-1"
                  style={{ height: '5px' }}
                />
              </div>
            )}
          </Form.Group>
          
          <div className="d-grid gap-2 d-md-flex">
            <Button 
              type="submit" 
              disabled={submitting}
              variant="primary"
              size="lg"
              className="py-2 fw-medium flex-grow-1"
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {submitLabel}…
                </>
              ) : (
                submitLabel
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline-secondary"
              size="lg"
              className="py-2 fw-medium"
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}