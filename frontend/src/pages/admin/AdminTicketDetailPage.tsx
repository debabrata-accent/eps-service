import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, DollarSign, CheckCircle, XCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketService } from '../../services/ticket.service';
import { paymentService } from '../../services/payment.service';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TicketTimeline } from '../../components/shared/TicketTimeline';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate, formatCurrency } from '../../utils/format';
import { TicketStatus, PaymentStatus } from '../../../../shared/src/enums';

export const AdminTicketDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showProposeCost, setShowProposeCost] = useState(false);
  const [quotedAmount, setQuotedAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [costNote, setCostNote] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);

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

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['ticket', id] });
    qc.invalidateQueries({ queryKey: ['ticket-history', id] });
  };

  const reviewMutation = useMutation({
    mutationFn: () => ticketService.markUnderReview(id!),
    onSuccess: () => { invalidate(); toast.success('Marked under review'); },
  });

  const proposeCostMutation = useMutation({
    mutationFn: () =>
      ticketService.proposeCost(
        id!,
        parseFloat(quotedAmount),
        parseFloat(advanceAmount) || undefined,
        costNote
      ),
    onSuccess: () => {
      invalidate();
      toast.success('Quote sent to customer');
      setShowProposeCost(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const createOrderMutation = useMutation({
    mutationFn: () => paymentService.createOrder(id!),
    onSuccess: () => { invalidate(); toast.success('Payment order created'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create order'),
  });

  const approveMutation = useMutation({
    mutationFn: () => ticketService.approve(id!),
    onSuccess: () => { invalidate(); toast.success('Ticket approved — released to engineer queue'); setShowApproveDialog(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => ticketService.reject(id!, rejectReason),
    onSuccess: () => { invalidate(); toast.success('Ticket rejected'); setShowRejectDialog(false); },
  });

  if (isLoading) return <PageLoader />;
  if (!ticket) return <p>Ticket not found.</p>;

  const canReview = ticket.status === TicketStatus.SUBMITTED;
  const canProposeCost = [TicketStatus.UNDER_REVIEW, TicketStatus.SUBMITTED].includes(ticket.status as TicketStatus);
  const canCreateOrder = ticket.status === TicketStatus.ADVANCE_PENDING && ticket.paymentStatus !== PaymentStatus.PAID;
  const canApprove = ticket.status === TicketStatus.ADVANCE_PENDING && ticket.paymentStatus === PaymentStatus.PAID;
  const canReject = ![TicketStatus.COMPLETED, TicketStatus.CANCELLED, TicketStatus.REJECTED].includes(ticket.status as TicketStatus);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2 mt-1">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
            <StatusBadge status={ticket.status} />
            <StatusBadge status={ticket.priority} type="priority" />
          </div>
          <p className="text-gray-600 mt-1">{ticket.issueTitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <section className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Customer & Factory Details</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-gray-500 uppercase">Company</dt><dd className="text-gray-900 mt-0.5">{ticket.companyName}</dd></div>
              <div><dt className="text-xs text-gray-500 uppercase">Owner</dt><dd className="text-gray-900 mt-0.5">{(ticket.owner as any)?.fullName}</dd></div>
              <div><dt className="text-xs text-gray-500 uppercase">Contact</dt><dd className="text-gray-900 mt-0.5">{ticket.contactPerson}</dd></div>
              <div><dt className="text-xs text-gray-500 uppercase">Phone</dt><dd className="text-gray-900 mt-0.5">{ticket.phone}</dd></div>
              <div><dt className="text-xs text-gray-500 uppercase">Panel Type</dt><dd className="text-gray-900 mt-0.5">{ticket.panelType}</dd></div>
              <div><dt className="text-xs text-gray-500 uppercase">Priority</dt><dd className="mt-0.5"><StatusBadge status={ticket.priority} type="priority" /></dd></div>
              <div className="col-span-2"><dt className="text-xs text-gray-500 uppercase">Site Address</dt><dd className="text-gray-900 mt-0.5">{ticket.siteAddress}</dd></div>
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Issue Description</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{ticket.issueDescription}</p>
          </section>

          {/* Quote / Payment info */}
          {ticket.quotedAmount && (
            <section className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Quote & Payment</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-gray-500 uppercase">Quoted Amount</dt><dd className="text-gray-900 font-bold text-lg mt-0.5">{formatCurrency(ticket.quotedAmount)}</dd></div>
                <div><dt className="text-xs text-gray-500 uppercase">Advance</dt><dd className="text-gray-900 mt-0.5">{formatCurrency(ticket.advanceAmount ?? 0)}</dd></div>
                <div><dt className="text-xs text-gray-500 uppercase">Payment Status</dt><dd className="mt-0.5"><StatusBadge status={ticket.paymentStatus} /></dd></div>
              </div>
            </section>
          )}

          {/* Action buttons */}
          <section className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="flex flex-wrap gap-3">
              {canReview && (
                <button
                  onClick={() => reviewMutation.mutate()}
                  disabled={reviewMutation.isPending}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Mark Under Review
                </button>
              )}
              {canProposeCost && (
                <button
                  onClick={() => setShowProposeCost(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Propose Cost
                </button>
              )}
              {canCreateOrder && (
                <button
                  onClick={() => createOrderMutation.mutate()}
                  disabled={createOrderMutation.isPending}
                  className="btn-primary flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  {createOrderMutation.isPending ? 'Creating Order...' : 'Create Payment Order'}
                </button>
              )}
              {canApprove && (
                <button
                  onClick={() => setShowApproveDialog(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Ticket
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => setShowRejectDialog(true)}
                  className="btn-danger flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              )}
            </div>
          </section>

          {/* Propose cost form */}
          {showProposeCost && (
            <section className="card p-6 border-2 border-brand-200">
              <h2 className="font-semibold text-gray-900 mb-4">Propose Service Cost</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Total Quoted Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={quotedAmount}
                    onChange={(e) => {
                      setQuotedAmount(e.target.value);
                      setAdvanceAmount(String(Math.round(parseFloat(e.target.value || '0') * 0.5)));
                    }}
                    placeholder="e.g. 25000"
                  />
                </div>
                <div>
                  <label className="label">Advance Amount (₹) — defaults to 50%</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Note (optional)</label>
                  <textarea className="input" rows={2} value={costNote} onChange={(e) => setCostNote(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => proposeCostMutation.mutate()}
                    disabled={!quotedAmount || proposeCostMutation.isPending}
                    className="btn-primary"
                  >
                    {proposeCostMutation.isPending ? 'Sending...' : 'Send Quote'}
                  </button>
                  <button onClick={() => setShowProposeCost(false)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Timeline + engineer info */}
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Status Timeline</h2>
            <TicketTimeline history={history ?? []} />
          </section>

          {ticket.assignedEngineer && (
            <section className="card p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Engineer</h3>
              <p className="text-sm">{(ticket.assignedEngineer as any).fullName}</p>
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
        title="Approve Ticket?"
        description="This will release the ticket into the engineer queue."
        confirmLabel="Approve"
        onConfirm={() => approveMutation.mutate()}
        loading={approveMutation.isPending}
      />

      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">Reject Ticket?</h3>
            <textarea
              className="input mb-4"
              rows={3}
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowRejectDialog(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending}
                className="btn-danger"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
