import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getAcceptanceReport, exportAcceptanceReport } from '../services/reportService';
import { Container, Table, Button, Spinner, Alert, Card, Row, Col, Badge } from 'react-bootstrap';
import { saveAs } from 'file-saver';
import { BiDownload, BiRefresh } from 'react-icons/bi';
import { FaFileAlt } from 'react-icons/fa';

const AcceptanceReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAcceptanceReport({});
      setReportData(res.data || []);
    } catch (err) {
      console.error('API error:', err);
      setError('Failed to fetch Acceptance Report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (reportData.length === 0) {
      alert('No data to export!');
      return;
    }
    setExporting(true);
    try {
      const res = await exportAcceptanceReport();
      saveAs(new Blob([res.data]), 'Acceptance_Report.xlsx');
    } catch (err) {
      console.error(err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="d-flex">
      <Sidebar />
      <Container className="mt-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">Acceptance Report</h3>
            <p className="text-muted mb-0">View all accepted gate pass records with details.</p>
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

        {/* Error Alert */}
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        {/* Summary Cards */}
        {reportData.length > 0 && (
          <Row className="mb-4">
            <Col md={6}>
              <Card className="shadow-sm text-center">
                <Card.Body>
                  <h6 className="text-muted mb-1">Total Accepted Records</h6>
                  <h3>{reportData.length}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="shadow-sm text-center">
                <Card.Body>
                  <h6 className="text-muted mb-1">Last Updated</h6>
                  <h5>{new Date().toLocaleString()}</h5>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Report Table */}
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" />
                <p className="mt-2 mb-0 text-muted">Loading acceptance report...</p>
              </div>
            ) : reportData.length > 0 ? (
              <div className="table-responsive">
                <Table hover bordered className="mb-0 align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Gate Pass ID</th>
                      <th>Requester</th>
                      <th>Receiver</th>
                      <th>Accepted By</th>
                      <th>Accepted Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={row.gate_pass_id || idx}>
                        <td className="fw-bold text-primary">REQ-{row.gate_pass_id}</td>
                        <td>{row.requester || '-'}</td>
                        <td>{row.receiver || '-'}</td>
                        <td>
                          <Badge bg="success" className="px-2 py-1">{row.accepted_by || 'N/A'}</Badge>
                        </td>
                        <td>{row.accepted_date ? new Date(row.accepted_date).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                <FaFileAlt size={40} className="mb-2 opacity-50" />
                <p className="mb-0">No acceptance records found</p>
                <small>Accepted records will appear here once available.</small>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Footer */}
        {reportData.length > 0 && (
          <div className="mt-3 text-muted small text-end">
            Report generated on {new Date().toLocaleString()}
          </div>
        )}
      </Container>
    </div>
  );
};

export default AcceptanceReport;
