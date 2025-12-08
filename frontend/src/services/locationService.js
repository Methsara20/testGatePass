import axios from "axios";

const API = "http://192.168.10.144:5000/api/locations";

// Fetch all locations
export const getLocations = async () => {
  try {
    const response = await axios.get(API);

    if (Array.isArray(response.data)) {
      return response.data.map(loc => ({
        id: loc.location_id || loc.id,
        name: loc.location_name || loc.name,
        status: loc.status || "active" // 👈 include status too
      }));
    }

    if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data.map(loc => ({
        id: loc.location_id || loc.id,
        name: loc.location_name || loc.name,
        status: loc.status || "active"
      }));
    }

    throw new Error("Invalid locations data format");
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
};

// Add location → send location_name, not just name
export const addLocation = (locationData) =>
  axios.post(API, {
    location_name: locationData.name, // ✅ backend expects location_name
    status: locationData.status
  });

// Update location → keep real field names
export const updateLocation = (id, locationData) =>
  axios.put(`${API}/${id}`, {
    location_name: locationData.location_name, // <-- FIX here
    status: locationData.status
  });


export const deleteLocation = (id) => axios.delete(`${API}/${id}`);


// Get only active locations (login, gatepass)
export const getActiveLocations = async () => {
  const response = await axios.get(`${API}/active`);
  return response.data; // ✅ return only the array
};