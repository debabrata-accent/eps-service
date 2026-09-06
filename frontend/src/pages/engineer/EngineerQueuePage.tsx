import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, MapPin, Phone, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { ticketService } from '../../services/ticket.service';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/format';
import { useNavigate } from 'react-router-dom';

export const EngineerQueuePage = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['engineer-queue'],
    queryFn: () => ticketService.getQueue(),
    refetchInterval: 15000, // auto-refresh every 15s
  });

  const assignMutation = useMutation({
    mutationFn: (ticketId: string) => ticketService.selfAssign(ticketId),
    onMutate: (ticketId) => setClaimingId(ticketId),
    onSuccess: (ticket) => {
      toast.success(`Ticket ${ticket.ticketNumber} assigned to you!`);
      qc.invalidateQueries({ queryKey: ['engineer-queue'] });
      qc.invalidateQueries({ queryKey: ['my-assigned'] });
      navigate(`/my-jobs/${ticket._id}`);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      const msg = err.response?.data?.message || 'Failed to claim ticket';
      if (err.response?.status === 409) {
        toast.error('This job was just claimed by another engineer.');
        refetch();
      } else {
        toast.error(msg);
      }
    },
    onSettled: () => setClaimingId(null),
  });

  if (isLoading) return <PageLoader />;

  const tickets = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Queue</h1>
          <p className="text-sm text-gray-500 mt-1">Available jobs — first come, first served</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-full font-medium">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
          <button onClick={() => refetch()} className="btn-secondary text-sm">
            Refresh
          </button>
        </div>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No jobs available right now"
          description="New approved jobs will appear here automatically. This page refreshes every 15 seconds."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map((ticket) => (
            <div key={ticket._id} className="card p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{ticket.ticketNumber}</p>
                  <p className="text-sm text-gray-600 truncate">{ticket.issueTitle}</p>
                </div>
                <StatusBadge status={ticket.priority} type="priority" />
              </div>

              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-gray-900">{ticket.companyName}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{ticket.siteAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span>{ticket.phone}</span>
                </div>
                {ticket.preferredVisitDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span>Preferred: {formatDate(ticket.preferredVisitDate)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => assignMutation.mutate(ticket._id)}
                  disabled={claimingId !== null}
                  className="btn-primary flex-1"
                >
                  {claimingId === ticket._id ? 'Claiming...' : 'Claim This Job'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.pagination.total > tickets.length && (
        <p className="text-sm text-center text-gray-500">
          Showing {tickets.length} of {data.pagination.total} jobs
        </p>
      )}
    </div>
  );
};
