import type {
  AdminAccountListFilter,
  AdminAccountListResult,
} from '@/entities/admin-account-log/model/types'
import { shouldUseAdminAccountLogRemoteApi } from './capabilities'
import { listAdminAccountLogs } from './store'

const remoteError = 'Admin account log remote API is not implemented yet'

export async function listAdminAccountLogsService(
  filter: AdminAccountListFilter
): Promise<AdminAccountListResult> {
  if (shouldUseAdminAccountLogRemoteApi()) throw new Error(remoteError)
  return listAdminAccountLogs(filter)
}
