import { ADMIN_LOGIN_APPROVAL_PENDING_MESSAGE } from '@/features/auth/errors/admin-login-approval-pending-error'
import { LoginInlineAlert } from './login-inline-alert'

export function LoginAdminApprovalPendingNotice() {
  return <LoginInlineAlert>{ADMIN_LOGIN_APPROVAL_PENDING_MESSAGE}</LoginInlineAlert>
}
