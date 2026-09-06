import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusCircle, FileText } from 'lucide-react';
import { ticketService } from '../../services/ticket.service';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatDate, formatStatus } from '../../utils/format';
import { TicketStatus } from '../../../../shared/src/enums';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  ...Object.values(TicketStatus).map((s) => ({ value: s, label: formatStatus(s) })),
];

export const TicketListPage = () => {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-tickets', status, page],
    queryFn: () => ticketService.getMyTickets({ status, page: String(page), limit: '15' }),
  });

  if (isLoading) return <PageLoader />;

  const tickets = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Track your service requests</p>
        </div>
        <Link to="/tickets/new" className="btn-primary flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">New Ticket</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3 flex-wrap">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input max-w-xs"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table / List */}
      {tickets.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No tickets yet"
          description="Create your first service ticket to get started."
          action={
            <Link to="/tickets/new" className="btn-primary">
              Create Ticket
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ticket #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Issue</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/tickets/${ticket._id}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {ticket.ticketNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div>
                        <p className="font-medium text-gray-900 truncate max-w-xs">{ticket.issueTitle}</p>
                        <p className="text-gray-500 text-xs">{ticket.companyName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatusBadge status={ticket.priority} type="priority" />
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {formatDate(ticket.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {pagination.total} total tickets
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700 px-2 py-1.5">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
