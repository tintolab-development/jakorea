import type {
  MemberLoginListFilter,
  MemberLoginListResult,
} from '@/entities/member-login-log/model/types'
import { shouldUseMemberLoginLogRemoteApi } from './capabilities'
import { listMemberLoginLogs } from './store'

const remoteError = 'Member login log remote API is not implemented yet'

export async function listMemberLoginLogsService(
  filter: MemberLoginListFilter
): Promise<MemberLoginListResult> {
  if (shouldUseMemberLoginLogRemoteApi()) throw new Error(remoteError)
  return listMemberLoginLogs(filter)
}
