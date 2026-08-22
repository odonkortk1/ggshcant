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

  if (!staff) {
    return <Navigate to="/staff-login" replace />;
  }

  return <Outlet />;
}
