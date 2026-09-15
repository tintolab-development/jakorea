/**
 * UJAT 기관·봉사 신청 — Admin API → 화면 row 어댑터
 */

import type { OrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationListItemResponse'
import type { VolunteerApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/volunteerApplicationListItemResponse'
import type { UjatInstitutionApplicationRow } from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import {
  buildEmptyScheduleSlots,
  sumGradeClassCounts,
} from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { projectUjatVolunteerApplicationStatus } from '@/features/program/ujat/lib/normalize-ujat-volunteer-application-status'
import { findUjatEducationRegionKeyByLabel } from '@/features/program/ujat/lib/ujat-education-regions'

function toId(value: number | string | undefined): string {
  if (value == null) return ''
  return String(value)
}

function mapOrgStatusToTempAssignment(
  status?: string
): UjatInstitutionApplicationRow['tempAssignmentStatus'] {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (['REJECTED', 'AUTO_REJECTED', 'CANCELLED'].includes(normalized)) {
    return 'application_rejected'
  }
  if (['TEMP_REJECTED', 'TEMPORARY_REJECTED'].includes(normalized)) {
    return 'temp_rejected'
  }
  if (
    ['APPROVED', 'ASSIGNED', 'TEMP_ASSIGNED', 'TEMPORARY_ASSIGNED', 'WAITING_ASSIGNMENT'].includes(
      normalized
    )
  ) {
    return 'temp_assigned'
  }
  return 'evaluation_pending'
}

/**
 * roster/class assignment가 없으면 신청 건수만으로 표 행을 채움.
 * grade/className/studentCount는 roster SSOT — 목록 DTO만으로는 학년 분해 불가.
 */
export function mapOrganizationApplicationToUjatInstitutionRow(
  dto: OrganizationApplicationListItemResponse,
  index: number,
  options?: {
    regionKey?: UjatInstitutionApplicationRegionKey
    regionLabel?: string
  }
): UjatInstitutionApplicationRow {
  const classCount = dto.requestedClassCount ?? 0
  const regionKey = (options?.regionKey ??
    (options?.regionLabel
      ? findUjatEducationRegionKeyByLabel(options.regionLabel) ?? 'seoul'
      : 'seoul')) as UjatInstitutionApplicationRegionKey

  const gradeClassCounts =
    classCount > 0
      ? [{ gradeLabel: '신청 학급', classCount }]
      : ([] as UjatInstitutionApplicationRow['gradeClassCounts'])

  return {
    id: toId(dto.id),
    regionKey,
    no: index + 1,
    institutionName: dto.organizationName?.trim() || '기관명 없음',
    tempAssignmentStatus: mapOrgStatusToTempAssignment(dto.applicationStatus),
    gradeClassCounts,
    totalClassCount: sumGradeClassCounts(gradeClassCounts) || classCount,
    scheduleSlots: buildEmptyScheduleSlots(),
    teacherName: dto.teacherName?.trim() || '-',
  }
}

export function mapVolunteerApplicationToUjatApplicantRow(
  dto: VolunteerApplicationListItemResponse,
  index: number,
  programId: string,
  half: UjatVolunteerRecruitHalf
): UjatVolunteerApplicantRow {
  const projection = projectUjatVolunteerApplicationStatus({
    applicationStatus: dto.applicationStatus,
    documentStatus: dto.documentStatus,
    interviewStatus: dto.interviewStatus,
    finalResultStatus: dto.finalResultStatus,
    reserveRank: dto.reserveRank,
    giveUpYn: dto.giveUpYn,
  })

  return {
    id: toId(dto.id),
    no: index + 1,
    name: dto.memberName?.trim() || '이름 없음',
    grade: '1학년',
    preferredRegion: '서울',
    contact: '',
    email: '',
    contactRaw: '',
    emailRaw: '',
    hasEducationExperience: false,
    applicationType: dto.isReparticipation ? 'ujat-graduate' : 'new',
    essayIntro: '',
    essayEducationExperience: '',
    essayNecessity: '',
    essayJaExperience: '',
    managerAEvaluation: 'unreviewed',
    managerBEvaluation: 'unreviewed',
    documentScreeningStatus: projection.documentScreeningStatus,
    interviewSlotCount: 0,
    interviewAssignmentStatus: projection.interviewAssignmentStatus,
    programId: toId(dto.programId) || programId,
    half,
    englishName: '',
    id1365: '',
    gender: '',
    birthDate: '',
    age: 0,
    universityName: '',
    major: '',
    applicationRoute: '',
    interviewAvailability: [],
    secondInterviewScreeningStatus: projection.secondInterviewScreeningStatus,
    scheduleChangeCancelCount: 0,
  }
}
