import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <div className="bg-light border-end vh-100 p-3" style={{ width: "220px" }}>
      <h5 className="mb-4">Gatepass</h5>
      <ul className="nav flex-column">
        <li className="nav-item">
          <Link className="nav-link" to="/dashboard">
            <i className="bi bi-speedometer2 me-2"></i> Dashboard
          </Link>
        </li>
        
        {/* <li className="nav-item">
          <Link className="nav-link" to="/requests">
            <i className="bi bi-journal-text me-2"></i> Requests
          </Link>
        </li> */}

        {/* New Gate Pass request form*/}
        <li className="nav-item">
          <Link className="nav-link" to="/gatepass/new">
            <i className="bi bi-pencil-square me-2" /> New Gate-Pass
          </Link>
        </li>

        <li className="nav-item">
          <Link className="nav-link" to="/my-requests">
            <i className="bi bi-list-check me-2"></i> My Requests
          </Link>
        </li>

        <li className="nav-item">
          <Link className="nav-link" to="/approvals">
            <i className="bi bi-check2-square me-2"></i> Approvals
          </Link>
        </li>

        <li className="nav-item">
          <Link className="nav-link" to="/deliveries">
            <i className="bi bi-truck me-2"></i> Gatepasses
          </Link>
        </li>

        

        {/* Admin-only section */}
        {user?.role === "Admin" && (
          <>
            <hr />
            <h6 className="text-muted px-3">Admin</h6>
            <li className="nav-item">
              <Link className="nav-link" to="/users">
                <i className="bi bi-people me-2"></i> Users
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/settings">
                <i className="bi bi-gear me-2"></i> Settings
              </Link>
            </li>
          </>
        )}

        <li className="nav-item">
          <Link className="nav-link" to="/">
            <i className="bi bi-box-arrow-right"></i> Logout
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
