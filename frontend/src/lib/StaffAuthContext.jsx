import React, { createContext, useContext, useState, useEffect } from "react";

const StaffAuthContext = createContext(null);

export function StaffAuthProvider({ children }) {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("staff_auth");
    if (stored) {
      try {
        setStaff(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const loginStaff = (staffData) => {
    setStaff(staffData);
    localStorage.setItem("staff_auth", JSON.stringify(staffData));
  };

  const logoutStaff = () => {
    setStaff(null);
    localStorage.removeItem("staff_auth");
  };

  return (
    <StaffAuthContext.Provider value={{ staff, loading, loginStaff, logoutStaff }}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error("useStaffAuth must be used within StaffAuthProvider");
  return ctx;
}