import React, { useEffect, useState } from "react";
import { Button, Table, Modal, InputGroup, Form, Spinner, Dropdown, Badge, Pagination, Alert } from "react-bootstrap";
import { PlusLg, PencilSquare, EyeFill, XCircle, ThreeDotsVertical, CheckCircleFill, XCircleFill } from "react-bootstrap-icons";
import { BiSearch } from "react-icons/bi";
import {
  getUsers,
  addUser,
  updateUser,
} from "../services/userService";
import UserForm from "../components/UserForm";

const UsersPage = () => {
  /* ─────────── state ─────────── */
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mode, setMode] = useState("view");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter states
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'ascending' });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Banner notification state
  const [banner, setBanner] = useState({ show: false, message: '', type: 'success' });
  
  /* ─────────── fetch all users ─────────── */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await getUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Auto-close banner after 5 seconds
  useEffect(() => {
    let timer;
    if (banner.show) {
      timer = setTimeout(() => {
        setBanner({ ...banner, show: false });
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [banner.show]);
  
  /* ─────────── search and filter functionality ─────────── */
  useEffect(() => {
    let result = users;
    
    // Apply search term
    if (searchTerm !== "") {
      result = result.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.location &&
            user.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply role filter
    if (roleFilter !== "all") {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(user => 
        (statusFilter === "active" && user.status === 'active') ||
        (statusFilter === "inactive" && user.status === 'inactive')
      );
    }
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      if (sortConfig.key === 'full_name') {
        const nameA = a.full_name.toLowerCase();
        const nameB = b.full_name.toLowerCase();
        if (nameA < nameB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (nameA > nameB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      } else if (sortConfig.key === 'role') {
        const roleA = a.role.toLowerCase();
        const roleB = b.role.toLowerCase();
        if (roleA < roleB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (roleA > roleB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      } else if (sortConfig.key === 'email') {
        const emailA = a.email.toLowerCase();
        const emailB = b.email.toLowerCase();
        if (emailA < emailB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (emailA > emailB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      } else if (sortConfig.key === 'status') {
        const statusA = a.status === 'active' ? 'active' : 'inactive';
        const statusB = b.status === 'active' ? 'active' : 'inactive';
        if (statusA < statusB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (statusA > statusB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      } else if (sortConfig.key === 'location') {
        const locA = (a.location || '').toLowerCase();
        const locB = (b.location || '').toLowerCase();
        if (locA < locB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (locA > locB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      }
      return 0;
    });
    
    setFilteredUsers(result);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, users, roleFilter, statusFilter, sortConfig]);
  
  /* ─────────── CRUD handlers ─────────── */
  const handleCreate = async (payload) => {
    try {
      await addUser(payload);
      setShowAdd(false);
      fetchUsers();
      setBanner({ show: true, message: 'User created successfully!', type: 'success' });
    } catch (err) {
      console.error("Error creating user:", err);
      setBanner({ show: true, message: 'Failed to create user. Please try again.', type: 'danger' });
    }
  };
  
  const handleUpdate = async (payload) => {
    try {
      await updateUser(selectedUser.id, payload);
      setSelectedUser(null);
      fetchUsers();
      setBanner({ show: true, message: 'User updated successfully!', type: 'success' });
    } catch (err) {
      console.error("Error updating user:", err);
      setBanner({ show: true, message: 'Failed to update user. Please try again.', type: 'danger' });
    }
  };
  
  /* ─────────── status toggle function ─────────── */
  const handleStatusChange = async (userId, newStatus) => {
    try {
      // Find the user in the current state
      const currentUser = users.find(user => user.id === userId);
      if (!currentUser) return;

      // Create a copy of the user with the updated status
      const updatedUser = { 
        ...currentUser, 
        status: newStatus 
      };

      // Optimistically update the UI
      const updatedUsers = users.map(user => 
        user.id === userId ? updatedUser : user
      );
      setUsers(updatedUsers);

      // Update user in the database with all fields
      await updateUser(userId, updatedUser);

      // Show success notification
      setBanner({ 
        show: true, 
        message: `User status updated to ${newStatus}`, 
        type: 'success' 
      });

      // If status filter is set to the opposite of the new status, change it to "all"
      if ((statusFilter === 'active' && newStatus === 'inactive') || 
          (statusFilter === 'inactive' && newStatus === 'active')) {
        setStatusFilter("all");
      }

    } catch (err) {
      console.error("Error updating user status:", err);
      setBanner({ 
        show: true, 
        message: 'Failed to update user status', 
        type: 'danger' 
      });

      // Revert the change on error
      fetchUsers();
    }
  };

  const toggleUserStatus = (userId) => {
    // Get current status from the user object
    const currentUser = users.find(user => user.id === userId);
    if (!currentUser) return;
    
    // Determine new status (opposite of current status)
    const newStatus = currentUser.status === 'active' ? 'inactive' : 'active';
    handleStatusChange(userId, newStatus);
  };
  
  const exportToCSV = () => {
    const headers = ["ID", "Name", "Email", "Role", "Status", "Location"];
    const csvContent = [
      headers.join(","),
      ...filteredUsers.map(user => 
        [
          user.id, 
          user.full_name, 
          user.email, 
          user.role, 
          user.status || "Active",
          user.location || ""
        ].join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "users.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  /* ─────────── sorting functions ─────────── */
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  /* ─────────── pagination logic ─────────── */
  // Get current users
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  
  /* ─────────── render ─────────── */
  return (
    <div className="d-flex">
      {/* Main Content Area */}
      <div className="flex-grow-1">
        <div className="p-1 flex-grow-0 w-100">
          {/* Banner Notification */}
          {banner.show && (
            <Alert 
              variant={banner.type} 
              className="mb-3 d-flex align-items-center justify-content-between"
            >
              <div className="d-flex align-items-center">
                {banner.type === 'success' ? (
                  <CheckCircleFill className="me-2" />
                ) : (
                  <XCircleFill className="me-2" />
                )}
                {banner.message}
              </div>
              <Button 
                variant={banner.type}
                size="sm" 
                onClick={() => setBanner({ ...banner, show: false })}
                className="text-white border-white"
              >
                Dismiss
              </Button>
            </Alert>
          )}
          
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h3 className="mb-2 fw-bold">Users Management</h3>
              <p className="text-muted mb-1">
                Manage and view all users in the system
              </p>
            </div>
            <div className="d-flex">
              <InputGroup style={{ width: "320px" }} className="me-3 shadow-sm">
                <InputGroup.Text className="bg-white border-end-0">
                  <BiSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, email, role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0 border-end-0"
                />
                {searchTerm && (
                  <Button
                    variant="light"
                    onClick={() => setSearchTerm("")}
                    className="border-start-0"
                  >
                    <XCircle />
                  </Button>
                )}
              </InputGroup>
              <Button 
                variant="outline-secondary" 
                className="me-2"
                onClick={exportToCSV}
              >
                Export CSV
              </Button>
              <Button 
                onClick={() => setShowAdd(true)}
                className="d-flex align-items-center shadow-sm"
              >
                <PlusLg className="me-1" /> Add User
              </Button>
            </div>
          </div>
          
          {/* Advanced Filters */}
          <div className="d-flex mb-3">
            <Form.Select 
              className="me-2" 
              style={{ width: "150px" }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="HOD">HOD</option>
              <option value="User">User</option>
            </Form.Select>
            
            <Form.Select 
              style={{ width: "150px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Form.Select>
          </div>
          
          <div className="bg-white rounded-3 shadow-sm p-1">
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
              <h5 className="mb-0 fw-semibold">
                All Users <span className="badge bg-secondary rounded-pill ms-2">{filteredUsers.length}</span>
              </h5>
            </div>
            
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading users data...</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover responsive className="align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">#</th>
                        <th 
                          onClick={() => requestSort('full_name')}
                          style={{ cursor: 'pointer' }}
                        >
                          Full Name 
                          {sortConfig.key === 'full_name' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        <th 
                          onClick={() => requestSort('role')}
                          style={{ cursor: 'pointer' }}
                        >
                          Role
                          {sortConfig.key === 'role' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        <th 
                          onClick={() => requestSort('email')}
                          style={{ cursor: 'pointer' }}
                        >
                          Email
                          {sortConfig.key === 'email' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        <th 
                          onClick={() => requestSort('status')}
                          style={{ cursor: 'pointer' }}
                        >
                          Status
                          {sortConfig.key === 'status' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        <th 
                          onClick={() => requestSort('location')}
                          style={{ cursor: 'pointer' }}
                        >
                          Location
                          {sortConfig.key === 'location' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        <th style={{ width: 140 }} className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.map((user, index) => (
                        <tr key={user.id} className="transition-hover">
                          <td className="ps-3">{indexOfFirstItem + index + 1}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                                <span className="fw-bold text-primary">
                                  {user.full_name.charAt(0)}
                                </span>
                              </div>
                              <span>{user.full_name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-info bg-opacity-10" style={{ color: '#28a745' }}>
                              {user.role}
                            </span>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <Form.Check
                              type="switch"
                              checked={user.status === 'active'}
                              onChange={() => toggleUserStatus(user.id)}
                              label={
                                <Badge bg={user.status === 'active' ? "success" : "danger"}>
                                  {user.status === 'active' ? "Active" : "Inactive"}
                                </Badge>
                              }
                            />
                          </td>
                          <td>{user.location || <span className="text-muted">Not specified</span>}</td>
                          <td className="text-center">
                            {/* Desktop Actions */}
                            <div className="d-none d-md-flex justify-content-center">
                              <Button
                                variant="light"
                                className="rounded-circle me-1 p-2 action-btn"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setMode("view");
                                }}
                                title="View details"
                              >
                                <EyeFill className="text-primary" />
                              </Button>
                              <Button
                                variant="light"
                                className="rounded-circle p-2 action-btn"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setMode("edit");
                                }}
                                title="Edit user"
                              >
                                <PencilSquare className="text-warning" />
                              </Button>
                            </div>
                            
                            {/* Mobile Actions */}
                            <div className="d-md-none d-flex justify-content-center">
                              <Dropdown>
                                <Dropdown.Toggle variant="light" size="sm" className="action-btn">
                                  <ThreeDotsVertical />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item onClick={() => { setSelectedUser(user); setMode("view"); }}>
                                    <EyeFill className="me-2" /> View Details
                                  </Dropdown.Item>
                                  <Dropdown.Item onClick={() => { setSelectedUser(user); setMode("edit"); }}>
                                    <PencilSquare className="me-2" /> Edit
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {currentUsers.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center py-5">
                            <div className="py-3">
                              <div className="mb-3 text-muted">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-people" viewBox="0 0 16 16">
                                  <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                                </svg>
                              </div>
                              <h5 className="text-muted">
                                {searchTerm || roleFilter !== "all" || statusFilter !== "all" 
                                  ? "No matching users found" 
                                  : "No users found"}
                              </h5>
                              <p className="text-muted">
                                {searchTerm || roleFilter !== "all" || statusFilter !== "all" 
                                  ? "Try adjusting your search criteria" 
                                  : "Add a new user to get started"}
                              </p>
                              {!searchTerm && roleFilter === "all" && statusFilter === "all" && (
                                <Button 
                                  variant="primary" 
                                  onClick={() => setShowAdd(true)}
                                  className="mt-2"
                                >
                                  <PlusLg className="me-1" /> Add Your First User
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {filteredUsers.length > itemsPerPage && (
                  <div className="d-flex justify-content-between align-items-center px-3 py-3 border-top">
                    <div className="text-muted small">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users
                    </div>
                    <Pagination className="mb-0">
                      <Pagination.Prev 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      />
                      
                      {pageNumbers.map(number => (
                        <Pagination.Item 
                          key={number} 
                          active={number === currentPage}
                          onClick={() => paginate(number)}
                        >
                          {number}
                        </Pagination.Item>
                      ))}
                      
                      <Pagination.Next 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* ─────────── Create modal ─────────── */}
          <Modal
            show={showAdd}
            onHide={() => setShowAdd(false)}
            centered
            size="md"
            className="fade"
          >
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold">Create New User</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              <UserForm
                key="new"
                submitLabel="Create User"
                onSubmit={handleCreate}
              />
            </Modal.Body>
          </Modal>
          
          {/* ─────────── View / Edit modal ─────────── */}
          <Modal
            show={!!selectedUser}
            onHide={() => setSelectedUser(null)}
            centered
            size="md"
            className="fade"
          >
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold">
                {mode === "view" ? "User Details" : "Edit User"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              {selectedUser && mode === "view" && (
                <div className="vstack gap-3">
                  <div className="text-center mb-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block">
                      <span className="fw-bold h3 text-primary">
                        {selectedUser.full_name.charAt(0)}
                      </span>
                    </div>
                    <h4 className="mt-2 mb-0">{selectedUser.full_name}</h4>
                    <p className="text-muted">{selectedUser.role}</p>
                    
                    {/* Status Badge */}
                    <Badge bg={selectedUser.status === 'active' ? "success" : "danger"} className="mb-3">
                      {selectedUser.status === 'active' ? "Active" : "Inactive"}
                    </Badge>
                    
                    {/* Gate Pass Statistics */}
                    <div className="bg-light rounded-3 p-3 mb-3">
                      <div className="row text-center">
                        <div className="col">
                          <div className="h5 mb-0">24</div>
                          <div className="small text-muted">Total Passes</div>
                        </div>
                        <div className="col">
                          <div className="h5 mb-0">3</div>
                          <div className="small text-muted">Active</div>
                        </div>
                        <div className="col">
                          <div className="h5 mb-0">2</div>
                          <div className="small text-muted">This Month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-top pt-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Email:</span>
                      <span className="fw-medium">{selectedUser.email}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Phone:</span>
                      <span className="fw-medium">{selectedUser.phone_number || "-"}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Location:</span>
                      <span className="fw-medium">{selectedUser.location || "-"}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Username:</span>
                      <span className="fw-medium">{selectedUser.username}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Status:</span>
                      <Badge bg={selectedUser.status === 'active' ? "success" : "danger"}>
                        {selectedUser.status === 'active' ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    {/* Security Features */}
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Security Level:</span>
                      <span className={`badge ${selectedUser.security_level === 'high' ? 'bg-danger' : selectedUser.security_level === 'medium' ? 'bg-warning' : 'bg-success'}`}>
                        {selectedUser.security_level || 'Standard'}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">2FA Enabled:</span>
                      <span className={`badge ${selectedUser.two_factor_enabled ? 'bg-success' : 'bg-danger'}`}>
                        {selectedUser.two_factor_enabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Activity Log */}
                  <div className="border-top pt-3">
                    <h6 className="text-muted mb-3">Recent Activity</h6>
                    <div className="small">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Gate Pass Created:</span>
                        <span>Today, 09:30 AM</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Last Login:</span>
                        <span>Yesterday, 04:15 PM</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Profile Updated:</span>
                        <span>Oct 12, 2023</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Audit Trail */}
                  <div className="border-top pt-3">
                    <h6 className="text-muted mb-3">Audit Trail</h6>
                    <div className="small">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Created By:</span>
                        <span>Admin (Oct 5, 2023)</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Last Modified:</span>
                        <span>John Doe (Oct 12, 2023)</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Access Count:</span>
                        <span>142 times</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="d-flex gap-2 mt-2">
                    <Button 
                      variant="outline-primary" 
                      className="w-50"
                      onClick={() => setMode("edit")}
                    >
                      <PencilSquare className="me-1" /> Edit
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      className="w-50"
                      onClick={() => setSelectedUser(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedUser && mode === "edit" && (
                <UserForm
                  key={selectedUser.id}
                  initialValues={selectedUser}
                  submitLabel="Update User"
                  onSubmit={handleUpdate}
                />
              )}
            </Modal.Body>
          </Modal>
        </div>
      </div>
      
      {/* Custom styles for larger action icons */}
      <style jsx>{`
        .action-btn {
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .action-btn svg {
          width: 20px;
          height: 20px;
        }
      `}</style>
    </div>
  );
};

export default UsersPage;