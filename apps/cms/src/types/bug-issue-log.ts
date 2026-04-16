import type { DateValue, UUID } from './index'

export interface BugIssueLog {
  id: UUID
  screenName: string
  errorMessage: string
  userName: string
  occurredAt: DateValue
}
