import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getApprovedVsRejected, exportApprovedVsRejected } from '../services/reportService';
import {
  Container,
  Table,
  Button,
  Card,
  Row,
  Col,
  Spinner,
  Form,
  Badge,
  Alert,
} from 'react-bootstrap';
import { saveAs } from 'file-saver';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BiDownload, BiRefresh, BiCheckCircle, BiXCircle } from 'react-icons/bi';
import { FaFileAlt } from 'react-icons/fa';

const COLORS = ['#28a745', '#dc3545', '#ffc107', '#6c757d'];

const ApprovedVsRejectedReport = () => {
  const [reportData, setReportData] = useState({ counts: [], details: [] });
  const [filteredDetails, setFilteredDetails] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getApprovedVsRejected();
      setReportData(res.data);
      setFilteredDetails(res.data.details);
    } catch (err) {
      console.error(err);
      setError('⚠️ Failed to fetch report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!reportData.details.length) return alert('No data to export!');
    setExporting(true);
    try {
      const res = await exportApprovedVsRejected();
      saveAs(new Blob([res.data]), 'Approved_vs_Rejected.xlsx');
    } catch (err) {
      console.error(err);
      alert('Export failed!');
    } finally {
      setExporting(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredDetails(
      reportData.details.filter(
        (row) =>
          row.gate_pass_id.toString().includes(term) ||
          row.requester?.toLowerCase().includes(term) ||
          row.department?.toLowerCase().includes(term) ||
          row.from_location?.toLowerCase().includes(term) ||
          row.to_location?.toLowerCase().includes(term) ||
          row.receiver_name?.toLowerCase().includes(term) ||
          row.status?.toLowerCase().includes(term)
      )
    );
  };

  const getStatusBadge = (status) => {
    if (!status || typeof status !== 'string')
      return <Badge bg="secondary">Unknown</Badge>;

    switch (status.toLowerCase()) {
      case 'approved':
        return (
          <Badge bg="success" className="d-flex align-items-center">
            <BiCheckCircle className="me-1" /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge bg="danger" className="d-flex align-items-center">
            <BiXCircle className="me-1" /> Rejected
          </Badge>
        );
      default:
        return <Badge bg="secondary">{status}</Badge>;
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
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">Approved vs Rejected Report</h3>
            <p className="text-muted mb-0">
              Visual breakdown of gate pass approvals and rejections
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={fetchReport} disabled={loading}>
              {loading ? (
                <Spinner size="sm" animation="border" className="me-2" />
              ) : (
                <BiRefresh className="me-1" />
              )}
              Refresh
            </Button>
            <Button
              variant="success"
              onClick={handleExport}
              disabled={exporting || !reportData.details.length}
            >
              {exporting ? (
                <Spinner size="sm" animation="border" className="me-2" />
              ) : (
                <BiDownload className="me-1" />
              )}
              Export Excel
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Summary Cards & Pie Chart */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="shadow-sm text-center">
              <Card.Body>
                <h6 className="text-muted">Total Gate Passes</h6>
                <h3>{reportData.details.length}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Header className="bg-light">
                <strong>Status Distribution</strong>
              </Card.Header>
              <Card.Body>
                {reportData.counts.length ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={reportData.counts}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        isAnimationActive
                      >
                        {reportData.counts.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted text-center mb-0">No data to display</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Search Bar */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row className="g-3 align-items-center">
              <Col md={6}>
                <Form.Control
                  type="text"
                  placeholder="🔍 Search by Gate Pass ID, requester, status..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </Col>
              <Col md={6} className="text-end">
                <small className="text-muted">
                  Showing <strong>{filteredDetails.length}</strong> of{' '}
                  <strong>{reportData.details.length}</strong> records
                </small>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Details Table */}
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover bordered className="mb-0 align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Gate Pass ID</th>
                    <th>Requester</th>
                    <th>Department</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Receiver</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        <Spinner animation="border" /> Loading report data...
                      </td>
                    </tr>
                  ) : filteredDetails.length > 0 ? (
                    filteredDetails.map((row) => (
                      <tr key={row.gate_pass_id}>
                        <td className="fw-bold text-primary">REQ-{row.gate_pass_id}</td>
                        <td>{row.requester}</td>
                        <td>{row.department}</td>
                        <td>{row.from_location}</td>
                        <td>{row.to_location}</td>
                        <td>{row.receiver_name || '-'}</td>
                        <td>{getStatusBadge(row.status)}</td>
                        <td>{new Date(row.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        <FaFileAlt size={40} className="mb-2 opacity-50" />
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
      </Container>
    </div>
  );
};

export default ApprovedVsRejectedReport;
