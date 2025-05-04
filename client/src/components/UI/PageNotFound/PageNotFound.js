import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './PageNotFound.css';

export const PageNotFound = ({ isAdmin = false }) => {
  const navigate = useNavigate();

  return (
    <Container fluid className="page-not-found-container min-vh-100 d-flex align-items-center">
      <Row className="w-100 justify-content-center">
        <Col xs={12} className="text-center">
          <div className="page-not-found-content">
            <h1 className="page-not-found-title display-1">404</h1>
            <h2 className="page-not-found-subtitle mb-4">Oops! Page Not Found</h2>
            <p className="page-not-found-text mb-4">
              The page you are looking for might have been removed, had its name changed,
              or is temporarily unavailable.
            </p>
            <Button 
              variant="primary" 
              className="page-not-found-button"
              onClick={() => navigate(isAdmin ? '/admin' : '/')}
            >
              Go to Homepage
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};
