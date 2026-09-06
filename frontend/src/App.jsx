import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';

import Home from './pages/Home';
import OrderTracking from './pages/OrderTracking';
import MenuManagement from './pages/MenuManagement';
import SalesAnalytics from './pages/SalesAnalytics';
import StaffManagement from './pages/StaffManagement';
import OrderHistory from './pages/OrderHistory';
import ClientLogin from './pages/ClientLogin';
import ClientRegister from './pages/ClientRegister';
import StaffLogin from './pages/StaffLogin';

import { ClientAuthProvider } from '@/lib/ClientAuthContext';
import { StaffAuthProvider } from '@/lib/StaffAuthContext';
import AdminRoute from '@/components/AdminRoute';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <ClientAuthProvider>
        <StaffAuthProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/order-history" element={<OrderHistory />} />
              <Route path="/client-login" element={<ClientLogin />} />
              <Route path="/client-register" element={<ClientRegister />} />
              <Route path="/staff-login" element={<StaffLogin />} />
              <Route element={<AdminRoute />}>
                <Route path="/orders" element={<OrderTracking />} />
              </Route>
              <Route element={<AdminRoute />}>
                <Route path="/menu-management" element={<MenuManagement />} />
                <Route path="/analytics" element={<SalesAnalytics />} />
              </Route>
              <Route element={<AdminRoute requireAdmin />}>
                <Route path="/staff" element={<StaffManagement />} />
              </Route>
              <Route path="*" element={<PageNotFound />} />
            </Routes>
            <Footer />
          </Router>
        </StaffAuthProvider>
      </ClientAuthProvider>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
