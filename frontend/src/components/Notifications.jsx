import React, { useState } from "react";
import { Bell } from "react-bootstrap-icons"; 
import { getNotifications } from "../services/notificationService";

const Notifications = ({ location, department }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications(location, department);
      setNotifications(data);
    } catch (err) {
      // Already logged in service
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    // If we're opening the dropdown, fetch fresh notifications
    if (!open) {
      fetchNotifications();
    }
    setOpen(!open);
  };

  return (
    <div className="relative">
      {/* Bell Icon with count */}
      <button onClick={handleBellClick} className="relative">
        <Bell size={24} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
            {notifications.length}
          </span>
        )}
      </button>
      
      {/* Dropdown list */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg border">
          {loading ? (
            <p className="p-3 text-sm text-gray-500">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="p-3 text-sm text-gray-500">No new notifications</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-3 border-b text-sm">
                {n.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;