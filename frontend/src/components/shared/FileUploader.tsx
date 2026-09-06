import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, FileText, Film, Image } from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import { FileCategory } from '../../../../shared/src/enums';

const ACCEPTED_TYPES = {
  'image/jpeg': [],
  'image/png': [],
  'image/jpg': [],
  'application/pdf': [],
  'application/msword': [],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
  'video/mp4': [],
};

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  cloudUrl: string;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

interface FileUploaderProps {
  ticketId: string;
  category?: FileCategory;
  onUploaded?: (file: UploadedFile) => void;
  label?: string;
}

const FileIcon = ({ mimeType }: { mimeType: string }) => {
  if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  if (mimeType === 'video/mp4') return <Film className="h-5 w-5 text-purple-500" />;
  return <FileText className="h-5 w-5 text-gray-500" />;
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FileUploader = ({
  ticketId,
  category = FileCategory.OTHER,
  onUploaded,
  label = 'Upload Files',
}: FileUploaderProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const uploadFile = async (file: File): Promise<void> => {
    const tempId = `${Date.now()}-${file.name}`;
    const uploading: UploadedFile = {
      id: tempId,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      cloudUrl: '',
      status: 'uploading',
    };
    setFiles((prev) => [...prev, uploading]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileCategory', category);

      const { data } = await api.post(`/tickets/${ticketId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const done: UploadedFile = {
        ...uploading,
        id: data.data._id,
        cloudUrl: data.data.cloudUrl,
        status: 'done',
      };
      setFiles((prev) => prev.map((f) => (f.id === tempId ? done : f)));
      onUploaded?.(done);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Upload failed';
      setFiles((prev) =>
        prev.map((f) => (f.id === tempId ? { ...f, status: 'error', error: msg } : f))
      );
    }
  };

  const onDrop = useCallback(
    (accepted: File[]) => {
      accepted.forEach(uploadFile);
    },
    [ticketId, category]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 10,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-3">
      <p className="label">{label}</p>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400'
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-10 w-10 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          {isDragActive ? 'Drop files here...' : 'Drag & drop files, or click to select'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          JPG, PNG, PDF, DOC, DOCX, MP4 — Images up to 10 MB, Videos up to 100 MB
        </p>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 card p-3">
              <FileIcon mimeType={f.mimeType} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                <p className="text-xs text-gray-500">{formatBytes(f.size)}</p>
                {f.status === 'error' && (
                  <p className="text-xs text-red-600">{f.error}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {f.status === 'uploading' && (
                  <span className="text-xs text-brand-600 animate-pulse">Uploading...</span>
                )}
                {f.status === 'done' && (
                  <span className="text-xs text-green-600">✓ Done</span>
                )}
                <button
                  onClick={() => removeFile(f.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
