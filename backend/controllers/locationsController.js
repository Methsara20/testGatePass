const db = require('../config/db'); // adjust based on your structure

// Get all locations
exports.getAllLocations = (req, res) => {
  db.query('SELECT * FROM locations ORDER BY location_id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Add a new location
exports.addLocation = (req, res) => {
  const { location_name } = req.body;
  if (!location_name) return res.status(400).json({ error: 'Location name required' });

  db.query('INSERT INTO locations (location_name) VALUES (?)', [location_name], (err, result) => {
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
  const { location_name } = req.body;

  db.query('UPDATE locations SET location_name = ? WHERE location_id = ?', [location_name, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Location updated successfully' });
  });
};
