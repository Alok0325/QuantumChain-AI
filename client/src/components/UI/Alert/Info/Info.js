import React from "react";
import { Modal, Button } from "react-bootstrap";
import "./Info.css"; // Import your custom styles

export const InfoAlertModal = ({ show, handleClose, title, description }) => {
  return (
    <Modal
      show={show}
      onHide={handleClose}
      className="info-alert-modal"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title className="info-alert-title">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="info-alert-description">{description}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
};


