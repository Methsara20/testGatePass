import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import companyLogo from "../assets/LOGO.png";

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const sidebarRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);
  
  // Role check for Admin or HOD
  const isAdminOrHOD = user?.role === "Admin" || user?.role === "HOD";
  
  // Handle tooltip display with edge detection
  const handleMouseEnter = (e, title) => {
    if (!isCollapsed) return;
    
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
  
  return (
    <>
      <div
        ref={sidebarRef}
        className="bg-gradient-to-b from-gray-50 to-gray-100 border-end vh-100 p-3 transition-all position-relative shadow-sm d-flex flex-column"
        style={{
          width: isCollapsed ? "80px" : "320px",
          minWidth: isCollapsed ? "80px" : "320px",
          transition: "width 0.3s ease, background 0.3s ease",
        }}
      >
        {/* Company Logo - Normal positioning that scrolls with content */}
        <div 
          className="d-flex flex-column align-items-center flex-shrink-0"
          style={{ 
            height: isCollapsed ? "50px" : "auto",
            paddingBottom: isCollapsed ? "0" : "1rem",
            marginBottom: isCollapsed ? "auto" : "auto",
          }}
        >
          <div className="d-flex flex-column align-items-center" style={{ width: "100%" }}>
            {/* Logo wrapped with Link component for navigation */}
            <Link to="/" className="d-flex flex-column align-items-center" style={{ width: "100%" }}>
              <img
                src={companyLogo}
                alt="Company Logo"
                className="img-fluid"
                style={{
                  height: isCollapsed ? "36px" : "28px",
                  width: "auto",
                  maxWidth: isCollapsed ? "60px" : "150px",
                  objectFit: "contain",
                  filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.1))",
                  cursor: "pointer",
                  marginTop: "auto",  
                }}
                title={isCollapsed ? "Expand sidebar and go to home" : "Collapse sidebar and go to home"}
                onClick={(e) => {
                  e.preventDefault(); // Prevent default Link behavior
                  toggleSidebar();   // Toggle sidebar
                  // Navigate to home after a short delay to allow sidebar animation
                  setTimeout(() => {
                    window.location.href = "/";
                  }, isCollapsed ? 300 : 0);
                }}
              />
            </Link>
            
            {/* Underline separator below logo - conditionally styled */}
            <div 
              className={`w-100 border-bottom border-gray-300 transition-all ${
                isCollapsed ? "mt-2" : "mt-3"
              }`}
            ></div>
          </div>
        </div>
        
        {/* Scrollable content area with hidden scrollbar */}
        <div 
          className="flex-grow-1 overflow-y-auto" 
          style={{ 
            scrollbarWidth: "none", // Hide scrollbar for Firefox
            msOverflowStyle: "none", // Hide scrollbar for IE and Edge
          }}
        >
          <style jsx>{`
            /* Hide scrollbar for Chrome, Safari, Opera */
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          <ul className="nav flex-column gap-1">
            {/* Dashboard (Admin & HOD only) */}
            {isAdminOrHOD && (
              <li className="nav-item">
                <Link
                  className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                    isActive("/dashboard") ? "bg-primary text-white" : "hover:bg-gray-200"
                  }`}
                  to="/dashboard"
                  style={{ fontSize: "0.9rem", minHeight: "40px" }}
                  onMouseEnter={(e) => handleMouseEnter(e, "Dashboard")}
                  onMouseLeave={handleMouseLeave}
                >
                  <i className={`bi bi-speedometer2 ${isActive("/dashboard") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                  {!isCollapsed && <span className="ms-3 fw-medium">Dashboard</span>}
                </Link>
              </li>
            )}
            
            <li className="nav-item">
              <Link
                className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                  isActive("/gatepass/new") ? "bg-primary text-white" : "hover:bg-gray-200"
                }`}
                to="/gatepass/new"
                style={{ fontSize: "0.9rem", minHeight: "40px" }}
                onMouseEnter={(e) => handleMouseEnter(e, "New Gate Pass")}
                onMouseLeave={handleMouseLeave}
              >
                <i className={`bi bi-pencil-square ${isActive("/gatepass/new") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                {!isCollapsed && <span className="ms-3 fw-medium">New Gate Pass</span>}
              </Link>
            </li>
            
            <li className="nav-item">
              <Link
                className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                  isActive("/my-requests") ? "bg-primary text-white" : "hover:bg-gray-200"
                }`}
                to="/my-requests"
                style={{ fontSize: "0.9rem", minHeight: "40px" }}
                onMouseEnter={(e) => handleMouseEnter(e, "My Requests")}
                onMouseLeave={handleMouseLeave}
              >
                <i className={`bi bi-list-check ${isActive("/my-requests") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                {!isCollapsed && <span className="ms-3 fw-medium">My Requests</span>}
              </Link>
            </li>
            
            <li className="nav-item">
              <Link
                className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                  isActive("/return-gatepass") ? "bg-primary text-white" : "hover:bg-gray-200"
                }`}
                to="/return-gatepass"
                style={{ fontSize: "0.9rem", minHeight: "40px" }}
                onMouseEnter={(e) => handleMouseEnter(e, "Return")}
                onMouseLeave={handleMouseLeave}
              >
                <i className={`bi bi-arrow-return-left ${isActive("/return-gatepass") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                {!isCollapsed && <span className="ms-3 fw-medium">Return</span>}
              </Link>
            </li>
            
            {/* Approvals (Admin & HOD only) */}
            {isAdminOrHOD && (
              <li className="nav-item">
                <Link
                  className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                    isActive("/approvals") ? "bg-primary text-white" : "hover:bg-gray-200"
                  }`}
                  to="/approvals"
                  style={{ fontSize: "0.9rem", minHeight: "40px" }}
                  onMouseEnter={(e) => handleMouseEnter(e, "Approvals")}
                  onMouseLeave={handleMouseLeave}
                >
                  <i className={`bi bi-check2-square ${isActive("/approvals") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                  {!isCollapsed && <span className="ms-3 fw-medium">Approvals</span>}
                </Link>
              </li>
            )}
            
            {isAdminOrHOD && (
              <li className="nav-item">
                <Link
                  className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                    isActive("/cancel-approval") ? "bg-primary text-white" : "hover:bg-gray-200"
                  }`}
                  to="/cancel-approval"
                  style={{ fontSize: "0.9rem", minHeight: "40px" }}
                  onMouseEnter={(e) => handleMouseEnter(e, "Gate Pass Cancellations")}
                  onMouseLeave={handleMouseLeave}
                >
                  <i className={`bi bi-x-square ${isActive("/cancel-approval") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                  {!isCollapsed && <span className="ms-3 fw-medium">Gate Pass Cancellations</span>}
                </Link>
              </li>
            )}
            
            <li className="nav-item">
              <Link
                className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                  isActive("/deliveries") ? "bg-primary text-white" : "hover:bg-gray-200"
                }`}
                to="/deliveries"
                style={{ fontSize: "0.9rem", minHeight: "40px" }}
                onMouseEnter={(e) => handleMouseEnter(e, "Gatepasses Acceptance")}
                onMouseLeave={handleMouseLeave}
              >
                <i className={`bi bi-truck ${isActive("/deliveries") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                {!isCollapsed && (
                  <span className="ms-3 fw-medium">Gatepasses Acceptance</span>
                )}
              </Link>
            </li>
            
            {/* Admin Section (only Admin users) */}
            {user?.role === "Admin" && (
              <>
                {!isCollapsed && (
                  <div className="d-flex align-items-center mt-3 mb-2 px-3">
                    <div className="flex-grow-1 border-top border-gray-300"></div>
                    <span className="px-2 text-gray-500 fw-semibold text-uppercase" style={{ fontSize: "0.75rem" }}>Admin</span>
                    <div className="flex-grow-1 border-top border-gray-300"></div>
                  </div>
                )}
                {isCollapsed && <div className="border-top border-gray-300 my-3"></div>}
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                      isActive("/users") ? "bg-primary text-white" : "hover:bg-gray-200"
                    }`}
                    to="/users"
                    style={{ fontSize: "0.9rem", minHeight: "40px" }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Users")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <i className={`bi bi-people ${isActive("/users") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                    {!isCollapsed && <span className="ms-3 fw-medium">Users</span>}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                      isActive("/locations") ? "bg-primary text-white" : "hover:bg-gray-200"
                    }`}
                    to="/locations"
                    style={{ fontSize: "0.9rem", minHeight: "40px" }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Locations")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <i className={`bi bi-geo-alt ${isActive("/locations") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                    {!isCollapsed && <span className="ms-3 fw-medium">Locations</span>}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                      isActive("/departments") ? "bg-primary text-white" : "hover:bg-gray-200"
                    }`}
                    to="/departments"
                    style={{ fontSize: "0.9rem", minHeight: "40px" }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Departments")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <i className={`bi bi-building ${isActive("/departments") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                    {!isCollapsed && <span className="ms-3 fw-medium">Departments</span>}
                  </Link>
                </li>
              </>
            )}
            
            {/* Reports Section (Admin & HOD only) */}
            {isAdminOrHOD && (
              <>
                {!isCollapsed && (
                  <div className="d-flex align-items-center mt-3 mb-2 px-3">
                    <div className="flex-grow-1 border-top border-gray-300"></div>
                    <span className="px-2 text-gray-500 fw-semibold text-uppercase" style={{ fontSize: "0.75rem" }}>Reports</span>
                    <div className="flex-grow-1 border-top border-gray-300"></div>
                  </div>
                )}
                {isCollapsed && <div className="border-top border-gray-300 my-3"></div>}
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                      isActive("/reports/gatepass-summary") ? "bg-primary text-white" : "hover:bg-gray-200"
                    }`}
                    to="/reports/gatepass-summary"
                    style={{ fontSize: "0.9rem", minHeight: "40px" }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Gate Pass Summary")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <i className={`bi bi-file-earmark-spreadsheet ${isActive("/reports/gatepass-summary") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                    {!isCollapsed && (
                      <span className="ms-3 fw-medium">Gate Pass Summary</span>
                    )}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                      isActive("/reports/overdue-materials") ? "bg-primary text-white" : "hover:bg-gray-200"
                    }`}
                    to="/reports/overdue-materials"
                    style={{ fontSize: "0.9rem", minHeight: "40px" }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Overdue Materials")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <i className={`bi bi-clock-history ${isActive("/reports/overdue-materials") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                    {!isCollapsed && (
                      <span className="ms-3 fw-medium">Overdue Materials</span>
                    )}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                      isActive("/reports/approved-vs-rejected") ? "bg-primary text-white" : "hover:bg-gray-200"
                    }`}
                    to="/reports/approved-vs-rejected"
                    style={{ fontSize: "0.9rem", minHeight: "40px" }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Approved vs Rejected")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <i className={`bi bi-check2-circle ${isActive("/reports/approved-vs-rejected") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                    {!isCollapsed && (
                      <span className="ms-3 fw-medium">Approved vs Rejected</span>
                    )}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                      isActive("/reports/material-movement") ? "bg-primary text-white" : "hover:bg-gray-200"
                    }`}
                    to="/reports/material-movement"
                    style={{ fontSize: "0.9rem", minHeight: "40px" }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Material Movement")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <i className={`bi bi-arrow-left-right ${isActive("/reports/material-movement") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                    {!isCollapsed && (
                      <span className="ms-3 fw-medium">Material Movement</span>
                    )}
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    className={`nav-link py-2 px-3 rounded d-flex align-items-center transition-all ${
                      isActive("/reports/acceptance-report") ? "bg-primary text-white" : "hover:bg-gray-200"
                    }`}
                    to="/reports/acceptance-report"
                    style={{ fontSize: "0.9rem", minHeight: "40px" }}
                    onMouseEnter={(e) => handleMouseEnter(e, "Acceptance Report")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <i className={`bi bi-hand-thumbs-up ${isActive("/reports/acceptance-report") ? "text-white" : "text-primary"}`} style={{ fontSize: "1.2rem" }}></i>
                    {!isCollapsed && (
                      <span className="ms-3 fw-medium">Acceptance Report</span>
                    )}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
      
      {/* Tooltip for collapsed state */}
      {activeTooltip && isCollapsed && (
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