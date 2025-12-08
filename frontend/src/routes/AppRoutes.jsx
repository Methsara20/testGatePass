import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Requests from '../pages/Requests';
import GatePassForm from '../pages/GatePassForm';
import UsersPage from '../pages/usersPage';
import LocationsPage from '../pages/LocationsPage';
import DepartmentsPage from '../pages/DepartmentsPage'; 
import { useAuth } from '../context/AuthContext';
import Approvals from '../pages/Approvals';
import MyRequests from '../pages/MyRequests';
import GatepassDelivery from '../pages/GatepassDelivery';
import ReturnGatePass from '../pages/ReturnProcess';
import CancelApproval from '../pages/CancelApproval';
import GatePassSummaryReport from '../reports/GatePassSummaryReport';
import OverdueMaterialsReport from '../reports/OverdueMaterialsReport';
import ApprovedVsRejectedReport from '../reports/ApprovedVsRejectedReport';
import MaterialMovementReport from '../reports/MaterialMovementReport';
import AcceptanceReport from '../reports/AcceptanceReport';
import Layout from '../components/Layout'; // Import the Layout component
import Profile from "../pages/Profile";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) return <Navigate to="/login" />;
  
  // Check role permissions
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

// Wrapper component for routes that need Layout
const LayoutWrapper = ({ children, allowedRoles }) => {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  );
};

// Helper function to get default route based on user role
const getDefaultRoute = (userRole) => {
  switch (userRole) {
    case 'Admin':
      return '/dashboard'
    case 'HOD':
      return '/gatepass/new';
    case 'User':
      return '/gatepass/new';
    default:
      return '/dashboard';
  }
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  
  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <Router>
      <Routes>
        {/* Login route - no layout needed */}
        <Route path="/login" element={user ? <Navigate to={getDefaultRoute(user.role)} /> : <Login />} />
        
        {/* Protected routes with Layout */}
        <Route
          path="/dashboard"
          element={<LayoutWrapper allowedRoles={['Admin', 'HOD', 'Audit']}><Dashboard /></LayoutWrapper>}
        />
        <Route 
          path="/requests" 
          element={<LayoutWrapper allowedRoles={['Admin', 'HOD', 'User']}><Requests /></LayoutWrapper>} 
        />
        <Route 
          path="/my-requests" 
          element={<LayoutWrapper allowedRoles={['Admin', 'HOD', 'User']}><MyRequests /></LayoutWrapper>} 
        />
        <Route 
          path="/approvals" 
          element={<LayoutWrapper allowedRoles={['Admin', 'HOD']}><Approvals /></LayoutWrapper>} 
        />
        <Route 
          path="/deliveries" 
          element={<LayoutWrapper allowedRoles={['Admin', 'HOD', 'User']}><GatepassDelivery /></LayoutWrapper>} 
        />
        <Route 
          path="/return-gatepass" 
          element={<LayoutWrapper allowedRoles={['Admin', 'HOD', 'User']}><ReturnGatePass /></LayoutWrapper>} 
        />
        <Route 
          path="/users" 
          element={<LayoutWrapper allowedRoles={['Admin']}><UsersPage /></LayoutWrapper>} 
        />
        <Route 
          path="/locations" 
          element={<LayoutWrapper allowedRoles={['Admin']}><LocationsPage /></LayoutWrapper>} 
        />
        <Route 
          path="/departments" 
          element={<LayoutWrapper allowedRoles={['Admin']}><DepartmentsPage /></LayoutWrapper>} 
        />
        
        {/* Reports with Layout */}
        <Route 
          path="/reports/gatepass-summary" 
          element={<LayoutWrapper allowedRoles={['Admin', 'HOD', 'Audit']}><GatePassSummaryReport /></LayoutWrapper>} 
        />
        <Route 
          path="/reports/overdue-materials" 
          element={<LayoutWrapper allowedRoles={['Admin', 'HOD', 'Audit']}><OverdueMaterialsReport /></LayoutWrapper>} 
        />
        <Route 
          path="/reports/approved-vs-rejected" 
          element={<LayoutWrapper allowedRoles={['Admin', 'HOD', 'Audit']}><ApprovedVsRejectedReport /></LayoutWrapper>} 
        />
        <Route 
          path="/reports/material-movement" 
          element={<LayoutWrapper allowedRoles={['Admin', 'HOD', 'Audit']}><MaterialMovementReport /></LayoutWrapper>} 
        />
        <Route 
          path="/reports/acceptance-report" 
          element={<LayoutWrapper allowedRoles={['Admin', 'HOD', 'Audit']}><AcceptanceReport /></LayoutWrapper>} 
        />
        
        {/* Other routes with Layout */}
        <Route 
          path="/cancel-approval" 
          element={<LayoutWrapper allowedRoles={['Admin', 'HOD', 'Audit']}><CancelApproval /></LayoutWrapper>} 
        />
        <Route 
          path="/gatepass/new" 
          element={<LayoutWrapper allowedRoles={['Admin', 'HOD', 'User']}><GatePassForm /></LayoutWrapper>} 
        />

        <Route 
          path="/profile" 
          element={<LayoutWrapper allowedRoles={['Admin', 'HOD', 'User', 'Audit']}><Profile /></LayoutWrapper>} 
        />
        
        {/* Unauthorized page - no layout needed */}
        <Route 
          path="/unauthorized" 
          element={
            <div className="container mt-5">
              <div className="row justify-content-center">
                <div className="col-md-6 text-center">
                  <h3 className="text-danger">Unauthorized Access</h3>
                  <p>You don't have permission to access this page.</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => window.location.href = user ? getDefaultRoute(user.role) : '/login'}
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          } 
        />
        
        {/* Redirect based on user role */}
        <Route path="*" element={<Navigate to={user ? getDefaultRoute(user.role) : "/login"} />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;