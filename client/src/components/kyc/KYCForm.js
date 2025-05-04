import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const KYCContainer = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #1a1a1a;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.1);
`;

const Title = styled.h1`
  color: #4CAF50;
  text-align: center;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
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
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  &:hover {
    background-color: #45a049;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  text-align: center;
  margin-top: 1rem;
`;

const SuccessMessage = styled.div`
  color: #4CAF50;
  text-align: center;
  margin-top: 1rem;
`;

const FileInput = styled.div`
  input[type="file"] {
    display: none;
  }
  label {
    display: block;
    padding: 12px;
    background-color: #2a2a2a;
    border: 1px solid #333;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;
    text-align: center;
    &:hover {
      border-color: #4CAF50;
    }
  }
`;

function KYCForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    address: '',
  });
  const [idProof, setIdProof] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdProof(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('userId', user.id);
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      formDataToSend.append('address', formData.address);
      if (idProof) {
        formDataToSend.append('idProof', idProof);
      }

      await axios.post('http://localhost:5000/api/kyc/submit', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('KYC submitted successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error submitting KYC');
    }
  };

  return (
    <KYCContainer>
      <Title>KYC Verification</Title>
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleInputChange}
          required
        />
        <Input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleInputChange}
          required
        />
        <Input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleInputChange}
          required
        />
        <FileInput>
          <label>
            {idProof ? idProof.name : 'Upload ID Proof'}
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              required
            />
          </label>
        </FileInput>
        <Button type="submit">Submit KYC</Button>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </Form>
    </KYCContainer>
  );
}

export default KYCForm; 