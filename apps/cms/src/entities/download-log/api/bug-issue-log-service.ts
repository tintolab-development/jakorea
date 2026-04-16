import { mockBugIssueLogs } from '@/data/mock/bug-issue-logs'
import type { BugIssueLog } from '@/types/bug-issue-log'

export async function getBugIssueLogs(): Promise<BugIssueLog[]> {
  await new Promise(resolve => setTimeout(resolve, 120))

  const logs = [...mockBugIssueLogs]
  logs.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
  return logs
}
