import {
  educationApplicationDetailPath,
  volunteerApplicationDetailPath,
} from '../../../lib/constants'
import { getMockEducationApplicationById } from '../../applications/lib/mock-applications'
import { isGeneralVolunteerApplication } from '../../applications/lib/application-kind'

function resolveApplicationDetailPath(applicationId: string): string {
  const application = getMockEducationApplicationById(applicationId)
  if (application && isGeneralVolunteerApplication(application)) {
    return volunteerApplicationDetailPath(applicationId)
  }
  return educationApplicationDetailPath(applicationId)
}

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
  return `${resolveApplicationDetailPath(applicationId)}?section=settlement`
}
