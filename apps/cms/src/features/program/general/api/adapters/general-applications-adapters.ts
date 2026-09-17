import type {
  ApplicantApprovalStatusKey,
  ApplicantSchoolRow,
} from '@/features/program/shared/model/applicant-institution'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { OrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationListItemResponse'
import type { OrganizationApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationDetailResponse'
import type { InstructorApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationListItemResponse'
import type { InstructorApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationDetailResponse'
import type { IndividualApplicationListItemEnriched } from '@/features/program/general/api/individual-application-screening-api-types'
import type { ParticipantListItemResponse } from '@/shared/api/generated/dashboard/schemas/participantListItemResponse'
import type { VolunteerApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/volunteerApplicationListItemResponse'
import type { VolunteerApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/volunteerApplicationDetailResponse'
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'
import type { InterviewAvailabilitySlot } from '@/shared/api/generated/dashboard/schemas/interviewAvailabilitySlot'
import type { PreferredEducationScheduleResponse } from '@/shared/api/generated/dashboard/schemas/preferredEducationScheduleResponse'
import type { IndividualApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/individualApplicationDetailResponse'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import { INSTRUCTOR_SETTLEMENT_STATUS_ORDER } from '@/shared/constants/instructor-settlement-status'
import type {
  GeneralDocumentScreeningStatus,
  GeneralInterviewAssignmentStatus,
  GeneralManagerEvaluation,
  GeneralSecondInterviewScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'
import {
  formatRequestedSchedulesPeriodLabel,
  mapRequestedSchedulesToSessions,
} from '@/features/program/1c-1s/lib/map-requested-schedules'
import {
  resolveStoredAffiliation,
} from '@/features/program/general/lib/affiliation-organization'

function toId(value: number | string | undefined): string {
  if (value == null) return ''
  return String(value)
}

type IndividualApplicationDetailEnriched = Omit<
  IndividualApplicationDetailResponse,
  'profile' | 'application'
> & {
  profile?: NonNullable<IndividualApplicationDetailResponse['profile']> & {
    schoolEnrollmentStatus?: string
    affiliationSchool?: string
    affiliationGrade?: string
    homeAddress?: string
  }
  application?: NonNullable<IndividualApplicationDetailResponse['application']> & {
    selfIntroduction?: string
    preferredEducationSchedules?: PreferredEducationScheduleResponse[]
  }
}

export function mapApiApplicationStatusToApprovalStatus(
  status?: string
): ApplicantApprovalStatusKey {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (['APPROVED', 'ASSIGNED', 'WAITING_ASSIGNMENT'].includes(normalized)) {
    return 'approved'
  }
  if (['REJECTED', 'AUTO_REJECTED', 'CANCELLED'].includes(normalized)) {
    return 'rejected'
  }
  return 'pending'
}

export function mapApprovalStatusToApiFilter(
  status?: ApplicantApprovalStatusKey
): string | undefined {
  if (!status) return undefined
  switch (status) {
    case 'approved':
      return 'APPROVED'
    case 'rejected':
      return 'REJECTED'
    case 'pending':
      return 'WAITING_REVIEW'
    default:
      return undefined
  }
}

export function mapOrganizationApplicationToApplicantSchoolRow(
  dto: OrganizationApplicationListItemResponse,
  index: number,
  programId: string,
  options?: {
    requestedSchedules?: RequestedScheduleResponse[]
  }
): ApplicantSchoolRow {
  const sessions = mapRequestedSchedulesToSessions(options?.requestedSchedules)
  const desiredEducationPeriod = formatRequestedSchedulesPeriodLabel(options?.requestedSchedules)

  return {
    id: toId(dto.id),
    organizationId: dto.organizationId ?? undefined,
    teacherMemberId: dto.teacherMemberId,
    no: index + 1,
    schoolName: dto.organizationName?.trim() || '기관명 없음',
    region: [dto.regionSido, dto.regionSigungu].filter(Boolean).join(' '),
    educationGrade: dto.grade?.trim() || '',
    classCount: dto.requestedClassCount ?? 0,
    studentCount: dto.requestedStudentCount ?? 0,
    teacherName: dto.teacherName?.trim() || '-',
    appliedAt: dto.submittedAt,
    approvalStatus: mapApiApplicationStatusToApprovalStatus(dto.applicationStatus),
    programId,
    sessions,
    desiredEducationPeriod,
  }
}

export function mapOrganizationApplicationDetailToApplicantSchoolRow(
  dto: OrganizationApplicationDetailResponse,
  base: ApplicantSchoolRow
): ApplicantSchoolRow {
  return {
    ...base,
    id: toId(dto.id) || base.id,
    organizationId: dto.organizationId ?? base.organizationId,
    teacherMemberId: dto.teacherMemberId ?? base.teacherMemberId,
    schoolName: dto.organizationName?.trim() || base.schoolName,
    region: dto.organizationAddress?.trim() || base.region,
    educationGrade: dto.requestedGrade?.trim() || base.educationGrade,
    classCount: dto.requestedClassCount ?? base.classCount,
    studentCount: dto.requestedStudentCount ?? base.studentCount,
    teacherName: dto.teacherName?.trim() || base.teacherName,
    contact: dto.teacherPhone?.trim() || base.contact,
    appliedAt: dto.submittedAt ?? base.appliedAt,
    approvalStatus: mapApiApplicationStatusToApprovalStatus(dto.applicationStatus),
    participationRejectionReason: dto.rejectReason?.trim() || base.participationRejectionReason,
    detail: {
      ...base.detail,
      addressDetail: dto.organizationAddressDetail?.trim() || base.detail?.addressDetail,
      educationType: dto.requestedEducationFormat?.trim() || base.detail?.educationType,
      textbookId: toId(dto.textbookId) || base.detail?.textbookId,
      textbookName: dto.textbookName?.trim() || base.detail?.textbookName,
      teacherInfo:
        [dto.teacherName, dto.teacherPhone, dto.teacherEmail]
          .map(value => value?.trim())
          .filter(Boolean)
          .join(' | ') || base.detail?.teacherInfo,
    },
  }
}

function formatJaEvaluationGradeLabel(raw?: string | null): string | undefined {
  const trimmed = raw?.trim()
  if (!trimmed) return undefined
  return trimmed.replace(/등급$/, '')
}

export function mapInstructorApplicationToApplicantInstructorRow(
  dto: InstructorApplicationListItemResponse,
  index: number,
  programId: string
): ApplicantInstructorRow {
  const affiliation = resolveStoredAffiliation({
    affiliationOrganizationId: dto.affiliationOrganizationId,
  })
  return {
    id: toId(dto.id),
    instructorMemberId:
      dto.instructorMemberId != null && Number.isFinite(dto.instructorMemberId)
        ? dto.instructorMemberId
        : undefined,
    affiliationOrganizationId: affiliation.affiliationOrganizationId,
    programId: toId(dto.programId) || programId,
    no: index + 1,
    instructorName: dto.instructorName?.trim() || '이름 없음',
    lectureExperienceYears:
      typeof dto.jaLectureExperienceYears === 'number' &&
      Number.isFinite(dto.jaLectureExperienceYears)
        ? dto.jaLectureExperienceYears
        : 0,
    educationLevel: '',
    educationSchoolName: '',
    contact: dto.contact?.trim() || '',
    email: dto.email?.trim() || '',
    address: dto.homeAddress?.trim() || '',
    appliedAt: dto.submittedAt,
    schoolName: '',
    approvalStatus: mapApiApplicationStatusToApprovalStatus(dto.applicationStatus),
    evaluationGrade: formatJaEvaluationGradeLabel(dto.jaEvaluationGrade),
    instructorFeeGradeLabel: dto.instructorFeeGradeSnapshot?.trim() || undefined,
    rejectionReason: dto.rejectReason?.trim() || undefined,
    distanceKm: dto.distanceKm,
    longDistanceYn: dto.longDistance,
    availableActions: dto.availableActions,
  }
}

export function mapInstructorApplicationDetailToApplicantRow(
  dto: InstructorApplicationDetailResponse,
  base: ApplicantInstructorRow
): ApplicantInstructorRow {
  const preferredScheduleSlots =
    dto.availableScheduleSlots
      ?.map(slot => {
        const scheduleId = slot.scheduleId
        if (scheduleId == null || !Number.isFinite(scheduleId)) return null
        return {
          slotKey: String(scheduleId),
          assignable: slot.assignable !== false,
        }
      })
      .filter((slot): slot is { slotKey: string; assignable: boolean } => slot != null) ??
    base.preferredScheduleSlots

  return {
    ...base,
    id: toId(dto.id) || base.id,
    instructorMemberId:
      dto.instructorMemberId != null && Number.isFinite(dto.instructorMemberId)
        ? dto.instructorMemberId
        : base.instructorMemberId,
    programId: toId(dto.programId) || base.programId,
    instructorName: dto.instructorName?.trim() || base.instructorName,
    lectureExperienceYears:
      typeof dto.jaLectureExperienceYears === 'number' &&
      Number.isFinite(dto.jaLectureExperienceYears)
        ? dto.jaLectureExperienceYears
        : base.lectureExperienceYears,
    educationLevel: dto.educationLevel?.trim() || base.educationLevel,
    educationSchoolName: dto.educationSchoolName?.trim() || base.educationSchoolName,
    contact: dto.contact?.trim() || base.contact,
    email: dto.email?.trim() || base.email,
    address:
      [dto.homeAddress, dto.homeAddressDetail]
        .map(part => part?.trim())
        .filter(Boolean)
        .join(' ') || base.address,
    appliedAt: dto.submittedAt ?? base.appliedAt,
    affiliation: dto.affiliation?.trim() || base.affiliation,
    approvalStatus: mapApiApplicationStatusToApprovalStatus(dto.applicationStatus),
    evaluationGrade: formatJaEvaluationGradeLabel(dto.jaEvaluationGrade) ?? base.evaluationGrade,
    instructorFeeGradeLabel: dto.instructorFeeGradeSnapshot?.trim() || base.instructorFeeGradeLabel,
    teachingExperience: dto.teachingExperience?.trim() || base.teachingExperience,
    oneLineIntro: dto.oneLineIntro?.trim() || base.oneLineIntro,
    nameHanja: dto.nameHanja?.trim() || base.nameHanja,
    nameEnglish: dto.nameEnglish?.trim() || base.nameEnglish,
    birthDate: dto.birthDate?.trim() || base.birthDate,
    gender: dto.gender?.trim() || base.gender,
    rejectionReason: dto.rejectReason?.trim() || base.rejectionReason,
    distanceKm: dto.distanceKm ?? base.distanceKm,
    longDistanceYn: dto.longDistance ?? base.longDistanceYn,
    managerComment: dto.managerComment ?? base.managerComment,
    availableActions: dto.availableActions ?? base.availableActions,
    preferredScheduleSlots,
  }
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

function formatKoreanInterviewDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''
  return `${value('year')}. ${value('month')}. ${value('day')}(${value('weekday')})`
}

function formatKoreanInterviewTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''
  return `${value('hour')}:${value('minute')}`
}

function mapInterviewAvailabilitySlots(
  slots: InterviewAvailabilitySlot[] | undefined
): NonNullable<NonNullable<GeneralIndividualApplicantRow['detail']>['interviewAvailability']> {
  const grouped = new Map<string, string[]>()
  for (const slot of slots ?? []) {
    if (!slot.startAt || !slot.endAt) continue
    const start = new Date(slot.startAt)
    const end = new Date(slot.endAt)
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end.getTime() <= start.getTime()
    ) {
      continue
    }
    const dateLabel = formatKoreanInterviewDate(start)
    const timeRange = `${formatKoreanInterviewTime(start)} ~ ${formatKoreanInterviewTime(end)}`
    const daySlots = grouped.get(dateLabel) ?? []
    if (!daySlots.includes(timeRange)) daySlots.push(timeRange)
    grouped.set(dateLabel, daySlots)
  }
  return Array.from(grouped, ([dateLabel, daySlots]) => ({ dateLabel, slots: daySlots }))
}

function formatPreferredScheduleDate(date: Date): { date: string; dayOfWeek: string } {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''
  return {
    date: `${value('year')}.${value('month')}.${value('day')}`,
    dayOfWeek: value('weekday').replace('요일', ''),
  }
}

export function mapPreferredEducationSchedulesToSessions(
  schedules: PreferredEducationScheduleResponse[] | undefined
): ParticipatingSchoolSession[] {
  return [...(schedules ?? [])]
    .sort((a, b) => {
      const byStart = (a.startAt ?? '').localeCompare(b.startAt ?? '')
      return byStart || (a.scheduleId ?? 0) - (b.scheduleId ?? 0)
    })
    .map((schedule, index) => {
      const start = schedule.startAt ? new Date(schedule.startAt) : null
      const end = schedule.endAt ? new Date(schedule.endAt) : null
      const validStart = start != null && !Number.isNaN(start.getTime())
      const validEnd = end != null && !Number.isNaN(end.getTime())
      const dateParts = validStart
        ? formatPreferredScheduleDate(start)
        : { date: '-', dayOfWeek: '-' }
      const timeRange =
        validStart && validEnd
          ? `${formatKoreanInterviewTime(start)} ~ ${formatKoreanInterviewTime(end)}`
          : '-'
      const duration =
        validStart && validEnd && end.getTime() > start.getTime()
          ? `${Math.round((end.getTime() - start.getTime()) / 60_000)}분`
          : '-'
      return {
        round: schedule.round ?? index + 1,
        ...dateParts,
        duration,
        format: '-',
        classNum: '-',
        timeRange,
        requestedScheduleId: schedule.scheduleId,
      }
    })
}

function mapManagerEvaluation(value: unknown): GeneralManagerEvaluation {
  const raw =
    value && typeof value === 'object' && 'evaluation' in value
      ? (value as { evaluation?: unknown }).evaluation
      : value
  const normalized = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (normalized === 'pass' || normalized === 'neutral' || normalized === 'fail') {
    return normalized
  }
  return 'unreviewed'
}

export function mapIndividualApplicationToApplicantRow(
  dto: IndividualApplicationListItemEnriched,
  index: number,
  programId: string
): GeneralIndividualApplicantRow {
  const assigned = formatAssignedInterviewFromIso(
    dto.assignedInterviewStartAt,
    dto.assignedInterviewEndAt
  )
  const interviewAvailability = mapInterviewAvailabilitySlots(dto.interviewAvailabilitySlots)
  const affiliation = resolveStoredAffiliation({
    affiliationOrganizationId: dto.affiliationOrganizationId,
    affiliationDisplayName: dto.affiliationName,
  })
  return {
    id: toId(dto.id),
    no: index + 1,
    applicantName: dto.memberName?.trim() || '이름 없음',
    availableActions: dto.availableActions,
    affiliation: affiliation.affiliation,
    educationGrade: dto.applicationGrade?.trim() || '',
    homeAddress: dto.homeAddressSummary?.trim() || '',
    appliedAt: dto.submittedAt,
    approvalStatus: mapApiApplicationStatusToApprovalStatus(dto.applicationStatus),
    memberId: dto.memberId != null ? String(dto.memberId) : undefined,
    affiliationOrganizationId: affiliation.affiliationOrganizationId,
    adminComment: dto.managerComment ?? undefined,
    programId: toId(dto.programId) || programId,
    sessions: mapPreferredEducationSchedulesToSessions(dto.preferredEducationSchedules),
    managerAEvaluation: mapManagerEvaluation(dto.managerAEvaluation),
    managerBEvaluation: mapManagerEvaluation(dto.managerBEvaluation),
    documentScreeningStatus: mapApiDocumentStatusToScreeningStatus(dto.documentStatus),
    interviewAssignmentStatus: mapApiInterviewStatusToAssignmentStatus(
      dto.interviewStatus,
      dto.giveUpYn
    ),
    secondInterviewScreeningStatus: mapApiFinalResultToSecondInterviewStatus(
      dto.finalResultStatus,
      dto.reserveRank
    ),
    interviewSlotCount: dto.interviewAvailabilityCount ?? 0,
    detail: {
      interviewAvailability,
    },
    ...assigned,
  } as GeneralIndividualApplicantRow
}

export function mapIndividualApplicationDetailToApplicantRow(
  dto: IndividualApplicationDetailEnriched,
  base: GeneralIndividualApplicantRow
): GeneralIndividualApplicantRow {
  const profile = dto.profile
  const screening = dto.screening
  const assigned = formatAssignedInterviewFromIso(
    dto.assignedInterviewStartAt,
    dto.assignedInterviewEndAt
  )
  const interviewAvailability = mapInterviewAvailabilitySlots(dto.interviewAvailabilitySlots)
  const interviewA = screening?.interviewEvaluations?.find(item => item.evaluatorOrder === 1)
  const interviewB = screening?.interviewEvaluations?.find(item => item.evaluatorOrder === 2)
  const team = dto.team as
    | {
        name?: string
        teamName?: string
        memberCount?: number
        role?: string
      }
    | undefined
  const teamRole = team?.role?.trim().toUpperCase()
  const canEditDocumentEvaluation =
    dto.availableActions?.includes('UPDATE_DOCUMENT_EVALUATION') === true

  return {
    ...base,
    id: toId(dto.id) || base.id,
    memberId: toId(dto.memberId) || undefined,
    applicantName: profile?.name?.trim() || '',
    availableActions: dto.availableActions ?? [],
    privacyMaskingLevel: dto.privacyMaskingLevel === 'UNMASKED' ? 'UNMASKED' : 'MASKED',
    canRevealPersonalInfo: dto.canRevealPersonalInfo === true,
    canEditManagerAEvaluation: dto.canEditManagerAEvaluation ?? canEditDocumentEvaluation,
    canEditManagerBEvaluation: dto.canEditManagerBEvaluation ?? canEditDocumentEvaluation,
    affiliation: profile?.affiliationSchool?.trim() || '',
    educationGrade: profile?.affiliationGrade?.trim() || '',
    homeAddress: profile?.homeAddress?.trim() || '',
    approvalStatus: mapApiApplicationStatusToApprovalStatus(dto.applicationStatus),
    adminComment: dto.managerComment ?? undefined,
    programId: toId(dto.programId) || base.programId,
    sessions: mapPreferredEducationSchedulesToSessions(
      dto.application?.preferredEducationSchedules
    ),
    detail: {
      gender: profile?.gender ?? undefined,
      birthDate: profile?.birthDate ?? undefined,
      age: profile?.age,
      schoolEnrollmentStatus: profile?.schoolEnrollmentStatus ?? undefined,
      affiliationSchool: profile?.affiliationSchool ?? undefined,
      affiliationGrade: profile?.affiliationGrade ?? undefined,
      contact: profile?.contact ?? undefined,
      email: profile?.email ?? undefined,
      homeAddressFull: profile?.homeAddress ?? undefined,
      id1365: profile?.external1365Id ?? undefined,
      selfIntroduction: dto.application?.selfIntroduction ?? undefined,
      teamName: team?.name ?? team?.teamName ?? undefined,
      teamMemberCount: team?.memberCount,
      teamMemberCountSelect:
        team?.memberCount != null && team.memberCount >= 1 && team.memberCount <= 5
          ? (String(team.memberCount) as '1' | '2' | '3' | '4' | '5')
          : team?.memberCount != null
            ? 'custom'
            : undefined,
      teamRole: teamRole === 'LEADER' ? 'leader' : teamRole === 'MEMBER' ? 'member' : undefined,
      interviewAvailability,
      scheduleChangeCancelCount: dto.application?.scheduleChangeCancelCount ?? 0,
    },
    textbookId: toId(dto.textbook?.id) || undefined,
    textbookName: dto.textbook?.name ?? undefined,
    textbookKits: dto.textbook?.kits,
    textbookQuantity: dto.textbook?.quantity,
    textbookStatus: dto.textbook?.status as GeneralIndividualApplicantRow['textbookStatus'],
    managerAEvaluation: mapManagerEvaluation(screening?.documentEvaluations?.managerA),
    managerBEvaluation: mapManagerEvaluation(screening?.documentEvaluations?.managerB),
    documentScreeningStatus: mapApiDocumentStatusToScreeningStatus(screening?.documentStatus),
    interviewSlotCount: dto.interviewAvailabilityCount ?? 0,
    interviewAssignmentStatus: mapApiInterviewStatusToAssignmentStatus(
      dto.assignedInterviewSlotId != null ? 'ASSIGNED' : 'WAITING_ASSIGNMENT',
      screening?.giveUpYn
    ),
    secondInterviewScreeningStatus: mapApiFinalResultToSecondInterviewStatus(
      screening?.finalResultStatus,
      screening?.reserveRank
    ),
    totalScore: screening?.interviewTotalScore ?? null,
    managerAScore: interviewA?.score ?? null,
    managerBScore: interviewB?.score ?? null,
    interviewEvaluationRemark: screening?.interviewEvaluationRemark ?? undefined,
    assignedInterviewDateLabel: assigned.assignedInterviewDateLabel,
    assignedInterviewTime: assigned.assignedInterviewTime,
  }
}

export function filterIndividualDoc1Rows(
  rows: GeneralIndividualApplicantRow[]
): GeneralIndividualApplicantRow[] {
  return rows
}

export function filterIndividualDocPassedRows(
  rows: GeneralIndividualApplicantRow[]
): GeneralIndividualApplicantRow[] {
  return rows.filter(row => row.documentScreeningStatus === 'pass')
}

export function filterIndividualInterview2Rows(
  rows: GeneralIndividualApplicantRow[]
): GeneralIndividualApplicantRow[] {
  return rows.filter(
    row =>
      row.documentScreeningStatus === 'pass' &&
      (row.interviewAssignmentStatus === 'assigned' ||
        row.interviewAssignmentStatus === 'withdrawn')
  )
}

export function mapParticipantToParticipatingIndividualRow(
  dto: ParticipantListItemResponse,
  index: number,
  programId: string
): ParticipatingIndividualParticipantRow {
  const affiliation = resolveStoredAffiliation({
    affiliationOrganizationId: dto.organizationId,
    affiliationDisplayName: dto.organizationName,
  })
  return {
    id: toId(dto.participantId),
    no: index + 1,
    applicantName: dto.memberName?.trim() || '이름 없음',
    affiliationOrganizationId: affiliation.affiliationOrganizationId,
    affiliation: affiliation.affiliation,
    educationGrade: '',
    homeAddress: '',
    approvalStatus: 'approved',
    programId,
    lectureAttendanceSessions: [],
    satisfactionSurveyCompleted: false,
    participationAppliedAt: dto.joinedAt ?? '',
    activityWithdrawn: dto.giveUpAt != null,
  }
}

export function mapApiDocumentStatusToScreeningStatus(
  status?: string | null
): GeneralDocumentScreeningStatus {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (['PASS', 'PASSED', 'APPROVED', 'DOCUMENT_PASSED'].includes(normalized)) return 'pass'
  if (['FAIL', 'FAILED', 'REJECTED', 'AUTO_REJECTED'].includes(normalized)) return 'fail'
  return 'pending'
}

export function mapApiInterviewStatusToAssignmentStatus(
  status?: string | null,
  giveUpYn?: boolean
): GeneralInterviewAssignmentStatus {
  if (giveUpYn) return 'withdrawn'
  const normalized = status?.trim().toUpperCase() ?? ''
  if (['ASSIGNED', 'COMPLETED'].includes(normalized)) return 'assigned'
  if (['WITHDRAWN', 'GIVE_UP', 'CANCELLED'].includes(normalized)) return 'withdrawn'
  return 'waiting'
}

export function mapApiFinalResultToSecondInterviewStatus(
  status?: string | null,
  reserveRank?: number
): GeneralSecondInterviewScreeningStatus | undefined {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (!normalized) return undefined
  if (['PASS', 'PASSED', 'APPROVED'].includes(normalized)) return 'pass'
  if (['FAIL', 'FAILED', 'REJECTED'].includes(normalized)) return 'fail'
  if (normalized === 'RESERVE' || normalized.startsWith('RESERVE')) {
    const rank = reserveRank ?? (Number(normalized.replace(/\D/g, '')) || 1)
    const clamped = Math.min(4, Math.max(1, rank)) as 1 | 2 | 3 | 4
    return `reserve${clamped}`
  }
  if (['WAITING', 'PENDING'].includes(normalized)) return 'waiting'
  if (['COMPLETED'].includes(normalized)) return 'completed'
  return 'waiting'
}

export function mapVolunteerApplicationToGeneralVolunteerApplicantRow(
  dto: VolunteerApplicationListItemResponse,
  index: number,
  programId: string
): GeneralVolunteerApplicantRow {
  const enriched = dto as VolunteerApplicationListItemResponse & {
    interviewAssignmentId?: number | null
    assignedInterviewSlotId?: number | null
    assignedInterviewStartAt?: string | null
    assignedInterviewEndAt?: string | null
  }
  const assigned = formatAssignedInterviewFromIso(
    enriched.assignedInterviewStartAt,
    enriched.assignedInterviewEndAt
  )
  const affiliation = resolveStoredAffiliation({
    affiliationOrganizationId: dto.affiliationOrganizationId,
  })
  return {
    id: toId(dto.id),
    memberId: dto.memberId,
    affiliationOrganizationId: affiliation.affiliationOrganizationId,
    no: index + 1,
    name: dto.memberName?.trim() || '이름 없음',
    contact: dto.contact?.trim() || '-',
    email: dto.email?.trim() || '-',
    contactRaw: dto.contact?.trim() || '',
    emailRaw: dto.email?.trim() || '',
    id1365: '',
    scheduleChangeCancelCount: 0,
    applicationType: dto.isReparticipation ? 'ujat-graduate' : 'new',
    hasJaVolunteerExperience: Boolean(dto.isReparticipation),
    essayIntro: '',
    essayEducationExperience: '',
    essayNecessity: '',
    essayJaExperience: '',
    managerAEvaluation: mapManagerEvaluation(dto.managerAEvaluation),
    managerBEvaluation: mapManagerEvaluation(dto.managerBEvaluation),
    canEditManagerAEvaluation: dto.canEditManagerAEvaluation === true,
    canEditManagerBEvaluation: dto.canEditManagerBEvaluation === true,
    availableActions: dto.availableActions ?? [],
    documentScreeningStatus: mapApiDocumentStatusToScreeningStatus(dto.documentStatus),
    interviewSlotCount: dto.interviewAvailabilityCount ?? 0,
    interviewAssignmentStatus: mapApiInterviewStatusToAssignmentStatus(
      dto.interviewStatus,
      dto.giveUpYn
    ),
    programId: toId(dto.programId) || programId,
    englishName: '',
    gender: '',
    birthDate: '',
    age: 0,
    universityName: '',
    major: '',
    applicationRoute: '',
    interviewAvailability: mapInterviewAvailabilitySlots(dto.interviewAvailability),
    interviewAssignmentId:
      enriched.interviewAssignmentId != null ? Number(enriched.interviewAssignmentId) : undefined,
    ...assigned,
    secondInterviewScreeningStatus: mapApiFinalResultToSecondInterviewStatus(
      dto.finalResultStatus,
      dto.reserveRank
    ),
  }
}

export function mapVolunteerApplicationDetailToApplicantRow(
  dto: VolunteerApplicationDetailResponse,
  base: GeneralVolunteerApplicantRow
): GeneralVolunteerApplicantRow {
  const profile = dto.profile
  const screening = dto.screening
  const assigned = formatAssignedInterviewFromIso(
    dto.assignedInterviewStartAt,
    dto.assignedInterviewEndAt
  )
  const canEditEvaluation =
    dto.availableActions?.includes('UPDATE_DOCUMENT_EVALUATION') === true
  return {
    ...base,
    id: toId(dto.id) || base.id,
    memberId: dto.memberId ?? base.memberId,
    name: profile?.name?.trim() || base.name,
    contact: profile?.contact?.trim() || base.contact,
    email: profile?.email?.trim() || base.email,
    contactRaw: profile?.contact?.trim() || base.contactRaw,
    emailRaw: profile?.email?.trim() || base.emailRaw,
    id1365: profile?.external1365Id?.trim() || base.id1365,
    scheduleChangeCancelCount:
      dto.application?.scheduleChangeCancelCount ?? base.scheduleChangeCancelCount,
    managerAEvaluation: mapManagerEvaluation(screening?.documentEvaluations?.managerA),
    managerBEvaluation: mapManagerEvaluation(screening?.documentEvaluations?.managerB),
    canEditManagerAEvaluation: dto.canEditManagerAEvaluation ?? canEditEvaluation,
    canEditManagerBEvaluation: dto.canEditManagerBEvaluation ?? canEditEvaluation,
    availableActions: dto.availableActions ?? base.availableActions,
    documentScreeningStatus: mapApiDocumentStatusToScreeningStatus(screening?.documentStatus),
    interviewSlotCount: dto.interviewAvailabilityCount ?? base.interviewSlotCount,
    interviewAssignmentStatus: mapApiInterviewStatusToAssignmentStatus(
      dto.assignedInterviewSlotId != null ? 'ASSIGNED' : 'WAITING_ASSIGNMENT',
      screening?.giveUpYn
    ),
    programId: toId(dto.programId) || base.programId,
    gender: profile?.gender?.trim() || base.gender,
    birthDate: profile?.birthDate?.trim() || base.birthDate,
    age: profile?.age ?? base.age,
    interviewAvailability: mapInterviewAvailabilitySlots(dto.interviewAvailability),
    interviewAssignmentId: dto.interviewAssignmentId ?? base.interviewAssignmentId,
    secondInterviewScreeningStatus: mapApiFinalResultToSecondInterviewStatus(
      screening?.finalResultStatus,
      screening?.reserveRank
    ),
    totalScore: screening?.interviewTotalScore ?? base.totalScore,
    interviewEvaluationRemark:
      screening?.interviewEvaluationRemark ?? base.interviewEvaluationRemark,
    assignedInterviewDateLabel:
      assigned.assignedInterviewDateLabel ?? base.assignedInterviewDateLabel,
    assignedInterviewTime: assigned.assignedInterviewTime ?? base.assignedInterviewTime,
  }
}

export function filterVolunteerDoc1Rows(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return rows.filter(row => row.documentScreeningStatus === 'pending')
}

export function filterVolunteerDocPassedRows(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return rows.filter(row => row.documentScreeningStatus === 'pass')
}

export function filterVolunteerInterview2Rows(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return rows.filter(
    row =>
      row.documentScreeningStatus === 'pass' &&
      (row.interviewAssignmentStatus === 'assigned' ||
        row.interviewAssignmentStatus === 'withdrawn')
  )
}

export function mapMaterialAssignmentStatusToTextbookStatus(
  status?: string
): ParticipatingSchoolRow['textbookStatus'] {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (['PREPARING', 'BEFORE_SHIPPING'].includes(normalized)) return 'preparing'
  if (['SHIPPING', 'IN_TRANSIT'].includes(normalized)) return 'shipping'
  if (['DELIVERED', 'DELIVERY_COMPLETED'].includes(normalized)) return 'delivered'
  return 'not_applicable'
}

export function mapParticipantToParticipatingSchoolRow(
  dto: ParticipantListItemResponse,
  index: number,
  programId: string
): ParticipatingSchoolRow {
  const organizationApplicationIdValue = dto.organizationApplicationId ?? dto.sourceApplicationId
  const organizationApplicationId =
    organizationApplicationIdValue != null ? String(organizationApplicationIdValue) : undefined
  const participantStatus = dto.participantStatus?.trim() || undefined
  const giveUpAt = dto.giveUpAt?.trim() || undefined
  const availableActions = readParticipantAvailableActions(dto)
  const activityWithdrawn = giveUpAt != null || participantStatus?.toUpperCase() === 'GIVE_UP'
  return {
    id: toId(dto.participantId),
    organizationId: dto.organizationId ?? undefined,
    teacherMemberId: dto.teacherMemberId,
    no: index + 1,
    schoolName: dto.organizationName?.trim() || dto.memberName?.trim() || '기관명 없음',
    region: '',
    educationGrade: '',
    classCount: 0,
    studentCount: 0,
    lectureRound: '',
    textbookStatus: mapMaterialAssignmentStatusToTextbookStatus(dto.materialAssignmentStatus),
    approvalStatus: 'approved',
    teacherName: '-',
    instructors: '',
    programId,
    organizationApplicationId,
    participantStatus,
    giveUpAt,
    activityWithdrawn,
    availableActions,
  }
}

/** codegen 미반영 additive 필드 — 런타임만 존재할 수 있음 */
function readParticipantAvailableActions(dto: ParticipantListItemResponse): string[] | undefined {
  const raw = (dto as ParticipantListItemResponse & { availableActions?: unknown }).availableActions
  if (!Array.isArray(raw)) return undefined
  const actions = raw.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
  return actions.length > 0 ? actions : undefined
}

/** participants(INSTRUCTOR) codegen 미반영 enrich — BE additive 필드 */
type ParticipantInstructorListEnriched = ParticipantListItemResponse & {
  homeAddress?: string | null
  homeAddressSummary?: string | null
  contact?: string | null
  phone?: string | null
  email?: string | null
  jaEvaluationGrade?: string | null
  jaGrade?: string | null
  lectureExperienceYears?: number | null
  settlementStatus?: string | null
  assignedOrganizationNames?: string[] | null
  lectureReportSubmitted?: boolean | null
}

function readParticipantInstructorEnriched(
  dto: ParticipantListItemResponse
): ParticipantInstructorListEnriched {
  return dto as ParticipantInstructorListEnriched
}

function readParticipantStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items = value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean)
  return items.length > 0 ? items : undefined
}

function mapParticipantInstructorSettlementStatus(
  raw?: string | null
): InstructorSettlementUiStatus {
  if (!raw?.trim()) return 'none'
  const snake = raw.trim().toLowerCase().replace(/-/g, '_')
  if (INSTRUCTOR_SETTLEMENT_STATUS_ORDER.includes(snake as InstructorSettlementUiStatus)) {
    return snake as InstructorSettlementUiStatus
  }
  return 'none'
}

function resolveParticipantInstructorHomeAddress(
  dto: ParticipantInstructorListEnriched
): string | undefined {
  const summary = dto.homeAddressSummary?.trim()
  if (summary) return summary
  const full = dto.homeAddress?.trim()
  if (full) return full
  const region = [dto.regionSido, dto.regionSigungu].filter(Boolean).join(' ').trim()
  return region || undefined
}

export function mapParticipantToParticipatingInstructorRow(
  dto: ParticipantListItemResponse,
  index: number,
  _programId: string
): ParticipatingInstructorRow {
  const enriched = readParticipantInstructorEnriched(dto)
  const homeAddress = resolveParticipantInstructorHomeAddress(enriched)
  const assignedOrganizationNames =
    readParticipantStringArray(enriched.assignedOrganizationNames) ??
    (enriched.organizationName?.trim() ? [enriched.organizationName.trim()] : undefined)
  const primarySchoolName = assignedOrganizationNames?.[0] ?? ''
  const affiliation = resolveStoredAffiliation({
    affiliationOrganizationId: dto.organizationId,
    affiliationDisplayName: dto.organizationName,
  })

  return {
    id: toId(dto.participantId),
    no: index + 1,
    instructorName: dto.memberName?.trim() || '이름 없음',
    schoolName: primarySchoolName,
    educationGrade: dto.grade?.trim() || '',
    classCount: dto.classCount ?? 0,
    studentCount: dto.studentCount ?? 0,
    lectureRound: '',
    settlementStatus: mapParticipantInstructorSettlementStatus(enriched.settlementStatus),
    teacherName: dto.teacherName?.trim() || '-',
    memberId: dto.memberId != null ? String(dto.memberId) : undefined,
    affiliationOrganizationId: affiliation.affiliationOrganizationId,
    affiliation: affiliation.affiliation,
    contact: enriched.contact?.trim() || enriched.phone?.trim() || '',
    email: enriched.email?.trim() || '',
    address: homeAddress,
    region: homeAddress,
    assignedOrganizationNames,
    jaEvaluationGrade:
      enriched.jaEvaluationGrade?.trim() || enriched.jaGrade?.trim() || undefined,
    lectureExperienceYears:
      typeof enriched.lectureExperienceYears === 'number'
        ? enriched.lectureExperienceYears
        : undefined,
    lectureReportSubmitted: enriched.lectureReportSubmitted ?? undefined,
    activityWithdrawn:
      dto.giveUpAt != null || dto.participantStatus?.trim().toUpperCase() === 'GIVE_UP',
  }
}

export function mapParticipantToParticipatingVolunteerRow(
  dto: ParticipantListItemResponse,
  index: number,
  _programId: string
): ParticipatingVolunteerRow {
  const affiliation = resolveStoredAffiliation({
    affiliationOrganizationId: dto.organizationId,
    affiliationDisplayName: dto.organizationName,
  })
  return {
    id: toId(dto.participantId),
    no: index + 1,
    volunteerName: dto.memberName?.trim() || '이름 없음',
    affiliationOrganizationId: affiliation.affiliationOrganizationId,
    affiliation: affiliation.affiliation,
    id1365: '',
    assignedInstitutionNames: [],
    sessions: [],
    contact: '-',
    email: '-',
    activityWithdrawn: dto.giveUpAt != null,
  }
}
