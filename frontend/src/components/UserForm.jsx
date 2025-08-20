import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, InputGroup } from "react-bootstrap";
import {
  PersonFill, EnvelopeFill, ShieldLockFill,
  TelephoneFill, PersonBadge
} from "react-bootstrap-icons";
import { getLocations } from "../services/locationService";
import { getDepartments } from "../services/departmentService";

const roles = ["Admin", "HOD", "User"];

export default function UserForm({
  initialValues = null,
  submitLabel = "Create User",
  onSubmit,
}) {
  const empty = {
    username: "", password: "", full_name: "",
    role: "User", email: "", phone_number: "", 
    location: "", department: ""
  };

  const [form, setForm] = useState(initialValues || empty);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [locationsError, setLocationsError] = useState(null);
  const [departmentsError, setDepartmentsError] = useState(null);

  useEffect(() => {
    setForm(initialValues || empty);
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
  
  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(form);
      if (!initialValues) setForm(empty);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      {locationsError && <div className="alert alert-warning py-2">{locationsError}</div>}
      {departmentsError && <div className="alert alert-warning py-2">{departmentsError}</div>}

      <Form onSubmit={handleSubmit} autoComplete="off">
        {/* username */}
        <Form.Group className="mb-3">
          <Form.Label>Username / Employee No</Form.Label>
          <InputGroup>
            <InputGroup.Text><PersonFill /></InputGroup.Text>
            <Form.Control
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </InputGroup>
        </Form.Group>

        {/* full_name */}
        <Form.Group className="mb-3">
          <Form.Label>Full Name</Form.Label>
          <InputGroup>
            <InputGroup.Text><PersonBadge /></InputGroup.Text>
            <Form.Control
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </InputGroup>
        </Form.Group>

        {/* email */}
        <Form.Group className="mb-3">
          <Form.Label>Email Address</Form.Label>
          <InputGroup>
            <InputGroup.Text><EnvelopeFill /></InputGroup.Text>
            <Form.Control
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </InputGroup>
        </Form.Group>

        {/* phone */}
        <Form.Group className="mb-3">
          <Form.Label>Phone Number</Form.Label>
          <InputGroup>
            <InputGroup.Text><TelephoneFill /></InputGroup.Text>
            <Form.Control
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
            />
          </InputGroup>
        </Form.Group>

        {/* role, location & department */}
        <Row className="mb-3">
          <Col md={4}>
            <Form.Label>Role</Form.Label>
            <Form.Select name="role" value={form.role} onChange={handleChange}>
              {roles.map(r => <option key={r}>{r}</option>)}
            </Form.Select>
          </Col>

          <Col md={4}>
            <Form.Label>Location</Form.Label>
            <Form.Select
              name="location"
              value={form.location}
              onChange={handleChange}
              disabled={locationsError || locations.length === 0}
            >
              <option value="">-- Select Location --</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </Form.Select>
            {locations.length === 0 && !locationsError && (
              <small className="text-muted">Loading locations...</small>
            )}
          </Col>

          <Col md={4}>
            <Form.Label>Department</Form.Label>
            <Form.Select
              name="department"
              value={form.department}
              onChange={handleChange}
              disabled={departmentsError || departments.length === 0}
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
              <small className="text-muted">Loading departments...</small>
            )}
          </Col>
        </Row>

        {/* password */}
        <Form.Group className="mb-4">
          <Form.Label>Password</Form.Label>
          <InputGroup>
            <InputGroup.Text><ShieldLockFill /></InputGroup.Text>
            <Form.Control
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required={!initialValues}
            />
          </InputGroup>
        </Form.Group>

        <Button type="submit" disabled={submitting}>
          {submitting ? submitLabel + "…" : submitLabel}
        </Button>
      </Form>
    </>
  );
}