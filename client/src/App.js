import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Body/Landing/Header/Header';
import Home from './components/Body/Landing/Home/Home';
import Register from './components/Body/Landing/auth/Register';
import Login from './components/Body/Landing/auth/Login';
import { AuthProvider } from './context/AuthContext';
import Market from './components/Body/Landing/Pages/Market/Market';
import P2P from './components/Body/Landing/Pages/P2P/P2P';
import About from './components/Body/Landing/Pages/About/About';
import SpotTrade from './components/Body/Landing/Pages/SpotTrade/SpotTrade';
import Predictions from './components/Body/Landing/Pages/Predictions/Predictions';
import Page from './components/Body/Landing/Pages/Page';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/" element={<Page />}>
                <Route path="market" element={<Market />} />
                <Route path="p2p" element={<P2P />} />
                <Route path="trade" element={<SpotTrade />} />
                <Route path="predictions" element={<Predictions />} />
                <Route path="about" element={<About />} />
              </Route>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 