import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./AlertPortal.css"; // Add styles for your alert and background blur
import {  InfoAlertModal } from "./Info/Info";
import { ErrorAlertModal } from "./Error/Error";
import { InputAlertModal } from "./Input/Input";

export const BackgroundPortal = ({ onClose }) => {
  return ReactDOM.createPortal(
    <div className="background-portal" onClick={onClose}></div>,
    document.getElementById("background-portal-root")
  );
};

export const AlertPortal = (props) => {
  return ReactDOM.createPortal(
    <div className="alert-portal">{props.children}</div>,
    document.getElementById("alert-portal-root")
  );
};

export const InfoAlert = ({ title,description ,hideAlert}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false)
    hideAlert();
  }

  return (
    <>
      {isVisible && <BackgroundPortal onClose={handleClose} />}
      {isVisible && (
        <AlertPortal>
          <InfoAlertModal
            show={isVisible}
            handleClose={handleClose}
            title={title}
            description={description}
          />
        </AlertPortal>
      )}
    </>
  );
};

export const ErrorAlert = ({ title,description ,hideAlert}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false)
    hideAlert();
  }

  return (
    <>
      {isVisible && <BackgroundPortal onClose={handleClose} />}
      {isVisible && (
        <AlertPortal>
          <ErrorAlertModal
            show={isVisible}
            handleClose={handleClose}
            title={title}
            description={description}
          />
        </AlertPortal>
      )}
    </>
  );
};

export const InputAlert = ({ title,handleSubmit ,hideAlert}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false)
    hideAlert();
  }

  
  return (
    <>
      {isVisible && <BackgroundPortal onClose={handleClose} />}
      {isVisible && (
        <AlertPortal>
          <InputAlertModal
            show={isVisible}
            handleClose={handleClose}
            title={title}
            handleSubmit={handleSubmit}
            
          />
        </AlertPortal>
      )}
    </>
  );
};
