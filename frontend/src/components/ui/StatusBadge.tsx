import { cn } from '../../utils/cn';
import { formatStatus } from '../../utils/format';
import { TicketStatus, EngineerStatus, Priority } from '../../../../shared/src/enums';

const ticketStatusColors: Record<string, string> = {
  [TicketStatus.DRAFT]: 'bg-gray-100 text-gray-700',
  [TicketStatus.SUBMITTED]: 'bg-blue-100 text-blue-700',
  [TicketStatus.UNDER_REVIEW]: 'bg-yellow-100 text-yellow-700',
  [TicketStatus.COST_PROPOSED]: 'bg-purple-100 text-purple-700',
  [TicketStatus.AWAITING_CUSTOMER_APPROVAL]: 'bg-orange-100 text-orange-700',
  [TicketStatus.ADVANCE_PENDING]: 'bg-red-100 text-red-700',
  [TicketStatus.APPROVED]: 'bg-teal-100 text-teal-700',
  [TicketStatus.OPEN_FOR_ASSIGNMENT]: 'bg-cyan-100 text-cyan-700',
  [TicketStatus.ASSIGNED]: 'bg-indigo-100 text-indigo-700',
  [TicketStatus.REJECTED]: 'bg-red-200 text-red-800',
  [TicketStatus.CANCELLED]: 'bg-gray-200 text-gray-600',
  [TicketStatus.COMPLETED]: 'bg-green-100 text-green-700',
};

const engineerStatusColors: Record<string, string> = {
  [EngineerStatus.ASSIGNED]: 'bg-indigo-100 text-indigo-700',
  [EngineerStatus.VISITED_FACTORY]: 'bg-blue-100 text-blue-700',
  [EngineerStatus.ISSUE_IDENTIFIED]: 'bg-yellow-100 text-yellow-700',
  [EngineerStatus.SOLUTION_PROPOSED]: 'bg-purple-100 text-purple-700',
  [EngineerStatus.ISSUE_FIXED]: 'bg-teal-100 text-teal-700',
  [EngineerStatus.COMPLETED]: 'bg-green-100 text-green-700',
};

const priorityColors: Record<string, string> = {
  [Priority.LOW]: 'bg-green-100 text-green-700',
  [Priority.MEDIUM]: 'bg-yellow-100 text-yellow-700',
  [Priority.HIGH]: 'bg-orange-100 text-orange-700',
  [Priority.CRITICAL]: 'bg-red-100 text-red-700',
};

interface StatusBadgeProps {
  status: string;
  type?: 'ticket' | 'engineer' | 'priority';
  className?: string;
}

export const StatusBadge = ({ status, type = 'ticket', className }: StatusBadgeProps) => {
  const colorMap =
    type === 'engineer'
      ? engineerStatusColors
      : type === 'priority'
      ? priorityColors
      : ticketStatusColors;

  const colorClass = colorMap[status] || 'bg-gray-100 text-gray-700';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
    >
      {formatStatus(status)}
    </span>
  );
};
