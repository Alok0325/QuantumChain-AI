import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
`;

const LoginForm = styled.form`
  background-color: #1a1a1a;
  padding: 2rem;
  border-radius: 10px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.1);
`;

const Title = styled.h1`
  color: #4CAF50;
  text-align: center;
  margin-bottom: 2rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  border: 1px solid #333;
  border-radius: 4px;
  background-color: #2a2a2a;
  color: #fff;
  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 1rem;
  &:hover {
    background-color: #45a049;
  }
`;

const RegisterLink = styled(Link)`
  display: block;
  text-align: center;
  margin-top: 1rem;
  color: #4CAF50;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  text-align: center;
  margin-top: 1rem;
`;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <Title>Login to QuantumChain</Title>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit">Login</Button>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <RegisterLink to="/register">
          Don't have an account? Register here
        </RegisterLink>
      </LoginForm>
    </LoginContainer>
  );
}

export default Login; 