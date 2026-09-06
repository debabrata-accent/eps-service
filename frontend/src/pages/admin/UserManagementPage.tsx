import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../../services/user.service';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate, formatStatus } from '../../utils/format';
import { Role } from '../../../../shared/src/enums';
import { cn } from '../../utils/cn';

export const UserManagementPage = () => {
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [disableTarget, setDisableTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', roleFilter, activeFilter],
    queryFn: () =>
      userService.list({
        role: roleFilter,
        isActive: activeFilter,
        limit: '50',
      }),
  });

  const disableMutation = useMutation({
    mutationFn: (id: string) => userService.disable(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User disabled');
      setDisableTarget(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  if (isLoading) return <PageLoader />;

  const users = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all platform users</p>
        </div>
        <Link to="/admin/users/new" className="btn-primary flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Add User</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input max-w-[180px]"
        >
          <option value="">All Roles</option>
          {Object.values(Role).map((r) => (
            <option key={r} value={r}>{formatStatus(r)}</option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="input max-w-[160px]"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </select>
      </div>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Username</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Created</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{user.fullName}</p>
                      <p className="text-xs text-gray-500">{user.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{user.username}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {formatStatus(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/users/${user._id}`}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          Edit
                        </Link>
                        {user.isActive && (
                          <button
                            onClick={() => setDisableTarget({ id: user._id, name: user.fullName })}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Disable
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!disableTarget}
        onOpenChange={(open) => { if (!open) setDisableTarget(null); }}
        title="Disable User?"
        description={`Disable ${disableTarget?.name}? They will no longer be able to log in.`}
        confirmLabel="Disable"
        variant="danger"
        onConfirm={() => disableMutation.mutate(disableTarget!.id)}
        loading={disableMutation.isPending}
      />
    </div>
  );
};
