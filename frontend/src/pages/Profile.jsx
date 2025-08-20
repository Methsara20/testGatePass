import React, { useEffect, useState } from "react";
import { Form, Button, Container, Row, Col, Modal, Alert, Card } from "react-bootstrap";
import { getUserById, updateUser } from "../services/userService";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user } = useAuth(); // current logged-in user
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [passwordAlert, setPasswordAlert] = useState({ type: "", message: "" });
  
  // Password update state
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    // Clear password alert when user starts typing
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
      // Use the existing updateUser service with password data
      await updateUser(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordAlert({ type: "success", message: "Password updated successfully!" });
      
      // Clear form after successful update
      setTimeout(() => {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        setShowPasswordModal(false);
        setPasswordAlert({ type: "", message: "" });
      }, 2000);
      
    } catch (err) {
      console.error("Error updating password:", err);
      const errorMessage = err.response?.data?.message || "Failed to update password. Please check your current password.";
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
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <h3 className="mb-4">My Profile</h3>

          {/* Profile Information Card */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Profile Information</h5>
            </Card.Header>
            <Card.Body>
              {alert.message && (
                <Alert
                  variant={alert.type}
                  onClose={() => setAlert({ type: "", message: "" })}
                  dismissible
                >
                  {alert.message}
                </Alert>
              )}

              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.username || ""}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Role</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.role || ""}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="full_name"
                        value={profile.full_name || ""}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={profile.email || ""}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone_number"
                        value={profile.phone_number || ""}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Location</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.location || ""}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex gap-2">
                  <Button variant="primary" onClick={handleSubmit}>
                    Update Profile
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change Password
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Profile Update Confirm Modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Update</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to update your profile details?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmUpdate}>
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
      >
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {passwordAlert.message && (
            <Alert
              variant={passwordAlert.type}
              onClose={() => setPasswordAlert({ type: "", message: "" })}
              dismissible
            >
              {passwordAlert.message}
            </Alert>
          )}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Current Password <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter your current password"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>New Password <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password (minimum 6 characters)"
              />
              <Form.Text className="text-muted">
                Password must be at least 6 characters long.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm your new password"
                className={
                  passwordData.confirmPassword && 
                  passwordData.newPassword !== passwordData.confirmPassword 
                    ? "is-invalid" : ""
                }
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
        <Modal.Footer>
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
            Update Password
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Profile;