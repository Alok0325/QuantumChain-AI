import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Body/Landing/Header/Header';
import Home from './components/Body/Landing/Home/Home';
import Register from './components/Body/Landing/auth/Register';
import Login from './components/Body/Landing/auth/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortfolioProvider } from './context/PortfolioContext';
import Market from './components/Body/Landing/Pages/Market/Market';
import P2P from './components/Body/Landing/Pages/P2P/P2P';
import About from './components/Body/Landing/Pages/About/About';
import SpotTrade from './components/Body/Landing/Pages/SpotTrade/SpotTrade';
import Predictions from './components/Body/Landing/Pages/Predictions/Predictions';
import Portfolio from './components/Body/Landing/Pages/Portfolio/Portfolio';
import Page from './components/Body/Landing/Pages/Page';
import PrivateRoute from './components/Body/Landing/auth/PrivateRoute';
import Profile from './components/Body/Landing/Pages/Profile/Profile';
import { BinanceProvider } from './context/BinanceContext';
import './App.css';

// Protected route wrapper component
const ProtectedPortfolio = () => {
  const { user } = useAuth();
  return user ? <Portfolio /> : <Navigate to="/login" />;
};

// Root route component that redirects based on auth state
const RootRoute = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/portfolio" /> : <Home />;
};

function App() {
  return (
    <AuthProvider>
      <BinanceProvider>
        <PortfolioProvider>
          <Router>
            <div className="app">
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<RootRoute />} />
                  <Route path="/" element={<Page />}>
                    <Route path="market" element={<Market />} />
                    <Route path="p2p" element={<P2P />} />
                    <Route path="trade" element={<SpotTrade />} />
                    <Route path="predictions" element={<Predictions />} />
                    <Route path="about" element={<About />} />
                    <Route path="portfolio" element={<ProtectedPortfolio />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Routes>
              </main>
            </div>
          </Router>
        </PortfolioProvider>
      </BinanceProvider>
    </AuthProvider>
  );
}

export default App; 