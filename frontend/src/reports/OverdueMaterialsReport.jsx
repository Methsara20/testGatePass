import React, { useState, useEffect } from 'react';
import { getOverdueMaterials, exportOverdueMaterials } from '../services/reportService';
import { Container, Table, Button, Card, Badge, Spinner, Form, Row, Col, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { saveAs } from 'file-saver';
import { BiDownload, BiRefresh, BiSearch } from 'react-icons/bi';
import { AiOutlineExclamationCircle } from 'react-icons/ai';
import { BsClock } from 'react-icons/bs';
import { FaRegCalendarAlt } from 'react-icons/fa';

const OverdueMaterialsReport = () => {
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
      const res = await getOverdueMaterials();
      setReportData(res.data);
      setFilteredData(res.data);
    } catch (err) {
      console.error(err);
      setError('⚠️ Failed to fetch overdue materials. Please try again.');
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
      const res = await exportOverdueMaterials();
      saveAs(new Blob([res.data]), 'Overdue_Materials.xlsx');
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
          row.material_name?.toLowerCase().includes(term) ||
          row.issuer?.toLowerCase().includes(term) ||
          row.receiver_name?.toLowerCase().includes(term) ||
          row.gate_pass_id?.toString().includes(term)
      )
    );
  };


  
  const getSeverityBadge = (days) => {
    if (days === 'Return')
      return <Badge bg="success" className="px-3">Returned</Badge>;
    if (days <= 7)
      return <Badge bg="warning" className="px-3">Recent ({days}d)</Badge>;
    if (days <= 30)
      return <Badge bg="danger" className="px-3">Warning ({days}d)</Badge>;
    return <Badge bg="dark" className="px-3">Critical ({days}d)</Badge>;
  };




  const getRowClass = (days) => {
    // If it's a returned gate pass (string 'Return') → no color
    if (days === 'Return') return '';
    
    if (days <= 7) return 'table-warning';
    if (days <= 30) return 'table-danger';
    return 'table-secondary';
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="d-flex">
      
            <div className="flex-grow-1">
        
      <Container className="mt-4">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">
              <BsClock className="me-2 text-warning" />
              Overdue Materials Report
            </h3>
            <p className="text-muted mb-0">
              Track, manage, and analyze overdue material returns
            </p>
          </div>
          <div className="d-flex gap-2 mt-2 mt-md-0">
            <Button
              variant="outline-primary"
              onClick={fetchReport}
              disabled={loading}
            >
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
              disabled={exporting || reportData.length === 0}
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

        {/* Search Filter */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row className="g-3 align-items-center">
              <Col md={6}>
                <Form.Control
                  type="text"
                  placeholder="🔍 Search by material, issuer, receiver, or Gate Pass ID..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </Col>
              <Col md={6} className="text-end">
                <small className="text-muted">
                  Showing <strong>{filteredData.length}</strong> of{" "}
                  <strong>{reportData.length}</strong> overdue items
                </small>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            <AiOutlineExclamationCircle className="me-2" />
            {error}
          </Alert>
        )}

        {/* Table */}
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover bordered className="mb-0 align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Gate Pass ID</th>
                    <th>Original Gate Pass ID</th>
                    <th>Material</th>
                    <th>Quantity</th>
                    <th>Requester</th>
                    <th>Accepted By</th>
                    <th>
                      <OverlayTrigger
                        overlay={<Tooltip>Expected Return Date</Tooltip>}
                      >
                        <span>
                          <FaRegCalendarAlt className="me-1" /> Due Date
                        </span>
                      </OverlayTrigger>
                    </th>
                    <th>Days Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <Spinner animation="border" className="me-2" /> Loading
                        overdue materials...
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((row, idx) => (
                      <tr key={idx} className={getRowClass(row.days_overdue)}>
                        <td className="fw-bold text-primary">
                          REQ-{row.gate_pass_id}
                        </td>
                        <td className="fw-bold text-primary">
                          REF-{row.reference_gate_pass_id}
                        </td>
                        <td>{row.material_name}</td>
                        <td>
                          <Badge bg="secondary">{row.qty}</Badge>
                        </td>
                        <td>{row.issuer}</td>
                        <td>{row.accepted_by}</td>
                        <td>
                          {row.return_date
                            ? new Date(row.return_date).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>{getSeverityBadge(row.days_overdue)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        <BsClock size={40} className="mb-2 opacity-50" />
                        <p className="mb-0">No overdue materials found</p>
                        <small>All materials are returned on time</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
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
    </div>
  );
};

export default OverdueMaterialsReport;
