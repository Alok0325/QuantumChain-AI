import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.div`
  width: 250px;
  background-color: #1a1a1a;
  padding: 2rem;
  box-shadow: 2px 0 5px rgba(0, 255, 0, 0.1);
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  background-color: #000000;
`;

const WelcomeMessage = styled.h1`
  color: #4CAF50;
  margin-bottom: 2rem;
`;

const NavLink = styled.button`
  display: block;
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  background: none;
  border: none;
  color: #fff;
  text-align: left;
  cursor: pointer;
  font-size: 16px;
  transition: color 0.3s;

  &:hover {
    color: #4CAF50;
  }
`;

const ChartContainer = styled.div`
  background-color: #1a1a1a;
  padding: 2rem;
  border-radius: 10px;
  margin-top: 2rem;
`;

const ChartTitle = styled.h2`
  color: #4CAF50;
  margin-bottom: 1rem;
`;

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dummy data for the chart
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'BTC Price',
        data: [30000, 35000, 32000, 38000, 36000, 40000],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#fff',
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color: '#fff',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#fff',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  return (
    <DashboardContainer>
      <Sidebar>
        <WelcomeMessage>Welcome, {user?.username}</WelcomeMessage>
        <NavLink onClick={() => navigate('/dashboard')}>Dashboard</NavLink>
        <NavLink onClick={() => navigate('/trade')}>Trade</NavLink>
        <NavLink onClick={() => navigate('/profile')}>Profile</NavLink>
        <NavLink onClick={handleLogout}>Logout</NavLink>
      </Sidebar>
      <MainContent>
        <ChartContainer>
          <ChartTitle>Market Overview</ChartTitle>
          <Line data={chartData} options={chartOptions} />
        </ChartContainer>
      </MainContent>
    </DashboardContainer>
  );
}

export default Dashboard; 