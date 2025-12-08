import React, { useEffect, useState, useRef } from 'react';
import { Button, Table, Modal, Form, Container, Row, Col, Spinner, Alert, Pagination } from 'react-bootstrap';
import { PlusLg, PencilSquare, ExclamationTriangle, CheckCircle } from 'react-bootstrap-icons';
import {
  getDepartments,
  addDepartment,
  updateDepartment
} from '../services/departmentService';

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [departmentStatuses, setDepartmentStatuses] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState({});
  
  // New state for search, filter, sort, and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // New state for confirmation modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingDepartmentName, setPendingDepartmentName] = useState('');
  
  // New state for success notification
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const successTimeoutRef = useRef(null);
  const highlightTimeoutRef = useRef(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    // Clean up timeouts on component unmount
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDepartments();
      
      // Process departments data to include status from backend
      const processedDepartments = res.data.map(dept => ({
        id: dept.department_id,
        name: dept.department_name,
        status: dept.status || 'active', // Get status from backend
        createdBy: dept.created_by || 'System',
        createdDate: dept.created_date || new Date().toISOString(),
        modifiedBy: dept.modified_by || 'System',
        modifiedDate: dept.modified_date || new Date().toISOString()
      }));
      
      setDepartments(processedDepartments);
      
      // Initialize department statuses from backend data
      const statuses = {};
      processedDepartments.forEach(dept => {
        statuses[dept.id] = dept.status === 'active'; // Convert to boolean
      });
      setDepartmentStatuses(statuses);
    } catch (err) {
      console.error(err);
      setError('Failed to load departments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateDepartmentStatusInBackend = async (id, status) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [id]: true }));
      
      // Find the department to get its name
      const department = departments.find(dept => dept.id === id);
      if (!department) throw new Error('Department not found');
      
      // Call the backend to update status using updateDepartment function
      await updateDepartment(id, department.name, status ? 'active' : 'inactive');
      
      // Update local state
      setDepartmentStatuses(prev => ({
        ...prev,
        [id]: status
      }));
      
      // Show success message
      setSuccessMessage(`Department "${department.name}" has been ${status ? 'activated' : 'deactivated'} successfully.`);
      setShowSuccess(true);
      
      // Auto-hide success message after 3 seconds
      successTimeoutRef.current = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
      // Refresh departments list
      fetchDepartments();
    } catch (err) {
      console.error(err);
      setError(`Failed to update department status. Please try again.`);
      // Revert the toggle in UI if update failed
      setDepartmentStatuses(prev => ({
        ...prev,
        [id]: !status
      }));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [id]: false }));
    }
  };

  const toggleDepartmentStatus = (departmentId) => {
    const newStatus = !departmentStatuses[departmentId];
    updateDepartmentStatusInBackend(departmentId, newStatus);
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    
    if (editingDepartment) {
      // For editing, proceed directly
      try {
        await updateDepartment(
          editingDepartment.id, 
          departmentName,
          departmentStatuses[editingDepartment.id] ? 'active' : 'inactive'
        );
        setSuccessMessage(`Department "${departmentName}" has been updated successfully.`);
        setShowSuccess(true);
        fetchDepartments();
        handleCloseModal();
        // Auto-hide success message after 3 seconds
        successTimeoutRef.current = setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
      } catch (err) {
        console.error(err);
        setError(`Failed to update department. Please try again.`);
      }
    } else {
      // For adding, show confirmation modal
      setPendingDepartmentName(departmentName);
      setShowConfirmationModal(true);
    }
  };

  const handleConfirmAdd = async () => {
    try {
      await addDepartment(pendingDepartmentName.toUpperCase());
      
      setSuccessMessage(`Department "${pendingDepartmentName}" has been created successfully.`);
      setShowSuccess(true);
      setNewDepartmentName(pendingDepartmentName);
      
      // Reset filters and pagination to show the new department
      setSearchTerm('');
      setStatusFilter('all');
      setCurrentPage(1);
      
      fetchDepartments();
      handleCloseModal();
      setShowConfirmationModal(false);
      setPendingDepartmentName('');
      
      // Auto-hide success message after 3 seconds
      successTimeoutRef.current = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
      // Clear the highlight after 3 seconds
      highlightTimeoutRef.current = setTimeout(() => {
        setNewDepartmentName('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to add department. Please try again.');
      setShowConfirmationModal(false);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setDepartmentName(department.name.toUpperCase());
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setDepartmentName('');
    setEditingDepartment(null);
  };

  // New functions for sorting
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // New functions for pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Process data: filter, sort, and paginate
  const getProcessedData = () => {
    // Filter data based on search term and status filter
    let filtered = departments.filter(dept => {
      const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase());
      const status = departmentStatuses[dept.id] ? 'active' : 'inactive';
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort data
    const sorted = [...filtered].sort((a, b) => {
      if (sortConfig.key === 'name') {
        if (a.name < b.name) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a.name > b.name) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      } else if (sortConfig.key === 'status') {
        const statusA = departmentStatuses[a.id] ? 'active' : 'inactive';
        const statusB = departmentStatuses[b.id] ? 'active' : 'inactive';
        if (statusA < statusB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (statusA > statusB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      } else if (sortConfig.key === 'createdDate') {
        const dateA = new Date(a.createdDate);
        const dateB = new Date(b.createdDate);
        if (dateA < dateB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (dateA > dateB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      } else if (sortConfig.key === 'modifiedDate') {
        const dateA = new Date(a.modifiedDate);
        const dateB = new Date(b.modifiedDate);
        if (dateA < dateB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (dateA > dateB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      }
      return 0;
    });

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sorted.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sorted.length / itemsPerPage);
    
    return {
      currentItems,
      totalPages,
      totalItems: sorted.length
    };
  };

  const { currentItems, totalPages, totalItems } = getProcessedData();

  return (
    <div className="d-flex">
      {/* Main Content Area */}
      <div className="flex-grow-1">
        <div className="p-1 flex-grow-0 w-100">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="mb-1 fw-bold">Department Management</h3>
              <p className="text-muted mb-1">
                Manage and view all departments in the system
              </p>
            </div>
            <div className="d-flex">
              <Button 
                onClick={() => setShowModal(true)}
                className="d-flex align-items-center shadow-sm"
              >
                <PlusLg className="me-1" /> Add Department
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-4">
              <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
            </Alert>
          )}
          
          {/* Success Notification */}
          {showSuccess && (
            <Alert variant="success" className="mb-4 d-flex align-items-center">
              <CheckCircle className="me-2" size={20} />
              <div className="flex-grow-1">{successMessage}</div>
              <Button 
                size="sm" 
                onClick={() => {
                  setShowSuccess(false);
                  if (successTimeoutRef.current) {
                    clearTimeout(successTimeoutRef.current);
                  }
                }}
              >
                Dismiss
              </Button>
            </Alert>
          )}
          
          {/* Search and Filter Controls */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Control
                type="text"
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
            </Col>
            <Col md={3}>
              <Form.Select 
                value={statusFilter} 
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1); // Reset to first page on filter change
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Col>
          </Row>
          
          <div className="bg-white rounded-3 shadow-sm p-1">
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
              <h5 className="mb-0 fw-semibold">
                All Departments <span className="badge bg-secondary rounded-pill ms-2">{totalItems}</span>
              </h5>
            </div>
            
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading departments...</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover responsive className="align-middle mb-0 table-nowrap">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3" style={{ width: '40px' }}>#</th>
                        <th 
                          onClick={() => requestSort('name')}
                          style={{ cursor: 'pointer', minWidth: '150px' }}
                        >
                          Department Name 
                          {sortConfig.key === 'name' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        <th 
                          onClick={() => requestSort('createdDate')}
                          style={{ cursor: 'pointer', minWidth: '100px' }}
                        >
                          Created Date
                          {sortConfig.key === 'createdDate' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        <th style={{ minWidth: '100px' }}>Created By</th>
                        <th 
                          onClick={() => requestSort('modifiedDate')}
                          style={{ cursor: 'pointer', minWidth: '100px' }}
                        >
                          Modified Date
                          {sortConfig.key === 'modifiedDate' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                        <th style={{ minWidth: '100px' }}>Modified By</th>
                        <th style={{ width: '80px' }} className="text-center">Actions</th>
                        <th 
                          style={{ width: '80px', cursor: 'pointer' }} 
                          className="text-center"
                          onClick={() => requestSort('status')}
                        >
                          Status
                          {sortConfig.key === 'status' && (
                            sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                          )}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((dept, index) => (
                          <tr 
                            key={dept.id} 
                            className={`transition-hover ${dept.name === newDepartmentName ? 'highlight-row' : ''}`}
                          >
                            <td className="ps-3">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className={`rounded-circle p-2 me-2 ${departmentStatuses[dept.id] ? 'bg-primary bg-opacity-10' : 'bg-secondary bg-opacity-10'}`}>
                                  <span className={`fw-bold ${departmentStatuses[dept.id] ? 'text-primary' : 'text-secondary'}`}>
                                    {dept.name.charAt(0)}
                                  </span>
                                </div>
                                <span className={!departmentStatuses[dept.id] ? 'text-secondary' : ''}>{dept.name}</span>
                              </div>
                            </td>
                            <td className="text-muted small">{formatDate(dept.createdDate)}</td>
                            <td className="text-muted small">{dept.createdBy}</td>
                            <td className="text-muted small">{formatDate(dept.modifiedDate)}</td>
                            <td className="text-muted small">{dept.modifiedBy}</td>
                            <td className="text-center">
                              <div className="d-flex justify-content-center">
                                <Button
                                  variant="light"
                                  className="rounded-circle p-2 action-btn"
                                  onClick={() => handleEdit(dept)}
                                  title="Edit department"
                                >
                                  <PencilSquare className="text-warning" />
                                </Button>
                              </div>
                            </td>
                            <td className="text-center">
                              <div className="d-flex align-items-center justify-content-center">
                                <Form.Check
                                  type="switch"
                                  checked={departmentStatuses[dept.id]}
                                  onChange={() => toggleDepartmentStatus(dept.id)}
                                  label={departmentStatuses[dept.id] ? "Active" : "Inactive"}
                                  disabled={updatingStatus[dept.id]}
                                />
                                {updatingStatus[dept.id] && (
                                  <Spinner as="span" animation="border" size="sm" className="ms-2" role="status" aria-hidden="true" />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center py-5">
                            <div className="py-3">
                              <div className="mb-3 text-muted">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-building" viewBox="0 0 16 16">
                                  <path d="M4 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1ZM4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM7.5 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM4.5 8a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Z"/>
                                  <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1Zm11 0H3v14h10V1Z"/>
                                </svg>
                              </div>
                              <h5 className="text-muted">No departments found</h5>
                              <p className="text-muted">Try adjusting your search or filter criteria</p>
                              <Button 
                                variant="primary" 
                                onClick={() => {
                                  setSearchTerm('');
                                  setStatusFilter('all');
                                  setCurrentPage(1);
                                }}
                                className="mt-2"
                              >
                                Clear Filters
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-3 px-3">
                    <div className="text-muted pagination-info">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} departments
                    </div>
                    <Pagination>
                      <Pagination.Prev 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      />
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Pagination.Item 
                          key={page}
                          active={currentPage === page}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Add/Edit Modal */}
          <Modal
            show={showModal}
            onHide={handleCloseModal}
            centered
            size="md"
            className="fade"
          >
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold">
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              <Form onSubmit={handleAddOrUpdate}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Department Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value.toUpperCase())}
                    placeholder="Enter department name"
                    required
                    autoFocus
                    className="py-2"
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Group>
                <div className="d-flex justify-content-end gap-2 pt-2">
                  <Button variant="secondary" onClick={handleCloseModal} className="px-4">
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" className="px-4">
                    {editingDepartment ? 'Update' : 'Add'}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
          
          {/* Confirmation Modal for Adding Department */}
          <Modal
            show={showConfirmationModal}
            onHide={() => setShowConfirmationModal(false)}
            centered
            size="md"
            className="fade"
          >
            <Modal.Header closeButton className="border-bottom-0 pb-0">
              <Modal.Title className="fw-bold d-flex align-items-center">
                <ExclamationTriangle className="text-warning me-2" />
                Confirm Addition
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              <p>Are you sure you want to add the department "<strong>{pendingDepartmentName}</strong>"?</p>
              <Alert variant="warning">
                <ExclamationTriangle className="me-2" />
                <strong>Warning:</strong> Once created, a department cannot be deleted.
              </Alert>
              <div className="d-flex justify-content-end gap-2 pt-3">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowConfirmationModal(false)} 
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleConfirmAdd} 
                  className="px-4"
                >
                  Confirm Add
                </Button>
              </div>
            </Modal.Body>
          </Modal>
        </div>
      </div>
      
      {/* Custom styles for action buttons and highlight animation */}
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
        .highlight-row {
          background-color: #d1e7dd !important;
          animation: highlightFade 3s forwards;
        }
        @keyframes highlightFade {
          0% { 
            background-color: #d1e7dd !important;
            box-shadow: 0 0 10px rgba(0, 128, 0, 0.3);
          }
          100% { 
            background-color: transparent !important;
            box-shadow: none;
          }
        }
        .table-nowrap th,
        .table-nowrap td {
          white-space: nowrap;
        }
        .pagination-info {
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
};

export default DepartmentsPage;