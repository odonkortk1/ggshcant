import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Home from './pages/Home';
import OrderTracking from './pages/OrderTracking';
import MenuManagement from './pages/MenuManagement';
import SalesAnalytics from './pages/SalesAnalytics';
import StaffManagement from './pages/StaffManagement';
import OrderHistory from './pages/OrderHistory';
import ClientLogin from './pages/ClientLogin';
import ClientRegister from './pages/ClientRegister';
import Login from './pages/Login';
import StaffLogin from './pages/StaffLogin';
import { ClientAuthProvider } from '@/lib/ClientAuthContext';
import { StaffAuthProvider } from '@/lib/StaffAuthContext';
import AdminRoute from '@/components/AdminRoute';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Add your page Route elements here */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/order-history" element={<OrderHistory />} />
      <Route path="/client-login" element={<ClientLogin />} />
      <Route path="/client-register" element={<ClientRegister />} />
      <Route path="/staff-login" element={<StaffLogin />} />
      <Route element={<AdminRoute />}>
        <Route path="/orders" element={<OrderTracking />} />
        <Route path="/menu-management" element={<MenuManagement />} />
        <Route path="/analytics" element={<SalesAnalytics />} />
        <Route path="/staff" element={<StaffManagement />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ClientAuthProvider>
          <StaffAuthProvider>
            <Router>
              <ScrollToTop />
              <AuthenticatedApp />
            </Router>
          </StaffAuthProvider>
        </ClientAuthProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App