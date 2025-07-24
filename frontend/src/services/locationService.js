import axios from "axios";

const API = "http://192.168.10.144:5000/api/locations";

export const getLocations = () => axios.get(API);

export const addLocation = (locationData) =>
  axios.post(API, locationData);

export const updateLocation = (id, locationData) =>
  axios.put(`${API}/${id}`, locationData);

export const deleteLocation = (id) =>
  axios.delete(`${API}/${id}`);
