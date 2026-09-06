import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Role } from '../../shared/src/enums';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

// Factory Owner
import { TicketListPage } from './pages/owner/TicketListPage';
import { CreateTicketPage } from './pages/owner/CreateTicketPage';
import { TicketDetailPage } from './pages/owner/TicketDetailPage';
import { PaymentPage } from './pages/owner/PaymentPage';
import { OwnerReportsPage } from './pages/owner/OwnerReportsPage';

// Engineer
import { EngineerQueuePage } from './pages/engineer/EngineerQueuePage';
import { MyJobsPage } from './pages/engineer/MyJobsPage';
import { JobDetailPage } from './pages/engineer/JobDetailPage';
import { EngineerReportsPage } from './pages/engineer/EngineerReportsPage';

// Customer Executive
import { AllTicketsPage } from './pages/admin/AllTicketsPage';
import { AdminTicketDetailPage } from './pages/admin/AdminTicketDetailPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { CreateEditUserPage } from './pages/admin/CreateEditUserPage';
import { PaymentMonitoringPage } from './pages/admin/PaymentMonitoringPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected — all roles */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Factory Owner */}
            <Route element={<ProtectedRoute allowedRoles={[Role.FACTORY_OWNER]} />}>
              <Route path="/tickets" element={<TicketListPage />} />
              <Route path="/tickets/new" element={<CreateTicketPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
              <Route path="/tickets/:id/payment" element={<PaymentPage />} />
              <Route path="/reports" element={<OwnerReportsPage />} />
            </Route>

            {/* Engineer */}
            <Route element={<ProtectedRoute allowedRoles={[Role.ENGINEER]} />}>
              <Route path="/queue" element={<EngineerQueuePage />} />
              <Route path="/my-jobs" element={<MyJobsPage />} />
              <Route path="/my-jobs/:id" element={<JobDetailPage />} />
              <Route path="/reports" element={<EngineerReportsPage />} />
            </Route>

            {/* Customer Executive */}
            <Route element={<ProtectedRoute allowedRoles={[Role.CUSTOMER_EXECUTIVE]} />}>
              <Route path="/admin/tickets" element={<AllTicketsPage />} />
              <Route path="/admin/tickets/:id" element={<AdminTicketDetailPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/users/new" element={<CreateEditUserPage />} />
              <Route path="/admin/users/:id" element={<CreateEditUserPage />} />
              <Route path="/admin/payments" element={<PaymentMonitoringPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
            </Route>
          </Route>
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>

    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: { fontSize: '14px', borderRadius: '10px' },
      }}
    />
  </QueryClientProvider>
);

export default App;
