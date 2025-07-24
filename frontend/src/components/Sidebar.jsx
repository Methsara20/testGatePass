import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import companyLogo from "../assets/LOGO.png";

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <div className="bg-light border-end vh-100 p-3" style={{ width: "280px", minWidth: "280px" }}>
      {/* Company Logo Section */}
      <div className="d-flex align-items-center mb-4 p-3 bg-white rounded shadow-sm">
        <img 
          src={companyLogo} 
          alt="Company Logo" 
          className="img-fluid"
          style={{ 
            height: "60px",
            width: "auto",
            maxWidth: "100px",
            objectFit: "contain",
            marginRight: "15px",
            filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.1))"
          }} 
        />
        <h4 className="m-0 text-primary fw-bold" style={{ fontSize: "1.25rem" }}>
          Gatepass System
        </h4>
      </div>
      
      <ul className="nav flex-column">
        {/* Main Navigation */}
        <li className="nav-item mb-2">
          <Link className="nav-link py-2 px-3 rounded" to="/dashboard">
            <i className="bi bi-speedometer2 me-2"></i> Dashboard
          </Link>
        </li>
        
        <li className="nav-item mb-2">
          <Link className="nav-link py-2 px-3 rounded" to="/gatepass/new">
            <i className="bi bi-pencil-square me-2"></i> New Gate-Pass
          </Link>
        </li>

        <li className="nav-item mb-2">
          <Link className="nav-link py-2 px-3 rounded" to="/my-requests">
            <i className="bi bi-list-check me-2"></i> My Requests
          </Link>
        </li>

        <li className="nav-item mb-2">
          <Link className="nav-link py-2 px-3 rounded" to="/approvals">
            <i className="bi bi-check2-square me-2"></i> Approvals
          </Link>
        </li>

        <li className="nav-item mb-2">
          <Link className="nav-link py-2 px-3 rounded" to="/deliveries">
            <i className="bi bi-truck me-2"></i> Gatepasses
          </Link>
        </li>

        {/* Admin Section */}
        {user?.role === "Admin" && (
          <>
            <hr className="my-3" />
            <h6 className="text-muted px-3 mb-2">Admin</h6>
            <li className="nav-item mb-2">
              <Link className="nav-link py-2 px-3 rounded" to="/users">
                <i className="bi bi-people me-2"></i> Users
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link py-2 px-3 rounded" to="/locations">
                <i className="bi bi-geo-alt me-2"></i> Locations
              </Link>
            </li>
          </>
        )}

        <hr className="my-3" />
        <li className="nav-item">
          <Link className="nav-link py-2 px-3 rounded text-danger" to="/logout">
            <i className="bi bi-box-arrow-right me-2"></i> Logout
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;