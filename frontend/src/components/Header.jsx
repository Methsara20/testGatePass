// Header.jsx - Enhanced toggle button and customizable welcome banner
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, Nav, Button, Dropdown, Badge, Modal } from "react-bootstrap";
import { 
  Bell, 
  PersonCircle, 
  BoxArrowRight, 
  QuestionCircle,
  List
} from "react-bootstrap-icons";
import { getNotifications } from "../services/notificationService"; 
import { useAuth } from "../context/AuthContext";

const Header = ({ 
  isSidebarCollapsed, 
  toggleSidebar, 
  isMobile,
  welcomeTextColor = '#000000ff', // Default green color, customizable
  showWelcomeText = true // Option to show/hide welcome text
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  
  // 🔹 Fetch notifications from backend
  const loadNotifications = async () => {
    if (!user?.location || !user?.department) return;
    try {
      const data = await getNotifications(user.location, user.department);
      const formatted = data.map((n) => ({
        id: n.id,
        text: n.message,
        read: false,
        link: "/approvals",
      }));
      setNotifications(formatted);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };
  
  // 🔹 Poll backend every 10s
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);
  
  // 🔹 Calculate unread notifications
  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length;
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
  
  // Handle sidebar toggle for both desktop and mobile
  const handleSidebarToggle = () => {
    // Dispatch custom event for sidebar toggle
    window.dispatchEvent(new CustomEvent('sidebar-toggle'));
  };
  
  return (
    <>
      <Navbar 
        expand="lg" 
        className="px-2 px-sm-3 shadow-sm"
        style={{ 
          backgroundColor: '#ffffffff',
          borderBottom: '1px solid #d1d9e0',
          minHeight: '55px',
          height: '55px',
          position: 'relative',
          zIndex: 1030,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {/* Left side - Sidebar toggle only */}
        <div className="d-flex align-items-center">
          {/* Enhanced sidebar toggle button */}
          <Button 
            variant="light" 
            className="p-0 me-2 me-sm-3 d-flex align-items-center justify-content-center rounded"
            onClick={handleSidebarToggle}
            aria-label="Toggle sidebar"
            aria-expanded={!isSidebarCollapsed}
            style={{ 
              width: '36px', 
              height: '36px',
              minHeight: '36px',
              border: '1px solid #e9ecef',
              background: '#f8f9fa',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#e9ecef'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f8f9fa'}
          >
            <List size={22} weight="bold" />
          </Button>
        </div>
        
        {/* Right side - Welcome text, notifications, and user actions */}
        <Nav className="ms-auto d-flex align-items-center flex-nowrap" style={{ height: '32px' }}>
          {/* Welcome Back banner - moved to right side, customizable color */}
          {showWelcomeText && !isMobile && (
            <div className="d-none d-md-flex align-items-center me-3">
              <div 
                className="fw-sm" 
                style={{ 
                  color: welcomeTextColor,
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Welcome Back!
              </div>
            </div>
          )}
          
          {/* Notifications */}
          <div className="position-relative me-3 d-flex align-items-center" ref={notificationRef}>
            <Button 
              variant="light" 
              className="position-relative p-0 d-flex align-items-center justify-content-center"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
              aria-expanded={showNotifications}
              style={{ 
                width: '36px', 
                height: '32px',
                minHeight: '32px',
                position: 'relative',
                zIndex: 1050,
                border: 'none',
                background: 'transparent',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Bell 
                size={20} 
                fill={unreadCount > 0 ? "#000000ff" : "#000000ff"}
                color={unreadCount > 0 ? "#000000ff" : "#000000ff"}
                style={{
                  animation: unreadCount > 0 ? 'bellShake 2s infinite' : 'none',
                  transformOrigin: 'top center',
             //   stroke: unreadCount > 0 ? "#000000ff" : "#000000ff",
                  strokeWidth: "1.5"
                }}
              />
              {unreadCount > 0 && (
                <Badge 
                  pill 
                  bg="danger" 
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ 
                    fontSize: '0.6rem', 
                    minWidth: '16px',
                    height: '16px',
                    padding: '3px',
                    zIndex: 1051,
                    animation: 'pulse 1.5s infinite'
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
            
            {/* CSS Animation Styles */}
            <style jsx>{`
              @keyframes bellShake {
                0%, 50%, 100% { transform: rotate(0deg); }
                10%, 30% { transform: rotate(-15deg); }
                20%, 40% { transform: rotate(15deg); }
              }
              
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
            
            {/* Notification dropdown */}
            {showNotifications && (
              <div 
                className="position-absolute mt-0 p-3 bg-white shadow rounded border"
                style={{ 
                  width: isMobile ? '90vw' : '320px', 
                  maxWidth: isMobile ? '90vw' : '320px', 
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  zIndex: 1060,
                  right: 0,
                  left: 'auto',
                  top: '100%',
                  transform: 'translateY(8px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                role="menu"
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
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
                  {/* <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => navigate('/notifications')}
                  >
                    View All Notifications
                  </Button> */}
                </div>
              </div>
            )}
          </div>
          
          {/* User dropdown - ORIGINAL DESIGN */}
          <Dropdown 
            align="end" 
            drop="down" 
          className="d-flex align-items-center"
          >
            <Dropdown.Toggle 
              variant="light" 
              className="d-flex align-items-center p-1 border-0"
              id="user-dropdown"
              style={{ 
                position: 'relative', 
                zIndex: 1050,
                height: '36px',
                minHeight: '36px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div className="d-flex flex-column text-end me-2">
                <div>
                  <span className="badge border text-dark me-1 bg-transparent">
                    {user?.username || 'User'}
                  </span>
                  <span className="badge bg-secondary me-1">{user?.department}</span>
                  <span className="badge bg-secondary">{user?.location}</span>
                </div>
              </div>
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  background: '#ffffffff',
                  border: '1px solid #e9ecef'
                }}
              >
                <PersonCircle size={18} className="text-secondary" />
              </div>
            </Dropdown.Toggle>
            
            <Dropdown.Menu 
              className="shadow border-0"
              style={{ 
                minWidth: '200px',
                marginTop: '0.5rem',
                zIndex: 1060,
                ...(isMobile && {
                  position: 'fixed',
                  top: '48px',
                  right: '10px',
                  left: 'auto',
                  width: '280px',
                  maxWidth: '280px',
                  transform: 'none',
                  borderRadius: '8px',
                  maxHeight: '70vh',
                  overflowY: 'auto'
                })
              }}
            >
              {/* Mobile welcome banner - with customizable color */}
              {isMobile && showWelcomeText && (
                <div className="px-3 py-2 border-bottom">
                  <div 
                    className="fw-sm" 
                    style={{ 
                      color: welcomeTextColor,
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    Welcome Back!
                  </div>
                </div>
              )}
              
              <div className="px-3 py-2 border-bottom">
                <div className="fw-bold">{user?.username || 'User'}</div>
                <small className="text-muted">{user?.email || 'user@example.com'}</small>
              </div>
              
              <Dropdown.Item onClick={() => navigate('/profile')}>
                <PersonCircle className="me-2" /> My Profile
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