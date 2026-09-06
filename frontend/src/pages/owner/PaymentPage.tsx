import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, ArrowLeft, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ticketService } from '../../services/ticket.service';
import { paymentService } from '../../services/payment.service';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/format';
import { TicketStatus } from '../../../../shared/src/enums';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const PaymentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [paymentDone, setPaymentDone] = useState(false);
  const [processing, setProcessing] = useState(false);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketService.getById(id!),
    enabled: !!id,
  });

  if (isLoading) return <PageLoader />;
  if (!ticket) return <p>Ticket not found.</p>;

  if (ticket.status === TicketStatus.COMPLETED || ticket.paymentStatus === 'paid') {
    return (
      <div className="max-w-md mx-auto mt-16 text-center card p-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Confirmed</h2>
        <p className="text-gray-500 mb-6">Your advance payment has been received.</p>
        <button onClick={() => navigate(`/tickets/${id}`)} className="btn-primary">
          Back to Ticket
        </button>
      </div>
    );
  }

  const handlePay = async () => {
    setProcessing(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your connection.');
        setProcessing(false);
        return;
      }

      const order = await paymentService.getByTicket(id!);
      if (!order || (order as any).status === 'paid') {
        toast.success('Payment already received!');
        setPaymentDone(true);
        setProcessing(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: order.razorpayOrderId,
        amount: order.advanceAmount * 100,
        currency: 'INR',
        name: 'EPS Service',
        description: `Advance for ${ticket.ticketNumber}`,
        handler: () => {
          toast.success('Payment successful! Awaiting confirmation...');
          setPaymentDone(true);
          qc.invalidateQueries({ queryKey: ['ticket', id] });
          setTimeout(() => navigate(`/tickets/${id}`), 3000);
        },
        prefill: {
          name: ticket.factoryOwnerName,
          contact: ticket.phone,
        },
        theme: { color: '#2563eb' },
      });

      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setProcessing(false);
      });

      rzp.open();
      setProcessing(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not initiate payment';
      toast.error(msg);
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Pay Advance</h1>
      </div>

      {paymentDone ? (
        <div className="card p-8 text-center">
          <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-3" />
          <p className="font-medium text-gray-900">Payment received! Redirecting...</p>
        </div>
      ) : (
        <div className="card p-6 space-y-5">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-medium text-gray-700">Ticket: <span className="text-gray-900">{ticket.ticketNumber}</span></p>
            <p className="font-medium text-gray-700">Issue: <span className="text-gray-900">{ticket.issueTitle}</span></p>
            <p className="font-medium text-gray-700">Total Quote: <span className="text-gray-900">{formatCurrency(ticket.quotedAmount ?? 0)}</span></p>
          </div>

          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-1">Advance to pay now</p>
            <p className="text-4xl font-bold text-brand-700">{formatCurrency(ticket.advanceAmount ?? 0)}</p>
          </div>

          <button
            onClick={handlePay}
            disabled={processing}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            <CreditCard className="h-5 w-5" />
            {processing ? 'Opening payment...' : 'Pay Now'}
          </button>

          <p className="text-xs text-center text-gray-400">
            Secured by Razorpay · UPI, Cards, Net Banking accepted
          </p>
        </div>
      )}
    </div>
  );
};
