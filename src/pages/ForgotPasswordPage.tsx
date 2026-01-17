import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="text-muted-foreground text-sm mt-1">
            We'll send you a link to reset your password
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
