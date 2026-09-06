import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { paymentService } from '../../services/payment.service';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { cn } from '../../utils/cn';

const STATUS_COLORS: Record<string, string> = {
  created: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export const PaymentMonitoringPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', statusFilter, page],
    queryFn: () => paymentService.listAll({ status: statusFilter, page: String(page), limit: '20' }),
  });

  if (isLoading) return <PageLoader />;

  const payments = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Monitoring</h1>
        <p className="text-sm text-gray-500 mt-1">Track all advance payments</p>
      </div>

      <div className="card p-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input max-w-[160px]"
        >
          <option value="">All Statuses</option>
          <option value="created">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ticket</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Paid At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment: any) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/tickets/${payment.ticketId?._id ?? payment.ticketId}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {payment.ticketId?.ticketNumber ?? '—'}
                      </Link>
                      <p className="text-xs text-gray-500">{payment.ticketId?.issueTitle ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-gray-900">{payment.ownerId?.fullName ?? '—'}</p>
                      <p className="text-xs text-gray-500">{payment.ownerId?.companyName ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{formatCurrency(payment.advanceAmount)}</p>
                      <p className="text-xs text-gray-500">of {formatCurrency(payment.totalAmount)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_COLORS[payment.status] ?? 'bg-gray-100 text-gray-700')}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {payment.paidAt ? formatDateTime(payment.paidAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">{pagination.total} total</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5">Prev</button>
                <span className="text-sm px-2 py-1.5">{page}/{pagination.totalPages}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages} className="btn-secondary text-xs px-3 py-1.5">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
