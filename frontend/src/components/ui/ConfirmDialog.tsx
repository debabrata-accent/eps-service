import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { cn } from '../../utils/cn';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'default' | 'danger';
  loading?: boolean;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) => (
  <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
      <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <AlertDialog.Title className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </AlertDialog.Title>
        <AlertDialog.Description className="text-sm text-gray-600 mb-6">
          {description}
        </AlertDialog.Description>
        <div className="flex justify-end gap-3">
          <AlertDialog.Cancel asChild>
            <button className="btn-secondary" disabled={loading}>
              {cancelLabel}
            </button>
          </AlertDialog.Cancel>
          <AlertDialog.Action asChild>
            <button
              className={cn(variant === 'danger' ? 'btn-danger' : 'btn-primary')}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Processing...' : confirmLabel}
            </button>
          </AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>
);
