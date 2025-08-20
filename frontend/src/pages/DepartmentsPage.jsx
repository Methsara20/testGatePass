import React, { useEffect, useState } from 'react';
import { Button, Table, Modal, Form, Container, Row, Col } from 'react-bootstrap';
import { PlusLg, Trash, PencilSquare } from 'react-bootstrap-icons';
import {
  getDepartments,
  addDepartment,
  deleteDepartment,
  updateDepartment
} from '../services/departmentService';


const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await getDepartments();
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDepartment = async () => {
    try {
      if (!newDepartment.trim()) return;
      await addDepartment(newDepartment);
      setNewDepartment('');
      fetchDepartments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDepartment(id);
      fetchDepartments();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (id, name) => {
    setEditMode(true);
    setEditId(id);
    setEditName(name);
    setShowModal(true);
  };

  const handleUpdate = async () => {
    try {
      await updateDepartment(editId, editName);
      setShowModal(false);
      setEditMode(false);
      fetchDepartments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="d-flex flex-column flex-lg-row min-vh-100">
      
      <div className="col-lg-2 p-0">
        
      </div>
            {/* Main Content Area */}
            <div className="flex-grow-1">
        
      {/* Main content area */}
      <main className="col-lg-10 p-4">
        <h3 className="mb-4">Departments</h3>
        
        {/* Add Department Form */}
        <div className="d-flex mb-4">
          <Form.Control
            type="text"
            placeholder="Add new department"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
            className="me-2"
          />
          <Button variant="success" onClick={handleAddDepartment}>
            <PlusLg /> Add
          </Button>
        </div>

        {/* Departments Table */}
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th style={{width: '60px'}}>#</th>
                <th>Department Name</th>
                <th style={{width: '120px'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, index) => (
                <tr key={dept.department_id}>
                  <td>{index + 1}</td>
                  <td>{dept.department_name}</td>
                  <td className="d-flex justify-content-around">
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => openEditModal(dept.department_id, dept.department_name)}
                      className="me-1"
                    >
                      <PencilSquare />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(dept.department_id)}
                    >
                      <Trash />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Edit Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Department</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Control
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdate}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </main>
    </div>
    </div>
  );
};

export default DepartmentsPage;