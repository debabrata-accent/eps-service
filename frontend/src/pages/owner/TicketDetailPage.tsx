import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, CreditCard, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketService } from '../../services/ticket.service';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TicketTimeline } from '../../components/shared/TicketTimeline';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate, formatCurrency } from '../../utils/format';
import { TicketStatus } from '../../../../shared/src/enums';
import { useAuthStore } from '../../store/authStore';
import { Role } from '../../../../shared/src/enums';

export const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketService.getById(id!),
    enabled: !!id,
  });

  const { data: history } = useQuery({
    queryKey: ['ticket-history', id],
    queryFn: () => ticketService.getHistory(id!),
    enabled: !!id,
  });

  const approveQuoteMutation = useMutation({
    mutationFn: () => ticketService.approveQuote(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      toast.success('Quote approved. Please complete payment.');
      navigate(`/tickets/${id}/payment`);
    },
    onError: () => toast.error('Failed to approve quote'),
  });

  const rejectQuoteMutation = useMutation({
    mutationFn: () => ticketService.rejectQuote(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      toast.success('Quote rejected');
      setShowRejectDialog(false);
    },
    onError: () => toast.error('Failed to reject quote'),
  });

  const followUpMutation = useMutation({
    mutationFn: () => ticketService.createFollowUp(id!, followUpNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket-history', id] });
      toast.success('Follow-up submitted');
      setFollowUpNote('');
      setShowFollowUp(false);
    },
  });

  if (isLoading) return <PageLoader />;
  if (!ticket) return <p className="text-gray-500">Ticket not found.</p>;

  const isOwner = user?.role === Role.FACTORY_OWNER;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2 mt-1" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
            <StatusBadge status={ticket.status} />
            <StatusBadge status={ticket.priority} type="priority" />
          </div>
          <p className="text-gray-600 mt-1">{ticket.issueTitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Factory details */}
          <section className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Factory Details</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <DetailItem label="Company" value={ticket.companyName} />
              <DetailItem label="Contact Person" value={ticket.contactPerson} />
              <DetailItem label="Phone" value={ticket.phone} />
              <DetailItem label="Panel Type" value={ticket.panelType} />
              <div className="col-span-2">
                <DetailItem label="Site Address" value={ticket.siteAddress} />
              </div>
              {ticket.safetyInstructions && (
                <div className="col-span-2">
                  <DetailItem label="Safety Notes" value={ticket.safetyInstructions} />
                </div>
              )}
            </dl>
          </section>

          {/* Issue details */}
          <section className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Issue Details</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{ticket.issueDescription}</p>
            {ticket.preferredVisitDate && (
              <p className="text-sm text-gray-500 mt-3">
                Preferred visit: {formatDate(ticket.preferredVisitDate)}
              </p>
            )}
          </section>

          {/* Quote section */}
          {ticket.status === TicketStatus.COST_PROPOSED && isOwner && (
            <section className="card p-6 border-2 border-brand-200 bg-brand-50">
              <h2 className="font-semibold text-gray-900 mb-4">Service Quote</h2>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold text-brand-700">
                    {formatCurrency(ticket.quotedAmount ?? 0)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Advance required: {formatCurrency(ticket.advanceAmount ?? 0)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApproveDialog(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Quote
                </button>
                <button
                  onClick={() => setShowRejectDialog(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Request Revision
                </button>
              </div>
            </section>
          )}

          {/* Payment pending */}
          {ticket.status === TicketStatus.ADVANCE_PENDING && isOwner && (
            <section className="card p-6 border-2 border-yellow-200 bg-yellow-50">
              <h2 className="font-semibold text-gray-900 mb-3">Payment Required</h2>
              <p className="text-sm text-gray-600 mb-4">
                Please pay the advance of {formatCurrency(ticket.advanceAmount ?? 0)} to proceed.
              </p>
              <button
                onClick={() => navigate(`/tickets/${id}/payment`)}
                className="btn-primary flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Pay Advance
              </button>
            </section>
          )}

          {/* Follow-up */}
          {ticket.status === TicketStatus.COMPLETED && isOwner && (
            <section className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Need Follow-up?</h2>
              {!showFollowUp ? (
                <button
                  onClick={() => setShowFollowUp(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Raise Follow-up
                </button>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Describe the issue..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => followUpMutation.mutate()}
                      disabled={!followUpNote.trim() || followUpMutation.isPending}
                      className="btn-primary"
                    >
                      Submit
                    </button>
                    <button onClick={() => setShowFollowUp(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sidebar: Timeline */}
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Status Timeline</h2>
            <TicketTimeline history={history ?? []} />
          </section>

          {ticket.assignedEngineer && (
            <section className="card p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Assigned Engineer</h3>
              <p className="text-sm text-gray-700">{(ticket.assignedEngineer as any).fullName}</p>
              <p className="text-xs text-gray-500">{(ticket.assignedEngineer as any).phone}</p>
              {ticket.engineerStatus && (
                <div className="mt-2">
                  <StatusBadge status={ticket.engineerStatus} type="engineer" />
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        title="Approve Quote?"
        description={`Approve the service quote of ${formatCurrency(ticket.quotedAmount ?? 0)}? You'll be redirected to payment.`}
        confirmLabel="Approve & Pay"
        onConfirm={() => approveQuoteMutation.mutate()}
        loading={approveQuoteMutation.isPending}
      />

      <ConfirmDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        title="Request Quote Revision?"
        description="The ticket will be returned to the team for re-quoting."
        confirmLabel="Request Revision"
        onConfirm={() => rejectQuoteMutation.mutate()}
        loading={rejectQuoteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
    <dd className="mt-0.5 text-gray-900">{value || '—'}</dd>
  </div>
);
