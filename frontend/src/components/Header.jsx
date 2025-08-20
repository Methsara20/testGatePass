// Header.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, Nav, Button, Dropdown, Badge, Modal } from "react-bootstrap";
import { 
  Bell, 
  PersonCircle, 
  BoxArrowRight, 
  Gear, 
  QuestionCircle,
  List
} from "react-bootstrap-icons";
import { useAuth } from "../context/AuthContext";
const Header = ({ isSidebarCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New approval request pending", time: "2 mins ago", read: false, link: "/approvals" },
    { id: 2, text: "Your request has been approved", time: "1 hour ago", read: true, link: "/requests" },
    { id: 3, text: "System maintenance scheduled", time: "3 hours ago", read: true, link: "/maintenance" },
  ]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  
  // Calculate unread notifications
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);
  
  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showNotifications) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNotifications]);
  
  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  const handleNotificationClick = (id) => {
    markAsRead(id);
    const notification = notifications.find(n => n.id === id);
    if (notification && notification.link) {
      navigate(notification.link);
    }
  };
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setShowLogoutModal(false);
      
      if (logout && typeof logout === 'function') {
        await logout();
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  return (
    <>
      <Navbar 
        bg="white" 
        expand="lg" 
        className="px-3 shadow-sm py-2"
        style={{ 
          borderBottom: '1px solid #e9ecef',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}
      >
        {/* Left side - Sidebar toggle */}
        <div className="d-flex align-items-center">
          {/* Sidebar toggle button */}
          <Button 
            variant="light" 
            className="p-2 me-2"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            aria-expanded={!isSidebarCollapsed}
          >
            <List size={20} />
          </Button>
        </div>
        
        {/* Right side - User actions */}
        <Nav className="ms-auto d-flex align-items-center gap-3">
          {/* Notifications */}
          <div className="position-relative" ref={notificationRef}>
            <Button 
              variant="light" 
              className="position-relative p-2"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge 
                  pill 
                  bg="danger" 
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ fontSize: '0.6rem' }}
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
            
            {/* Notification dropdown */}
            {showNotifications && (
              <div 
                className="position-absolute end-0 mt-2 p-3 bg-white shadow rounded border"
                style={{ 
                  width: '320px', 
                  maxHeight: '400px', 
                  overflowY: 'auto',
                  zIndex: 1000
                }}
                role="menu"
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 fw-bold">Notifications</h6>
                  {unreadCount > 0 && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 text-primary"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                
                {notifications.length === 0 ? (
                  <p className="text-muted text-center py-3">No notifications</p>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-2 mb-2 rounded ${notification.read ? 'bg-light' : 'bg-primary bg-opacity-10'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleNotificationClick(notification.id)}
                      role="menuitem"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notification.id)}
                    >
                      <div className="d-flex justify-content-between">
                        <span className={`fw-medium ${notification.read ? '' : 'text-primary'}`}>
                          {notification.text}
                        </span>
                        {!notification.read && (
                          <span className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></span>
                        )}
                      </div>
                      <small className="text-muted">{notification.time}</small>
                    </div>
                  ))
                )}
                
                <div className="text-center mt-3">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => navigate('/notifications')}
                  >
                    View All Notifications
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* User dropdown */}
          <Dropdown align="end">
            <Dropdown.Toggle 
              variant="light" 
              className="d-flex align-items-center p-1 border-0"
              id="user-dropdown"
            >
              <div className="d-flex flex-column text-end me-2 d-none d-sm-block">
                <div>
                  <span className="badge border text-dark me-1 bg-transparent">
                    {user?.username || 'User'}
                  </span>
                  <span className="badge bg-secondary me-1">{user?.department}</span>
                  <span className="badge bg-secondary">{user?.location}</span>
                </div>
              </div>
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef'
                }}
              >
                <PersonCircle size={20} className="text-secondary" />
              </div>
            </Dropdown.Toggle>
            
            <Dropdown.Menu className="shadow border-0" style={{ minWidth: '200px' }}>
              <div className="px-3 py-2 border-bottom">
                <div className="fw-bold">{user?.username || 'User'}</div>
                <small className="text-muted">{user?.email || 'user@example.com'}</small>
              </div>
              
              <Dropdown.Item onClick={() => navigate('/profile')}>
                <PersonCircle className="me-2" /> My Profile
              </Dropdown.Item>
              
              <Dropdown.Item onClick={() => navigate('/settings')}>
                <Gear className="me-2" /> Settings
              </Dropdown.Item>
              
              <Dropdown.Item onClick={() => navigate('/help')}>
                <QuestionCircle className="me-2" /> Help & Support
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Item 
                onClick={() => setShowLogoutModal(true)} 
                className="py-2 text-danger"
                disabled={isLoggingOut}
              >
                <BoxArrowRight className="me-2" /> 
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Navbar>
      
      {/* Logout Confirmation Modal */}
      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to logout? Any unsaved work will be lost.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
export default Header;