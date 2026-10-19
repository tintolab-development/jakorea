/**
 * UJAT 기관·봉사 신청 — Admin API → 화면 row 어댑터
 */

import {
  parseUjatScheduleConfirmStatus,
  type UjatOrganizationApplicationDetail as OrganizationApplicationDetailDto,
  type UjatOrganizationApplicationListItem as OrganizationApplicationListItemResponse,
  type UjatVolunteerApplicationListItem as VolunteerApplicationListItemResponse,
} from '@/features/program/ujat/api/ujat-applications-contract'
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
import { findUjatEducationRegionKeyByCode } from '@/features/program/ujat/lib/ujat-education-regions'
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

const UNRESOLVED_REGION_KEY = '' as UjatInstitutionApplicationRegionKey

function resolveInstitutionRegionKey(
  dto: OrganizationApplicationListItemResponse,
  options?: {
    regionKey?: UjatInstitutionApplicationRegionKey
  }
): UjatInstitutionApplicationRegionKey {
  if (options?.regionKey) return options.regionKey
  const matched = findUjatEducationRegionKeyByCode(dto.educationRegionCode)
  return (matched as UjatInstitutionApplicationRegionKey | undefined) ?? UNRESOLVED_REGION_KEY
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
    scheduleConfirmStatus: parseUjatScheduleConfirmStatus(dto.scheduleConfirmStatus),
    assignedInstructorCount: dto.assignedInstructorCount ?? null,
    operatingStudentCount: dto.operatingStudentCount ?? null,
  }
}

/**
 * 목록 캐시에 없는 deep link도 상세 GET만으로 표시할 수 있도록
 * 기관 신청 상세 DTO를 UJAT 목록 행 형태로 투영한다.
 * 상세 DTO를 목록 응답으로 대체하는 것이 아니라, 화면 식별자·상태 표시용 projection이다.
 */
export function mapOrganizationApplicationDetailToUjatInstitutionRow(
  dto: OrganizationApplicationDetailDto,
  index = 0
): UjatInstitutionApplicationRow {
  return mapOrganizationApplicationToUjatInstitutionRow(
    {
      id: dto.id,
      programId: dto.programId,
      organizationName: dto.organizationName,
      teacherName: dto.teacherName,
      applicationStatus: dto.applicationStatus,
      requestedClassCount: dto.requestedClassCount,
      availableActions: dto.availableActions ?? [],
      grade: dto.requestedGrade ?? dto.grade,
      regionSido: dto.regionSido,
      regionSigungu: dto.regionSigungu,
      educationRegionCode: dto.educationRegionCode,
      temporaryAssignmentStatus: dto.temporaryAssignmentStatus,
      scheduleConfirmStatus: dto.scheduleConfirmStatus,
      assignedInstructorCount: dto.assignedInstructorCount,
      operatingStudentCount: dto.operatingStudentCount,
      sessions: [],
      preferredEducationSchedules: [],
    },
    index
  )
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

  const remoteGradeBlocks = mapRemoteGradeBlocks(dto.gradeBlocks, studentCount)
  const remoteClassTimeRows = mapRemoteClassTimeRows(dto.classTimeRows)

  const hasField = (key: keyof OrganizationApplicationDetailDto): boolean =>
    Object.prototype.hasOwnProperty.call(dto, key)
  const stringField = (key: keyof OrganizationApplicationDetailDto, fallback: string): string => {
    if (!hasField(key)) return fallback
    const value = dto[key]
    return typeof value === 'string' ? value.trim() : ''
  }

  return {
    ...base,
    address: stringField('organizationAddress', base.address),
    addressDetail: stringField('organizationAddressDetail', base.addressDetail),
    otherRequests: stringField('managerComment', base.otherRequests),
    teacherContact: {
      teacherName: stringField('teacherName', row.teacherName || base.teacherContact.teacherName),
      tel: stringField('teacherTel', base.teacherContact.tel),
      mobile: stringField('teacherPhone', base.teacherContact.mobile),
      email: stringField('teacherEmail', base.teacherContact.email),
    },
    preferredEducationDates: hasField('preferredEducationDates')
      ? dto.preferredEducationDates ?? []
      : base.preferredEducationDates,
    classTimeRows: remoteClassTimeRows ?? base.classTimeRows,
    gradeBlocks:
      remoteGradeBlocks ??
      (classCount > 0
        ? [
            {
              gradeLabel,
              classCount,
              classes: Array.from({ length: classCount }, (_, index) => ({
                classNo: index + 1,
                studentCount: classCount === 1 ? studentCount : 0,
              })),
            },
          ]
        : base.gradeBlocks),
  }
}

/** `classes`가 비어 있으면 총원을 나누지 않는다 — 학급 1개면 총원, 2개 이상이면 0 */
function mapRemoteGradeBlocks(
  blocks: OrganizationApplicationDetailDto['gradeBlocks'],
  totalStudentCount: number
): UjatInstitutionApplicationDetail['gradeBlocks'] | null {
  if (!blocks) return null
  const singleBlock = blocks.length === 1
  return blocks.map(block => {
    const classCount = block.classCount ?? 0
    const classes = (block.classes ?? []).map((room, index) => {
      const parsedNo = Number(room.classNo)
      return {
        classNo: Number.isFinite(parsedNo) && parsedNo > 0 ? parsedNo : index + 1,
        studentCount: room.studentCount ?? 0,
      }
    })
    return {
      gradeLabel: block.gradeLabel?.trim() || '-',
      classCount,
      classes:
        classes.length > 0
          ? classes
          : Array.from({ length: classCount }, (_, index) => ({
              classNo: index + 1,
              studentCount: singleBlock && classCount === 1 ? totalStudentCount : 0,
            })),
    }
  })
}

function mapRemoteClassTimeRows(
  rows: OrganizationApplicationDetailDto['classTimeRows']
): UjatInstitutionApplicationDetail['classTimeRows'] | null {
  if (!rows) return null
  return rows.flatMap(row => {
    const periods = row.periods ?? []
    if (periods.length !== 4) return []
    return [
      {
        gradeRangeLabel: row.gradeRangeLabel?.trim() || '-',
        periods: [periods[0]!, periods[1]!, periods[2]!, periods[3]!] as const,
      },
    ]
  })
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

function mapVolunteerGrade(value: unknown): UjatVolunteerGrade | '' {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  const raw = trimmed === '휴학' ? '휴학생' : trimmed
  if ((UJAT_VOLUNTEER_GRADE_OPTIONS as readonly string[]).includes(raw)) {
    return raw as UjatVolunteerGrade
  }
  return ''
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
    reserveRank: dto.reserveRank ?? undefined,
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
    enriched.preferredActivityRegion?.trim() || enriched.preferredRegion?.trim() || ''
  const grade = mapVolunteerGrade(enriched.applicationGrade ?? enriched.grade)
  const hasEducationExperience =
    typeof enriched.hasEducationExperience === 'boolean'
      ? enriched.hasEducationExperience
      : typeof enriched.educationExperience === 'boolean'
        ? enriched.educationExperience
        : typeof enriched.educationExperience === 'string'
          ? /yes|있|true|y/i.test(enriched.educationExperience)
          : null

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
  const slotScore = (
    item: { score?: number | null; scoreTotal?: number | null } | undefined
  ): number | null => {
    const raw = item?.score ?? item?.scoreTotal
    return typeof raw === 'number' ? raw : null
  }
  const scoreA = slotScore(interviewEvals.find(item => item.evaluatorOrder === 1))
  const scoreB = slotScore(interviewEvals.find(item => item.evaluatorOrder === 2))

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
    ...(dto.interviewAssignmentId != null
      ? { interviewAssignmentId: dto.interviewAssignmentId }
      : {}),
    englishName: '',
    ...(dto.memberId != null ? { memberId: String(dto.memberId) } : {}),
    id1365: dto.id1365?.trim() || '',
    gender: '',
    birthDate: dto.birthDate?.trim() || '',
    age: 0,
    universityName: '',
    major: '',
    applicationRoute: '',
    interviewAvailability,
    secondInterviewScreeningStatus: projection.secondInterviewScreeningStatus,
    scheduleChangeCancelCount: 0,
    managerAScore: scoreA,
    managerBScore: scoreB,
    totalScore:
      scoreA != null && scoreB != null ? scoreA + scoreB : scoreA != null ? scoreA : scoreB,
    ...assigned,
  }
}
