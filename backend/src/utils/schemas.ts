import { z } from 'zod';
import { Role, Priority, FileCategory, EngineerStatus } from '@eps/shared';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(Role),
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  companyName: z.string().max(100).optional(),
  engineerSpecialization: z.string().max(100).optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  companyName: z.string().max(100).optional(),
  engineerSpecialization: z.string().max(100).optional(),
});

export const createTicketSchema = z.object({
  factoryOwnerName: z.string().min(2).max(100),
  companyName: z.string().min(2).max(100),
  siteAddress: z.string().min(5).max(300),
  contactPerson: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  alternatePhone: z.string().max(15).optional(),
  panelType: z.string().min(2).max(100),
  panelInstallationDate: z.string().optional(),
  issueTitle: z.string().min(5).max(200),
  issueDescription: z.string().min(10).max(2000),
  priority: z.nativeEnum(Priority).optional(),
  preferredVisitDate: z.string().optional(),
  safetyInstructions: z.string().max(500).optional(),
});

export const proposeCostSchema = z.object({
  quotedAmount: z.number().positive('Quoted amount must be positive'),
  advanceAmount: z.number().positive().optional(),
  note: z.string().max(500).optional(),
});

export const updateEngineerStatusSchema = z.object({
  engineerStatus: z.nativeEnum(EngineerStatus),
  note: z.string().max(500).optional(),
});

export const createServiceReportSchema = z.object({
  ticketId: z.string().min(1),
  visitNotes: z.string().min(10).max(2000),
  rootCause: z.string().min(5).max(1000),
  solutionProvided: z.string().min(5).max(1000),
  sparePartsUsed: z.string().max(500).optional(),
  completionNote: z.string().min(5).max(1000),
});

export const attachmentUploadSchema = z.object({
  fileCategory: z.nativeEnum(FileCategory).optional(),
});

export const createOrderSchema = z.object({
  ticketId: z.string().min(1),
});

export const fcmTokenSchema = z.object({
  fcmToken: z.string().min(1),
});
