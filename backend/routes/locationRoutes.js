const express = require('express');
const router = express.Router();
const { 
  getAllLocations, 
  addLocation, 
  deleteLocation, 
  updateLocation ,
  getActiveLocations
} = require('../controllers/locationsController');

// Routes
router.get('/', getAllLocations);
router.post('/', addLocation);
router.delete('/:id', deleteLocation);
router.put('/:id', updateLocation);
router.get("/active", getActiveLocations);

module.exports = router;