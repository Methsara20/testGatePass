import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Row, Col } from "react-bootstrap";
import {
  getLocations,
  addLocation,
  updateLocation,
  deleteLocation
} from "../services/locationService";
import Sidebar from "../components/Sidebar";

const LocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [editingLocation, setEditingLocation] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);
  
  const fetchLocations = async () => {
    try {
      const res = await getLocations();
      setLocations(Array.isArray(res.data) ? res.data.reverse() : []);
    } catch (err) {
      console.error("Error fetching locations:", err);
      setLocations([]);
    }
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.location_id, {
          location_name: locationName,
        });
      } else {
        await addLocation({ location_name: locationName });
      }
      fetchLocations();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving location:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        await deleteLocation(id);
        fetchLocations();
      } catch (err) {
        console.error("Error deleting location:", err);
      }
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setLocationName(location.location_name);
    setShowModal(true);
  };

  const handleCopy = (locationName) => {
    navigator.clipboard.writeText(locationName);
    alert('Location name copied to clipboard!');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setLocationName("");
    setEditingLocation(null);
  };

  return (
    <div className="d-flex">
      <Sidebar />
      
      <div className="p-4 flex-grow-1">
        <Row className="mb-3">
          <Col>
            <h3>Location Management</h3>
          </Col>
          <Col className="text-end">
            <Button onClick={() => setShowModal(true)}>+ Add Location</Button>
          </Col>
        </Row>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Location Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(locations) && locations.length > 0 ? (
              locations.map((loc, index) => (
                <tr key={loc.location_id}>
                  <td>{index + 1}</td>
                  <td>{loc.location_name}</td>
                  <td>
                    <Button variant="warning" size="sm" onClick={() => handleEdit(loc)} className="me-2">
                      Edit
                    </Button>
                    <Button variant="info" size="sm" onClick={() => handleCopy(loc.location_name)} className="me-2">
                      Copy
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(loc.location_id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center">
                  No locations found
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>{editingLocation ? "Edit" : "Add"} Location</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleAddOrUpdate}>
              <Form.Group>
                <Form.Label>Location Name</Form.Label>
                <Form.Control
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  required
                />
              </Form.Group>
              <div className="mt-3 text-end">
                <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>{" "}
                <Button variant="primary" type="submit">
                  {editingLocation ? "Update" : "Add"}
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