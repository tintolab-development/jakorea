import type {
  PiiAccessListFilter,
  PiiAccessListResult,
} from '@/entities/pii-access-log/model/types'
import { shouldUsePiiAccessLogRemoteApi } from './capabilities'
import { listPiiAccessLogs } from './store'

const remoteError = 'PII access log remote API is not implemented yet'

export async function listPiiAccessLogsService(
  filter: PiiAccessListFilter
): Promise<PiiAccessListResult> {
  if (shouldUsePiiAccessLogRemoteApi()) throw new Error(remoteError)
  return listPiiAccessLogs(filter)
}
