import type { InstructorApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationListItemResponse'
import type { OrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationListItemResponse'
import type { ParticipantListItemResponse } from '@/shared/api/generated/dashboard/schemas/participantListItemResponse'

const emptyParticipantRequired: Pick<
  ParticipantListItemResponse,
  'availableActions' | 'sessions' | 'assignmentInstructors' | 'assignedOrganizationNames'
> = {
  availableActions: [],
  sessions: [],
  assignmentInstructors: [],
  assignedOrganizationNames: [],
}

export function participantListItemFixture(
  partial: Partial<ParticipantListItemResponse>
): ParticipantListItemResponse {
  return { ...emptyParticipantRequired, ...partial } as ParticipantListItemResponse
}

const emptyInstructorRequired: Pick<
  InstructorApplicationListItemResponse,
  'availableScheduleIds' | 'preferredOrganizations' | 'availableActions'
> = {
  availableScheduleIds: [],
  preferredOrganizations: [],
  availableActions: [],
}

export function instructorApplicationListItemFixture(
  partial: Partial<InstructorApplicationListItemResponse> & Record<string, unknown>
): InstructorApplicationListItemResponse {
  return { ...emptyInstructorRequired, ...partial } as InstructorApplicationListItemResponse
}

const emptyOrganizationRequired: Pick<
  OrganizationApplicationListItemResponse,
  'availableActions' | 'sessions' | 'preferredEducationSchedules'
> = {
  availableActions: [],
  sessions: [],
  preferredEducationSchedules: [],
}

export function organizationApplicationListItemFixture(
  partial: Partial<OrganizationApplicationListItemResponse>
): OrganizationApplicationListItemResponse {
  return { ...emptyOrganizationRequired, ...partial } as OrganizationApplicationListItemResponse
}
