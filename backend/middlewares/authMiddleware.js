const jwt = require("jsonwebtoken");
const db = require("../config/db");

exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    // Check if user is active
    db.query(
      "SELECT status FROM users WHERE id = ?",
      [decoded.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!results.length) return res.status(404).json({ error: "User not found" });

        if (results[0].status !== "active") {
          return res.status(403).json({ error: "User inactive. Access denied." });
        }

        req.user = decoded;
        next();
      }
    );
  });
};
