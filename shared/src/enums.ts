export enum Role {
  FACTORY_OWNER = 'factory_owner',
  ENGINEER = 'engineer',
  CUSTOMER_EXECUTIVE = 'customer_executive',
}

export enum TicketStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  COST_PROPOSED = 'cost_proposed',
  AWAITING_CUSTOMER_APPROVAL = 'awaiting_customer_approval',
  ADVANCE_PENDING = 'advance_pending',
  APPROVED = 'approved',
  OPEN_FOR_ASSIGNMENT = 'open_for_assignment',
  ASSIGNED = 'assigned',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum EngineerStatus {
  ASSIGNED = 'assigned',
  VISITED_FACTORY = 'visited_factory',
  ISSUE_IDENTIFIED = 'issue_identified',
  SOLUTION_PROPOSED = 'solution_proposed',
  ISSUE_FIXED = 'issue_fixed',
  COMPLETED = 'completed',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  NOT_REQUIRED = 'not_required',
}

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

export enum FileCategory {
  FAULT_PHOTO = 'fault_photo',
  DESIGN_DOC = 'design_doc',
  VISIT_NOTE = 'visit_note',
  COMPLETION_PROOF = 'completion_proof',
  OTHER = 'other',
}

export enum NotificationType {
  TICKET_UPDATE = 'ticket_update',
  QUOTE = 'quote',
  PAYMENT = 'payment',
  ASSIGNMENT = 'assignment',
  SYSTEM = 'system',
}

// Allowed engineer status transitions (in order)
export const ENGINEER_STATUS_ORDER: EngineerStatus[] = [
  EngineerStatus.ASSIGNED,
  EngineerStatus.VISITED_FACTORY,
  EngineerStatus.ISSUE_IDENTIFIED,
  EngineerStatus.SOLUTION_PROPOSED,
  EngineerStatus.ISSUE_FIXED,
  EngineerStatus.COMPLETED,
];
