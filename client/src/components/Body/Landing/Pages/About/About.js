import React, { useState } from 'react';
import './About.css';

const CareerFormModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    experience: '',
    resume: null,
    coverLetter: ''
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="career-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Join Our Team</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="position">Desired Position</label>
            <select
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
            >
              <option value="">Select a position</option>
              <option value="frontend">Frontend Developer</option>
              <option value="backend">Backend Developer</option>
              <option value="fullstack">Full Stack Developer</option>
              <option value="ui-ux">UI/UX Designer</option>
              <option value="blockchain">Blockchain Developer</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="experience">Years of Experience</label>
            <input
              type="number"
              id="experience"
              name="experience"
              min="0"
              max="50"
              value={formData.experience}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="resume">Resume (PDF)</label>
            <input
              type="file"
              id="resume"
              name="resume"
              accept=".pdf"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="coverLetter">Cover Letter</label>
            <textarea
              id="coverLetter"
              name="coverLetter"
              value={formData.coverLetter}
              onChange={handleChange}
              rows="4"
              required
            ></textarea>
          </div>
          <button type="submit" className="submit-button">Submit Application</button>
        </form>
      </div>
    </div>
  );
};

const About = () => {
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
  
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
      name: 'Alok Prajapati',
      role: 'Team Leader',
      bio: 'Full Stack Developer and AI Specialist with expertise in building scalable applications and implementing AI solutions. Leading the team in developing innovative blockchain and AI-powered features.',
      image: '/images/team/Alok.jpeg'
    },
    {
      name: 'Saurabh Shukla',
      role: 'Database Specialist',
      bio: 'Expert in database architecture and optimization, ensuring robust and efficient data management for the platform. Specializes in blockchain data structures and distributed systems.',
      image: '/images/team/Saurabh.jpeg'
    },
    {
      name: 'Abhishek Kumar',
      role: 'Frontend Developer',
      bio: 'Skilled Frontend Developer with focus on creating intuitive and responsive user interfaces. Expertise in modern JavaScript frameworks and UI/UX best practices.',
      image: '/images/team/Abhi.jpeg'
    },
    {
      name: 'Abhishek Kumar Maurya',
      role: 'UI/UX Developer',
      bio: 'Creative UI/UX Developer dedicated to crafting beautiful and user-friendly interfaces. Specializes in modern design patterns and interactive user experiences.',
      image: '/images/team/Maurya.jpeg'
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
        <h2>Meet Our Team</h2>
        <p className="team-intro">
          Our talented team of developers and specialists work together to bring you the most advanced
          crypto trading platform.
        </p>
        <div className="team-grid">
          {team.map((member, index) => (
            <div key={index} className="team-card">
              <div className="team-image">
                <img src={member.image} alt={member.name} />
              </div>
              <h3>{member.name}</h3>
              <span className="team-role">{member.role}</span>
              <p>{member.bio}</p>
              <div className="team-social">
                <a href="#" className="social-link github" title="GitHub">
                  <i className="fab fa-github"></i>
                </a>
                <a href="#" className="social-link linkedin" title="LinkedIn">
                  <i className="fab fa-linkedin"></i>
                </a>
              </div>
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
          <button 
            className="cta-button primary"
            onClick={() => setIsCareerModalOpen(true)}
          >
            Get Started
          </button>
          <button className="cta-button secondary">Learn More</button>
        </div>
      </section>

      <CareerFormModal 
        isOpen={isCareerModalOpen} 
        onClose={() => setIsCareerModalOpen(false)} 
      />
    </div>
  );
};

export default About; 