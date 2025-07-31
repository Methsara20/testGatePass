import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getMaterialMovement, exportMaterialMovement } from '../services/reportService';
import { Container, Table, Button, Card, Spinner, Form, Row, Col, Badge, Alert } from 'react-bootstrap';
import { saveAs } from 'file-saver';
import { BiDownload, BiRefresh, BiSearch } from 'react-icons/bi';

const MaterialMovementReport = () => {
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMaterialMovement();
      setReportData(res.data);
      setFilteredData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch material movement data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportMaterialMovement();
      saveAs(new Blob([res.data]), 'Material_Movement.xlsx');
    } catch (err) {
      console.error(err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredData(
      reportData.filter(
        (row) =>
          row.material_name.toLowerCase().includes(term) ||
          row.issuer.toLowerCase().includes(term) ||
          row.receiver.toLowerCase().includes(term)
      )
    );
  };

  useEffect(() => { fetchReport(); }, []);

  return (
    <div className="d-flex">
      <Sidebar />
      <Container className="mt-4">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">📦 Material Movement Report</h3>
            <p className="text-muted mb-0">Track and monitor material movement between issuers and receivers</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={fetchReport} disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" className="me-2" /> : <BiRefresh className="me-1" />}
              Refresh
            </Button>
            <Button variant="success" onClick={handleExport} disabled={exporting || reportData.length === 0}>
              {exporting ? <Spinner size="sm" animation="border" className="me-2" /> : <BiDownload className="me-1" />}
              Export Excel
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Control
                  type="text"
                  placeholder="🔍 Search by material, issuer, or receiver..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </Col>
              <Col md={6} className="text-end">
                <small className="text-muted">
                  Showing <strong>{filteredData.length}</strong> of <strong>{reportData.length}</strong> records
                </small>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Data Table */}
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover bordered className="mb-0 align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Material</th>
                    <th>Quantity</th>
                    <th>Issuer</th>
                    <th>Receiver</th>
                    <th>Out Date</th>
                    <th>In Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <Spinner animation="border" className="me-2" /> Loading data...
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold">{row.material_name}</td>
                        <td>
                          <Badge bg="secondary">{row.qty}</Badge>
                        </td>
                        <td>{row.issuer}</td>
                        <td>{row.receiver}</td>
                        <td>{new Date(row.out_date).toLocaleDateString()}</td>
                        <td>{row.in_date ? new Date(row.in_date).toLocaleDateString() : <span className="text-muted">Not Returned</span>}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        <BiSearch size={40} className="mb-2 opacity-50" />
                        <p className="mb-0">No records found</p>
                        <small>Try adjusting your search or filters</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Footer Info */}
        {reportData.length > 0 && (
          <div className="mt-3 text-muted small text-end">
            Report generated on {new Date().toLocaleString()}
          </div>
        )}
      </Container>
    </div>
  );
};

export default MaterialMovementReport;
