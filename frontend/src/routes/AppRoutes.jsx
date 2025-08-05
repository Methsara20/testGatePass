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
//Cancel Approval
import CancelApproval from '../pages/CancelApproval';
//reports
import GatePassSummaryReport from '../reports/GatePassSummaryReport';
import OverdueMaterialsReport from '../reports/OverdueMaterialsReport';
import ApprovedVsRejectedReport from '../reports/ApprovedVsRejectedReport';
//import AuditLogReport from '../reports/AuditLogReport';
import MaterialMovementReport from '../reports/MaterialMovementReport';
import AcceptanceReport from '../reports/AcceptanceReport';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={<ProtectedRoute allowedRoles={['Admin', 'HOD']}><Dashboard /></ProtectedRoute>}
        />

        <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/my-requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute allowedRoles={['Admin', 'HOD']}><Approvals /></ProtectedRoute>} />
        <Route path="/deliveries" element={<ProtectedRoute><GatepassDelivery /></ProtectedRoute>} />

        {/* ✅ Updated Users routes */}
        <Route path="/users" element={<ProtectedRoute allowedRoles={['Admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="/locations" element={<ProtectedRoute allowedRoles={['Admin']}><LocationsPage /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute allowedRoles={['Admin']}><DepartmentsPage /></ProtectedRoute>} />


        {/* Reports (Admin & HOD only) */}
        <Route path="/reports/gatepass-summary" element={<ProtectedRoute allowedRoles={['Admin', 'HOD']}><GatePassSummaryReport /></ProtectedRoute>}/>
        <Route path="/reports/overdue-materials" element={<ProtectedRoute allowedRoles={['Admin', 'HOD']}><OverdueMaterialsReport /></ProtectedRoute>}/>
        <Route path="/reports/approved-vs-rejected" element={<ProtectedRoute allowedRoles={['Admin', 'HOD']}><ApprovedVsRejectedReport /></ProtectedRoute>}/>
        {/* <Route path="/reports/audit-log" element={<ProtectedRoute allowedRoles={['Admin', 'HOD']}><AuditLogReport /></ProtectedRoute>}/> */}
        <Route path="/reports/material-movement" element={<ProtectedRoute allowedRoles={['Admin', 'HOD']}><MaterialMovementReport /></ProtectedRoute>}/>
        <Route path="/reports/acceptance-report" element={<ProtectedRoute allowedRoles={['Admin', 'HOD']}><AcceptanceReport /></ProtectedRoute> }/>

        {/* Approval canceled  */}
        <Route path="/cancel-approval" element={<ProtectedRoute><CancelApproval /></ProtectedRoute>} />

        

        <Route path="/unauthorized" element={<h3 className="text-center mt-5">Unauthorized Access</h3>} />
        <Route path="*" element={<Navigate to="/login" />} />


        <Route path="/gatepass/new" element={<ProtectedRoute><GatePassForm/></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
