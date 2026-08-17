import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useStaffAuth } from '@/lib/StaffAuthContext';

export default function AdminRoute() {
  const { isAuthenticated, isLoadingAuth, authChecked, checkUserAuth, user } = useAuth();
  const { staff, loading: staffLoading } = useStaffAuth();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked || staffLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Allow Base44 admin (owner) OR custom staff auth
  const isBase44Admin = isAuthenticated && user?.role === 'admin';
  const isStaff = !!staff;

  if (!isBase44Admin && !isStaff) {
    return <Navigate to="/staff-login" replace />;
  }

  return <Outlet />;
}