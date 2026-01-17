import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useToast, type Toast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast()
  const Icon = icons[toast.type]

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-3 rounded-md border shadow-lg',
        styles[toast.type]
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="p-1 hover:bg-black/10 rounded"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
