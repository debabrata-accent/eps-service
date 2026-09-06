import TicketCounter from '../models/TicketCounter';

/**
 * Atomically generates the next ticket number for the current year.
 * Format: EP-YYYY-NNNN (e.g., EP-2026-0001)
 */
export const generateTicketNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();

  // findOneAndUpdate is atomic — safe under concurrent requests
  const counter = await TicketCounter.findOneAndUpdate(
    { year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const padded = String(counter.seq).padStart(4, '0');
  return `EP-${year}-${padded}`;
};
