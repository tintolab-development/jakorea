import {
  CERTIFICATE_ISSUE_PRIVACY_ACCESS_PURPOSE,
  invalidatePrivacyAccessLogsAfterCertificateIssue,
} from '@/features/logs/lib/certificate-issue-privacy-access'
import {
  mapApiBirthDateToDisplay,
  mapStudentRosterResponseToRows,
} from '@/features/program/general/api/adapters/student-roster-adapters'
import {
  unmaskIndividualApplicationPrivacyRemote,
  unmaskInstructorApplicationPrivacyRemote,
  unmaskVolunteerApplicationPrivacyRemote,
} from '@/features/program/general/api/applications-api-client'
import { fetchOrganizationStudentRosterPrivacyDetail } from '@/features/program/general/api/student-roster-api-client'
import { mapIndividualApplicationDetailToParticipatingRow } from '@/features/program/general/lib/participating-individual-application-detail'
import { mapInstructorApplicationDetailToParticipatingRow } from '@/features/program/general/lib/participating-instructor-application-detail'
import { mapVolunteerApplicationDetailToParticipatingRow } from '@/features/program/general/lib/participating-volunteer-application-detail'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import { fetchMemberRolePrivacyUnmask } from '@/features/user/api/member-privacy-unmask'
import type { UserRole } from '@/types/user'

export type CertificateIssueUnmaskedPerson = {
  name?: string
  birthDate?: string
}

function readTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

export function extractCertificateIssuePersonFromUnmaskPayload(
  payload: unknown
): CertificateIssueUnmaskedPerson {
  const root = asRecord(payload)
  if (root == null) return {}
  const member = asRecord(root.member)
  const profile = asRecord(root.profile)
  const name =
    readTrimmedString(root.name) ??
    readTrimmedString(root.instructorName) ??
    readTrimmedString(member?.name) ??
    readTrimmedString(profile?.name)
  const rawBirthDate =
    readTrimmedString(root.birthDate) ??
    readTrimmedString(member?.birthDate) ??
    readTrimmedString(profile?.birthDate)
  return {
    ...(name ? { name } : {}),
    ...(rawBirthDate ? { birthDate: mapApiBirthDateToDisplay(rawBirthDate) ?? rawBirthDate } : {}),
  }
}

function parseOptionalProgramId(programId?: string | number | null): number | undefined {
  if (programId == null || programId === '') return undefined
  const parsed = typeof programId === 'number' ? programId : Number(programId)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined
}

function parseOptionalMemberId(memberId?: string | number | null): number | undefined {
  if (memberId == null || memberId === '') return undefined
  const parsed = typeof memberId === 'number' ? memberId : Number(memberId)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined
}

export async function unmaskMemberForCertificateIssue(
  memberId: number,
  role?: UserRole
): Promise<CertificateIssueUnmaskedPerson> {
  const payload = await fetchMemberRolePrivacyUnmask(
    memberId,
    CERTIFICATE_ISSUE_PRIVACY_ACCESS_PURPOSE,
    role
  )
  invalidatePrivacyAccessLogsAfterCertificateIssue()
  return extractCertificateIssuePersonFromUnmaskPayload(payload)
}

export async function unmaskRosterStudentForCertificateIssue(input: {
  applicationId: string | number
  rosterId: number
}): Promise<Pick<SchoolDetailStudentRow, 'name' | 'birthDate'>> {
  const response = await fetchOrganizationStudentRosterPrivacyDetail(input.applicationId)
  invalidatePrivacyAccessLogsAfterCertificateIssue()
  const row = mapStudentRosterResponseToRows(response).find(
    item => item.serverRosterId === input.rosterId
  )
  if (row == null) {
    throw new Error('학생 명단 원문 정보를 찾을 수 없습니다.')
  }
  return {
    name: row.name,
    birthDate: row.birthDate,
  }
}

export async function unmaskIndividualParticipantForCertificateIssue(
  participant: ParticipatingIndividualParticipantRow
): Promise<ParticipatingIndividualParticipantRow> {
  const applicationId = participant.individualApplicationId?.trim()
  if (applicationId) {
    const dto = await unmaskIndividualApplicationPrivacyRemote(
      applicationId,
      CERTIFICATE_ISSUE_PRIVACY_ACCESS_PURPOSE
    )
    invalidatePrivacyAccessLogsAfterCertificateIssue()
    return mapIndividualApplicationDetailToParticipatingRow(dto, participant)
  }

  const memberId = parseOptionalMemberId(participant.memberId)
  if (memberId != null) {
    const person = await unmaskMemberForCertificateIssue(memberId, 'INDIVIDUAL')
    return {
      ...participant,
      ...(person.name ? { applicantName: person.name } : {}),
      detail: {
        ...participant.detail,
        ...(person.birthDate ? { birthDate: person.birthDate } : {}),
      },
    }
  }

  return participant
}

export async function unmaskInstructorForCertificateIssue(
  instructor: ParticipatingInstructorRow,
  programId?: string | number | null
): Promise<ParticipatingInstructorRow> {
  const applicationId = instructor.instructorApplicationId?.trim()
  if (applicationId) {
    const dto = await unmaskInstructorApplicationPrivacyRemote(
      applicationId,
      CERTIFICATE_ISSUE_PRIVACY_ACCESS_PURPOSE,
      parseOptionalProgramId(programId)
    )
    invalidatePrivacyAccessLogsAfterCertificateIssue()
    return mapInstructorApplicationDetailToParticipatingRow(dto, instructor, String(programId ?? ''))
  }

  const memberId = parseOptionalMemberId(instructor.memberId)
  if (memberId != null) {
    const person = await unmaskMemberForCertificateIssue(memberId, 'INSTRUCTOR')
    return {
      ...instructor,
      ...(person.name ? { instructorName: person.name } : {}),
      ...(person.birthDate ? { birthDate: person.birthDate } : {}),
    }
  }

  return instructor
}

export async function unmaskVolunteerForCertificateIssue(
  volunteer: ParticipatingVolunteerRow,
  programId?: string | number | null
): Promise<ParticipatingVolunteerRow> {
  const applicationId = volunteer.volunteerApplicationId?.trim()
  if (applicationId) {
    const dto = await unmaskVolunteerApplicationPrivacyRemote(
      applicationId,
      CERTIFICATE_ISSUE_PRIVACY_ACCESS_PURPOSE,
      parseOptionalProgramId(programId)
    )
    invalidatePrivacyAccessLogsAfterCertificateIssue()
    return mapVolunteerApplicationDetailToParticipatingRow(dto, volunteer)
  }

  const memberId = parseOptionalMemberId(volunteer.memberId)
  if (memberId != null) {
    const person = await unmaskMemberForCertificateIssue(memberId)
    return {
      ...volunteer,
      ...(person.name ? { volunteerName: person.name } : {}),
      ...(person.birthDate ? { birthDate: person.birthDate } : {}),
    }
  }

  return volunteer
}
