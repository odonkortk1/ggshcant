import { Outlet, Navigate } from 'react-router-dom';
import { useStaffAuth } from '@/lib/StaffAuthContext';

export default function AdminRoute() {
  const { staff, loading } = useStaffAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not logged in at all, redirect to login
  if (!staff) {
    return <Navigate to="/staff-login" replace />;
  }

  // If logged in but NOT an admin, redirect them away (e.g., back to /orders)
  if (staff.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/orders" replace />;
  }

  return <Outlet />;
}