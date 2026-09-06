import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketService } from '../../services/ticket.service';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TicketTimeline } from '../../components/shared/TicketTimeline';
import { FileUploader } from '../../components/shared/FileUploader';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/format';
import { EngineerStatus, FileCategory } from '../../../../shared/src/enums';
import { ENGINEER_STATUS_ORDER } from '../../../../shared/src/enums';
import api from '../../services/api';

export const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [statusNote, setStatusNote] = useState('');
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  // Service report form state
  const [report, setReport] = useState({
    visitNotes: '', rootCause: '', solutionProvided: '', sparePartsUsed: '', completionNote: '',
  });
  const [reportExists, setReportExists] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

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

  useQuery({
    queryKey: ['service-report', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/service-reports/ticket/${id}`);
        const r = res.data.data;
        setReport({
          visitNotes: r.visitNotes,
          rootCause: r.rootCause,
          solutionProvided: r.solutionProvided,
          sparePartsUsed: r.sparePartsUsed || '',
          completionNote: r.completionNote,
        });
        setReportExists(true);
        setReportId(r._id);
        return r;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, note }: { status: string; note: string }) =>
      ticketService.updateEngineerStatus(id!, status, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      qc.invalidateQueries({ queryKey: ['ticket-history', id] });
      toast.success('Status updated');
      setShowStatusUpdate(false);
      setStatusNote('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (reportExists && reportId) {
        await api.put(`/service-reports/${reportId}`, report);
      } else {
        await api.post('/service-reports', { ...report, ticketId: id });
        setReportExists(true);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-report', id] });
      toast.success('Service report saved');
    },
    onError: () => toast.error('Failed to save report'),
  });

  if (isLoading) return <PageLoader />;
  if (!ticket) return <p>Ticket not found.</p>;

  const currentStatusIdx = ENGINEER_STATUS_ORDER.indexOf(ticket.engineerStatus as EngineerStatus);
  const nextStatus = ENGINEER_STATUS_ORDER[currentStatusIdx + 1];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2 mt-1">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
            <StatusBadge status={ticket.engineerStatus ?? ticket.status} type="engineer" />
            <StatusBadge status={ticket.priority} type="priority" />
          </div>
          <p className="text-gray-600 mt-1">{ticket.issueTitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket info */}
          <section className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Site Details</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-gray-500 uppercase">Company</dt><dd className="text-gray-900 mt-0.5">{ticket.companyName}</dd></div>
              <div><dt className="text-xs text-gray-500 uppercase">Contact</dt><dd className="text-gray-900 mt-0.5">{ticket.contactPerson}</dd></div>
              <div><dt className="text-xs text-gray-500 uppercase">Phone</dt><dd className="text-gray-900 mt-0.5">{ticket.phone}</dd></div>
              <div><dt className="text-xs text-gray-500 uppercase">Panel</dt><dd className="text-gray-900 mt-0.5">{ticket.panelType}</dd></div>
              <div className="col-span-2"><dt className="text-xs text-gray-500 uppercase">Address</dt><dd className="text-gray-900 mt-0.5">{ticket.siteAddress}</dd></div>
              {ticket.safetyInstructions && (
                <div className="col-span-2 bg-yellow-50 rounded-lg p-3">
                  <dt className="text-xs font-medium text-yellow-700 uppercase">⚠ Safety Notes</dt>
                  <dd className="text-yellow-800 mt-0.5 text-sm">{ticket.safetyInstructions}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Issue */}
          <section className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Issue Description</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{ticket.issueDescription}</p>
          </section>

          {/* Status update */}
          {nextStatus && (
            <section className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Update Work Status</h2>
              {!showStatusUpdate ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Next step:</span>
                  <StatusBadge status={nextStatus} type="engineer" />
                  <button
                    onClick={() => setShowStatusUpdate(true)}
                    className="btn-primary ml-auto flex items-center gap-1.5"
                  >
                    Update <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Moving to: <StatusBadge status={nextStatus} type="engineer" className="ml-1" />
                  </p>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="input"
                    rows={2}
                    placeholder="Optional note..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => statusMutation.mutate({ status: nextStatus, note: statusNote })}
                      disabled={statusMutation.isPending}
                      className="btn-primary"
                    >
                      {statusMutation.isPending ? 'Updating...' : 'Confirm Update'}
                    </button>
                    <button onClick={() => setShowStatusUpdate(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* File uploads */}
          <section className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Upload Visit Files</h2>
            <FileUploader ticketId={id!} category={FileCategory.VISIT_NOTE} label="Visit Notes / Photos" />
            <div className="mt-4">
              <FileUploader ticketId={id!} category={FileCategory.COMPLETION_PROOF} label="Completion Proof" />
            </div>
          </section>

          {/* Service report */}
          <section className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              {reportExists ? 'Edit Service Report' : 'Create Service Report'}
            </h2>
            <div className="space-y-4">
              {[
                { key: 'visitNotes', label: 'Visit Notes *', rows: 3 },
                { key: 'rootCause', label: 'Root Cause *', rows: 2 },
                { key: 'solutionProvided', label: 'Solution Provided *', rows: 2 },
                { key: 'sparePartsUsed', label: 'Spare Parts Used', rows: 1 },
                { key: 'completionNote', label: 'Completion Note *', rows: 2 },
              ].map(({ key, label, rows }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <textarea
                    className="input"
                    rows={rows}
                    value={(report as any)[key]}
                    onChange={(e) => setReport((r) => ({ ...r, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <button
                onClick={() => reportMutation.mutate()}
                disabled={reportMutation.isPending}
                className="btn-primary"
              >
                {reportMutation.isPending ? 'Saving...' : reportExists ? 'Update Report' : 'Save Report'}
              </button>
            </div>
          </section>
        </div>

        {/* Timeline */}
        <div>
          <section className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Status Timeline</h2>
            <TicketTimeline history={history ?? []} />
          </section>
        </div>
      </div>
    </div>
  );
};
