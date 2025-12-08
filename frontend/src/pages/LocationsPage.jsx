import React, { useEffect, useState, useRef } from 'react';
import { Table, Button, Modal, Form, Row, Col, Spinner, Alert, Pagination } from 'react-bootstrap';
import { 
  getLocations, 
  addLocation, 
  updateLocation 
} from '../services/locationService';
import { PlusLg, PencilSquare, ExclamationTriangle, CheckCircle } from 'react-bootstrap-icons';

const LocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationStatuses, setLocationStatuses] = useState({});
  
  // New state for search, filter, sort, and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Fixed items per page
  
  // New state for confirmation modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingLocationName, setPendingLocationName] = useState('');
  
  // New state for success notification
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newLocationName, setNewLocationName] = useState(''); // Track by name instead of ID
  const successTimeoutRef = useRef(null);
  const highlightTimeoutRef = useRef(null);

  useEffect(() => {
    fetchLocations();
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

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLocations();
      
      // Debug the raw API response
      // console.log('API Response:', response);
      // Handle various API response structures
      let locationsData = [];
      if (Array.isArray(response)) {
        locationsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        locationsData = response.data;
      } else if (response?.locations && Array.isArray(response.locations)) {
        locationsData = response.locations;
      }
      // Debug the processed data
      // console.log('Processed Locations:', locationsData);
      if (locationsData.length > 0) {
        // Ensure each item has the expected structure including new fields
        const validatedLocations = locationsData.map(loc => ({
          id: loc.id || loc.location_id || Math.random().toString(36).substr(2, 9),
          name: loc.location_name || loc.name || loc.title || 'Unnamed Location',
          createdBy: loc.created_by || 'System',
          createdDate: loc.created_date || new Date().toISOString(),
          modifiedBy: loc.modified_by || 'System',
          modifiedDate: loc.modified_date || new Date().toISOString(),
          status: loc.status || "active"   // 👈 keep backend status
        }));
        
        setLocations(validatedLocations.reverse());
        
        // Initialize location statuses (default to active)
        const statuses = {};
        validatedLocations.forEach((loc) => {
          statuses[loc.id] = loc.status === "active"; // 👈 keep actual value
        });
        setLocationStatuses(statuses);

      } else {
        setLocations([]);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations. Please try again.');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    
    if (editingLocation) {
      // For editing, proceed directly
      try {
        await updateLocation(editingLocation.id, {
          location_name: locationName,
        });
        setSuccessMessage(`Location "${locationName}" has been updated successfully.`);
        setShowSuccess(true);
        fetchLocations();
        handleCloseModal();
        // Auto-hide success message after 3 seconds
        successTimeoutRef.current = setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
      } catch (err) {
        console.error('Error saving location:', err);
        setError(`Failed to update location. Please try again.`);
      }
    } else {
      // For adding, show confirmation modal
      setPendingLocationName(locationName);
      setShowConfirmationModal(true);
    }
  };

  // const handleConfirmAdd = async () => {
  //   try {
  //     await addLocation({ location_name: pendingLocationName.toUpperCase() });
      
  //     setSuccessMessage(`Location "${pendingLocationName}" has been created successfully.`);
  //     setShowSuccess(true);
  //     setNewLocationName(pendingLocationName); // Set the name of the new location
      
  //     // Reset filters and pagination to show the new location
  //     setSearchTerm('');
  //     setStatusFilter('all');
  //     setCurrentPage(1);
      
  //     fetchLocations();
  //     handleCloseModal();
  //     setShowConfirmationModal(false);
  //     setPendingLocationName('');
      
  //     // Auto-hide success message after 3 seconds
  //     successTimeoutRef.current = setTimeout(() => {
  //       setShowSuccess(false);
  //     }, 3000);
      
  //     // Clear the highlight after 3 seconds
  //     highlightTimeoutRef.current = setTimeout(() => {
  //       setNewLocationName('');
  //     }, 3000);
  //   } catch (err) {
  //     console.error('Error saving location:', err);
  //     setError('Failed to add location. Please try again.');
  //     setShowConfirmationModal(false);
  //   }
  // };

  const handleConfirmAdd = async () => {
    try {
      await addLocation({
        name: pendingLocationName.toUpperCase(),  // ✅ use "name" if backend expects it
        status: "active"                          // ✅ optional default field
      });
      
      setSuccessMessage(`Location "${pendingLocationName}" has been created successfully.`);
      setShowSuccess(true);
      setNewLocationName(pendingLocationName);
      setSearchTerm('');
      setStatusFilter('all');
      setCurrentPage(1);
  
      fetchLocations();
      handleCloseModal();
      setShowConfirmationModal(false);
      setPendingLocationName('');
  
      successTimeoutRef.current = setTimeout(() => setShowSuccess(false), 3000);
      highlightTimeoutRef.current = setTimeout(() => setNewLocationName(''), 3000);
  
    } catch (err) {
      console.error('Error saving location:', err.response?.data || err);
      setError('Failed to add location. Please try again.');
      setShowConfirmationModal(false);
    }
  };
  

  const toggleLocationStatus = async (location) => {
    const newStatus = !locationStatuses[location.id];
  
    setLocationStatuses(prev => ({
      ...prev,
      [location.id]: newStatus
    }));
  
    try {
      await updateLocation(location.id, {
        location_name: location.name,
        status: newStatus ? "active" : "inactive"
      });
  
      setSuccessMessage(
        `Location "${location.name}" has been ${newStatus ? "activated" : "deactivated"}.`
      );
      setShowSuccess(true);
      successTimeoutRef.current = setTimeout(() => setShowSuccess(false), 3000);
  
    } catch (err) {
      console.error("Error updating status:", err.response?.data || err);
      setLocationStatuses(prev => ({
        ...prev,
        [location.id]: !newStatus
      }));
      setError("Failed to update location status. Please try again.");
    }
  };
  
  

  const handleEdit = (location) => {
    setEditingLocation(location);
    setLocationName(location.name.toUpperCase());
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setLocationName('');
    setEditingLocation(null);
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
    let filtered = locations.filter(location => {
      const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase());
      const status = locationStatuses[location.id] ? 'active' : 'inactive';
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
        const statusA = locationStatuses[a.id] ? 'active' : 'inactive';
        const statusB = locationStatuses[b.id] ? 'active' : 'inactive';
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
              <h3 className="mb-1 fw-bold">Location Management</h3>
              <p className="text-muted mb-1">
                Manage and view all locations in the system
              </p>
            </div>
            <div className="d-flex">
              <Button
                onClick={() => setShowModal(true)}
                className="d-flex align-items-center shadow-sm"
              >
                <PlusLg className="me-1" /> Add Location
              </Button>
            </div>
          </div>

          {error && (
            <Alert
              variant="danger"
              onClose={() => setError(null)}
              dismissible
              className="mb-4"
            >
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
                placeholder="Search locations..."
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
                All Locations{" "}
                <span className="badge bg-secondary rounded-pill ms-2">
                  {totalItems}
                </span>
              </h5>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading locations...</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table
                    hover
                    responsive
                    className="align-middle mb-0 table-nowrap"
                  >
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3" style={{ width: "40px" }}>
                          #
                        </th>
                        <th
                          onClick={() => requestSort("name")}
                          style={{ cursor: "pointer", minWidth: "150px" }}
                        >
                          Location Name
                          {sortConfig.key === "name" &&
                            (sortConfig.direction === "ascending"
                              ? " ↑"
                              : " ↓")}
                        </th>
                        <th
                          onClick={() => requestSort("createdDate")}
                          style={{ cursor: "pointer", minWidth: "100px" }}
                        >
                          Created Date
                          {sortConfig.key === "createdDate" &&
                            (sortConfig.direction === "ascending"
                              ? " ↑"
                              : " ↓")}
                        </th>
                        <th style={{ minWidth: "100px" }}>Created By</th>
                        <th
                          onClick={() => requestSort("modifiedDate")}
                          style={{ cursor: "pointer", minWidth: "100px" }}
                        >
                          Modified Date
                          {sortConfig.key === "modifiedDate" &&
                            (sortConfig.direction === "ascending"
                              ? " ↑"
                              : " ↓")}
                        </th>
                        <th style={{ minWidth: "100px" }}>Modified By</th>
                        <th style={{ width: "80px" }} className="text-center">
                          Actions
                        </th>
                        <th
                          style={{ width: "80px", cursor: "pointer" }}
                          className="text-center"
                          onClick={() => requestSort("status")}
                        >
                          Status
                          {sortConfig.key === "status" &&
                            (sortConfig.direction === "ascending"
                              ? " ↑"
                              : " ↓")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((location, index) => (
                          <tr
                            key={location.id}
                            className={`transition-hover ${
                              !locationStatuses[location.id] ? "text-muted" : ""
                            } ${
                              location.name === newLocationName
                                ? "highlight-row"
                                : ""
                            }`}
                          >
                            <td className="ps-3">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  className={`rounded-circle p-2 me-2 ${
                                    locationStatuses[location.id]
                                      ? "bg-primary bg-opacity-10"
                                      : "bg-secondary bg-opacity-10"
                                  }`}
                                >
                                  <span
                                    className={`fw-bold ${
                                      locationStatuses[location.id]
                                        ? "text-primary"
                                        : "text-secondary"
                                    }`}
                                  >
                                    {location.name.charAt(0)}
                                  </span>
                                </div>
                                <span>{location.name}</span>
                              </div>
                            </td>
                            <td className="text-muted small">
                              {formatDate(location.createdDate)}
                            </td>
                            <td className="text-muted small">
                              {location.createdBy}
                            </td>
                            <td className="text-muted small">
                              {formatDate(location.modifiedDate)}
                            </td>
                            <td className="text-muted small">
                              {location.modifiedBy}
                            </td>
                            <td className="text-center">
                              <div className="d-flex justify-content-center">
                                <Button
                                  variant="light"
                                  className="rounded-circle p-2 action-btn"
                                  onClick={() => handleEdit(location)}
                                  title="Edit location"
                                >
                                  <PencilSquare className="text-warning" />
                                </Button>
                              </div>
                            </td>
                            <td className="text-center">
                              <Form.Check
                                type="switch"
                                checked={locationStatuses[location.id]}
                                onChange={() => toggleLocationStatus(location)}
                                label={
                                  locationStatuses[location.id]
                                    ? "Active"
                                    : "Inactive"
                                }
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center py-5">
                            <div className="py-3">
                              <div className="mb-3 text-muted">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="48"
                                  height="48"
                                  fill="currentColor"
                                  className="bi bi-geo-alt"
                                  viewBox="0 0 16 16"
                                >
                                  <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z" />
                                  <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                                </svg>
                              </div>
                              <h5 className="text-muted">No locations found</h5>
                              <p className="text-muted">
                                Try adjusting your search or filter criteria
                              </p>
                              <Button
                                variant="primary"
                                onClick={() => {
                                  setSearchTerm("");
                                  setStatusFilter("all");
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
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                      {totalItems} locations
                    </div>
                    <Pagination>
                      <Pagination.Prev
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      />
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Pagination.Item
                            key={page}
                            active={currentPage === page}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Pagination.Item>
                        )
                      )}
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
                {editingLocation ? "Edit Location" : "Add New Location"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              <Form onSubmit={handleAddOrUpdate}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Location Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={locationName}
                    onChange={(e) =>
                      setLocationName(e.target.value.toUpperCase())
                    }
                    placeholder="Enter location name"
                    required
                    autoFocus
                    className="py-2"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Group>
                <div className="d-flex justify-content-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    onClick={handleCloseModal}
                    className="px-4"
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" className="px-4">
                    {editingLocation ? "Update" : "Add"}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
          {/* Confirmation Modal for Adding Location */}
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
              <p>
                Are you sure you want to add the location "
                <strong>{pendingLocationName}</strong>"?
              </p>
              <Alert variant="warning">
                <ExclamationTriangle className="me-2" />
                <strong>Warning:</strong> Once created, a location cannot be
                deleted.
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

export default LocationsPage;