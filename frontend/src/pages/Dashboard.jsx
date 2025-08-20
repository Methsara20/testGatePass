import React, { useEffect, useState, lazy, Suspense } from "react";
import { fetchDashboardData } from "../services/dashboardService";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
const Line = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));
const Bar = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
const Pie = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Pie })));

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const [summary, setSummary] = useState({});
  const [recent, setRecent] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [retryCount, setRetryCount] = useState(0);
  const [cache, setCache] = useState({});

  // Fetch data with caching and retry
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const cacheKey = `dashboard-${dateFilter}`;
        
        if (cache[cacheKey]) {
          // Use cached data
          const cachedData = cache[cacheKey];
          setSummary(cachedData.summary || {});
          setRecent(cachedData.recent || []);
          setTrend(cachedData.trend || []);
          setLoading(false);
          return;
        }
        
        const res = await fetchDashboardData();
        const data = res.data;
        
        // Update cache
        setCache(prev => ({ ...prev, [cacheKey]: data }));
        
        setSummary(data.summary || {});
        setRecent(data.recent || []);
        setTrend(data.trend || []);
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
    switch(status.toLowerCase()) {
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

  // Process department-wise analytics
  const departmentAnalytics = filteredRecent.reduce((acc, req) => {
    const dept = req.department || 'Unknown';
    if (!acc[dept]) {
      acc[dept] = {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        requests: []
      };
    }
    acc[dept].total += 1;
    acc[dept].requests.push(req);
    
    const status = req.status.toLowerCase();
    if (status === 'approved') acc[dept].approved += 1;
    else if (status === 'pending') acc[dept].pending += 1;
    else if (status === 'rejected') acc[dept].rejected += 1;
    
    return acc;
  }, {});

  // Process location-wise analytics
  const locationAnalytics = filteredRecent.reduce((acc, req) => {
    const loc = req.location || 'Unknown';
    if (!acc[loc]) {
      acc[loc] = {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        requests: []
      };
    }
    acc[loc].total += 1;
    acc[loc].requests.push(req);
    
    const status = req.status.toLowerCase();
    if (status === 'approved') acc[loc].approved += 1;
    else if (status === 'pending') acc[loc].pending += 1;
    else if (status === 'rejected') acc[loc].rejected += 1;
    
    return acc;
  }, {});

  // Department chart data
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

  // Location chart data
  const locationChartData = {
    labels: Object.keys(locationAnalytics),
    datasets: [
      {
        label: 'Total Requests',
        data: Object.values(locationAnalytics).map(loc => loc.total),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Department distribution pie chart
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

  // Loading skeleton component
  const SkeletonLoader = () => (
    <div className="skeleton-loader">
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
    </div>
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
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
    <div className="dashboard-wrapper">
      {/* Dashboard Header with Integration Features */}
      <header className="dashboard-header">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h1 className="h4 mb-0" >Dashboard</h1>
            <div className="d-flex align-items-center flex-wrap">
              <span className="me-3 text-muted">Last updated: {new Date().toLocaleTimeString()}</span>
              
              {/* Integration Features */}
              <div className="dropdown me-2">
                <button 
                  className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                  type="button" 
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  aria-label="Share options"
                >
                  <i className="bi bi-share me-1"></i> Share
                </button>
                <ul className="dropdown-menu">
                  <li><a className="dropdown-item" href="#"><i className="bi bi-slack me-2"></i>Share to Slack</a></li>
                  <li><a className="dropdown-item" href="#"><i className="bi bi-microsoft-teams me-2"></i>Share to Teams</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><a className="dropdown-item" href="#"><i className="bi bi-link-45deg me-2"></i>Copy Link</a></li>
                </ul>
              </div>
              
              <button className="btn btn-sm btn-outline-primary me-2" aria-label="Export data">
                <i className="bi bi-download me-1"></i> Export
              </button>
              
              <button 
                className="btn btn-sm btn-outline-primary" 
                onClick={() => setRetryCount(prev => prev + 1)}
                aria-label="Refresh dashboard"
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Filter Bar */}
      <div className="dashboard-filters">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Overview</h2>
            <div className="btn-group" role="group" aria-label="Date filters">
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

      {/* Scrollable Content Area */}
      <div className="dashboard-content">
        <div className="container-fluid mt-4">
          {/* Summary Cards */}
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 mb-5">
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

          <div className="row">
            {/* Recent Activity */}
            <div className="col-lg-12 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3">
                  <h4 className="mb-0">Recent Activity</h4>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th scope="col">ID</th>
                          <th scope="col">Type</th>
                          <th scope="col">Status</th>
                          <th scope="col">Date</th>
                          <th scope="col">Location</th>
                          <th scope="col">Department</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecent.length > 0 ? (
                          filteredRecent.map((req) => (
                            <tr key={req.id}>
                              <td><span className="fw-bold">#{req.id}</span></td>
                              <td>{req.request_type}</td>
                              <td>
                                <span className={`badge bg-${getStatusColor(req.status)}`}>
                                  {req.status}
                                </span>
                              </td>
                              <td>{new Date(req.request_date).toLocaleDateString()}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className="bi bi-geo-alt me-2 text-muted"></i>
                                  {req.location || 'N/A'}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className="bi bi-building me-2 text-muted"></i>
                                  {req.department || 'N/A'}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-4 text-muted">
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

            {/* Department-wise Analytics */}
            <div className="col-lg-6 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3">
                  <h4 className="mb-0">Department-wise Analytics</h4>
                </div>
                <div className="card-body">
                  {Object.keys(departmentAnalytics).length > 0 ? (
                    <>
                      <div className="chart-container mb-4" style={{ height: '200px' }}>
                        <Suspense fallback={<SkeletonLoader />}>
                          <Bar 
                            data={departmentChartData} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  display: false
                                }
                              }
                            }} 
                          />
                        </Suspense>
                      </div>
                      
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Department</th>
                              <th>Total</th>
                              <th>Approved</th>
                              <th>Pending</th>
                              <th>Rejected</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(departmentAnalytics).map(([dept, counts]) => (
                              <tr key={dept}>
                                <td>{dept}</td>
                                <td>{counts.total}</td>
                                <td className="text-success">{counts.approved}</td>
                                <td className="text-warning">{counts.pending}</td>
                                <td className="text-danger">{counts.rejected}</td>
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

            {/* Location-wise Analytics */}
            <div className="col-lg-6 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3">
                  <h4 className="mb-0">Location-wise Analytics</h4>
                </div>
                <div className="card-body">
                  {Object.keys(locationAnalytics).length > 0 ? (
                    <>
                      <div className="chart-container mb-4" style={{ height: '200px' }}>
                        <Suspense fallback={<SkeletonLoader />}>
                          <Pie 
                            data={departmentPieData} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'right'
                                }
                              }
                            }} 
                          />
                        </Suspense>
                      </div>
                      
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Location</th>
                              <th>Total</th>
                              <th>Approved</th>
                              <th>Pending</th>
                              <th>Rejected</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(locationAnalytics).map(([loc, counts]) => (
                              <tr key={loc}>
                                <td>{loc}</td>
                                <td>{counts.total}</td>
                                <td className="text-success">{counts.approved}</td>
                                <td className="text-warning">{counts.pending}</td>
                                <td className="text-danger">{counts.rejected}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      No location data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Request Trend Chart */}
            <div className="col-lg-6 mb-4">
              <div className="card border-0 shadow-sm">
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

            {/* Performance Insights */}
            <div className="col-lg-6 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3">
                  <h4 className="mb-0">Performance Insights</h4>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4 text-center mb-4">
                      <div className="display-6 fw-bold text-primary">
                        {summary.total ? Math.round((summary.approved / summary.total) * 100) : 0}%
                      </div>
                      <div className="text-muted">Approval Rate</div>
                    </div>
                    <div className="col-md-4 text-center mb-4">
                      <div className="display-6 fw-bold text-warning">
                        {summary.total ? Math.round((summary.pending / summary.total) * 100) : 0}%
                      </div>
                      <div className="text-muted">Pending Rate</div>
                    </div>
                    <div className="col-md-4 text-center mb-4">
                      <div className="display-6 fw-bold text-danger">
                        {summary.total ? Math.round((summary.rejected / summary.total) * 100) : 0}%
                      </div>
                      <div className="text-muted">Rejection Rate</div>
                    </div>
                  </div>

                  {/* Average Processing Time */}
                  <h5 className="mt-4 mb-3">Average Processing Time</h5>
                  <div className="row text-center">
                    <div className="col-md-4 mb-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          <div className="fs-4 fw-bold text-success">
                            {summary.avgApprovalTime || 'N/A'}
                          </div>
                          <div className="text-muted">Approval Time</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          <div className="fs-4 fw-bold text-warning">
                            {summary.avgPendingTime || 'N/A'}
                          </div>
                          <div className="text-muted">Pending Time</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          <div className="fs-4 fw-bold text-danger">
                            {summary.avgRejectionTime || 'N/A'}
                          </div>
                          <div className="text-muted">Rejection Time</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Performance (conditionally rendered) */}
          {summary.teamPerformance && summary.teamPerformance.length > 0 && (
            <div className="row mt-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white py-3">
                    <h4 className="mb-0">Team Performance</h4>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th scope="col">Team Member</th>
                            <th scope="col">Requests Processed</th>
                            <th scope="col">Avg. Processing Time</th>
                            <th scope="col">Approval Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.teamPerformance.map((member, index) => (
                            <tr key={index}>
                              <td>{member.name}</td>
                              <td>{member.processed}</td>
                              <td>{member.avgTime}</td>
                              <td>
                                <div className="progress" style={{ height: '20px' }}>
                                  <div 
                                    className="progress-bar" 
                                    role="progressbar" 
                                    style={{ width: `${member.approvalRate}%` }}
                                    aria-valuenow={member.approvalRate} 
                                    aria-valuemin="0" 
                                    aria-valuemax="100"
                                  >
                                    {member.approvalRate}%
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        /* Ensure external header dropdowns have the highest z-index */
        /* This targets any dropdown menu that might be in the external header */
        .navbar .dropdown-menu,
        .app-header .dropdown-menu,
        .main-header .dropdown-menu,
        .top-header .dropdown-menu,
        .header .dropdown-menu,
        .site-header .dropdown-menu,
        .page-header .dropdown-menu,
        header .dropdown-menu,
        .external-header .dropdown-menu {
          z-index: 9999 !important;
        }
        
        /* Also target any modal or overlay that might be part of the header */
        .navbar-collapse,
        .app-header .collapse,
        .main-header .collapse,
        .top-header .collapse {
          z-index: 9998 !important;
        }
      `}</style>
      
      <style jsx>{`
        .dashboard-wrapper {
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - var(--external-header-height, 0px));
        }
        
        .dashboard-header {
          position: sticky;
          top: var(--external-header-height, 0px);
          z-index: 100; /* Much lower z-index */
          background-color: #fff;
          padding: 1rem 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .dashboard-filters {
          position: sticky;
          top: calc(var(--external-header-height, 0px) + 73px);
          z-index: 90; /* Even lower z-index */
          background-color: #fff;
          padding: 1rem 0;
          border-bottom: 1px solid #e9ecef;
        }
        
        .dashboard-content {
          flex: 1;
          overflow-y: auto;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        .dashboard-content::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
        
        .hover-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        .icon-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        .display-6 {
          font-size: 2rem;
        }
        .skeleton-loader {
          padding: 1rem;
        }
        .skeleton-line {
          height: 1rem;
          margin-bottom: 0.5rem;
          border-radius: 0.25rem;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        .card:focus {
          outline: 2px solid #0d6efd;
          outline-offset: 2px;
        }
        .btn:focus {
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        @media (max-width: 768px) {
          .table-responsive {
            font-size: 0.875rem;
          }
          .badge {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
          }
          .bi {
            font-size: 0.875rem;
          }
          .chart-container {
            height: 150px !important;
          }
          .dashboard-filters {
            top: calc(var(--external-header-height, 0px) + 120px);
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;