import React, { createContext, useContext, useState, useEffect } from "react";

const StaffAuthContext = createContext(null);

export function StaffAuthProvider({ children }) {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("staff_auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStaff(parsed?.staff ? { ...parsed.staff, token: parsed.token } : parsed);
      } catch {}
    }
    setLoading(false);
  }, []);

  const loginStaff = (staffData) => {
    const normalized = staffData?.staff ? { ...staffData.staff, token: staffData.token } : staffData;
    setStaff(normalized);
    localStorage.setItem("staff_auth", JSON.stringify(normalized));
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