import type { DateValue, UUID } from './index'

export interface BugIssueLog {
  id: UUID
  screenName: string
  errorMessage: string
  userName: string
  occurredAt: DateValue
}

export interface BugIssueLogDetail {
  issueId: string
  messageKo: string
  message: string
  apiPath: string
  featureKey: string
  screenKey: string
  actorType: string
  actorTypeLabel: string
}
