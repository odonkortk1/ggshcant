import React, { createContext, useContext, useState, useEffect } from "react";

const ClientAuthContext = createContext(null);

export function ClientAuthProvider({ children }) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("client_auth");
    if (stored) {
      try {
        setClient(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const loginClient = (clientData) => {
    setClient(clientData);
    localStorage.setItem("client_auth", JSON.stringify(clientData));
  };

  const logoutClient = () => {
    setClient(null);
    localStorage.removeItem("client_auth");
  };

  return (
    <ClientAuthContext.Provider value={{ client, loading, loginClient, logoutClient }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext);
  if (!ctx) throw new Error("useClientAuth must be used within ClientAuthProvider");
  return ctx;
}