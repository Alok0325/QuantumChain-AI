import React from "react";
import { Modal, Button } from "react-bootstrap";
import "./Error.css"; // Import your custom styles

export const ErrorAlertModal = ({ show, handleClose, title, description }) => {
  return (
    <Modal
      show={show}
      onHide={handleClose}
      className="error-alert-modal"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title className="error-alert-title">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="error-alert-description">{description}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

