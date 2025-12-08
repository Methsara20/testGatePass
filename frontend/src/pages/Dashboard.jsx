import React, { useEffect, useState, lazy, Suspense } from "react";
import { fetchDashboardData } from "../services/dashboardService";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import '../styles/Global.css';
import '../styles/Dashboard.css';

// Lazy load chart components
const Line = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));
const Bar = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
const Pie = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Pie })));

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  // State declarations
  const [summary, setSummary] = useState({});
  const [recent, setRecent] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [retryCount, setRetryCount] = useState(0);
  const [cache, setCache] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  
  // Analytics tab state
  const [analyticsFilters, setAnalyticsFilters] = useState({
    timeGranularity: 'daily',
    department: 'all',
    location: 'all',
    status: 'all'
  });
  
  // Reports tab state
  const [reports, setReports] = useState([
    { id: 1, name: 'Monthly Summary', description: 'Comprehensive monthly report of all gate pass activities', lastGenerated: '2023-06-15', format: 'PDF' },
    { id: 2, name: 'Department Performance', description: 'Performance analysis by department', lastGenerated: '2023-06-10', format: 'Excel' },
    { id: 3, name: 'Location Analysis', description: 'Request distribution by location', lastGenerated: '2023-06-12', format: 'PDF' },
    { id: 4, name: 'Status Trends', description: 'Trends in approval, pending, and rejection rates', lastGenerated: '2023-06-14', format: 'PDF' },
    { id: 5, name: 'Processing Time Report', description: 'Average processing times by department and status', lastGenerated: '2023-06-08', format: 'Excel' },
  ]);
  
  const [customReport, setCustomReport] = useState({
    name: '',
    description: '',
    dateRange: 'last30',
    departments: [],
    locations: [],
    statuses: [],
    format: 'pdf'
  });

  // Disable default browser scrollbar when component mounts
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // Fetch data with caching and retry
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const cacheKey = `dashboard-${dateFilter}`;
        if (cache[cacheKey]) {
          const cachedData = cache[cacheKey];
          setSummary(cachedData.summary || {});
          setRecent(cachedData.recent || []);
          setTrend(cachedData.trend || {});
          setLoading(false);
          return;
        }
        const res = await fetchDashboardData();
        const data = res.data;
        setCache(prev => ({ ...prev, [cacheKey]: data }));
        setSummary(data.summary || {});
        setRecent(data.recent || []);
        setTrend(data.trend || {});
        setLoading(false);
      } catch (e) {
        console.error("Dashboard load error", e);
        setError("Failed to load dashboard data. Please try again later.");
        setLoading(false);
      }
    };
    fetchData();
  }, [dateFilter, retryCount, cache]);

  // Handle retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Handle analytics filter changes
  const handleAnalyticsFilterChange = (filterName, value) => {
    setAnalyticsFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Handle custom report form changes
  const handleCustomReportChange = (field, value) => {
    setCustomReport(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Generate a custom report
  const generateCustomReport = () => {
    alert(`Generating custom report: ${customReport.name}`);
    // In a real app, this would call an API to generate the report
  };

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Request Trends Over Time',
        font: {
          size: 16
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(200, 200, 200, 0.1)'
        }
      },
      x: {
        grid: {
          color: 'rgba(200, 200, 200, 0.1)'
        }
      }
    }
  };

  const chartData = {
    labels: trend.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Number of Requests',
        data: trend.map(item => item.count),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 8
      }
    ]
  };

  // Status badge colors
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  // Filter data based on selected date range
  const getFilteredData = () => {
    const now = new Date();
    let startDate;
    if (dateFilter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateFilter === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (dateFilter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      return { recent, trend };
    }
    const filteredRecent = recent.filter(req => new Date(req.request_date) >= startDate);
    const filteredTrend = trend.filter(item => new Date(item.date) >= startDate);
    return { recent: filteredRecent, trend: filteredTrend };
  };

  const { recent: filteredRecent, trend: filteredTrend } = getFilteredData();

  // Process analytics data
  const departmentAnalytics = filteredRecent.reduce((acc, req) => {
    const dept = req.department || 'External Locations';
    if (!acc[dept]) {
      acc[dept] = { total: 0, approved: 0, pending: 0, rejected: 0, requests: [] };
    }
    acc[dept].total += 1;
    acc[dept].requests.push(req);
    const status = req.status.toLowerCase();
    if (status === 'approved') acc[dept].approved += 1;
    else if (status === 'pending') acc[dept].pending += 1;
    else if (status === 'rejected') acc[dept].rejected += 1;
    return acc;
  }, {});

  const fromDepartmentAnalytics = filteredRecent.reduce((acc, req) => {
    const dept = req.from_department || 'External Locations';
    if (!acc[dept]) {
      acc[dept] = { total: 0, approved: 0, pending: 0, rejected: 0, requests: [] };
    }
    acc[dept].total += 1;
    acc[dept].requests.push(req);
    const status = req.status.toLowerCase();
    if (status === 'approved') acc[dept].approved += 1;
    else if (status === 'pending') acc[dept].pending += 1;
    else if (status === 'rejected') acc[dept].rejected += 1;
    return acc;
  }, {});

  const locationAnalytics = filteredRecent.reduce((acc, req) => {
    const loc = req.location || 'External Locations';
    if (!acc[loc]) {
      acc[loc] = { total: 0, approved: 0, pending: 0, rejected: 0, requests: [] };
    }
    acc[loc].total += 1;
    acc[loc].requests.push(req);
    const status = req.status.toLowerCase();
    if (status === 'approved') acc[loc].approved += 1;
    else if (status === 'pending') acc[loc].pending += 1;
    else if (status === 'rejected') acc[loc].rejected += 1;
    return acc;
  }, {});

  const toLocationAnalytics = filteredRecent.reduce((acc, req) => {
    const loc = req.destination_address || 'External Locations';
    if (!acc[loc]) {
      acc[loc] = { total: 0, approved: 0, pending: 0, rejected: 0, requests: [] };
    }
    acc[loc].total += 1;
    acc[loc].requests.push(req);
    const status = req.status.toLowerCase();
    if (status === 'approved') acc[loc].approved += 1;
    else if (status === 'pending') acc[loc].pending += 1;
    else if (status === 'rejected') acc[loc].rejected += 1;
    return acc;
  }, {});

  // Chart data preparation
  const departmentChartData = {
    labels: Object.keys(departmentAnalytics),
    datasets: [
      {
        label: 'Total Requests',
        data: Object.values(departmentAnalytics).map(dept => dept.total),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const locationChartData = {
    labels: Object.keys(locationAnalytics),
    datasets: [
      {
        label: 'Total Requests',
        data: Object.values(locationAnalytics).map(loc => loc.total),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const departmentPieData = {
    labels: Object.keys(departmentAnalytics),
    datasets: [
      {
        data: Object.values(departmentAnalytics).map(dept => dept.total),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const statusPieData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [
      {
        data: [
          summary.approved || 0,
          summary.pending || 0,
          summary.rejected || 0
        ],
        backgroundColor: [
          'rgba(40, 167, 69, 0.6)',
          'rgba(255, 193, 7, 0.6)',
          'rgba(220, 53, 69, 0.6)'
        ],
        borderColor: [
          'rgba(40, 167, 69, 1)',
          'rgba(255, 193, 7, 1)',
          'rgba(220, 53, 69, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const fromDepartmentPieData = {
    labels: Object.keys(fromDepartmentAnalytics),
    datasets: [
      {
        data: Object.values(fromDepartmentAnalytics).map(dept => dept.total),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const toLocationPieData = {
    labels: Object.keys(toLocationAnalytics),
    datasets: [
      {
        data: Object.values(toLocationAnalytics).map(loc => loc.total),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Loading skeleton component
  const SkeletonLoader = () => (
    <div className="skeleton-loader">
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
    </div>
  );

  // Loading and error states
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="alert alert-danger" role="alert">
          {error}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={handleRetry}>
            Retry ({retryCount})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        {/* Dashboard Header */}
        <header className="dashboard-header">
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center flex-wrap">
              <h3 className="mb-1 fw-bold">Dashboard</h3>
              <div className="d-flex align-items-center flex-wrap justify-content-center justify-content-md-start">
                <span className="me-3 text-muted small d-none d-sm-inline">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
                <div className="dropdown me-2">
                  <button
                    className="btn btn-sm btn-outline-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    aria-label="Share options"
                  >
                    <i className="bi bi-share me-1"></i> <span className="d-none d-sm-inline">Share</span>
                  </button>
                  <ul className="dropdown-menu">
                    <li><a className="dropdown-item" href="#"><i className="bi bi-slack me-2"></i>Share to Slack</a></li>
                    <li><a className="dropdown-item" href="#"><i className="bi bi-microsoft-teams me-2"></i>Share to Teams</a></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><a className="dropdown-item" href="#"><i className="bi bi-link-45deg me-2"></i>Copy Link</a></li>
                  </ul>
                </div>
                <button className="btn btn-sm btn-outline-primary me-2" aria-label="Export data">
                  <i className="bi bi-download me-1"></i> <span className="d-none d-sm-inline">Export</span>
                </button>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setRetryCount(prev => prev + 1)}
                  aria-label="Refresh dashboard"
                >
                  <i className="bi bi-arrow-clockwise me-1"></i> <span className="d-none d-sm-inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Navigation Tabs */}
        <div className="dashboard-tabs">
          <div className="container-fluid">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => setActiveTab('analytics')}
                >
                  Analytics(⚠️In Development)
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reports')}
                >
                  Custom Reports(⚠️In Development)
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Dashboard Filter Bar (only for Overview tab) */}
        {activeTab === 'overview' && (
          <div className="dashboard-filters">
            <div className="container-fluid">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                <h2 className="mb-3 mb-md-0">Overview</h2>
                <div className="btn-group flex-wrap" role="group" aria-label="Date filters">
                  <button
                    type="button"
                    className={`btn btn-outline-primary ${dateFilter === 'today' ? 'active' : ''}`}
                    onClick={() => setDateFilter('today')}
                    aria-pressed={dateFilter === 'today'}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className={`btn btn-outline-primary ${dateFilter === 'week' ? 'active' : ''}`}
                    onClick={() => setDateFilter('week')}
                    aria-pressed={dateFilter === 'week'}
                  >
                    This Week
                  </button>
                  <button
                    type="button"
                    className={`btn btn-outline-primary ${dateFilter === 'month' ? 'active' : ''}`}
                    onClick={() => setDateFilter('month')}
                    aria-pressed={dateFilter === 'month'}
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    className={`btn btn-outline-primary ${dateFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setDateFilter('all')}
                    aria-pressed={dateFilter === 'all'}
                  >
                    All Time
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="dashboard-content">
          <div className="container-fluid mt-4">
            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <>
                {/* Summary Cards */}
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-4 g-4 mb-5">
                  <div className="col">
                    <div className="card h-100 border-0 shadow-sm hover-card" tabIndex="0">
                      <div className="card-body p-4">
                        <div className="icon-circle bg-primary bg-opacity-10 mb-3">
                          <i className="bi bi-clipboard-data fs-2 text-primary"></i>
                        </div>
                        <div className="fw-bold fs-5">Total Requests</div>
                        <div className="display-6 fw-bold my-2">{summary.total || 0}</div>
                        <div className="text-muted small">All Gate Pass Requests</div>
                      </div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="card h-100 border-0 shadow-sm hover-card" tabIndex="0">
                      <div className="card-body p-4">
                        <div className="icon-circle bg-success bg-opacity-10 mb-3">
                          <i className="bi bi-check-circle fs-2 text-success"></i>
                        </div>
                        <div className="fw-bold fs-5">Approved</div>
                        <div className="display-6 fw-bold my-2">{summary.approved || 0}</div>
                        <div className="text-muted small">Requests approved</div>
                      </div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="card h-100 border-0 shadow-sm hover-card" tabIndex="0">
                      <div className="card-body p-4">
                        <div className="icon-circle bg-warning bg-opacity-10 mb-3">
                          <i className="bi bi-hourglass-split fs-2 text-warning"></i>
                        </div>
                        <div className="fw-bold fs-5">Pending</div>
                        <div className="display-6 fw-bold my-2">{summary.pending || 0}</div>
                        <div className="text-muted small">Awaiting Approval</div>
                      </div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="card h-100 border-0 shadow-sm hover-card" tabIndex="0">
                      <div className="card-body p-4">
                        <div className="icon-circle bg-danger bg-opacity-10 mb-3">
                          <i className="bi bi-x-circle fs-2 text-danger"></i>
                        </div>
                        <div className="fw-bold fs-5">Rejected</div>
                        <div className="display-6 fw-bold my-2">{summary.rejected || 0}</div>
                        <div className="text-muted small">Requests Rejected</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="row mb-4">
                  <div className="col-12 col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-white py-3">
                        <h4 className="mb-0">Request Status Distribution</h4>
                      </div>
                      <div className="card-body">
                        <div className="chart-container" style={{ height: '250px' }}>
                          <Suspense fallback={<SkeletonLoader />}>
                            <Pie
                              data={statusPieData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'right',
                                    labels: {
                                      font: {
                                        size: 12
                                      }
                                    }
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: function (context) {
                                        const label = context.label || '';
                                        const value = context.raw || 0;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = Math.round((value / total) * 100);
                                        return `${label}: ${value} (${percentage}%)`;
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </Suspense>
                        </div>
                        <div className="table-responsive mt-3">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Status</th>
                                <th>Total</th>
                                <th className="d-none d-md-table-cell">Percentage</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td><span className="badge bg-success">Approved</span></td>
                                <td>{summary.approved || 0}</td>
                                <td className="d-none d-md-table-cell">
                                  {summary.total ? Math.round((summary.approved / summary.total) * 100) : 0}%
                                </td>
                              </tr>
                              <tr>
                                <td><span className="badge bg-warning">Pending</span></td>
                                <td>{summary.pending || 0}</td>
                                <td className="d-none d-md-table-cell">
                                  {summary.total ? Math.round((summary.pending / summary.total) * 100) : 0}%
                                </td>
                              </tr>
                              <tr>
                                <td><span className="badge bg-danger">Rejected</span></td>
                                <td>{summary.rejected || 0}</td>
                                <td className="d-none d-md-table-cell">
                                  {summary.total ? Math.round((summary.rejected / summary.total) * 100) : 0}%
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-white py-3">
                        <h4 className="mb-0">Department Distribution</h4>
                      </div>
                      <div className="card-body">
                        {Object.keys(departmentAnalytics).length > 0 ? (
                          <>
                            <div className="chart-container" style={{ height: '250px' }}>
                              <Suspense fallback={<SkeletonLoader />}>
                                <Pie
                                  data={departmentPieData}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        position: 'right',
                                        labels: {
                                          font: {
                                            size: 12
                                          }
                                        }
                                      },
                                      tooltip: {
                                        callbacks: {
                                          label: function (context) {
                                            const label = context.label || '';
                                            const value = context.raw || 0;
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = Math.round((value / total) * 100);
                                            return `${label}: ${value} (${percentage}%)`;
                                          }
                                        }
                                      }
                                    }
                                  }}
                                />
                              </Suspense>
                            </div>
                            <div className="table-responsive mt-3">
                              <table className="table table-sm">
                                <thead>
                                  <tr>
                                    <th>Department</th>
                                    <th>Total</th>
                                    <th className="d-none d-md-table-cell">Approved</th>
                                    <th className="d-none d-md-table-cell">Pending</th>
                                    <th className="d-none d-md-table-cell">Rejected</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(departmentAnalytics).map(([dept, counts]) => (
                                    <tr key={dept}>
                                      <td>{dept}</td>
                                      <td>{counts.total}</td>
                                      <td className="d-none d-md-table-cell text-success">{counts.approved}</td>
                                      <td className="d-none d-md-table-cell text-warning">{counts.pending}</td>
                                      <td className="d-none d-md-table-cell text-danger">{counts.rejected}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4 text-muted">
                            No department data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Table */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white py-3">
                        <h4 className="mb-0">Recent Activity</h4>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th scope="col">GP Number</th>
                                <th scope="col">GP Type</th>
                                <th scope="col">Status</th>
                                <th scope="col">GP Req Date</th>
                                <th scope="col" className="d-none d-md-table-cell">From Department</th>
                                <th scope="col" className="d-none d-md-table-cell">From Location</th>
                                <th scope="col" className="d-none d-md-table-cell">To Department</th>
                                <th scope="col" className="d-none d-md-table-cell">To Location</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredRecent.length > 0 ? (
                                filteredRecent.map((req) => (
                                  <tr key={req.gate_pass_id}>
                                    <td><span className="fw-bold">REQ {req.gate_pass_id}</span></td>
                                    <td>{req.request_type}</td>
                                    <td>
                                      <span className={`badge bg-${getStatusColor(req.status)}`}>
                                        {req.status}
                                      </span>
                                    </td>
                                    <td>{new Date(req.request_date).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}</td>
                                    <td className="d-none d-md-table-cell">
                                      <div className="d-flex align-items-center">
                                        <i className="bi bi-building me-2 text-muted"></i>
                                        {req.from_department || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="d-none d-md-table-cell">
                                      <div className="d-flex align-items-center">
                                        <i className="bi bi-geo-alt me-2 text-muted"></i>
                                        {req.location || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="d-none d-md-table-cell">
                                      <div className="d-flex align-items-center">
                                        <i className="bi bi-building me-2 text-muted"></i>
                                        {req.department || req.receiver_name || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="d-none d-md-table-cell">
                                      <div className="d-flex align-items-center">
                                        <i className="bi bi-geo-alt me-2 text-muted"></i>
                                        {req.destination_address || 'N/A'}
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="8" className="text-center py-4 text-muted">
                                    No recent activity found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Request Trend Chart */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-white py-3">
                        <h4 className="mb-0">Request Trend</h4>
                      </div>
                      <div className="card-body">
                        {filteredTrend.length > 0 ? (
                          <Suspense fallback={<SkeletonLoader />}>
                            <div className="chart-container" style={{ height: '300px' }}>
                              <Line options={chartOptions} data={chartData} />
                            </div>
                          </Suspense>
                        ) : (
                          <div className="text-center py-4 text-muted">
                            No trend data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Insights */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-white py-3">
                        <h4 className="mb-0">Performance Insights</h4>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-4 text-center mb-4">
                            <div className="display-6 fw-bold text-primary">
                              {summary.total ? Math.round((summary.approved / summary.total) * 100) : 0}%
                            </div>
                            <div className="text-muted small">Approval Rate</div>
                          </div>
                          <div className="col-4 text-center mb-4">
                            <div className="display-6 fw-bold text-warning">
                              {summary.total ? Math.round((summary.pending / summary.total) * 100) : 0}%
                            </div>
                            <div className="text-muted small">Pending Rate</div>
                          </div>
                          <div className="col-4 text-center mb-4">
                            <div className="display-6 fw-bold text-danger">
                              {summary.total ? Math.round((summary.rejected / summary.total) * 100) : 0}%
                            </div>
                            <div className="text-muted small">Rejection Rate</div>
                          </div>
                        </div>
                        <h5 className="mt-4 mb-3">Average Processing Time</h5>
                        <div className="row text-center">
                          <div className="col-12 col-md-4 mb-3">
                            <div className="card border-0 shadow-sm">
                              <div className="card-body">
                                <div className="fs-4 fw-bold text-success">
                                  {summary.avgApprovalTime || 'N/A'}
                                </div>
                                <div className="text-muted small">Approval Time</div>
                              </div>
                            </div>
                          </div>
                          <div className="col-12 col-md-4 mb-3">
                            <div className="card border-0 shadow-sm">
                              <div className="card-body">
                                <div className="fs-4 fw-bold text-warning">
                                  {summary.avgPendingTime || 'N/A'}
                                </div>
                                <div className="text-muted small">Pending Time</div>
                              </div>
                            </div>
                          </div>
                          <div className="col-12 col-md-4 mb-3">
                            <div className="card border-0 shadow-sm">
                              <div className="card-body">
                                <div className="fs-4 fw-bold text-danger">
                                  {summary.avgRejectionTime || 'N/A'}
                                </div>
                                <div className="text-muted small">Rejection Time</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Analytics Tab Content */}
            {activeTab === 'analytics' && (
              <div className="analytics-tab">
                {/* Analytics Filters */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-3">
                        <label className="form-label">Time Granularity</label>
                        <select
                          className="form-select"
                          value={analyticsFilters.timeGranularity}
                          onChange={(e) => handleAnalyticsFilterChange('timeGranularity', e.target.value)}
                        >
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Department</label>
                        <select
                          className="form-select"
                          value={analyticsFilters.department}
                          onChange={(e) => handleAnalyticsFilterChange('department', e.target.value)}
                        >
                          <option value="all">All Departments</option>
                          {Object.keys(departmentAnalytics).map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Location</label>
                        <select
                          className="form-select"
                          value={analyticsFilters.location}
                          onChange={(e) => handleAnalyticsFilterChange('location', e.target.value)}
                        >
                          <option value="all">All Locations</option>
                          {Object.keys(locationAnalytics).map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={analyticsFilters.status}
                          onChange={(e) => handleAnalyticsFilterChange('status', e.target.value)}
                        >
                          <option value="all">All Statuses</option>
                          <option value="approved">Approved</option>
                          <option value="pending">Pending</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Charts Row */}
                <div className="row mb-4">
                  <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-white py-3">
                        <h4 className="mb-0">Request Volume Over Time</h4>
                      </div>
                      <div className="card-body">
                        <div className="chart-container" style={{ height: '350px' }}>
                          <Suspense fallback={<SkeletonLoader />}>
                            <Line
                              data={chartData}
                              options={{
                                ...chartOptions,
                                plugins: {
                                  ...chartOptions.plugins,
                                  title: {
                                    ...chartOptions.plugins.title,
                                    text: `Request Volume (${analyticsFilters.timeGranularity})`
                                  }
                                }
                              }}
                            />
                          </Suspense>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-white py-3">
                        <h4 className="mb-0">Processing Time Analysis</h4>
                      </div>
                      <div className="card-body">
                        <div className="chart-container" style={{ height: '350px' }}>
                          <Suspense fallback={<SkeletonLoader />}>
                            <Bar
                              data={{
                                labels: ['Approval', 'Pending', 'Rejection'],
                                datasets: [
                                  {
                                    label: 'Average Time (hours)',
                                    data: [
                                      summary.avgApprovalTime ? parseFloat(summary.avgApprovalTime) : 0,
                                      summary.avgPendingTime ? parseFloat(summary.avgPendingTime) : 0,
                                      summary.avgRejectionTime ? parseFloat(summary.avgRejectionTime) : 0
                                    ],
                                    backgroundColor: [
                                      'rgba(40, 167, 69, 0.6)',
                                      'rgba(255, 193, 7, 0.6)',
                                      'rgba(220, 53, 69, 0.6)'
                                    ],
                                    borderColor: [
                                      'rgba(40, 167, 69, 1)',
                                      'rgba(255, 193, 7, 1)',
                                      'rgba(220, 53, 69, 1)'
                                    ],
                                    borderWidth: 1,
                                  },
                                ],
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    title: {
                                      display: true,
                                      text: 'Hours'
                                    }
                                  }
                                }
                              }}
                            />
                          </Suspense>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Department Performance Comparison */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white py-3">
                        <h4 className="mb-0">Department Performance Comparison</h4>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead className="table-light">
                              <tr>
                                <th>Department</th>
                                <th>Total Requests</th>
                                <th>Approval Rate</th>
                                <th>Avg. Processing Time</th>
                                <th>Peak Hours</th>
                                <th>Trend</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(departmentAnalytics).map(([dept, counts]) => {
                                const approvalRate = counts.total > 0
                                  ? Math.round((counts.approved / counts.total) * 100)
                                  : 0;
                                // Simulate trend data
                                const trend = Math.random() > 0.5 ? 'up' : 'down';
                                const trendPercent = Math.floor(Math.random() * 20) + 1;
                                return (
                                  <tr key={dept}>
                                    <td>{dept}</td>
                                    <td>{counts.total}</td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                                          <div
                                            className="progress-bar bg-success"
                                            role="progressbar"
                                            style={{ width: `${approvalRate}%` }}
                                            aria-valuenow={approvalRate}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                          ></div>
                                        </div>
                                        {approvalRate}%
                                      </div>
                                    </td>
                                    <td>{(Math.random() * 24 + 1).toFixed(1)} hrs</td>
                                    <td>10AM - 2PM</td>
                                    <td>
                                      <span className={`badge bg-${trend === 'up' ? 'success' : 'danger'}`}>
                                        {trend === 'up' ? '↑' : '↓'} {trendPercent}%
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Heatmap */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white py-3">
                        <h4 className="mb-0">Location Activity Heatmap</h4>
                      </div>
                      <div className="card-body">
                        <div className="d-flex flex-wrap">
                          {Object.entries(locationAnalytics).map(([loc, counts]) => {
                            const intensity = counts.total > 10 ? 'high' : counts.total > 5 ? 'medium' : 'low';
                            return (
                              <div key={loc} className="location-heatmap-item m-2 p-3 rounded text-center"
                                style={{
                                  backgroundColor: intensity === 'high' ? 'rgba(220, 53, 69, 0.2)' :
                                    intensity === 'medium' ? 'rgba(255, 193, 7, 0.2)' :
                                      'rgba(40, 167, 69, 0.2)',
                                  minWidth: '120px'
                                }}>
                                <div className="fw-bold">{loc}</div>
                                <div className="fs-5">{counts.total} requests</div>
                                <div className="small text-muted">
                                  {counts.approved} approved, {counts.pending} pending
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reports Tab Content */}
            {activeTab === 'reports' && (
              <div className="reports-tab">
                {/* Standard Reports Section */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white py-3">
                    <h4 className="mb-0">Standard Reports</h4>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Report Name</th>
                            <th>Description</th>
                            <th>Last Generated</th>
                            <th>Format</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.map(report => (
                            <tr key={report.id}>
                              <td className="fw-bold">{report.name}</td>
                              <td>{report.description}</td>
                              <td>{report.lastGenerated}</td>
                              <td>
                                <span className="badge bg-secondary">{report.format}</span>
                              </td>
                              <td>
                                <div className="btn-group" role="group">
                                  <button className="btn btn-sm btn-outline-primary">
                                    <i className="bi bi-eye me-1"></i> View
                                  </button>
                                  <button className="btn btn-sm btn-outline-success">
                                    <i className="bi bi-download me-1"></i> Download
                                  </button>
                                  <button className="btn btn-sm btn-outline-secondary">
                                    <i className="bi bi-arrow-clockwise me-1"></i> Regenerate
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Custom Report Generator */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white py-3">
                    <h4 className="mb-0">Custom Report Generator</h4>
                  </div>
                  <div className="card-body">
                    <form onSubmit={(e) => { e.preventDefault(); generateCustomReport(); }}>
                      <div className="row g-3 mb-4">
                        <div className="col-md-6">
                          <label className="form-label">Report Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={customReport.name}
                            onChange={(e) => handleCustomReportChange('name', e.target.value)}
                            placeholder="Enter report name"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Description</label>
                          <input
                            type="text"
                            className="form-control"
                            value={customReport.description}
                            onChange={(e) => handleCustomReportChange('description', e.target.value)}
                            placeholder="Enter report description"
                          />
                        </div>
                      </div>
                      <div className="row g-3 mb-4">
                        <div className="col-md-3">
                          <label className="form-label">Date Range</label>
                          <select
                            className="form-select"
                            value={customReport.dateRange}
                            onChange={(e) => handleCustomReportChange('dateRange', e.target.value)}
                          >
                            <option value="last7">Last 7 Days</option>
                            <option value="last30">Last 30 Days</option>
                            <option value="last90">Last 90 Days</option>
                            <option value="ytd">Year to Date</option>
                            <option value="custom">Custom Range</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Format</label>
                          <select
                            className="form-select"
                            value={customReport.format}
                            onChange={(e) => handleCustomReportChange('format', e.target.value)}
                          >
                            <option value="pdf">PDF</option>
                            <option value="excel">Excel</option>
                            <option value="csv">CSV</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Departments</label>
                          <select
                            className="form-select"
                            multiple
                            value={customReport.departments}
                            onChange={(e) => {
                              const options = Array.from(e.target.selectedOptions, option => option.value);
                              handleCustomReportChange('departments', options);
                            }}
                          >
                            {Object.keys(departmentAnalytics).map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                          <div className="form-text">Hold Ctrl/Cmd to select multiple</div>
                        </div>
                      </div>
                      <div className="row g-3 mb-4">
                        <div className="col-md-6">
                          <label className="form-label">Locations</label>
                          <select
                            className="form-select"
                            multiple
                            value={customReport.locations}
                            onChange={(e) => {
                              const options = Array.from(e.target.selectedOptions, option => option.value);
                              handleCustomReportChange('locations', options);
                            }}
                          >
                            {Object.keys(locationAnalytics).map(loc => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))}
                          </select>
                          <div className="form-text">Hold Ctrl/Cmd to select multiple</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Statuses</label>
                          <select
                            className="form-select"
                            multiple
                            value={customReport.statuses}
                            onChange={(e) => {
                              const options = Array.from(e.target.selectedOptions, option => option.value);
                              handleCustomReportChange('statuses', options);
                            }}
                          >
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <div className="form-text">Hold Ctrl/Cmd to select multiple</div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-end">
                        <button type="submit" className="btn btn-primary">
                          <i className="bi bi-file-earmark-text me-2"></i> Generate Report
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Scheduled Reports */}
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Scheduled Reports</h4>
                    <button className="btn btn-sm btn-outline-primary">
                      <i className="bi bi-plus-circle me-1"></i> Add Schedule
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Report Name</th>
                            <th>Schedule</th>
                            <th>Recipients</th>
                            <th>Last Sent</th>
                            <th>Next Run</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Monthly Summary</td>
                            <td>1st of every month, 9:00 AM</td>
                            <td>admin@company.com, manager@company.com</td>
                            <td>2023-06-01</td>
                            <td>2023-07-01</td>
                            <td><span className="badge bg-success">Active</span></td>
                            <td>
                              <div className="btn-group" role="group">
                                <button className="btn btn-sm btn-outline-primary">
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button className="btn btn-sm btn-outline-danger">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Weekly Department Performance</td>
                            <td>Every Monday, 8:00 AM</td>
                            <td>dept-heads@company.com</td>
                            <td>2023-06-12</td>
                            <td>2023-06-19</td>
                            <td><span className="badge bg-success">Active</span></td>
                            <td>
                              <div className="btn-group" role="group">
                                <button className="btn btn-sm btn-outline-primary">
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button className="btn btn-sm btn-outline-danger">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Daily Status Summary</td>
                            <td>Every day, 6:00 PM</td>
                            <td>admin@company.com</td>
                            <td>2023-06-15</td>
                            <td>2023-06-16</td>
                            <td><span className="badge bg-warning">Paused</span></td>
                            <td>
                              <div className="btn-group" role="group">
                                <button className="btn btn-sm btn-outline-primary">
                                  <i className="bi bi-play-circle"></i>
                                </button>
                                <button className="btn btn-sm btn-outline-danger">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;