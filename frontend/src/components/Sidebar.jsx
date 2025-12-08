import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import companyLogo from "../assets/LOGO.png";

const Sidebar = ({ isCollapsed, toggleSidebar, isMobile }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const sidebarRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  
  // Listen for toggle events from header
  useEffect(() => {
    const handleToggleEvent = () => {
      if (isMobile) {
        setIsMobileExpanded(prev => !prev);
      } else {
        // For desktop, the Layout component handles the state
        // This event is already handled by Layout
      }
    };
    
    window.addEventListener('sidebar-toggle', handleToggleEvent);
    return () => {
      window.removeEventListener('sidebar-toggle', handleToggleEvent);
    };
  }, [isMobile]);
  
  // Role checks
  const isAdmin = user?.role === "Admin";
  const isHOD = user?.role === "HOD";
  const isAudit = user?.role === "Audit" || user?.role === "Auditor";
  
  // Access permissions
  const canViewDashboard = isAdmin || isHOD || isAudit;
  const canViewApprovals = isAdmin || isHOD; // Audit users cannot view approvals
  const canViewReports = isAdmin || isHOD || isAudit;
  
  // Handle tooltip display with edge detection
  const handleMouseEnter = (e, title) => {
    const effectiveCollapsed = isMobile ? !isMobileExpanded : isCollapsed;
    if (!effectiveCollapsed) return;
    
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    
    tooltipTimeoutRef.current = setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      
      // Calculate tooltip position
      let left = rect.right + 10;
      const top = rect.top;
      
      // Check if tooltip goes off-screen
      if (left + 200 > window.innerWidth) {
        left = rect.left - 210; // Show on left side instead
      }
      
      setTooltipPosition({ top, left });
      setActiveTooltip(title);
    }, 300);
  };
  
  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setActiveTooltip(null);
  };
  
  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);
  
  // Check if a menu item is active
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // Determine if sidebar is effectively collapsed
  const effectiveCollapsed = isMobile ? !isMobileExpanded : isCollapsed;
  
  // Icon component with blue highlight when active
  const Icon = ({ name, isActive }) => (
    <i 
      className={`bi bi-${name}`} 
      style={{ 
        fontSize: "1.2rem",
        color: isActive ? "#ffffff" : "#6b7280", // White when active, gray when inactive
        fontWeight: isActive ? "600" : "400" // Slightly bolder when active
      }}
    ></i>
  );
  
  return (
    <>
      <div
        ref={sidebarRef}
        className={`bg-gradient-to-b from-gray-50 to-gray-100 border-end vh-100 transition-all position-relative shadow-sm d-flex flex-column ${
          effectiveCollapsed ? 'px-1 py-3' : 'p-3'
        }`}
        style={{
          width: effectiveCollapsed ? "70px" : "260px",
          minWidth: effectiveCollapsed ? "70px" : "260px",
          transition: "width 0.3s ease, background 0.3s ease",
          zIndex: (isMobile && !effectiveCollapsed) ? 1050 : (isMobile ? 1040 : "auto")
        }}
      >
        {/* Company Logo */}
        <div 
          className="d-flex flex-column align-items-center flex-shrink-0"
          style={{ 
            height: effectiveCollapsed ? "50px" : "auto",
            paddingBottom: effectiveCollapsed ? "0" : "0.5rem",
            marginBottom: effectiveCollapsed ? "0.5rem":"0.5rem"
          }}
        >
          <div className="d-flex flex-column align-items-center" style={{ width: "50%" }}>
            <Link to="/" className="d-flex flex-column align-items-center" style={{ width: "100%" }}>
              <img
                src={companyLogo}
                alt="Company Logo"
                className="img-fluid"
                style={{
                  height: effectiveCollapsed ? "30px" : "22px",
                  width: "auto",
                  maxWidth: effectiveCollapsed ? "50px" : "150px",
                  objectFit: "contain",
                  filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.1))",
                  cursor: "pointer",
                  marginTop: "auto",  
                }}
                title={effectiveCollapsed ? "Expand sidebar and go to home" : "Collapse sidebar and go to home"}
                onClick={(e) => {
                  e.preventDefault();
                  // Dispatch toggle event
                  window.dispatchEvent(new CustomEvent('sidebar-toggle'));
                  setTimeout(() => {
                    window.location.href = "/";
                  }, effectiveCollapsed ? 300 : 0);
                }}
              />
            </Link>
            
            <div 
              className={`w-100 border-bottom border-gray-300 transition-all ${
                effectiveCollapsed ? "mt-2" : "mt-3"
              }`}
            ></div>
          </div>
        </div>
        
        {/* Scrollable content area with custom scrollbar */}
        <div 
          className="flex-grow-1 overflow-y-auto"
          style={{
            // Force scrollbar to be visible
            overflowY: 'scroll',
            overflowX: 'hidden', // Prevent horizontal scrollbar
            // Define a fixed height to ensure scrolling
            height: isMobile ? 'calc(100vh - 74px)' : 'calc(100vh - 120px)',
            // Firefox scrollbar styles
            scrollbarWidth: 'thin',
            scrollbarColor: '#888 #f1f1f1',
          }}
        >
          {/* Custom scrollbar styles for WebKit browsers */}
          <style>
            {`
              .flex-grow-1::-webkit-scrollbar {
                width: 6px !important; /* Reduced scrollbar width */
              }
              
              .flex-grow-1::-webkit-scrollbar-track {
                background: #f1f1f1 !important;
                border-radius: 10px !important;
              }
              
              .flex-grow-1::-webkit-scrollbar-thumb {
                background: #888 !important;
                border-radius: 10px !important;
              }
              
              .flex-grow-1::-webkit-scrollbar-thumb:hover {
                background: #555 !important;
              }
            `}
          </style>
          
          <ul className="nav flex-column gap-1">
            {/* Dashboard (Admin, HOD & Audit only) */}
            {canViewDashboard && (
              <li className="nav-item">
                <Link
                  className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                    isActive("/dashboard") ? "bg-primary text-white" : "hover:bg-gray-200"
                  } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                  to="/dashboard"
                  style={{ 
                    fontSize: "0.9rem", 
                    minHeight: "40px",
                    width: effectiveCollapsed ? "40px" : "auto",
                    height: effectiveCollapsed ? "40px" : "auto",
                    margin: effectiveCollapsed ? "0 auto" : "0",
                    borderRadius: effectiveCollapsed ? "8px" : "6px"
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, "Dashboard")}
                  onMouseLeave={handleMouseLeave}
                >
                  <Icon name="speedometer2" isActive={isActive("/dashboard")} />
                  {!effectiveCollapsed && <span className={`ms-3 fw-medium ${isActive("/dashboard") ? "text-white" : ""}`}>Dashboard</span>}
                </Link>
              </li>
            )}
            
            {/* Only show these items for non-Audit users */}
            {!isAudit && (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                      isActive("/gatepass/new") ? "bg-primary text-white" : "hover:bg-gray-200"
                    } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                    to="/gatepass/new"
                    style={{ 
                      fontSize: "0.9rem", 
                      minHeight: "40px",
                      width: effectiveCollapsed ? "40px" : "auto",
                      height: effectiveCollapsed ? "40px" : "auto",
                      margin: effectiveCollapsed ? "0 auto" : "0",
                      borderRadius: effectiveCollapsed ? "8px" : "6px"
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, "New Gate Pass")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Icon name="pencil-square" isActive={isActive("/gatepass/new")} />
                    {!effectiveCollapsed && <span className={`ms-3 fw-medium ${isActive("/gatepass/new") ? "text-white" : ""}`}>New Gate Pass</span>}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                      isActive("/my-requests") ? "bg-primary text-white" : "hover:bg-gray-200"
                    } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                    to="/my-requests"
                    style={{ 
                      fontSize: "0.9rem", 
                      minHeight: "40px",
                      width: effectiveCollapsed ? "40px" : "auto",
                      margin: effectiveCollapsed ? "0 auto" : "0"
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, "My Requests")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Icon name="list-check" isActive={isActive("/my-requests")} />
                    {!effectiveCollapsed && <span className={`ms-3 fw-medium ${isActive("/my-requests") ? "text-white" : ""}`}>My Requests</span>}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                      isActive("/return-gatepass") ? "bg-primary text-white" : "hover:bg-gray-200"
                    } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                    to="/return-gatepass"
                    style={{ 
                      fontSize: "0.9rem", 
                      minHeight: "40px",
                      width: effectiveCollapsed ? "40px" : "auto",
                      margin: effectiveCollapsed ? "0 auto" : "0"
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Return")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Icon name="arrow-return-left" isActive={isActive("/return-gatepass")} />
                    {!effectiveCollapsed && <span className={`ms-3 fw-medium ${isActive("/return-gatepass") ? "text-white" : ""}`}>Return</span>}
                  </Link>
                </li>
                
                {/* Approvals (Admin & HOD only) */}
                {canViewApprovals && (
                  <li className="nav-item">
                    <Link
                      className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                        isActive("/approvals") ? "bg-primary text-white" : "hover:bg-gray-200"
                      } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                      to="/approvals"
                      style={{ 
                        fontSize: "0.9rem", 
                        minHeight: "40px",
                        width: effectiveCollapsed ? "40px" : "auto",
                        margin: effectiveCollapsed ? "0 auto" : "0"
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, "Approvals")}
                      onMouseLeave={handleMouseLeave}
                    >
                      <Icon name="check2-square" isActive={isActive("/approvals")} />
                      {!effectiveCollapsed && <span className={`ms-3 fw-medium ${isActive("/approvals") ? "text-white" : ""}`}>Approvals</span>}
                    </Link>
                  </li>
                )}
                
                {canViewApprovals && (
                  <li className="nav-item">
                    <Link
                      className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                        isActive("/cancel-approval") ? "bg-primary text-white" : "hover:bg-gray-200"
                      } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                      to="/cancel-approval"
                      style={{ 
                        fontSize: "0.9rem", 
                        minHeight: "40px",
                        width: effectiveCollapsed ? "40px" : "auto",
                        margin: effectiveCollapsed ? "0 auto" : "0"
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, "Gate Pass Cancellation")}
                      onMouseLeave={handleMouseLeave}
                    >
                      <Icon name="x-square" isActive={isActive("/cancel-approval")} />
                      {!effectiveCollapsed && <span className={`ms-3 fw-medium ${isActive("/cancel-approval") ? "text-white" : ""}`}>Gate Pass Cancellation</span>}
                    </Link>
                  </li>
                )}
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                      isActive("/deliveries") ? "bg-primary text-white" : "hover:bg-gray-200"
                    } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                    to="/deliveries"
                    style={{ 
                      fontSize: "0.9rem", 
                      minHeight: "40px",
                      width: effectiveCollapsed ? "40px" : "auto",
                      margin: effectiveCollapsed ? "0 auto" : "0"
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Gatepasses Acceptance")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Icon name="truck" isActive={isActive("/deliveries")} />
                    {!effectiveCollapsed && (
                      <span className={`ms-3 fw-medium ${isActive("/deliveries") ? "text-white" : ""}`}>Gate Pass Acceptance</span>
                    )}
                  </Link>
                </li>
              </>
            )}
            
            {/* Admin Section (only Admin users) */}
            {isAdmin && (
              <>
                {!effectiveCollapsed && (
                  <div className="d-flex align-items-center mt-3 mb-2 px-3">
                    <div className="flex-grow-1 border-top border-gray-300"></div>
                    <span className="px-2 text-gray-500 fw-semibold text-uppercase" style={{ fontSize: "0.75rem" }}>Admin</span>
                    <div className="flex-grow-1 border-top border-gray-300"></div>
                  </div>
                )}
                {effectiveCollapsed && <div className="border-top border-gray-300 my-3"></div>}
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                      isActive("/users") ? "bg-primary text-white" : "hover:bg-gray-200"
                    } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                    to="/users"
                    style={{ 
                      fontSize: "0.9rem", 
                      minHeight: "40px",
                      width: effectiveCollapsed ? "40px" : "auto",
                      margin: effectiveCollapsed ? "0 auto" : "0"
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Users")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Icon name="people" isActive={isActive("/users")} />
                    {!effectiveCollapsed && <span className={`ms-3 fw-medium ${isActive("/users") ? "text-white" : ""}`}>Users</span>}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                      isActive("/locations") ? "bg-primary text-white" : "hover:bg-gray-200"
                    } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                    to="/locations"
                    style={{ 
                      fontSize: "0.9rem", 
                      minHeight: "40px",
                      width: effectiveCollapsed ? "40px" : "auto",
                      margin: effectiveCollapsed ? "0 auto" : "0"
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Locations")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Icon name="geo-alt" isActive={isActive("/locations")} />
                    {!effectiveCollapsed && <span className={`ms-3 fw-medium ${isActive("/locations") ? "text-white" : ""}`}>Locations</span>}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                      isActive("/departments") ? "bg-primary text-white" : "hover:bg-gray-200"
                    } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                    to="/departments"
                    style={{ 
                      fontSize: "0.9rem", 
                      minHeight: "40px",
                      width: effectiveCollapsed ? "40px" : "auto",
                      margin: effectiveCollapsed ? "0 auto" : "0"
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Departments")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Icon name="building" isActive={isActive("/departments")} />
                    {!effectiveCollapsed && <span className={`ms-3 fw-medium ${isActive("/departments") ? "text-white" : ""}`}>Departments</span>}
                  </Link>
                </li>
              </>
            )}
            
            {/* Reports Section (Admin, HOD & Audit only) */}
            {canViewReports && (
              <>
                {!effectiveCollapsed && (
                  <div className="d-flex align-items-center mt-3 mb-2 px-3">
                    <div className="flex-grow-1 border-top border-gray-300"></div>
                    <span className="px-2 text-gray-500 fw-semibold text-uppercase" style={{ fontSize: "0.75rem" }}>Reports</span>
                    <div className="flex-grow-1 border-top border-gray-300"></div>
                  </div>
                )}
                {effectiveCollapsed && <div className="border-top border-gray-300 my-3"></div>}
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                      isActive("/reports/gatepass-summary") ? "bg-primary text-white" : "hover:bg-gray-200"
                    } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                    to="/reports/gatepass-summary"
                    style={{ 
                      fontSize: "0.9rem", 
                      minHeight: "40px",
                      width: effectiveCollapsed ? "40px" : "auto",
                      margin: effectiveCollapsed ? "0 auto" : "0"
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Gate Pass Summary")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Icon name="file-earmark-spreadsheet" isActive={isActive("/reports/gatepass-summary")} />
                    {!effectiveCollapsed && (
                      <span className={`ms-3 fw-medium ${isActive("/reports/gatepass-summary") ? "text-white" : ""}`}>Gate Pass Summary</span>
                    )}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                      isActive("/reports/overdue-materials") ? "bg-primary text-white" : "hover:bg-gray-200"
                    } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                    to="/reports/overdue-materials"
                    style={{ 
                      fontSize: "0.9rem", 
                      minHeight: "40px",
                      width: effectiveCollapsed ? "40px" : "auto",
                      margin: effectiveCollapsed ? "0 auto" : "0"
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Overdue Materials")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Icon name="clock-history" isActive={isActive("/reports/overdue-materials")} />
                    {!effectiveCollapsed && (
                      <span className={`ms-3 fw-medium ${isActive("/reports/overdue-materials") ? "text-white" : ""}`}>Overdue Materials</span>
                    )}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                      isActive("/reports/approved-vs-rejected") ? "bg-primary text-white" : "hover:bg-gray-200"
                    } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                    to="/reports/approved-vs-rejected"
                    style={{ 
                      fontSize: "0.9rem", 
                      minHeight: "40px",
                      width: effectiveCollapsed ? "40px" : "auto",
                      margin: effectiveCollapsed ? "0 auto" : "0"
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Approved vs Rejected")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Icon name="check2-circle" isActive={isActive("/reports/approved-vs-rejected")} />
                    {!effectiveCollapsed && (
                      <span className={`ms-3 fw-medium ${isActive("/reports/approved-vs-rejected") ? "text-white" : ""}`}>Approved vs Rejected</span>
                    )}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                      isActive("/reports/material-movement") ? "bg-primary text-white" : "hover:bg-gray-200"
                    } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                    to="/reports/material-movement"
                    style={{ 
                      fontSize: "0.9rem", 
                      minHeight: "40px",
                      width: effectiveCollapsed ? "40px" : "auto",
                      margin: effectiveCollapsed ? "0 auto" : "0"
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Material Movement")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Icon name="arrow-left-right" isActive={isActive("/reports/material-movement")} />
                    {!effectiveCollapsed && (
                      <span className={`ms-3 fw-medium ${isActive("/reports/material-movement") ? "text-white" : ""}`}>Material Movement</span>
                    )}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 rounded d-flex align-items-center transition-all ${
                      isActive("/reports/acceptance-report") ? "bg-primary text-white" : "hover:bg-gray-200"
                    } ${effectiveCollapsed ? 'justify-content-center px-1' : 'px-3'}`}
                    to="/reports/acceptance-report"
                    style={{ 
                      fontSize: "0.9rem", 
                      minHeight: "40px",
                      width: effectiveCollapsed ? "40px" : "auto",
                      margin: effectiveCollapsed ? "0 auto" : "0"
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Acceptance Report")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Icon name="hand-thumbs-up" isActive={isActive("/reports/acceptance-report")} />
                    {!effectiveCollapsed && (
                      <span className={`ms-3 fw-medium ${isActive("/reports/acceptance-report") ? "text-white" : ""}`}>Acceptance Report</span>
                    )}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
      
      {/* Tooltip for collapsed state (only show on desktop) */}
      {activeTooltip && effectiveCollapsed && !isMobile && (
        <div
          className="position-fixed bg-dark text-white py-2 px-3 rounded shadow-lg transition-opacity"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            zIndex: 1000,
            fontSize: "0.8rem",
            whiteSpace: "nowrap",
            opacity: activeTooltip ? 1 : 0,
            transform: activeTooltip ? "translateY(0)" : "translateY(5px)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          {activeTooltip}
          <div
            className="position-absolute bg-dark"
            style={{
              top: "50%",
              right: "100%",
              width: "8px",
              height: "8px",
              transform: "translateY(-50%) rotate(45deg)",
              marginRight: "-1px",
            }}
          ></div>
        </div>
      )}
    </>
  );
};

export default Sidebar;