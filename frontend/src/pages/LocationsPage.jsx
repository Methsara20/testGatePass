import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { 
  getLocations, 
  addLocation, 
  updateLocation, 
  deleteLocation 
} from '../services/locationService';
import Sidebar from '../components/Sidebar';

const LocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [editingLocation, setEditingLocation] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLocations();
      
      // Debug the raw API response
      console.log('API Response:', response);

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
      console.log('Processed Locations:', locationsData);

      if (locationsData.length > 0) {
        // Ensure each item has the expected structure
        const validatedLocations = locationsData.map(loc => ({
          id: loc.id || loc.location_id || Math.random().toString(36).substr(2, 9),
          name: loc.location_name || loc.name || loc.title || 'Unnamed Location'
        }));

        setLocations(validatedLocations.reverse());
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
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, {
          location_name: locationName,
        });
      } else {
        await addLocation({ location_name: locationName });
      }
      fetchLocations();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving location:', err);
      setError(`Failed to ${editingLocation ? 'update' : 'add'} location. Please try again.`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await deleteLocation(id);
        fetchLocations();
      } catch (err) {
        console.error('Error deleting location:', err);
        setError('Failed to delete location. Please try again.');
      }
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setLocationName(location.name);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setLocationName('');
    setEditingLocation(null);
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      
      <div className="p-4 flex-grow-1" style={{ overflowX: 'auto' }}>
        <Row className="mb-3 align-items-center">
          <Col md={6}>
            <h2>Location Management</h2>
          </Col>
          <Col md={6} className="text-end">
            <Button 
              variant="primary" 
              onClick={() => setShowModal(true)}
              disabled={loading}
            >
              + Add Location
            </Button>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center mt-4">
            <Spinner animation="border" />
            <p className="mt-2">Loading locations...</p>
          </div>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Location Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.length > 0 ? (
                locations.map((location, index) => (
                  <tr key={location.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: '500' }}>{location.name}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleEdit(location)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(location.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-4">
                    No locations found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}

        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleAddOrUpdate}>
              <Form.Group className="mb-3">
                <Form.Label>Location Name</Form.Label>
                <Form.Control
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Enter location name"
                  required
                  autoFocus
                />
              </Form.Group>
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingLocation ? 'Update' : 'Add'}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default LocationsPage;