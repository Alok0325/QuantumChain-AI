import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardOverview = ({ stats }) => {
  // Dummy data for charts
  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Users',
        data: [1234, 2345, 3456, 2789, 4567, 5678],
        fill: true,
        borderColor: '#00ffff',
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
        tension: 0.4
      }
    ]
  };

  const tradingVolumeData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Trading Volume (USD)',
        data: [2500000, 3200000, 2800000, 4100000, 3800000, 4500000],
        backgroundColor: 'rgba(0, 255, 0, 0.6)'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#fff'
        }
      }
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#fff'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#fff'
        }
      }
    }
  };

  return (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p>{stats.totalUsers.toLocaleString()}</p>
            <span className="stat-change positive">
              <i className="fas fa-arrow-up"></i> 12.5%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-user-check"></i>
          </div>
          <div className="stat-info">
            <h3>Active Users</h3>
            <p>{stats.activeUsers.toLocaleString()}</p>
            <span className="stat-change positive">
              <i className="fas fa-arrow-up"></i> 8.3%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <h3>Pending KYC</h3>
            <p>{stats.pendingKYC.toLocaleString()}</p>
            <span className="stat-change negative">
              <i className="fas fa-arrow-down"></i> 5.2%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <div className="stat-info">
            <h3>Total Transactions</h3>
            <p>{stats.totalTransactions.toLocaleString()}</p>
            <span className="stat-change positive">
              <i className="fas fa-arrow-up"></i> 15.7%
            </span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>User Growth</h3>
          <div className="chart-container">
            <Line data={userGrowthData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Trading Volume</h3>
          <div className="chart-container">
            <Bar data={tradingVolumeData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {[
            {
              type: 'kyc',
              user: 'John Doe',
              action: 'submitted KYC documents',
              time: '5 minutes ago'
            },
            {
              type: 'transaction',
              user: 'Alice Smith',
              action: 'made a large BTC transaction',
              time: '15 minutes ago'
            },
            {
              type: 'user',
              user: 'Bob Wilson',
              action: 'registered a new account',
              time: '30 minutes ago'
            },
            {
              type: 'alert',
              user: 'System',
              action: 'detected unusual trading activity',
              time: '1 hour ago'
            }
          ].map((activity, index) => (
            <div key={index} className="activity-item">
              <div className={`activity-icon ${activity.type}`}>
                <i className={`fas fa-${
                  activity.type === 'kyc' ? 'id-card' :
                  activity.type === 'transaction' ? 'exchange-alt' :
                  activity.type === 'user' ? 'user-plus' :
                  'exclamation-triangle'
                }`}></i>
              </div>
              <div className="activity-details">
                <p>
                  <strong>{activity.user}</strong> {activity.action}
                </p>
                <span>{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview; 