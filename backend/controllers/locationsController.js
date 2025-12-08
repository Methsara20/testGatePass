const db = require('../config/db'); // adjust based on your structure

// Get all locations
exports.getAllLocations = (req, res) => {
    db.query('SELECT * FROM locations ORDER BY location_id ASC', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  };
// Add a new location
exports.addLocation = (req, res) => {
  const { location_name, status } = req.body;
  if (!location_name) return res.status(400).json({ error: 'Location name required' });

  db.query('INSERT INTO locations (location_name, status) VALUES (?, ?)', [location_name, status], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Location added successfully', location_id: result.insertId });
  });
};

// Delete a location (optional)
exports.deleteLocation = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM locations WHERE location_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Location deleted successfully' });
  });
};

// Edit a location (optional)
exports.updateLocation = (req, res) => {
  const { id } = req.params;
  const { location_name, status } = req.body;

  db.query('UPDATE locations SET location_name = ?, status =? WHERE location_id = ?', [location_name, status, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Location updated successfully' });
  });
};


// Get ONLY active locations → for Login & Gate Pass form
exports.getActiveLocations = (req, res) => {
  db.query(
    "SELECT * FROM locations WHERE status = 'active' ORDER BY location_id ASC",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};