/**
 * UJAT 기관·봉사 신청 — Admin API → 화면 row 어댑터
 */

import type { OrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationListItemResponse'
import type { VolunteerApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/volunteerApplicationListItemResponse'
import type { OrganizationApplicationDetailDto } from '@/features/program/general/api/applications-api-client'
import type { UjatInstitutionApplicationRow } from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { UjatInstitutionApplicationDetail } from '@/features/program/ujat/ui/detail-modal/application-institution/detail/detail-types'
import {
  buildEmptyScheduleSlots,
  sumGradeClassCounts,
} from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'
import { getUjatInstitutionApplicationDetail } from '@/features/program/ujat/model/ujat-institution-application'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import type {
  UjatManagerEvaluation,
  UjatVolunteerGrade,
  UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { UJAT_VOLUNTEER_GRADE_OPTIONS } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { projectUjatVolunteerApplicationStatus } from '@/features/program/ujat/lib/normalize-ujat-volunteer-application-status'
import { findUjatEducationRegionKeyByLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import { fromUjatRecruitHalfApi } from '@/features/program/ujat/api/ujat-recruit-half'

function toId(value: number | string | undefined): string {
  if (value == null) return ''
  return String(value)
}

function mapOrgStatusToTempAssignment(
  status?: string | null,
  temporaryAssignmentStatus?: string | null
): UjatInstitutionApplicationRow['tempAssignmentStatus'] {
  const temp = temporaryAssignmentStatus?.trim().toUpperCase() ?? ''
  if (['TEMP_REJECTED', 'TEMPORARY_REJECTED'].includes(temp)) {
    return 'temp_rejected'
  }
  if (
    ['TEMP_ASSIGNED', 'TEMPORARY_ASSIGNED', 'TEMPORARY', 'TEMP_ASSIGNMENT_CONFIRMED'].includes(temp)
  ) {
    return 'temp_assigned'
  }

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

function resolveInstitutionRegionKey(
  dto: OrganizationApplicationListItemResponse,
  options?: {
    regionKey?: UjatInstitutionApplicationRegionKey
    regionLabel?: string
  }
): UjatInstitutionApplicationRegionKey {
  if (options?.regionKey) return options.regionKey
  const label =
    options?.regionLabel?.trim() ||
    [dto.regionSido, dto.regionSigungu].filter(Boolean).join(' ').trim() ||
    ''
  if (label) {
    const matched = findUjatEducationRegionKeyByLabel(label)
    if (matched) return matched as UjatInstitutionApplicationRegionKey
  }
  // sido만으로도 교육 지역 키 매칭 시도
  if (dto.regionSido?.trim()) {
    const matched = findUjatEducationRegionKeyByLabel(dto.regionSido.trim())
    if (matched) return matched as UjatInstitutionApplicationRegionKey
  }
  return 'seoul'
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
  const regionKey = resolveInstitutionRegionKey(dto, options)
  const gradeLabel = dto.grade?.trim() || '신청 학급'

  const gradeClassCounts =
    classCount > 0
      ? [{ gradeLabel, classCount }]
      : ([] as UjatInstitutionApplicationRow['gradeClassCounts'])

  return {
    id: toId(dto.id),
    regionKey,
    no: index + 1,
    institutionName: dto.organizationName?.trim() || '기관명 없음',
    tempAssignmentStatus: mapOrgStatusToTempAssignment(
      dto.applicationStatus,
      dto.temporaryAssignmentStatus
    ),
    gradeClassCounts,
    totalClassCount: sumGradeClassCounts(gradeClassCounts) || classCount,
    scheduleSlots: buildEmptyScheduleSlots(),
    teacherName: dto.teacherName?.trim() || '-',
  }
}

export function enrichUjatInstitutionDetailFromRemote(
  row: UjatInstitutionApplicationRow,
  dto: OrganizationApplicationDetailDto
): UjatInstitutionApplicationDetail {
  const base = getUjatInstitutionApplicationDetail(row)
  const classCount = dto.requestedClassCount ?? row.totalClassCount
  const gradeLabel =
    dto.requestedGrade?.trim() ||
    dto.grade?.trim() ||
    row.gradeClassCounts[0]?.gradeLabel ||
    '신청 학급'
  const studentCount = dto.requestedStudentCount ?? 0

  return {
    ...base,
    address: dto.organizationAddress?.trim() || base.address,
    addressDetail: dto.organizationAddressDetail?.trim() || base.addressDetail,
    otherRequests: dto.managerComment?.trim() || base.otherRequests,
    teacherContact: {
      teacherName: dto.teacherName?.trim() || row.teacherName || base.teacherContact.teacherName,
      tel: base.teacherContact.tel,
      mobile: dto.teacherPhone?.trim() || base.teacherContact.mobile,
      email: dto.teacherEmail?.trim() || base.teacherContact.email,
    },
    gradeBlocks:
      classCount > 0
        ? [
            {
              gradeLabel,
              classCount,
              classes: Array.from({ length: classCount }, (_, index) => ({
                classNo: index + 1,
                studentCount: classCount > 0 ? Math.floor(studentCount / classCount) : 0,
              })),
            },
          ]
        : base.gradeBlocks,
  }
}

function mapManagerEvaluation(value: unknown): UjatManagerEvaluation {
  const raw =
    value && typeof value === 'object' && 'evaluation' in value
      ? (value as { evaluation?: unknown }).evaluation
      : value
  const normalized = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (normalized === 'pass' || normalized === 'neutral' || normalized === 'fail') {
    return normalized
  }
  if (normalized === 'unreviewed' || normalized === '') return 'unreviewed'
  return 'unreviewed'
}

function mapVolunteerGrade(value: unknown): UjatVolunteerGrade {
  const raw = typeof value === 'string' ? value.trim() : ''
  if ((UJAT_VOLUNTEER_GRADE_OPTIONS as readonly string[]).includes(raw)) {
    return raw as UjatVolunteerGrade
  }
  return '1학년'
}

function formatAssignedInterviewFromIso(
  startAt?: string | null,
  endAt?: string | null
): { assignedInterviewDateLabel?: string; assignedInterviewTime?: string } {
  if (!startAt?.trim()) return {}
  const start = new Date(startAt)
  if (Number.isNaN(start.getTime())) return {}
  const y = start.getFullYear()
  const m = String(start.getMonth() + 1).padStart(2, '0')
  const d = String(start.getDate()).padStart(2, '0')
  const hh = String(start.getHours()).padStart(2, '0')
  const mm = String(start.getMinutes()).padStart(2, '0')
  const startLabel = `${hh}:${mm}`
  let timeRange = startLabel
  if (endAt?.trim()) {
    const end = new Date(endAt)
    if (!Number.isNaN(end.getTime())) {
      const eh = String(end.getHours()).padStart(2, '0')
      const em = String(end.getMinutes()).padStart(2, '0')
      timeRange = `${startLabel} ~ ${eh}:${em}`
    }
  }
  return {
    assignedInterviewDateLabel: `${y}.${m}.${d}`,
    assignedInterviewTime: timeRange,
  }
}

function mapInterviewAvailability(
  slots: Array<{ startAt?: string; endAt?: string }> | undefined
): UjatVolunteerApplicantRow['interviewAvailability'] {
  const grouped = new Map<string, string[]>()
  for (const slot of slots ?? []) {
    const startAt = (slot as { startAt?: string }).startAt
    const endAt = (slot as { endAt?: string }).endAt
    if (!startAt?.trim()) continue
    const start = new Date(startAt)
    if (Number.isNaN(start.getTime())) continue
    const y = String(start.getFullYear()).slice(-2)
    const m = String(start.getMonth() + 1).padStart(2, '0')
    const d = String(start.getDate()).padStart(2, '0')
    const weekday = start.toLocaleDateString('ko-KR', { weekday: 'short' })
    const dateLabel = `${y}. ${m}. ${d}(${weekday})`
    const hh = String(start.getHours()).padStart(2, '0')
    const mm = String(start.getMinutes()).padStart(2, '0')
    let timeRange = `${hh}:${mm}`
    if (endAt?.trim()) {
      const end = new Date(endAt)
      if (!Number.isNaN(end.getTime())) {
        const eh = String(end.getHours()).padStart(2, '0')
        const em = String(end.getMinutes()).padStart(2, '0')
        timeRange = `${hh}:${mm} ~ ${eh}:${em}`
      }
    }
    const daySlots = grouped.get(dateLabel) ?? []
    if (!daySlots.includes(timeRange)) daySlots.push(timeRange)
    grouped.set(dateLabel, daySlots)
  }
  return Array.from(grouped, ([dateLabel, daySlots]) => ({ dateLabel, slots: daySlots }))
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

  const enriched = dto as VolunteerApplicationListItemResponse & {
    preferredRegion?: string | null
    preferredActivityRegion?: string | null
    grade?: string | null
    applicationGrade?: string | null
    educationExperience?: string | boolean | null
    hasEducationExperience?: boolean | null
    contact?: string | null
    email?: string | null
    interviewAvailability?: VolunteerApplicationListItemResponse extends {
      interviewAvailability?: infer T
    }
      ? T
      : Array<{ startAt?: string; endAt?: string }>
    interviewAvailabilityCount?: number | null
  }

  const preferredRegion =
    enriched.preferredActivityRegion?.trim() ||
    enriched.preferredRegion?.trim() ||
    '서울'
  const grade = mapVolunteerGrade(enriched.applicationGrade ?? enriched.grade)
  const hasEducationExperience =
    typeof enriched.hasEducationExperience === 'boolean'
      ? enriched.hasEducationExperience
      : typeof enriched.educationExperience === 'boolean'
        ? enriched.educationExperience
        : typeof enriched.educationExperience === 'string'
          ? /yes|있|true|y/i.test(enriched.educationExperience)
          : false

  const assigned = formatAssignedInterviewFromIso(
    dto.assignedInterviewStartAt,
    dto.assignedInterviewEndAt
  )
  const interviewAvailability = mapInterviewAvailability(
    enriched.interviewAvailability as
      | Array<{ startAt?: string; endAt?: string }>
      | undefined
  )
  const interviewEvals = dto.interviewEvaluations ?? []
  const scoreA = interviewEvals.find(item => item.evaluatorOrder === 1)?.score
  const scoreB = interviewEvals.find(item => item.evaluatorOrder === 2)?.score

  return {
    id: toId(dto.id),
    no: index + 1,
    name: dto.memberName?.trim() || '이름 없음',
    grade,
    preferredRegion,
    contact: enriched.contact?.trim() || '-',
    email: enriched.email?.trim() || '-',
    contactRaw: '',
    emailRaw: '',
    hasEducationExperience,
    applicationType: dto.isReparticipation ? 'ujat-graduate' : 'new',
    essayIntro: '',
    essayEducationExperience: '',
    essayNecessity: '',
    essayJaExperience: '',
    managerAEvaluation: mapManagerEvaluation(dto.managerAEvaluation),
    managerBEvaluation: mapManagerEvaluation(dto.managerBEvaluation),
    documentScreeningStatus: projection.documentScreeningStatus,
    interviewSlotCount: enriched.interviewAvailabilityCount ?? interviewAvailability.length,
    interviewAssignmentStatus:
      dto.interviewAssignmentStatus?.trim().toUpperCase() === 'ASSIGNED'
        ? 'assigned'
        : projection.interviewAssignmentStatus,
    programId: toId(dto.programId) || programId,
    half: fromUjatRecruitHalfApi(dto.recruitHalf, half),
    englishName: '',
    id1365: '',
    gender: '',
    birthDate: '',
    age: 0,
    universityName: '',
    major: '',
    applicationRoute: '',
    interviewAvailability,
    secondInterviewScreeningStatus: projection.secondInterviewScreeningStatus,
    scheduleChangeCancelCount: 0,
    managerAScore: typeof scoreA === 'number' ? scoreA : null,
    managerBScore: typeof scoreB === 'number' ? scoreB : null,
    totalScore:
      typeof scoreA === 'number' && typeof scoreB === 'number'
        ? scoreA + scoreB
        : typeof scoreA === 'number'
          ? scoreA
          : typeof scoreB === 'number'
            ? scoreB
            : null,
    ...assigned,
  }
}
