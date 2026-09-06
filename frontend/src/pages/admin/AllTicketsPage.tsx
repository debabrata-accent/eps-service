import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { ticketService } from '../../services/ticket.service';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatDate, formatStatus } from '../../utils/format';
import { TicketStatus, Priority } from '../../../../shared/src/enums';

export const AllTicketsPage = () => {
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['all-tickets', status, priority, page],
    queryFn: () =>
      ticketService.getAll({ status, priority, page: String(page), limit: '20' }),
  });

  if (isLoading) return <PageLoader />;

  const tickets = data?.data ?? [];
  const pagination = data?.pagination;

  const filtered = search
    ? tickets.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
          t.issueTitle.toLowerCase().includes(search.toLowerCase()) ||
          t.companyName.toLowerCase().includes(search.toLowerCase())
      )
    : tickets;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Tickets</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all customer service requests</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search ticket, issue, company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input max-w-xs"
        >
          <option value="">All Statuses</option>
          {Object.values(TicketStatus).map((s) => (
            <option key={s} value={s}>{formatStatus(s)}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value); setPage(1); }}
          className="input max-w-[160px]"
        >
          <option value="">All Priorities</option>
          {Object.values(Priority).map((p) => (
            <option key={p} value={p}>{formatStatus(p)}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No tickets found" description="Adjust your filters." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ticket #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Issue</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Engineer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/tickets/${ticket._id}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {ticket.ticketNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="font-medium text-gray-900">{ticket.companyName}</p>
                      <p className="text-xs text-gray-500">{(ticket.owner as any)?.fullName}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-700 max-w-xs truncate">
                      {ticket.issueTitle}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatusBadge status={ticket.priority} type="priority" />
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-gray-600 text-xs">
                      {(ticket.assignedEngineer as any)?.fullName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {formatDate(ticket.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">{pagination.total} total</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5">Prev</button>
                <span className="text-sm text-gray-700 px-2 py-1.5">{page}/{pagination.totalPages}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages} className="btn-secondary text-xs px-3 py-1.5">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
