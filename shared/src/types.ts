import {
  Role,
  TicketStatus,
  EngineerStatus,
  Priority,
  PaymentStatus,
  FileType,
  FileCategory,
  NotificationType,
} from './enums';

// ─── User ────────────────────────────────────────────────────────────────────

export interface IUser {
  _id: string;
  username: string;
  role: Role;
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;         // factory_owner only
  engineerSpecialization?: string; // engineer only
  isActive: boolean;
  fcmToken?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUserCreate {
  username: string;
  password: string;
  role: Role;
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  engineerSpecialization?: string;
}

export interface IUserUpdate {
  fullName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  engineerSpecialization?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface ILoginRequest {
  username: string;
  password: string;
}

export interface ILoginResponse {
  accessToken: string;
  user: IUser;
}

export interface IJwtPayload {
  userId: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ─── Ticket ───────────────────────────────────────────────────────────────────

export interface ITicket {
  _id: string;
  ticketNumber: string;
  ownerId: string;
  owner?: IUser;

  // Factory details
  factoryOwnerName: string;
  companyName: string;
  siteAddress: string;
  contactPerson: string;
  phone: string;
  alternatePhone?: string;

  // Panel info
  panelType: string;
  panelInstallationDate?: string;

  // Issue
  issueTitle: string;
  issueDescription: string;
  priority: Priority;
  preferredVisitDate?: string;
  safetyInstructions?: string;

  // Status
  status: TicketStatus;
  engineerStatus?: EngineerStatus;

  // Assignment
  assignedEngineerId?: string;
  assignedEngineer?: IUser;
  assignedAt?: string;

  // Quote & Payment
  quotedAmount?: number;
  advanceAmount?: number;
  paymentStatus: PaymentStatus;
  paymentId?: string;

  // Meta
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ITicketCreate {
  factoryOwnerName: string;
  companyName: string;
  siteAddress: string;
  contactPerson: string;
  phone: string;
  alternatePhone?: string;
  panelType: string;
  panelInstallationDate?: string;
  issueTitle: string;
  issueDescription: string;
  priority: Priority;
  preferredVisitDate?: string;
  safetyInstructions?: string;
}

// ─── Attachment ───────────────────────────────────────────────────────────────

export interface IAttachment {
  _id: string;
  ticketId: string;
  fileType: FileType;
  fileCategory: FileCategory;
  cloudUrl: string;
  publicId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  uploader?: IUser;
  createdAt: string;
}

// ─── Ticket History ───────────────────────────────────────────────────────────

export interface ITicketHistory {
  _id: string;
  ticketId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedByUser?: IUser;
  note?: string;
  timestamp: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface IPayment {
  _id: string;
  ticketId: string;
  ticket?: ITicket;
  ownerId: string;
  owner?: IUser;
  totalAmount: number;
  advanceAmount: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: 'created' | 'paid' | 'failed';
  paidAt?: string;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  ticketId?: string;
  isRead: boolean;
  sentAt: string;
}

// ─── Service Report ───────────────────────────────────────────────────────────

export interface IServiceReport {
  _id: string;
  ticketId: string;
  ticket?: ITicket;
  engineerId: string;
  engineer?: IUser;
  visitNotes: string;
  rootCause: string;
  solutionProvided: string;
  sparePartsUsed?: string;
  completionNote: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface IOwnerReportSummary {
  totalTickets: number;
  openTickets: number;
  completedTickets: number;
  cancelledTickets: number;
  totalSpend: number;
  avgTurnaroundDays: number;
}

export interface IEngineerReportSummary {
  assignedTickets: number;
  completedTickets: number;
  avgCompletionDays: number;
  visitCount: number;
}

export interface IAdminReportSummary {
  totalTickets: number;
  pendingReview: number;
  pendingPayment: number;
  approvedUnassigned: number;
  totalRevenue: number;
  completionTrend: Array<{ period: string; count: number }>;
  engineerUtilization: Array<{ engineerName: string; completed: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
}
