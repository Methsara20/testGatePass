const express = require('express');
const router = express.Router();
const {
  getGatePassSummary,
  getOverdueMaterials,
  getApprovedVsRejected,
  getAuditLog,
  getMaterialMovement,
  getAcceptanceReport,
  exportGatePassSummary,
  exportOverdueMaterials,
  exportApprovedVsRejected,
  exportAuditLog,
  exportMaterialMovement,
  exportAcceptanceReport,
} = require("../controllers/reportController");

// JSON APIs
router.get('/gatepass-summary', getGatePassSummary);
router.get('/overdue-materials', getOverdueMaterials);
router.get('/approved-vs-rejected', getApprovedVsRejected);
//router.get('/audit-log', getAuditLog);
router.get('/material-movement', getMaterialMovement);
router.get('/acceptance-report', getAcceptanceReport);

// Excel Export APIs
router.get('/export/gatepass-summary', exportGatePassSummary);
router.get('/export/overdue-materials', exportOverdueMaterials);
router.get('/export/approved-vs-rejected', exportApprovedVsRejected);
//router.get('/export/audit-log', exportAuditLog);
router.get('/export/material-movement', exportMaterialMovement);
router.get('/export/acceptance-report', exportAcceptanceReport);

module.exports = router;
