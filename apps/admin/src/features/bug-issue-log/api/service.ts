import type {
  BugIssueListFilter,
  BugIssueListResult,
} from '@/entities/bug-issue-log/model/types'
import { shouldUseBugIssueLogRemoteApi } from './capabilities'
import { listBugIssueLogs } from './store'

const remoteError = 'Bug issue log remote API is not implemented yet'

export async function listBugIssueLogsService(
  filter: BugIssueListFilter
): Promise<BugIssueListResult> {
  if (shouldUseBugIssueLogRemoteApi()) throw new Error(remoteError)
  return listBugIssueLogs(filter)
}
