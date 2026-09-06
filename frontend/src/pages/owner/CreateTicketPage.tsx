import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketService } from '../../services/ticket.service';
import { FileUploader } from '../../components/shared/FileUploader';
import { FileCategory, Priority } from '../../../../shared/src/enums';
import { AxiosError } from 'axios';

const schema = z.object({
  factoryOwnerName: z.string().min(2, 'Required'),
  companyName: z.string().min(2, 'Required'),
  siteAddress: z.string().min(5, 'Required'),
  contactPerson: z.string().min(2, 'Required'),
  phone: z.string().min(10, 'Valid phone required'),
  alternatePhone: z.string().optional(),
  panelType: z.string().min(2, 'Required'),
  panelInstallationDate: z.string().optional(),
  issueTitle: z.string().min(5, 'Required'),
  issueDescription: z.string().min(10, 'Minimum 10 characters'),
  priority: z.nativeEnum(Priority),
  preferredVisitDate: z.string().optional(),
  safetyInstructions: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const STEPS = ['Factory Details', 'Issue Details', 'Attachments', 'Review'];

export const CreateTicketPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { priority: Priority.MEDIUM },
  });

  const stepFields: Array<(keyof FormData)[]> = [
    ['factoryOwnerName', 'companyName', 'siteAddress', 'contactPerson', 'phone'],
    ['panelType', 'issueTitle', 'issueDescription', 'priority'],
    [], // attachments — no form fields
    [], // review
  ];

  const handleNext = async () => {
    const fields = stepFields[step];
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }

    if (step === 1 && !createdTicketId) {
      // Create ticket draft before moving to attachments
      setIsSubmitting(true);
      try {
        const values = getValues();
        const ticket = await ticketService.create(values);
        setCreatedTicketId(ticket._id);
        setStep((s) => s + 1);
      } catch (err) {
        const msg = err instanceof AxiosError ? err.response?.data?.message : 'Failed to create ticket';
        toast.error(msg || 'Failed to create ticket');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setStep((s) => s + 1);
  };

  const handleSubmitTicket = async () => {
    if (!createdTicketId) return;
    setIsSubmitting(true);
    try {
      await ticketService.submit(createdTicketId);
      toast.success('Ticket submitted successfully!');
      navigate('/tickets');
    } catch (err) {
      toast.error('Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const values = getValues();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Service Ticket</h1>
        <p className="text-sm text-gray-500 mt-1">Submit a new electrical panel service request</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, idx) => (
          <div key={idx} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium flex-shrink-0 transition-colors ${
              idx < step ? 'bg-green-500 text-white' :
              idx === step ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {idx < step ? '✓' : idx + 1}
            </div>
            <span className={`text-xs hidden sm:block ${idx === step ? 'text-brand-600 font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
            {idx < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 hidden sm:block" />}
          </div>
        ))}
      </div>

      <div className="card p-6">
        {/* Step 0: Factory Details */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Factory & Contact Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Factory Owner Name *</label>
                <input className="input" {...register('factoryOwnerName')} />
                {errors.factoryOwnerName && <p className="error-text">{errors.factoryOwnerName.message}</p>}
              </div>
              <div>
                <label className="label">Company Name *</label>
                <input className="input" {...register('companyName')} />
                {errors.companyName && <p className="error-text">{errors.companyName.message}</p>}
              </div>
            </div>
            <div>
              <label className="label">Site Address *</label>
              <textarea className="input" rows={2} {...register('siteAddress')} />
              {errors.siteAddress && <p className="error-text">{errors.siteAddress.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Contact Person *</label>
                <input className="input" {...register('contactPerson')} />
                {errors.contactPerson && <p className="error-text">{errors.contactPerson.message}</p>}
              </div>
              <div>
                <label className="label">Phone *</label>
                <input className="input" type="tel" {...register('phone')} />
                {errors.phone && <p className="error-text">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="label">Alternate Phone</label>
                <input className="input" type="tel" {...register('alternatePhone')} />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Issue Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Panel & Issue Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Panel Type *</label>
                <input className="input" placeholder="e.g. MCC Panel, PLC Panel" {...register('panelType')} />
                {errors.panelType && <p className="error-text">{errors.panelType.message}</p>}
              </div>
              <div>
                <label className="label">Panel Installation Date</label>
                <input className="input" type="date" {...register('panelInstallationDate')} />
              </div>
            </div>
            <div>
              <label className="label">Issue Title *</label>
              <input className="input" placeholder="Brief title of the issue" {...register('issueTitle')} />
              {errors.issueTitle && <p className="error-text">{errors.issueTitle.message}</p>}
            </div>
            <div>
              <label className="label">Issue Description *</label>
              <textarea
                className="input"
                rows={4}
                placeholder="Describe the issue in detail..."
                {...register('issueDescription')}
              />
              {errors.issueDescription && <p className="error-text">{errors.issueDescription.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Priority</label>
                <select className="input" {...register('priority')}>
                  {Object.values(Priority).map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Preferred Visit Date</label>
                <input className="input" type="date" {...register('preferredVisitDate')} />
              </div>
            </div>
            <div>
              <label className="label">Safety / Access Instructions</label>
              <textarea className="input" rows={2} placeholder="Any safety notes for the engineer..." {...register('safetyInstructions')} />
            </div>
          </div>
        )}

        {/* Step 2: Attachments */}
        {step === 2 && createdTicketId && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h2>
            <p className="text-sm text-gray-500">Upload fault photos, videos, or design documents. You can skip this step.</p>
            <FileUploader ticketId={createdTicketId} category={FileCategory.FAULT_PHOTO} label="Fault Photos / Videos" />
            <FileUploader ticketId={createdTicketId} category={FileCategory.DESIGN_DOC} label="Design Documents" />
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Submit</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <Row label="Company" value={values.companyName} />
              <Row label="Site Address" value={values.siteAddress} />
              <Row label="Contact" value={`${values.contactPerson} — ${values.phone}`} />
              <Row label="Panel Type" value={values.panelType} />
              <Row label="Issue" value={values.issueTitle} />
              <Row label="Priority" value={values.priority} />
            </div>
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Once submitted, your ticket will be reviewed by our team and you'll receive a quote shortly.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0 || isSubmitting}
          className="btn-secondary flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? 'Saving...' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitTicket}
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        )}
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex gap-2">
    <span className="font-medium text-gray-600 w-28 flex-shrink-0">{label}:</span>
    <span className="text-gray-900">{value || '—'}</span>
  </div>
);
