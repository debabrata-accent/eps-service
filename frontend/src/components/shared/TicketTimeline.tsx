import { formatDateTime } from '../../utils/format';
import { StatusBadge } from '../ui/StatusBadge';
import { ITicketHistory } from '../../../../shared/src/types';

interface TicketTimelineProps {
  history: ITicketHistory[];
}

export const TicketTimeline = ({ history }: TicketTimelineProps) => {
  if (!history || history.length === 0) {
    return <p className="text-sm text-gray-500">No history available.</p>;
  }

  return (
    <ol className="relative border-l border-gray-200 space-y-6 ml-3">
      {history.map((entry, idx) => (
        <li key={entry._id} className="ml-6">
          <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-brand-500 ring-4 ring-white">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
          </span>
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {entry.oldStatus && (
                <>
                  <StatusBadge status={entry.oldStatus} />
                  <span className="text-gray-400 text-xs">→</span>
                </>
              )}
              <StatusBadge status={entry.newStatus} />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span className="font-medium text-gray-700">
                {(entry.changedByUser as any)?.fullName || 'System'}
              </span>
              <span>·</span>
              <span>{formatDateTime(entry.timestamp)}</span>
            </div>
            {entry.note && (
              <p className="mt-2 text-sm text-gray-600 italic">"{entry.note}"</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};
