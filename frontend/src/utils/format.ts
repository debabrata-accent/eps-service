import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date: string | Date): string =>
  format(new Date(date), 'dd MMM yyyy');

export const formatDateTime = (date: string | Date): string =>
  format(new Date(date), 'dd MMM yyyy, hh:mm a');

export const timeAgo = (date: string | Date): string =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export const formatStatus = (status: string): string =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
