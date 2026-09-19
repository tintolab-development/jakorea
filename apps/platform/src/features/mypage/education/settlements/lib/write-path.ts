import {
  educationApplicationDetailPath,
  lectureApplicationDetailPath,
  volunteerApplicationDetailPath,
} from '../../../lib/constants'
import { getMockEducationApplicationById } from '../../applications/lib/mock-applications'
import {
  isInstructorRoleApplication,
  isVolunteerRoleApplication,
} from '../../applications/lib/application-kind'

function resolveApplicationDetailPath(applicationId: string): string {
  const application = getMockEducationApplicationById(applicationId)
  if (application && isVolunteerRoleApplication(application)) {
    return volunteerApplicationDetailPath(applicationId)
  }
  if (application && isInstructorRoleApplication(application)) {
    return lectureApplicationDetailPath(applicationId)
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
