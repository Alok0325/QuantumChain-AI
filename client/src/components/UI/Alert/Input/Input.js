import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import "./Input.css"; // Import your custom styles

export const InputAlertModal = ({ show, handleClose, handleSubmit, title }) => {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const onSubmit = () => {
    handleSubmit(inputValue);
    setInputValue(""); // Clear the input field
    handleClose(); // Close the modal
  };

  const onCancel = () => {
    setInputValue(""); // Reset the input field
    handleClose(); // Close the modal
  };

  return (
    <Modal
      show={show}
      onHide={onCancel}
      className="input-alert-modal"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title className="input-alert-title">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="formInputField">
            <Form.Label className="input-alert-label">Enter Value:</Form.Label>
            <Form.Control
              type="text"
              placeholder="Type something..."
              value={inputValue}
              onChange={handleInputChange}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSubmit}>
          Submit
        </Button>
      </Modal.Footer>
    </Modal>
  );
};


