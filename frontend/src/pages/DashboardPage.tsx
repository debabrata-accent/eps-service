import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Role } from '../../../shared/src/enums';
import { EngineerDashboardPage } from './engineer/EngineerDashboardPage';

// Role-aware dashboard.
// - Engineer: shows a real dashboard (overview, quick links, active jobs).
// - Factory Owner / Customer Executive: redirect to their primary landing page.
export const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role as Role) {
    case Role.ENGINEER:
      return <EngineerDashboardPage />;
    case Role.FACTORY_OWNER:
      return <Navigate to="/tickets" replace />;
    case Role.CUSTOMER_EXECUTIVE:
      return <Navigate to="/admin/tickets" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};
