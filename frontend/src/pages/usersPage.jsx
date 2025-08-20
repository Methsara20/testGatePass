import React, { useEffect, useState } from "react";
import { Button, Table, Modal, InputGroup, Form } from "react-bootstrap";
import { PlusLg, PencilSquare, Trash, EyeFill } from "react-bootstrap-icons";
import { BiSearch } from "react-icons/bi";
import {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
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

  /* ─────────── search functionality ─────────── */
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.location &&
            user.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

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
      
            <div className="flex-grow-1">
        
      <div className="p-4 flex-grow-1 w-100">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 fw-semibold">
            All Users <small className="text-muted">({filteredUsers.length} users)</small>
          </h5>
          <div className="d-flex">
            <InputGroup style={{ width: "300px" }} className="me-3">
              <InputGroup.Text>
                <BiSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="outline-secondary"
                  onClick={() => setSearchTerm("")}
                >
                  Clear
                </Button>
              )}
            </InputGroup>
            <Button onClick={() => setShowAdd(true)}>
              <PlusLg className="me-1" /> Add User
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : (
          <Table hover responsive className="align-middle">
            <thead className="table-light">
              <tr>
                <th>No</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Location</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>{user.full_name}</td>
                  <td>{user.role}</td>
                  <td>{user.email}</td>
                  <td>{user.location}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="light"
                      onClick={() => {
                        setSelectedUser(user);
                        setMode("view");
                      }}
                    >
                      <EyeFill />
                    </Button>{" "}
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => {
                        setSelectedUser(user);
                        setMode("edit");
                      }}
                    >
                      <PencilSquare />
                    </Button>{" "}
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    {searchTerm ? "No matching users found" : "No users found"}
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
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {mode === "view" ? "User Details" : "Edit User"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {selectedUser && mode === "view" && (
              <div className="vstack gap-2">
                <div>
                  <strong>Full Name:</strong> {selectedUser.full_name}
                </div>
                <div>
                  <strong>Role:</strong> {selectedUser.role}
                </div>
                <div>
                  <strong>Email:</strong> {selectedUser.email}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedUser.phone_number || "-"}
                </div>
                <div>
                  <strong>Location:</strong> {selectedUser.location || "-"}
                </div>
                <div>
                  <strong>Username:</strong> {selectedUser.username}
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
    </div>
  );
};

export default UsersPage;