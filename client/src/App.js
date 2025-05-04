import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import KYCForm from './components/kyc/KYCForm';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #000000;
  color: #ffffff;
`;

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContainer>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/kyc"
              element={
                <PrivateRoute>
                  <KYCForm />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </AppContainer>
      </Router>
    </AuthProvider>
  );
}

export default App; 