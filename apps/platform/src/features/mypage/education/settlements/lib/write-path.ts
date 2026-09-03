import { educationApplicationDetailPath } from '../../../lib/constants'

export function buildSettlementWritePath(options: {
  applicationId: string
  sessionId: string
}): string {
  const params = new URLSearchParams({ sessionId: options.sessionId })
  return `${educationApplicationDetailPath(options.applicationId)}/settlement/write?${params.toString()}`
}

export function buildSettlementConfirmPath(options: {
  applicationId: string
  sessionId: string
}): string {
  const params = new URLSearchParams({ sessionId: options.sessionId })
  return `${educationApplicationDetailPath(options.applicationId)}/settlement/confirm?${params.toString()}`
}

export function buildSettlementTabPath(applicationId: string): string {
  return `${educationApplicationDetailPath(applicationId)}?section=settlement`
}
