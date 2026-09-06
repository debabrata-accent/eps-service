import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Role } from '../../../shared/src/enums';

// Dashboard simply redirects to the appropriate first page for each role
export const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    switch (user.role as Role) {
      case Role.FACTORY_OWNER:
        navigate('/tickets', { replace: true });
        break;
      case Role.ENGINEER:
        navigate('/queue', { replace: true });
        break;
      case Role.CUSTOMER_EXECUTIVE:
        navigate('/admin/tickets', { replace: true });
        break;
    }
  }, [user, navigate]);

  return null;
};
