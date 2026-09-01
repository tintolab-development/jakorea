import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'

/** UJAT 면접일 배정 모달이 요구하는 필드만 겹치므로 general row를 모달용으로 변환 */
export function toInterviewAssignModalApplicant(
  row: GeneralVolunteerApplicantRow,
  options?: { clearExistingAssignment?: boolean }
): UjatVolunteerApplicantRow {
  const applicant = row as unknown as UjatVolunteerApplicantRow
  if (!options?.clearExistingAssignment) return applicant
  return {
    ...applicant,
    assignedInterviewDateLabel: undefined,
    assignedInterviewTime: undefined,
  }
}

export function toInterviewAssignModalApplicants(
  rows: GeneralVolunteerApplicantRow[]
): UjatVolunteerApplicantRow[] {
  return rows as unknown as UjatVolunteerApplicantRow[]
}
