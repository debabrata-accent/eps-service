import { Request, Response } from 'express';
import { UploadApiResponse } from 'cloudinary';
import { cloudinary } from '../config/cloudinary';
import Attachment from '../models/Attachment';
import Ticket from '../models/Ticket';
import { sendSuccess, sendError } from '../utils/response';
import { validateFileSize } from '../config/multer';
import { FileType, FileCategory, Role, TicketStatus } from '@eps/shared';

const mimeToFileType = (mime: string): FileType => {
  if (mime.startsWith('image/')) return FileType.IMAGE;
  if (mime === 'video/mp4') return FileType.VIDEO;
  return FileType.DOCUMENT;
};

const streamToCloudinary = (
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'video' | 'raw'
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => {
        if (err || !result) reject(err || new Error('Upload failed'));
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

export const uploadAttachment = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    sendError(res, 'No file uploaded', 400);
    return;
  }

  const ticket = await Ticket.findById(req.params.id).lean();
  if (!ticket) {
    sendError(res, 'Ticket not found', 404);
    return;
  }

  // Access check
  const { role, userId } = req.user!;
  if (role === Role.FACTORY_OWNER && ticket.ownerId?.toString() !== userId) {
    sendError(res, 'Forbidden', 403);
    return;
  }
  if (role === Role.ENGINEER && ticket.assignedEngineerId?.toString() !== userId) {
    sendError(res, 'Forbidden', 403);
    return;
  }

  // Size validation
  const sizeError = validateFileSize(req.file);
  if (sizeError) {
    sendError(res, sizeError, 400);
    return;
  }

  const fileType = mimeToFileType(req.file.mimetype);
  const resourceType =
    fileType === FileType.IMAGE ? 'image' : fileType === FileType.VIDEO ? 'video' : 'raw';

  const folder = `eps/tickets/${req.params.id}`;
  const result = await streamToCloudinary(req.file.buffer, folder, resourceType);

  const fileCategory = (req.body.fileCategory as FileCategory) || FileCategory.OTHER;

  const attachment = await Attachment.create({
    ticketId: req.params.id,
    fileType,
    fileCategory,
    cloudUrl: result.secure_url,
    publicId: result.public_id,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    uploadedBy: userId,
  });

  sendSuccess(res, attachment, 'File uploaded', 201);
};

export const getAttachments = async (req: Request, res: Response): Promise<void> => {
  const ticket = await Ticket.findById(req.params.id).lean();
  if (!ticket) {
    sendError(res, 'Ticket not found', 404);
    return;
  }

  const { role, userId } = req.user!;
  if (role === Role.FACTORY_OWNER && ticket.ownerId?.toString() !== userId) {
    sendError(res, 'Forbidden', 403);
    return;
  }
  if (role === Role.ENGINEER && ticket.assignedEngineerId?.toString() !== userId) {
    sendError(res, 'Forbidden', 403);
    return;
  }

  const attachments = await Attachment.find({ ticketId: req.params.id })
    .populate('uploadedBy', 'fullName role')
    .sort({ createdAt: -1 })
    .lean();

  sendSuccess(res, attachments);
};

export const deleteAttachment = async (req: Request, res: Response): Promise<void> => {
  const attachment = await Attachment.findById(req.params.attachmentId);
  if (!attachment) {
    sendError(res, 'Attachment not found', 404);
    return;
  }

  const ticket = await Ticket.findById(attachment.ticketId).lean();
  if (!ticket) {
    sendError(res, 'Ticket not found', 404);
    return;
  }

  const { role, userId } = req.user!;

  // FO can only delete own attachments on draft tickets
  if (role === Role.FACTORY_OWNER) {
    if (ticket.ownerId?.toString() !== userId || ticket.status !== TicketStatus.DRAFT) {
      sendError(res, 'Forbidden or ticket not in draft status', 403);
      return;
    }
  }

  // Delete from Cloudinary
  const resourceType =
    attachment.fileType === FileType.IMAGE
      ? 'image'
      : attachment.fileType === FileType.VIDEO
      ? 'video'
      : 'raw';

  await cloudinary.uploader.destroy(attachment.publicId, { resource_type: resourceType });
  await attachment.deleteOne();

  sendSuccess(res, null, 'Attachment deleted');
};
