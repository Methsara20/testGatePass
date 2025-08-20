import React, { useEffect, useState } from "react";
import { Form, Button, Container, Row, Col, Modal, Alert, Card, ProgressBar } from "react-bootstrap";
import { getUserById, updateUser, updatePassword  } from "../services/userService";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [passwordAlert, setPasswordAlert] = useState({ type: "", message: "" });
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (user?.id) {
      getUserById(user.id)
        .then((res) => {
          setProfile(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching profile:", err);
          setLoading(false);
        });
    }
  }, [user]);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => {
        setAlert({ type: "", message: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    if (passwordAlert.message) {
      const timer = setTimeout(() => {
        setPasswordAlert({ type: "", message: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [passwordAlert]);

  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    return Math.min(strength, 100);
  };

  const getPasswordStrengthClass = (strength) => {
    if (strength < 50) return 'bg-danger';
    if (strength < 75) return 'bg-warning';
    return 'bg-success';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    
    if (name === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    if (passwordAlert.message) {
      setPasswordAlert({ type: "", message: "" });
    }
  };

  const validateForm = () => {
    if (!profile.full_name?.trim()) return "Full Name is required.";
    if (!profile.email?.trim()) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(profile.email)) return "Invalid email format.";
    if (!profile.phone_number?.trim()) return "Phone number is required.";
    if (!/^[0-9]{10}$/.test(profile.phone_number))
      return "Phone number must be 10 digits.";
    return null;
  };

  const validatePassword = () => {
    if (!passwordData.currentPassword.trim()) {
      return "Current password is required.";
    }
    if (!passwordData.newPassword.trim()) {
      return "New password is required.";
    }
    if (passwordData.newPassword.length < 6) {
      return "New password must be at least 6 characters long.";
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return "New password and confirm password do not match.";
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      return "New password must be different from current password.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      setAlert({ type: "danger", message: error });
      return;
    }
    setShowConfirm(true);
  };

  const handlePasswordSubmit = async () => {
    const error = validatePassword();
    if (error) {
      setPasswordAlert({ type: "danger", message: error });
      return;
    }
  
    try {
      // Use the dedicated updatePassword function from your service
      await updatePassword(
        user.id,
        passwordData.currentPassword,
        passwordData.newPassword
      );
  
      setPasswordAlert({ type: "success", message: "Password updated successfully!" });
  
      setTimeout(() => {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        setShowPasswordModal(false);
        setPasswordAlert({ type: "", message: "" });
        setPasswordStrength(0);
      }, 2000);
  
    } catch (err) {
      console.error("Full error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
  
      const errorMessage = err.response?.data?.message ||
                           err.response?.data?.error ||
                           "Failed to update password. Please check your current password.";
      setPasswordAlert({ type: "danger", message: errorMessage });
    }
  };


  const confirmUpdate = async () => {
    try {
      await updateUser(user.id, profile);
      setAlert({ type: "success", message: "Profile updated successfully!" });
    } catch (err) {
      console.error("Error updating profile:", err);
      setAlert({ type: "danger", message: "Failed to update profile." });
    } finally {
      setShowConfirm(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setPasswordAlert({ type: "", message: "" });
    setPasswordStrength(0);
  };

  if (loading) return (
    <Container className="mt-4">
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading profile information...</p>
      </div>
    </Container>
  );

  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <div className="text-center mb-4">
            <div className="d-inline-block position-relative">
              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mb-3" 
                   style={{ width: '100px', height: '100px' }}>
                <i className="bi bi-person-fill text-white" style={{ fontSize: '3rem' }}></i>
              </div>
              <div className="position-absolute bottom-0 end-0 bg-success rounded-circle p-1 border border-white">
                <i className="bi bi-check-fill text-white"></i>
              </div>
            </div>
            <h3 className="mt-3 mb-1">My Profile</h3>
            <p className="text-muted">Manage your account information</p>
          </div>

          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-primary text-white py-3">
              <h5 className="mb-0 d-flex align-items-center">
                <i className="bi bi-person-circle me-2"></i>
                Profile Information
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              {alert.message && (
                <Alert 
                  variant={alert.type} 
                  onClose={() => setAlert({ type: "", message: "" })}
                  dismissible
                  className="d-flex align-items-center"
                >
                  <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                  <div>{alert.message}</div>
                </Alert>
              )}
              <Form>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Username</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.username || ""}
                        disabled
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Role</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.role || ""}
                        disabled
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="full_name"
                        value={profile.full_name || ""}
                        onChange={handleChange}
                        className="py-2"
                        placeholder="Enter your full name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={profile.email || ""}
                        onChange={handleChange}
                        className="py-2"
                        placeholder="Enter your email"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Phone Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone_number"
                        value={profile.phone_number || ""}
                        onChange={handleChange}
                        className="py-2"
                        placeholder="Enter your phone number"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Location</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.location || ""}
                        disabled
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex gap-2 mt-4">
                  <Button 
                    variant="primary" 
                    onClick={handleSubmit}
                    className="px-4 py-2 d-flex align-items-center"
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Update Profile
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 d-flex align-items-center"
                  >
                    <i className="bi bi-shield-lock me-2"></i>
                    Change Password
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Profile Update Confirm Modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header className="bg-light py-3">
          <Modal.Title className="text-dark">
            <i className="bi bi-exclamation-triangle text-warning me-2"></i>
            Confirm Update
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="mb-0">Are you sure you want to update your profile details?</p>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmUpdate}>
            <i className="bi bi-check-lg me-1"></i>
            Yes, Update
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Password Update Modal */}
      <Modal 
        show={showPasswordModal} 
        onHide={() => {
          setShowPasswordModal(false);
          resetPasswordForm();
        }}
        size="md"
        centered
      >
        <Modal.Header className="bg-light py-3">
          <Modal.Title className="text-dark">
            <i className="bi bi-shield-lock me-2"></i>
            Change Password
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          {passwordAlert.message && (
            <Alert
              variant={passwordAlert.type}
              onClose={() => setPasswordAlert({ type: "", message: "" })}
              dismissible
              className="d-flex align-items-center"
            >
              <i className={`bi ${passwordAlert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
              <div>{passwordAlert.message}</div>
            </Alert>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">
                Current Password <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter your current password"
                className="py-2"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">
                New Password <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                className="py-2"
              />
              <div className="mt-2">
                <small className="text-muted">Password strength:</small>
                <ProgressBar 
                  now={passwordStrength} 
                  variant={getPasswordStrengthClass(passwordStrength)}
                  className="mt-1" 
                  style={{ height: '5px' }}
                />
                <div className="d-flex justify-content-between mt-1">
                  <small className="text-muted">Weak</small>
                  <small className="text-muted">Strong</small>
                </div>
              </div>
              <Form.Text className="text-muted">
                Password must be at least 6 characters long.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">
                Confirm New Password <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm your new password"
                className={`py-2 ${
                  passwordData.confirmPassword && 
                  passwordData.newPassword !== passwordData.confirmPassword 
                    ? "is-invalid" : ""
                }`}
              />
              {passwordData.confirmPassword && 
               passwordData.newPassword !== passwordData.confirmPassword && (
                <Form.Control.Feedback type="invalid">
                  Passwords do not match.
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowPasswordModal(false);
              resetPasswordForm();
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handlePasswordSubmit}
            disabled={
              !passwordData.currentPassword || 
              !passwordData.newPassword || 
              !passwordData.confirmPassword ||
              passwordData.newPassword !== passwordData.confirmPassword
            }
          >
            <i className="bi bi-check-lg me-1"></i>
            Update Password
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Profile;