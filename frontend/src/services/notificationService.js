import axios from "axios";

const API_URL = "http://192.168.10.144:5000/api/notifications";

// Fetch notifications (only Pending ones)
export const getNotifications = async (location, department) => {
  try {
    const res = await axios.get(API_URL, {
      params: { location, department },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching notifications:", err);
    throw err;
  }
};