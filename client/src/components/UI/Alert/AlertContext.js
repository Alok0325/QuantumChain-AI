import { ErrorAlert, InfoAlert, InputAlert } from "./AlertPortal";
import React, { createContext, useState, useContext } from "react";

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    type: null, // "info", "error", or "input"
    title: "",
    description: "",
    handleSubmit: null,
    handlePostAlert: null,
  });

  const showAlert = (
    type,
    title,
    description = "",
    handleSubmit = null,
    handlePostAlert = null
  ) => {
    setAlertState({ type, title, description, handleSubmit, handlePostAlert });
  };

  const hideAlert = () => {
    if (alertState.handlePostAlert) {
      alertState.handlePostAlert();
    }
    setAlertState({
      type: null,
      title: "",
      description: "",
      handleSubmit: null,
      handlePostAlert: null,
    });
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alertState.type === "info" && (
        <InfoAlert
          title={alertState.title}
          description={alertState.description}
          hideAlert={hideAlert}
        />
      )}
      {alertState.type === "error" && (
        <ErrorAlert
          title={alertState.title}
          description={alertState.description}
          hideAlert={hideAlert}
        />
      )}
      {alertState.type === "input" && (
        <InputAlert
          title={alertState.title}
          handleSubmit={alertState.handleSubmit}
          hideAlert={hideAlert}
        />
      )}
    </AlertContext.Provider>
  );
};
