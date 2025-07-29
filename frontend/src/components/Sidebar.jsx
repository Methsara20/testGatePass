import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import companyLogo from "../assets/LOGO.png";

const Sidebar = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // ✅ Role check for Admin or HOD
  const isAdminOrHOD = user?.role === "Admin" || user?.role === "HOD";

  return (
    <div
      className="bg-light border-end vh-100 p-3 transition-all"
      style={{
        width: isCollapsed ? "80px" : "220px",
        minWidth: isCollapsed ? "80px" : "220px",
        transition: "width 0.3s ease",
      }}
    >
      {/* Company Logo */}
      <div
        className={`d-flex flex-column align-items-center mb-4 ${
          isCollapsed ? "justify-content-center" : ""
        }`}
      >
        <img
          src={companyLogo}
          alt="Company Logo"
          className="img-fluid mb-2"
          style={{
            height: isCollapsed ? "60px" : "100px",
            width: "auto",
            maxWidth: isCollapsed ? "60px" : "160px",
            objectFit: "contain",
            filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.1))",
            transition: "all 0.3s ease",
            cursor: isCollapsed ? "pointer" : "default",
          }}
          onClick={isCollapsed ? toggleSidebar : undefined}
          title={isCollapsed ? "Expand sidebar" : ""}
        />

        {/* Toggle Button */}
        <button
          className="btn p-0"
          onClick={toggleSidebar}
          style={{
            border: "none",
            background: "none",
            fontSize: "1.5rem",
            color: "#6c757d",
            marginTop: isCollapsed ? "0" : "10px",
          }}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <i className="bi bi-list"></i>
        </button>
      </div>

      <ul className="nav flex-column">
        {/* ✅ Dashboard (Admin & HOD only) */}
        {isAdminOrHOD && (
          <li className="nav-item mb-1">
            <Link
              className="nav-link py-2 px-3 rounded d-flex align-items-center"
              to="/dashboard"
              title="Dashboard"
            >
              <i className="bi bi-speedometer2"></i>
              {!isCollapsed && <span className="ms-2">Dashboard</span>}
            </Link>
          </li>
        )}

        <li className="nav-item mb-1">
          <Link
            className="nav-link py-2 px-3 rounded d-flex align-items-center"
            to="/gatepass/new"
            title="New Gate-Pass"
          >
            <i className="bi bi-pencil-square"></i>
            {!isCollapsed && <span className="ms-2">New Gate-Pass</span>}
          </Link>
        </li>

        <li className="nav-item mb-2">
          <Link
            className="nav-link py-2 px-3 rounded d-flex align-items-center"
            to="/my-requests"
            title="My Requests"
          >
            <i className="bi bi-list-check"></i>
            {!isCollapsed && <span className="ms-2">My Requests</span>}
          </Link>
        </li>

        {/* ✅ Approvals (Admin & HOD only) */}
        {isAdminOrHOD && (
          <li className="nav-item mb-2">
            <Link
              className="nav-link py-2 px-3 rounded d-flex align-items-center"
              to="/approvals"
              title="Approvals"
            >
              <i className="bi bi-check2-square"></i>
              {!isCollapsed && <span className="ms-2">Approvals</span>}
            </Link>
          </li>
        )}

        <li className="nav-item mb-2">
          <Link
            className="nav-link py-2 px-3 rounded d-flex align-items-center"
            to="/deliveries"
            title="Gatepasses"
          >
            <i className="bi bi-truck"></i>
            {!isCollapsed && <span className="ms-2">Gatepasses</span>}
          </Link>
        </li>

        {/* Admin Section (only Admin users) */}
        {user?.role === "Admin" && (
          <>
            {!isCollapsed && <hr className="my-3" />}
            {isCollapsed && <div className="border-top my-3"></div>}
            {!isCollapsed && <h6 className="text-muted px-3 mb-2">Admin</h6>}

            <li className="nav-item mb-2">
              <Link
                className="nav-link py-2 px-3 rounded d-flex align-items-center"
                to="/users"
                title="Users"
              >
                <i className="bi bi-people"></i>
                {!isCollapsed && <span className="ms-2">Users</span>}
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link
                className="nav-link py-2 px-3 rounded d-flex align-items-center"
                to="/locations"
                title="Locations"
              >
                <i className="bi bi-geo-alt"></i>
                {!isCollapsed && <span className="ms-2">Locations</span>}
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link
                className="nav-link py-2 px-3 rounded d-flex align-items-center"
                to="/departments"
                title="Departments"
              >
                <i className="bi bi-building"></i>
                {!isCollapsed && <span className="ms-2">Departments</span>}
              </Link>
            </li>
          </>
        )}

        {!isCollapsed && <hr className="my-3" />}
        {isCollapsed && <div className="border-top my-3"></div>}

        <li className="nav-item">
          <Link
            className="nav-link py-2 px-3 rounded text-danger d-flex align-items-center"
            to="/logout"
            title="Logout"
          >
            <i className="bi bi-box-arrow-right"></i>
            {!isCollapsed && <span className="ms-2">Logout</span>}
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
