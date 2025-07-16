// src/pages/UsersPage.jsx
import React, { useEffect, useState } from "react";
import { Button, Table, Modal } from "react-bootstrap";
import { PlusLg, PencilSquare, Trash, EyeFill } from "react-bootstrap-icons";
import {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
} from "../services/userService";
import UserForm from "../components/UserForm";         // ← generic form
import Sidebar from "../components/Sidebar";

const UsersPage = () => {
  /* ─────────── state ─────────── */
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showAdd,      setShowAdd]      = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // object or null
  const [mode,         setMode]         = useState("view"); // "view" | "edit"

  /* ─────────── fetch all users ─────────── */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  /* ─────────── CRUD handlers ─────────── */
  const handleCreate = async (payload) => {
    try {
      await addUser(payload);
      setShowAdd(false);
      fetchUsers();
    } catch (err) {
      console.error("Error creating user:", err);
    }
  };

  const handleUpdate = async (payload) => {
    try {
      await updateUser(selectedUser.id, payload);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  /* ─────────── render ─────────── */
  return (
    <div className="d-flex">
      <Sidebar />

      <div className="p-4 flex-grow-1 w-100">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 fw-semibold">All Users</h5>
          <Button onClick={() => setShowAdd(true)}>
            <PlusLg className="me-1" /> Add User
          </Button>
        </div>

        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : (
          <Table hover responsive className="align-middle">
            <thead className="table-light">
              <tr>
                <th>Full&nbsp;Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Location</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.role}</td>
                  <td>{u.email}</td>
                  <td>{u.location}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="light"
                      onClick={() => {
                        setSelectedUser(u);
                        setMode("view");
                      }}
                    >
                      <EyeFill />
                    </Button>{" "}
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => {
                        setSelectedUser(u);
                        setMode("edit");
                      }}
                    >
                      <PencilSquare />
                    </Button>{" "}
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(u.id)}
                    >
                      <Trash />
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}

        {/* ─────────── Create modal ─────────── */}
        <Modal
          show={showAdd}
          onHide={() => setShowAdd(false)}
          centered
          size="md"
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <UserForm
              key="new"                 /* keeps form empty each time */
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
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {mode === "view" ? "User Details" : "Edit User"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {/* View mode */}
            {selectedUser && mode === "view" && (
              <div className="vstack gap-2">
                <div><strong>Full Name:</strong> {selectedUser.full_name}</div>
                <div><strong>Role:</strong> {selectedUser.role}</div>
                <div><strong>Email:</strong> {selectedUser.email}</div>
                <div><strong>Phone:</strong> {selectedUser.phone_number || "-"}</div>
                <div><strong>Location:</strong> {selectedUser.location || "-"}</div>
                <div><strong>Username:</strong> {selectedUser.username}</div>
              </div>
            )}

            {/* Edit mode */}
            {selectedUser && mode === "edit" && (
              <UserForm
                key={selectedUser.id}   /* forces fresh mount per user */
                initialValues={selectedUser}
                submitLabel="Update User"
                onSubmit={handleUpdate}
              />
            )}
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default UsersPage;
