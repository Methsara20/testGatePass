// import axios from "axios";

// const API = "http://192.168.10.144:5000/api/locations";

// export const getLocations = () => axios.get(API);

// export const addLocation = (locationData) =>
//   axios.post(API, locationData);

// export const updateLocation = (id, locationData) =>
//   axios.put(`${API}/${id}`, locationData);

// export const deleteLocation = (id) =>
//   axios.delete(`${API}/${id}`);


import axios from "axios";

const API = "http://192.168.10.144:5000/api/locations";

export const getLocations = async () => {
  try {
    const response = await axios.get(API);
    
    
    
    // Handle different response formats
    if (Array.isArray(response.data)) {
      return response.data.map(loc => ({
        id: loc.location_id || loc.id,
        name: loc.location_name || loc.name
      }));
    }
    
    if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data.map(loc => ({
        id: loc.location_id || loc.id,
        name: loc.location_name || loc.name
      }));
    }
    
    throw new Error("Invalid locations data format");
  } catch (error) {
    console.error("Error fetching locations:", error);
    return []; // Always return an array as fallback
  }
};

// Keep your other methods unchanged
export const addLocation = (locationData) => axios.post(API, locationData);
export const updateLocation = (id, locationData) => axios.put(`${API}/${id}`, locationData);
export const deleteLocation = (id) => axios.delete(`${API}/${id}`);