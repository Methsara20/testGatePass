import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getGatePassSummary, exportGatePassSummary } from '../services/reportService';
import { Container, Row, Col, Form, Button, Table, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { BiSearch, BiDownload, BiRefresh, BiCalendar, BiFilter } from 'react-icons/bi';
import { saveAs } from 'file-saver';

const GatePassSummaryReport = () => {
  const [filters, setFilters] = useState({ 
    start_date: '', 
    end_date: '', 
    status: '' 
  });
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getGatePassSummary(filters);
      setReportData(res.data);
      setTotalCount(res.data.length);
    } catch (err) {
      console.error('Error fetching report', err);
      setError('Failed to fetch report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (reportData.length === 0) {
      alert('No data to export. Please run a report first.');
      return;
    }
    
    setExporting(true);
    try {
      const res = await exportGatePassSummary(filters);
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(new Blob([res.data]), `Gate_Pass_Summary_${timestamp}.xlsx`);
    } catch (err) {
      console.error('Export failed', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({ start_date: '', end_date: '', status: '' });
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Pending': 'warning',
      'Approved': 'success',
      'Rejected': 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  useEffect(() => { 
    fetchReport(); 
  }, []);

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-4">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">
              <BiCalendar className="me-2 text-primary" />
              Gate Pass Summary Report
            </h3>
            <p className="text-muted mb-0">Generate and export comprehensive gate pass reports</p>
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary" 
              onClick={() => fetchReport()}
              disabled={loading}
              className="d-flex align-items-center"
            >
              <BiRefresh className={`me-1 ${loading ? 'spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="success" 
              onClick={handleExport}
              disabled={exporting || reportData.length === 0}
              className="d-flex align-items-center"
            >
              {exporting ? (
                <Spinner size="sm" className="me-1" />
              ) : (
                <BiDownload className="me-1" />
              )}
              Export Excel
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-light">
            <div className="d-flex align-items-center">
              <BiFilter className="me-2 text-primary" />
              <strong>Filters</strong>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={3}>
                <Form.Label className="fw-semibold">
                  <BiCalendar className="me-1" />
                  Start Date
                </Form.Label>
                <Form.Control 
                  type="date" 
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="form-control-sm"
                />
              </Col>
              <Col md={3}>
                <Form.Label className="fw-semibold">
                  <BiCalendar className="me-1" />
                  End Date
                </Form.Label>
                <Form.Control 
                  type="date" 
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="form-control-sm"
                />
              </Col>
              <Col md={3}>
                <Form.Label className="fw-semibold">Status</Form.Label>
                <Form.Select 
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="form-control-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </Form.Select>
              </Col>
              <Col md={3} className="d-flex align-items-end">
                <div className="d-flex gap-2 w-100">
                  <Button 
                    variant="primary" 
                    onClick={fetchReport}
                    disabled={loading}
                    className="flex-grow-1 d-flex align-items-center justify-content-center"
                  >
                    {loading ? (
                      <Spinner size="sm" className="me-1" />
                    ) : (
                      <BiSearch className="me-1" />
                    )}
                    {loading ? 'Loading...' : 'Apply Filters'}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={clearFilters}
                    title="Clear all filters"
                  >
                    Clear
                  </Button>
                </div>
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

        {/* Results Summary */}
        {!loading && (
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="text-muted">
                Showing <strong>{reportData.length}</strong> gate pass{reportData.length !== 1 ? 'es' : ''}
                {filters.start_date || filters.end_date || filters.status ? (
                  <span className="ms-1">
                    (filtered)
                    {filters.start_date && <Badge bg="light" text="dark" className="ms-1">From: {filters.start_date}</Badge>}
                    {filters.end_date && <Badge bg="light" text="dark" className="ms-1">To: {filters.end_date}</Badge>}
                    {filters.status && <Badge bg="light" text="dark" className="ms-1">Status: {filters.status}</Badge>}
                  </span>
                ) : ''}
              </span>
            </div>
          </div>
        )}

        {/* Data Table */}
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th className="px-3 py-3">Gate Pass ID</th>
                    <th className="px-3 py-3">Requester</th>
                    <th className="px-3 py-3">Department</th>
                    <th className="px-3 py-3">From Location</th>
                    <th className="px-3 py-3">To Location</th>
                    <th className="px-3 py-3">Receiver</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5">
                        <Spinner animation="border" role="status" className="me-2" />
                        Loading report data...
                      </td>
                    </tr>
                  ) : reportData.length > 0 ? (
                    reportData.map((row, idx) => (
                      <tr key={idx} className="align-middle">
                        <td className="px-3 py-3">
                          <span className="fw-bold text-primary">REQ-{row.gate_pass_id}</span>
                        </td>
                        <td className="px-3 py-3">{row.requester || 'N/A'}</td>
                        <td className="px-3 py-3">{row.department || 'N/A'}</td>
                        <td className="px-3 py-3">{row.from_location || 'N/A'}</td>
                        <td className="px-3 py-3">{row.to_location || 'N/A'}</td>
                        <td className="px-3 py-3">{row.receiver_name || 'N/A'}</td>
                        <td className="px-3 py-3">{getStatusBadge(row.status)}</td>
                        <td className="px-3 py-3">
                          {row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-5">
                        <div className="text-muted">
                          <BiSearch size={48} className="mb-3 opacity-50" />
                          <p className="mb-0">No gate passes found</p>
                          <small>Try adjusting your filters or date range</small>
                        </div>
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
          <div className="mt-3 text-muted small">
            <Row>
              <Col>
                Report generated on {new Date().toLocaleString()}
              </Col>
              <Col className="text-end">
                Total records: {reportData.length}
              </Col>
            </Row>
          </div>
        )}
      </div>

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GatePassSummaryReport;