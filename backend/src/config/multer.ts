import multer from 'multer';
import { Request } from 'express';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
];

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;   // 10 MB
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;  // 100 MB
const DOC_MAX_BYTES = 20 * 1024 * 1024;     // 20 MB

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(
      new Error(
        `File type not allowed. Allowed: JPG, PNG, PDF, DOC, DOCX, MP4`
      )
    );
    return;
  }
  cb(null, true);
};

// We store in memory and stream to Cloudinary — no disk storage
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: VIDEO_MAX_BYTES, // highest limit; per-type validation happens in the route
    files: 10,
  },
});

export const validateFileSize = (
  file: Express.Multer.File
): string | null => {
  if (file.mimetype.startsWith('image/') && file.size > IMAGE_MAX_BYTES) {
    return `Image "${file.originalname}" exceeds 10 MB limit`;
  }
  if (file.mimetype === 'video/mp4' && file.size > VIDEO_MAX_BYTES) {
    return `Video "${file.originalname}" exceeds 100 MB limit`;
  }
  if (
    !file.mimetype.startsWith('image/') &&
    file.mimetype !== 'video/mp4' &&
    file.size > DOC_MAX_BYTES
  ) {
    return `Document "${file.originalname}" exceeds 20 MB limit`;
  }
  return null;
};
