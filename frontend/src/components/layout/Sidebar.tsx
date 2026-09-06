import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, FileText, ClipboardList, Users,
  CreditCard, BarChart2, Briefcase, List, Zap, X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Role } from '../../../../shared/src/enums';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems: Record<Role, Array<{ to: string; label: string; icon: React.ElementType }>> = {
  [Role.FACTORY_OWNER]: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tickets/new', label: 'New Ticket', icon: PlusCircle },
    { to: '/tickets', label: 'My Tickets', icon: FileText },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
  ],
  [Role.ENGINEER]: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/queue', label: 'Job Queue', icon: List },
    { to: '/my-jobs', label: 'My Jobs', icon: Briefcase },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
  ],
  [Role.CUSTOMER_EXECUTIVE]: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/tickets', label: 'All Tickets', icon: ClipboardList },
    { to: '/admin/payments', label: 'Payments', icon: CreditCard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/reports', label: 'Reports', icon: BarChart2 },
  ],
};

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const user = useAuthStore((s) => s.user);
  const items = user ? navItems[user.role as Role] ?? [] : [];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-40 flex flex-col transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-400" />
            <span className="font-bold text-lg tracking-tight">EPS Service</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }: { isActive: boolean }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        {user && (
          <div className="px-4 py-4 border-t border-gray-700">
            <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
            <p className="text-xs text-gray-400 capitalize mt-0.5">
              {user.role.replace(/_/g, ' ')}
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
