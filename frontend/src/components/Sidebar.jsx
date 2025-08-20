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
        className={`d-flex flex-column align-items-center mb-3 ${
          isCollapsed ? "justify-content-center" : ""
        }`}
      >
        <img
          src={companyLogo}
          alt="Company Logo"
          className="img-fluid mb-2"
          style={{
            height: isCollapsed ? "50px" : "80px",
            width: "auto",
            maxWidth: isCollapsed ? "50px" : "140px",
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
            marginTop: isCollapsed ? "0" : "0px",
          }}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <i className="bi bi-list"></i>
        </button>
      </div>

      <ul className="nav flex-column">
        {/* ✅ Dashboard (Admin & HOD only) */}
        {isAdminOrHOD && (
          <li className="nav-item">
            <Link
              className="nav-link py-1 px-2 rounded d-flex align-items-center"
              to="/dashboard"
              title="Dashboard"
              style={{ fontSize: "0.9rem", minHeight: "32px" }}
            >
              <i className="bi bi-speedometer2" style={{ fontSize: "1rem" }}></i>
              {!isCollapsed && <span className="ms-2">Dashboard</span>}
            </Link>
          </li>
        )}

        <li className="nav-item">
          <Link
            className="nav-link py-1 px-2 rounded d-flex align-items-center"
            to="/gatepass/new"
            title="New Gate-Pass"
            style={{ fontSize: "0.9rem", minHeight: "32px" }}
          >
            <i className="bi bi-pencil-square" style={{ fontSize: "1rem" }}></i>
            {!isCollapsed && <span className="ms-2">New Gate Pass</span>}
          </Link>
        </li>

        <li className="nav-item">
          <Link
            className="nav-link py-1 px-2 rounded d-flex align-items-center"
            to="/my-requests"
            title="My Requests"
            style={{ fontSize: "0.9rem", minHeight: "32px" }}
          >
            <i className="bi bi-list-check" style={{ fontSize: "1rem" }}></i>
            {!isCollapsed && <span className="ms-2">My Requests</span>}
          </Link>
        </li>

        {/* ✅ Approvals (Admin & HOD only) */}
        {isAdminOrHOD && (
          <li className="nav-item">
            <Link
              className="nav-link py-1 px-2 rounded d-flex align-items-center"
              to="/approvals"
              title="Approvals"
              style={{ fontSize: "0.9rem", minHeight: "32px" }}
            >
              <i className="bi bi-check2-square" style={{ fontSize: "1rem" }}></i>
              {!isCollapsed && <span className="ms-2">Approvals</span>}
            </Link>
          </li>
        )}

        {isAdminOrHOD && (
          <li className="nav-item">
            <Link
              className="nav-link py-1 px-2 rounded d-flex align-items-center"
              to="/cancel-approval"
              title="cancel approval"
              style={{ fontSize: "0.9rem", minHeight: "32px" }}
            >
              <i className="bi bi-x-square" style={{ fontSize: "1rem" }}></i>
              {!isCollapsed && <span className="ms-2">Cancel Approval</span>}
            </Link>
          </li>
        )}

        <li className="nav-item">
          <Link
            className="nav-link py-1 px-2 rounded d-flex align-items-center"
            to="/deliveries"
            title="Gatepasses"
            style={{ fontSize: "0.9rem", minHeight: "32px" }}
          >
            <i className="bi bi-truck" style={{ fontSize: "1rem" }}></i>
            {!isCollapsed && (
              <span className="ms-2">Gatepasses Acceptance</span>
            )}
          </Link>
        </li>

        {/* Admin Section (only Admin users) */}
        {user?.role === "Admin" && (
          <>
            {!isCollapsed && <hr className="my-2" />}
            {isCollapsed && <div className="border-top my-2"></div>}
            {!isCollapsed && <h6 className="text-muted px-2 mb-1" style={{ fontSize: "0.8rem" }}>Admin</h6>}

            <li className="nav-item">
              <Link
                className="nav-link py-1 px-2 rounded d-flex align-items-center"
                to="/users"
                title="Users"
                style={{ fontSize: "0.9rem", minHeight: "32px" }}
              >
                <i className="bi bi-people" style={{ fontSize: "1rem" }}></i>
                {!isCollapsed && <span className="ms-2">Users</span>}
              </Link>
            </li>

            {/* <li className="nav-item">
              <Link
                className="nav-link py-1 px-2 rounded d-flex align-items-center"
                to="/reports/audit-log"
                title="Audit Log Report"
                style={{ fontSize: "0.9rem", minHeight: "32px" }}
              >
                <i className="bi bi-journal-text" style={{ fontSize: "1rem" }}></i>
                {!isCollapsed && <span className="ms-2">User Group</span>}
              </Link>
            </li> */}

            <li className="nav-item">
              <Link
                className="nav-link py-1 px-2 rounded d-flex align-items-center"
                to="/locations"
                title="Locations"
                style={{ fontSize: "0.9rem", minHeight: "32px" }}
              >
                <i className="bi bi-geo-alt" style={{ fontSize: "1rem" }}></i>
                {!isCollapsed && <span className="ms-2">Locations</span>}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link py-1 px-2 rounded d-flex align-items-center"
                to="/departments"
                title="Departments"
                style={{ fontSize: "0.9rem", minHeight: "32px" }}
              >
                <i className="bi bi-building" style={{ fontSize: "1rem" }}></i>
                {!isCollapsed && <span className="ms-2">Departments</span>}
              </Link>
            </li>
          </>
        )}

        {/* Reports Section (Admin & HOD only) */}
        {isAdminOrHOD && (
          <>
            {!isCollapsed && <hr className="my-2" />}
            {isCollapsed && <div className="border-top my-2"></div>}
            {!isCollapsed && <h6 className="text-muted px-2 mb-1" style={{ fontSize: "0.8rem" }}>Reports</h6>}

            <li className="nav-item">
              <Link
                className="nav-link py-1 px-2 rounded d-flex align-items-center"
                to="/reports/gatepass-summary"
                title="Gate Pass Summary Report"
                style={{ fontSize: "0.9rem", minHeight: "32px" }}
              >
                <i className="bi bi-file-earmark-spreadsheet" style={{ fontSize: "1rem" }}></i>
                {!isCollapsed && (
                  <span className="ms-2">Gate Pass Summary</span>
                )}
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link py-1 px-2 rounded d-flex align-items-center"
                to="/reports/overdue-materials"
                title="Overdue Materials Report"
                style={{ fontSize: "0.9rem", minHeight: "32px" }}
              >
                <i className="bi bi-clock-history" style={{ fontSize: "1rem" }}></i>
                {!isCollapsed && (
                  <span className="ms-2">Overdue Materials</span>
                )}
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link py-1 px-2 rounded d-flex align-items-center"
                to="/reports/approved-vs-rejected"
                title="Approved vs Rejected Report"
                style={{ fontSize: "0.9rem", minHeight: "32px" }}
              >
                <i className="bi bi-check2-circle" style={{ fontSize: "1rem" }}></i>
                {!isCollapsed && (
                  <span className="ms-2">Approved vs Rejected</span>
                )}
              </Link>
            </li>

            

            <li className="nav-item">
              <Link
                className="nav-link py-1 px-2 rounded d-flex align-items-center"
                to="/reports/material-movement"
                title="Material Movement Report"
                style={{ fontSize: "0.9rem", minHeight: "32px" }}
              >
                <i className="bi bi-arrow-left-right" style={{ fontSize: "1rem" }}></i>
                {!isCollapsed && (
                  <span className="ms-2">Material Movement</span>
                )}
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link py-1 px-2 rounded d-flex align-items-center"
                to="/reports/acceptance-report"
                title="Acceptance Report"
                style={{ fontSize: "0.9rem", minHeight: "32px" }}
              >
                <i className="bi bi-hand-thumbs-up" style={{ fontSize: "1rem" }}></i>
                {!isCollapsed && (
                  <span className="ms-2">Acceptance Report</span>
                )}
              </Link>
            </li>
          </>
        )}

        {!isCollapsed && <hr className="my-2" />}
        {isCollapsed && <div className="border-top my-2"></div>}

        <li className="nav-item">
          <Link
            className="nav-link py-1 px-2 rounded text-danger d-flex align-items-center"
            to="/logout"
            title="Logout"
            style={{ fontSize: "0.9rem", minHeight: "32px" }}
          >
            <i className="bi bi-box-arrow-right" style={{ fontSize: "1rem" }}></i>
            {!isCollapsed && <span className="ms-2">Logout</span>}
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;