import React from 'react';
import './About.css';

const About = () => {
  const features = [
    {
      title: 'Quantum-Powered Trading',
      description: 'Leveraging quantum computing algorithms to analyze market patterns and execute trades with unprecedented speed and accuracy.',
      icon: '⚛️'
    },
    {
      title: 'AI Predictions',
      description: 'Advanced machine learning models that predict market movements and provide actionable insights for traders.',
      icon: '🤖'
    },
    {
      title: 'Secure P2P Trading',
      description: 'Decentralized peer-to-peer trading platform with advanced security measures and escrow protection.',
      icon: '🔒'
    },
    {
      title: 'Real-time Analytics',
      description: 'Comprehensive market analysis tools with real-time data visualization and technical indicators.',
      icon: '📊'
    }
  ];

  const team = [
    {
      name: 'Dr. Sarah Chen',
      role: 'Chief Quantum Scientist',
      bio: 'PhD in Quantum Computing with 15+ years of experience in quantum algorithms and financial modeling.',
      image: 'https://randomuser.me/api/portraits/women/1.jpg'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Head of AI Development',
      bio: 'Expert in machine learning and neural networks, specializing in financial market prediction.',
      image: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    {
      name: 'Dr. James Wilson',
      role: 'Blockchain Architect',
      bio: 'Blockchain pioneer with extensive experience in developing secure trading platforms.',
      image: 'https://randomuser.me/api/portraits/men/2.jpg'
    }
  ];

  return (
    <div className="about-container">
      <section className="about-hero">
        <h1>Revolutionizing Crypto Trading with Quantum Technology</h1>
        <p className="hero-subtitle">
          QuantumChain AI combines the power of quantum computing, artificial intelligence, and blockchain technology
          to create the next generation of cryptocurrency trading platforms.
        </p>
      </section>

      <section className="about-mission">
        <h2>Our Mission</h2>
        <p>
          At QuantumChain AI, we're dedicated to revolutionizing the cryptocurrency trading landscape by
          harnessing the power of quantum computing and artificial intelligence. Our platform provides
          traders with unprecedented speed, accuracy, and security in their trading operations.
        </p>
      </section>

      <section className="about-features">
        <h2>Key Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-technology">
        <h2>Our Technology</h2>
        <div className="tech-stack">
          <div className="tech-item">
            <h3>Quantum Computing</h3>
            <p>
              Our proprietary quantum algorithms process market data at speeds impossible for classical computers,
              enabling real-time analysis of complex market patterns.
            </p>
          </div>
          <div className="tech-item">
            <h3>Artificial Intelligence</h3>
            <p>
              Advanced machine learning models continuously learn from market data to provide accurate
              predictions and trading signals.
            </p>
          </div>
          <div className="tech-item">
            <h3>Blockchain Security</h3>
            <p>
              State-of-the-art security measures ensure safe and transparent trading operations
              for all platform users.
            </p>
          </div>
        </div>
      </section>

      <section className="about-team">
        <h2>Our Team</h2>
        <div className="team-grid">
          {team.map((member, index) => (
            <div key={index} className="team-card">
              <div className="team-image">
                <img src={member.image} alt={member.name} />
              </div>
              <h3>{member.name}</h3>
              <span className="team-role">{member.role}</span>
              <p>{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-cta">
        <h2>Join the Quantum Revolution</h2>
        <p>
          Experience the future of cryptocurrency trading with QuantumChain AI.
          Start your journey today and be part of the quantum trading revolution.
        </p>
        <div className="cta-buttons">
          <button className="cta-button primary">Get Started</button>
          <button className="cta-button secondary">Learn More</button>
        </div>
      </section>
    </div>
  );
};

export default About; 