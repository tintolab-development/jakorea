import {
  ADMIN_ACCOUNT_ACTION_LABELS,
  type AdminAccountActionType,
} from '@/entities/admin-account-log/model/types'

export function formatAdminAccountActionLabel(actionType: string | null | undefined): string {
  const code = actionType?.trim()
  if (!code) return '-'
  if (code in ADMIN_ACCOUNT_ACTION_LABELS) {
    return ADMIN_ACCOUNT_ACTION_LABELS[code as AdminAccountActionType]
  }
  return code
}
