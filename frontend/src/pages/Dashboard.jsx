import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { fetchDashboardData } from "../services/dashboardService";

const Dashboard = () => {
  const [summary, setSummary] = useState({});
  const [recent, setRecent] = useState([]);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    fetchDashboardData().then((res) => {
      setSummary(res.data.summary);
      setRecent(res.data.recent);
      setTrend(res.data.trend);
    });
  }, []);

  return (
    <div className="d-flex">
        <Sidebar />
    <div className="container mt-4">
      <h2>Overview</h2>
      <div className="row text-center mb-4">
        <div className="col">
          <div className="card p-3 shadow-sm">
            <i className="bi bi-clipboard-data fs-3 text-primary"></i>
            <div className="fw-bold">Total Requests</div>
            <div>{summary.total}</div>
            <div >All Gate Pass Requests</div>
          </div>
        </div>
        <div className="col">
          <div className="card p-3 shadow-sm">
            <i className="bi bi-check-circle fs-3 text-success"></i>
            <div className="fw-bold">Approved</div>
            <div>{summary.approved}</div>
            <div>Requests approved</div>
          </div>
        </div>
        <div className="col">
          <div className="card p-3 shadow-sm">
            <i className="bi bi-hourglass-split fs-3 text-warning"></i>
            <div className="fw-bold">Pending</div>
            <div>{summary.pending}</div>
            <div>Awaiting Approval</div>
          </div>
        </div>
        <div className="col">
          <div className="card p-3 shadow-sm">
            <i className="bi bi-x-circle fs-3 text-danger"></i>
            <div className="fw-bold">Rejected</div>
            <div>{summary.rejected}</div>
            <div>Requests Rejected</div>
          </div>
        </div>
      </div>

      <h4>Recent Activity</h4>
      <ul className="list-group">
        {recent.map((req) => (
          <li className="list-group-item" key={req.id}>
            #{req.id} - {req.request_type} - {req.status} -{" "}
            {new Date(req.request_date).toLocaleDateString()}
          </li>
        ))}
      </ul>

      <h4 className="mt-4">Request Trend</h4>
      <ul className="list-group">
        {trend.map((item, i) => (
          <li key={i} className="list-group-item">
            {new Date(item.date).toLocaleDateString()} - {item.count} requests
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
};

export default Dashboard;
