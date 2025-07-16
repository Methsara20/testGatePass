import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, InputGroup } from "react-bootstrap";
import {
  PersonFill, EnvelopeFill, ShieldLockFill,
  TelephoneFill, GeoAltFill, PersonBadge
} from "react-bootstrap-icons";

const roles = ["Admin", "HOD", "User"];

export default function UserForm({
  initialValues = null,          // ← selected user or null
  submitLabel = "Create User",   // ← button text
  onSubmit,                      // ← function to call with form data
}) {
  const empty = {
    username: "", password: "", full_name: "",
    role: "User", email: "", phone_number: "", location: ""
  };

  const [form, setForm] = useState(initialValues || empty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /* 🔄 sync form whenever a different user is passed in */
  useEffect(() => setForm(initialValues || empty), [initialValues]);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(form);                 // ← addUser or updateUser
      if (!initialValues) setForm(empty);   // reset only after “create”
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {error && <div className="alert alert-danger py-2">{error}</div>}

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

        {/* role & location */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Role</Form.Label>
            <Form.Select name="role" value={form.role} onChange={handleChange}>
              {roles.map(r => <option key={r}>{r}</option>)}
            </Form.Select>
          </Col>
          <Col md={6} className="pt-md-0 pt-3">
            <Form.Label>Location</Form.Label>
            <InputGroup>
              <InputGroup.Text><GeoAltFill /></InputGroup.Text>
              <Form.Control
                name="location"
                value={form.location}
                onChange={handleChange}
              />
            </InputGroup>
          </Col>
        </Row>

        {/* password (keep for create; you may hide during edit) */}
        <Form.Group className="mb-4">
          <Form.Label>Password</Form.Label>
          <InputGroup>
            <InputGroup.Text><ShieldLockFill /></InputGroup.Text>
            <Form.Control
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required={!initialValues}   // optional: only required on create
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
