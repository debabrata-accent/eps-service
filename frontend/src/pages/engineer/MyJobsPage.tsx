import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { ticketService } from '../../services/ticket.service';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/format';
import { TicketStatus } from '../../../../shared/src/enums';

type Tab = 'active' | 'completed';

const ACTIVE_STATUSES = [
  TicketStatus.ASSIGNED,
  TicketStatus.OPEN_FOR_ASSIGNMENT,
].join(',');

export const MyJobsPage = () => {
  const [tab, setTab] = useState<Tab>('active');

  const { data, isLoading } = useQuery({
    queryKey: ['my-assigned', tab],
    queryFn: () =>
      ticketService.getMyAssigned({
        status: tab === 'completed' ? TicketStatus.COMPLETED : '',
        limit: '30',
      }),
  });

  const tickets = data?.data ?? [];

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
        <p className="text-sm text-gray-500 mt-1">Your assigned service tickets</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['active', 'completed'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={tab === 'active' ? 'No active jobs' : 'No completed jobs'}
          description={
            tab === 'active'
              ? 'Claim jobs from the queue to see them here.'
              : 'Completed jobs will appear here.'
          }
          action={
            tab === 'active' ? (
              <Link to="/queue" className="btn-primary">
                Go to Queue
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ticket #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Work Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/my-jobs/${ticket._id}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {ticket.ticketNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-700">
                      {ticket.companyName}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={ticket.engineerStatus ?? ticket.status}
                        type={ticket.engineerStatus ? 'engineer' : 'ticket'}
                      />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatusBadge status={ticket.priority} type="priority" />
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {ticket.assignedAt ? formatDate(ticket.assignedAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
