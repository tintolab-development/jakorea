import type {
  ApplicantApprovalStatusKey,
  ApplicantSchoolRow,
} from '@/features/program/shared/model/applicant-institution'
import { formatApplicantSchoolApprovalNotificationSentAt } from '@/features/program/shared/model/applicant-institution'
import type {
  ApplicantInstructorLectureFeeBasisType,
  ApplicantInstructorRow,
} from '@/features/program/shared/model/applicant-instructor'
import type { InstructorMemberProfile, SchoolTeacherEmploymentStatus } from '@/types/user'
import { buildLectureFeeBasisDisplay } from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'
import type { InstructorApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationDetailResponse'
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
import type {
  IndividualApplicationListItemEnriched,
  PreferredEducationSchedule,
} from '@/features/program/general/api/individual-application-screening-api-types'
import type { ParticipantListItemResponse } from '@/shared/api/generated/dashboard/schemas/participantListItemResponse'
import { mapParticipantSessionsToEducationSchedules } from '@/features/program/general/lib/map-participant-sessions-to-education-schedules'
import type { VolunteerApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/volunteerApplicationListItemResponse'
import type { VolunteerApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/volunteerApplicationDetailResponse'
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'
import type { InterviewAvailabilitySlot } from '@/shared/api/generated/dashboard/schemas/interviewAvailabilitySlot'
import type { SessionProgress } from '@/shared/api/generated/dashboard/schemas/sessionProgress'
import type { IndividualApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/individualApplicationDetailResponse'
import {
  parseParticipantSurveyViewKey,
  type ParticipatingIndividualParticipantRow,
} from '@/features/program/general/model/participating-individual-participants'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import { formatInstructorFeeGradeLabel } from '@/shared/constants/instructor-fee-grade'
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
import { mapSessionProgressToLectureAttendanceSessions } from '@/features/program/general/lib/participating-individual-participant-lecture-attendance'
import {
  instructorCmsProfileToApplicantInstructorRowPartial,
  normalizeInstructorCmsProfileFromApi,
} from '@/features/user/api/map-instructor-cms-profile'

function toId(value: number | string | null | undefined): string {
  if (value == null || value === '') return ''
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
    preferredEducationSchedules?: PreferredEducationSchedule[]
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

/**
 * 일반 기관 목록·상세 스키마에는 아직 없고, TT·Gemini와 재발송 응답에만 있다.
 * 스펙에 필드가 생기면 그대로 읽힌다.
 */
function readResultNotificationSentAt(dto: object): string | null | undefined {
  const value = (dto as { resultNotificationSentAt?: string | null }).resultNotificationSentAt
  return typeof value === 'string' ? value : undefined
}

/** codegen 미반영. 1사1교 기관 목록·상세 GET `참여`|`미참여`|결연사명. */
export function readOrganizationApplicationEconomyDisplayFields(dto: object): {
  previousYearParticipation?: string
  affiliatedFinancialCompany?: string
} {
  const raw = dto as {
    previousYearParticipation?: string | null
    affiliatedFinancialCompany?: string | null
  }
  const previousYearParticipation = formatPreviousYearParticipationLabel(
    raw.previousYearParticipation
  )
  const affiliatedFinancialCompany = raw.affiliatedFinancialCompany?.trim() || undefined
  return {
    ...(previousYearParticipation ? { previousYearParticipation } : {}),
    ...(affiliatedFinancialCompany ? { affiliatedFinancialCompany } : {}),
  }
}

export function formatPreviousYearParticipationLabel(
  raw?: string | null
): string | undefined {
  const trimmed = raw?.trim()
  if (!trimmed) return undefined
  if (trimmed === 'yes' || trimmed === 'Y' || trimmed === '참여') return '참여'
  if (trimmed === 'no' || trimmed === 'N' || trimmed === '미참여') return '미참여'
  return trimmed
}

function formatOrganizationResultNotificationSentAt(
  iso?: string | null
): string | undefined {
  const trimmed = iso?.trim()
  if (!trimmed) return undefined
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return undefined
  return formatApplicantSchoolApprovalNotificationSentAt(parsed)
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
  const region = [dto.regionSido, dto.regionSigungu].filter(Boolean).join(' ').trim()

  return {
    id: toId(dto.id),
    organizationId: dto.organizationId ?? undefined,
    teacherMemberId: dto.teacherMemberId ?? undefined,
    no: index + 1,
    schoolName: dto.organizationName?.trim() || '기관명 없음',
    region,
    educationGrade: dto.grade?.trim() || '',
    classCount: dto.requestedClassCount ?? 0,
    studentCount: dto.requestedStudentCount ?? 0,
    teacherName: dto.teacherName?.trim() || '-',
    appliedAt: dto.submittedAt ?? undefined,
    approvalStatus: mapApiApplicationStatusToApprovalStatus(dto.applicationStatus),
    participationRejectionReason: dto.rejectReason?.trim() || undefined,
    approvalNotificationSentAt: formatOrganizationResultNotificationSentAt(
      readResultNotificationSentAt(dto)
    ),
    availableActions: dto.availableActions ?? [],
    programId,
    sessions,
    desiredEducationPeriod,
    detail: {
      ...readOrganizationApplicationEconomyDisplayFields(dto),
    },
  }
}

/** 상세 DTO → 신청 기관 detail(사유·안내). 빈 값은 기존 row를 지우지 않는다. */
export function readOrganizationApplicationDetailExtendFields(
  dto: Pick<
    OrganizationApplicationDetailResponse,
    | 'organizationAddressDetail'
    | 'requestedEducationFormat'
    | 'applicationReason'
    | 'otherRequests'
    | 'computerInRoom'
    | 'waitingRoomLocation'
    | 'mealProvided'
    | 'mealNotice'
    | 'parkingInfo'
    | 'textbookId'
    | 'textbookName'
    | 'teacherPhone'
    | 'teacherEmail'
  >
): NonNullable<ApplicantSchoolRow['detail']> {
  const addressDetail = dto.organizationAddressDetail?.trim() || undefined
  const educationType = formatRequestedEducationFormat(dto.requestedEducationFormat) || undefined
  const applicationReason = dto.applicationReason?.trim() || undefined
  const otherRequests = dto.otherRequests?.trim() || undefined
  const computerInSpace = dto.computerInRoom?.trim() || undefined
  const waitingPlaceGuide = dto.waitingRoomLocation?.trim() || undefined
  const mealNotice = dto.mealNotice?.trim() || undefined
  const mealInfo =
    mealNotice ||
    (typeof dto.mealProvided === 'boolean' ? (dto.mealProvided ? '가능' : '불가') : undefined)
  const parkingInfo = dto.parkingInfo?.trim() || undefined
  const textbookId = toId(dto.textbookId) || undefined
  const textbookName = dto.textbookName?.trim() || undefined
  const teacherPhone = dto.teacherPhone?.trim() || undefined
  const teacherEmail = dto.teacherEmail?.trim() || undefined

  return {
    ...(addressDetail ? { addressDetail } : {}),
    ...(educationType ? { educationType } : {}),
    ...(applicationReason ? { applicationReason } : {}),
    ...(otherRequests ? { otherRequests } : {}),
    ...(computerInSpace ? { computerInSpace } : {}),
    ...(waitingPlaceGuide
      ? { waitingPlaceGuide, waitingRoom: waitingPlaceGuide }
      : {}),
    ...(mealInfo ? { mealInfo } : {}),
    ...(parkingInfo ? { parkingInfo, otherSpecialNotes: parkingInfo } : {}),
    ...(textbookId ? { textbookId } : {}),
    ...(textbookName ? { textbookName } : {}),
    ...(teacherPhone ? { teacherPhone } : {}),
    ...(teacherEmail ? { teacherEmail } : {}),
  }
}

export function mapOrganizationApplicationDetailToApplicantSchoolRow(
  dto: OrganizationApplicationDetailResponse,
  base: ApplicantSchoolRow
): ApplicantSchoolRow {
  const teacherPhone = dto.teacherPhone?.trim()
  const teacherEmail = dto.teacherEmail?.trim()
  const detailFields = readOrganizationApplicationDetailExtendFields(dto)
  return {
    ...base,
    id: toId(dto.id) || base.id,
    organizationId: dto.organizationId ?? base.organizationId,
    teacherMemberId: dto.teacherMemberId ?? base.teacherMemberId,
    schoolName: dto.organizationName?.trim() || base.schoolName,
    region: dto.organizationAddress?.trim() || base.region,
    educationGrade: formatApplicantGradeLabel(dto.requestedGrade) || base.educationGrade,
    classCount: dto.requestedClassCount ?? base.classCount,
    studentCount: dto.requestedStudentCount ?? base.studentCount,
    teacherName: dto.teacherName?.trim() || base.teacherName,
    contact: teacherPhone || base.contact,
    appliedAt: dto.submittedAt ?? base.appliedAt,
    approvalStatus: mapApiApplicationStatusToApprovalStatus(dto.applicationStatus),
    participationRejectionReason: dto.rejectReason?.trim() || base.participationRejectionReason,
    approvalNotificationSentAt:
      formatOrganizationResultNotificationSentAt(readResultNotificationSentAt(dto)) ??
      base.approvalNotificationSentAt,
    availableActions: dto.availableActions ?? base.availableActions,
    detail: {
      ...base.detail,
      ...detailFields,
      ...readOrganizationApplicationEconomyDisplayFields(dto),
      ...(teacherPhone ? { teacherPhone } : {}),
      ...(teacherEmail ? { teacherEmail } : {}),
      teacherInfo: undefined,
    },
  }
}

export function formatApplicantGradeLabel(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return ''
  if (trimmed.endsWith('학년')) return trimmed
  if (/^\d+$/.test(trimmed)) return `${trimmed}학년`
  return trimmed
}

/** 상세 희망 교육 형태. API는 ONLINE/OFFLINE/HYBRID, 화면 라디오는 한글 값. */
export function formatRequestedEducationFormat(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return ''
  if (trimmed === '온라인' || trimmed === '오프라인' || trimmed === '온/오프라인') return trimmed
  switch (trimmed.toUpperCase()) {
    case 'ONLINE':
      return '온라인'
    case 'OFFLINE':
      return '오프라인'
    case 'HYBRID':
      return '온/오프라인'
    default:
      return ''
  }
}

/** PATCH 요청용. 화면 한글 → API enum. 이미 enum이면 그대로. */
export function toRequestedEducationFormatApiValue(
  raw: string | null | undefined
): 'ONLINE' | 'OFFLINE' | 'HYBRID' | undefined {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return undefined
  switch (trimmed) {
    case '온라인':
    case 'ONLINE':
      return 'ONLINE'
    case '오프라인':
    case 'OFFLINE':
      return 'OFFLINE'
    case '온/오프라인':
    case 'HYBRID':
      return 'HYBRID'
    default:
      return undefined
  }
}

/** 기관 신청 상세의 기본정보 4칸. 폼 답으로 채우지 않는다. */
export function readOrganizationApplicationBasicInfoFields(
  dto: Pick<
    OrganizationApplicationDetailResponse,
    | 'organizationAddressDetail'
    | 'requestedEducationFormat'
    | 'applicationReason'
    | 'otherRequests'
  >
): {
  addressDetail?: string
  educationFormat?: string
  applicationReason?: string
  otherRequests?: string
} {
  const addressDetail = dto.organizationAddressDetail?.trim() || undefined
  const educationFormat = formatRequestedEducationFormat(dto.requestedEducationFormat) || undefined
  const applicationReason = dto.applicationReason?.trim() || undefined
  const otherRequests = dto.otherRequests?.trim() || undefined
  return { addressDetail, educationFormat, applicationReason, otherRequests }
}

/**
 * TT 등 — 목록 SoT(학급·일정 블록)는 유지하고, 상세에만 있는 PII·부가 필드만 채운다.
 * 빈 문자열로 목록 값을 덮지 않는다.
 */
export function softMergeOrganizationApplicationDetailOntoRow(
  dto: OrganizationApplicationDetailResponse,
  base: ApplicantSchoolRow
): ApplicantSchoolRow {
  const teacherPhone = dto.teacherPhone?.trim()
  const teacherEmail = dto.teacherEmail?.trim()
  const teacherName = dto.teacherName?.trim()
  /** 상세 학년은 requestedGrade만. 목록 educationGrade(프로그램 대상 학년)를 다시 넣지 않는다. */
  const requestedGrade = formatApplicantGradeLabel(dto.requestedGrade)
  const rejectReason = dto.rejectReason?.trim()
  const detailFields = readOrganizationApplicationDetailExtendFields(dto)

  return {
    ...base,
    educationGrade: requestedGrade,
    teacherMemberId: dto.teacherMemberId ?? base.teacherMemberId,
    teacherName: teacherName || base.teacherName,
    contact: teacherPhone || base.contact,
    participationRejectionReason: rejectReason || base.participationRejectionReason,
    approvalNotificationSentAt:
      formatOrganizationResultNotificationSentAt(readResultNotificationSentAt(dto)) ??
      base.approvalNotificationSentAt,
    availableActions: dto.availableActions ?? base.availableActions,
    detail: {
      ...base.detail,
      ...detailFields,
      ...readOrganizationApplicationEconomyDisplayFields(dto),
      ...(teacherPhone ? { teacherPhone } : {}),
      ...(teacherEmail ? { teacherEmail } : {}),
      teacherInfo: undefined,
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
    instructorFeeGradeLabel: formatInstructorFeeGradeLabel(dto.instructorFeeGradeSnapshot) || undefined,
    rejectionReason: dto.rejectReason?.trim() || undefined,
    distanceKm: dto.distanceKm,
    longDistanceYn: dto.longDistance,
    availableActions: dto.availableActions,
  }
}

function mapInstructorFeeBasisType(
  raw?: string | null
): ApplicantInstructorLectureFeeBasisType | undefined {
  if (raw === 'program' || raw === 'special_lecture' || raw === 'other_labor') return raw
  return undefined
}

function mapInstructorMemberProfileFromDetail(
  dto: InstructorApplicationDetailResponse
): InstructorMemberProfile | undefined {
  const profile = dto.instructorMemberProfile
  if (!profile) return undefined
  if (profile.teacherAffiliated === true) return 'instructor_dual'
  if (profile.teacherAffiliated === false) return 'instructor_only'
  return undefined
}

function mapAffiliationEmploymentStatus(
  raw?: string | null
): SchoolTeacherEmploymentStatus | undefined {
  if (raw === 'ACTIVE' || raw === 'ON_LEAVE' || raw === 'WITHDRAWN' || raw === 'TRANSFERRED') {
    return raw
  }
  return undefined
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
    instructorFeeGradeLabel:
      formatInstructorFeeGradeLabel(dto.feePolicy?.instructorFeeGrade) ||
      formatInstructorFeeGradeLabel(dto.instructorFeeGradeSnapshot) ||
      base.instructorFeeGradeLabel,
    lectureFeeBasisType:
      mapInstructorFeeBasisType(dto.feePolicy?.basisType) ?? base.lectureFeeBasisType,
    lectureFeeMeasure: dto.feePolicy?.measure?.trim() || base.lectureFeeMeasure,
    lectureFeeAmount:
      dto.feePolicy?.amount != null ? String(dto.feePolicy.amount) : base.lectureFeeAmount,
    lectureFeeBasisDisplay:
      dto.feePolicy != null
        ? buildLectureFeeBasisDisplay(
            mapInstructorFeeBasisType(dto.feePolicy.basisType) ??
              base.lectureFeeBasisType ??
              'special_lecture',
            dto.feePolicy.measure ?? base.lectureFeeMeasure ?? '',
            dto.feePolicy.amount != null
              ? String(dto.feePolicy.amount)
              : (base.lectureFeeAmount ?? '')
          ) ?? base.lectureFeeBasisDisplay
        : base.lectureFeeBasisDisplay,
    businessIncomeEarnerStatus:
      dto.businessIncomeEarnerStatus?.trim() || base.businessIncomeEarnerStatus,
    affiliationOrganizationId:
      dto.affiliationOrganizationId !== undefined
        ? dto.affiliationOrganizationId
        : base.affiliationOrganizationId,
    instructorMemberProfile:
      mapInstructorMemberProfileFromDetail(dto) ?? base.instructorMemberProfile,
    affiliationEmploymentStatus:
      mapAffiliationEmploymentStatus(dto.employmentStatus) ??
      mapAffiliationEmploymentStatus(dto.instructorMemberProfile?.employmentStatus) ??
      base.affiliationEmploymentStatus,
    affiliationIsCurrentlyEmployed:
      dto.affiliationIsCurrentlyEmployed ??
      dto.instructorMemberProfile?.currentlyEmployed ??
      base.affiliationIsCurrentlyEmployed,
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
    ...mapInstructorResumeFromDetail(dto, base),
  }
}

/** `instructorCmsProfile` 이력서 섹션 — 기본 정보 필드는 신청 DTO 우선이라 여기서 덮지 않는다. */
function mapInstructorResumeFromDetail(
  dto: InstructorApplicationDetailResponse,
  base: ApplicantInstructorRow
): Partial<ApplicantInstructorRow> {
  const profile = normalizeInstructorCmsProfileFromApi(dto.instructorCmsProfile ?? undefined)
  if (!profile) return {}
  const resume = instructorCmsProfileToApplicantInstructorRowPartial(profile)
  const pickList = <T>(next: T[] | undefined, prev: T[] | undefined) =>
    (next?.length ?? 0) > 0 ? next : prev
  return {
    careerDetails: pickList(resume.careerDetails, base.careerDetails),
    jaKoreaActivities: pickList(resume.jaKoreaActivities, base.jaKoreaActivities),
    educations: pickList(resume.educations, base.educations),
    qualifications: pickList(resume.qualifications, base.qualifications),
    awards: pickList(resume.awards, base.awards),
    freeWriting1: resume.freeWriting1 || base.freeWriting1,
    freeWriting2: resume.freeWriting2 || base.freeWriting2,
    freeWriting3: resume.freeWriting3 || base.freeWriting3,
    freeWriting4: resume.freeWriting4 || base.freeWriting4,
    instructorCareerLevel: resume.instructorCareerLevel ?? base.instructorCareerLevel,
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

function preferredScheduleLabel(schedule: PreferredEducationSchedule): string {
  return typeof schedule.label === 'string' ? schedule.label.trim() : ''
}

/**
 * 운영 일정(startAt 있음)을 시작 시각 순으로 두고, `line:N`(startAt 없음)은 응답 순서를 유지한다.
 */
function orderPreferredEducationSchedules(
  schedules: PreferredEducationSchedule[]
): PreferredEducationSchedule[] {
  return schedules
    .map((schedule, index) => ({ schedule, index }))
    .sort((a, b) => {
      const aStart = a.schedule.startAt ?? ''
      const bStart = b.schedule.startAt ?? ''
      if (aStart && bStart) {
        const byStart = aStart.localeCompare(bStart)
        return byStart || (a.schedule.scheduleId ?? 0) - (b.schedule.scheduleId ?? 0)
      }
      if (aStart || bStart) return aStart ? -1 : 1
      return a.index - b.index
    })
    .map(entry => entry.schedule)
}

export function mapPreferredEducationSchedulesToSessions(
  schedules: PreferredEducationSchedule[] | undefined
): ParticipatingSchoolSession[] {
  return orderPreferredEducationSchedules([...(schedules ?? [])]).map((schedule, index) => {
    const scheduleLabel = preferredScheduleLabel(schedule)
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
      ...(scheduleLabel ? { scheduleLabel } : {}),
      ...(schedule.scheduleId != null ? { requestedScheduleId: schedule.scheduleId } : {}),
    }
  })
}

function mapSessionProgressStatusToParticipating(
  raw?: string | null
): ParticipatingSchoolSession['status'] {
  const upper = (raw ?? '').trim().toUpperCase()
  if (upper === 'COMPLETED' || upper === 'DONE' || upper === 'ATTENDED' || upper === 'PRESENT') {
    return 'completed'
  }
  if (upper === 'NOT_PLANNED' || upper === 'CANCELLED' || upper === 'CANCELED') {
    return 'not_planned'
  }
  return 'pending'
}

/** participants `sessions[]` (SessionProgress) → 참여 봉사자/캘린더용 세션 */
export function mapSessionProgressToParticipatingSchoolSessions(
  sessions: SessionProgress[] | undefined | null
): ParticipatingSchoolSession[] {
  return [...(sessions ?? [])]
    .sort((a, b) => {
      const byStart = (a.startAt ?? '').localeCompare(b.startAt ?? '')
      return byStart || (a.sessionNo ?? 0) - (b.sessionNo ?? 0)
    })
    .map((session, index) => {
      const start = session.startAt ? new Date(session.startAt) : null
      const end = session.endAt ? new Date(session.endAt) : null
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
      const round = session.sessionNo ?? index + 1
      return {
        round,
        ...dateParts,
        duration,
        format: session.scheduleName?.trim() || '-',
        classNum: `${round}교시`,
        timeRange,
        status: mapSessionProgressStatusToParticipating(
          session.attendanceStatus ?? session.assignmentStatus
        ),
        resolvedScheduleId: session.scheduleId ?? session.resolvedScheduleId ?? null,
        requestedScheduleId: session.requestedScheduleId ?? undefined,
        scheduleUnresolved:
          session.scheduleId == null && session.resolvedScheduleId == null,
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
  const extra = dto as ParticipantListItemResponse & {
    satisfactionSurveyCompleted?: boolean | null
    surveyResponse?: unknown
    satisfactionResponse?: unknown
  }
  const homeAddress =
    dto.homeAddressSummary?.trim() ||
    [dto.regionSido, dto.regionSigungu].filter(Boolean).join(' ').trim()
  const contact = dto.contact?.trim() || dto.phone?.trim() || ''
  const email = dto.email?.trim() || ''
  return {
    id: toId(dto.participantId),
    individualApplicationId:
      dto.sourceApplicationId != null ? String(dto.sourceApplicationId) : undefined,
    memberId: dto.memberId != null ? String(dto.memberId) : undefined,
    no: index + 1,
    applicantName: dto.memberName?.trim() || '이름 없음',
    affiliationOrganizationId: affiliation.affiliationOrganizationId,
    affiliation: affiliation.affiliation,
    educationGrade: dto.grade?.trim() || '',
    homeAddress,
    approvalStatus: 'approved',
    programId,
    sessions: mapSessionProgressToParticipatingSchoolSessions(dto.sessions),
    availableActions: dto.availableActions,
    lectureAttendanceSessions: mapSessionProgressToLectureAttendanceSessions(dto.sessions),
    satisfactionSurveyCompleted: extra.satisfactionSurveyCompleted === true,
    surveyResponse: parseParticipantSurveyViewKey(extra.surveyResponse),
    satisfactionResponse: parseParticipantSurveyViewKey(extra.satisfactionResponse),
    participationAppliedAt: dto.joinedAt ?? '',
    activityWithdrawn:
      dto.giveUpAt != null || dto.participantStatus?.trim().toUpperCase() === 'GIVE_UP',
    detail: {
      contact: contact || undefined,
      email: email || undefined,
      homeAddressFull: homeAddress || undefined,
    },
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

/** 교재 배송 배지. `materialAssignmentStatus`(UNDECIDED/NONE/ASSIGNED)와 다르다. */
export function mapTextbookDeliveryStatusToBadge(
  status?: string | null
): ParticipatingSchoolRow['textbookStatus'] {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (normalized === 'PREPARING' || normalized === 'PREPARE') return 'preparing'
  if (normalized === 'SHIPPING' || normalized === 'SHIP') return 'shipping'
  if (normalized === 'DELIVERED' || normalized === 'DELIVER') return 'delivered'
  return 'not_applicable'
}

export function mapTextbookStatusKeyToDeliveryStatus(
  status: ParticipatingSchoolRow['textbookStatus']
): 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'NOT_APPLICABLE' {
  if (status === 'preparing') return 'PREPARING'
  if (status === 'shipping') return 'SHIPPING'
  if (status === 'delivered') return 'DELIVERED'
  return 'NOT_APPLICABLE'
}

function readOrganizationTextbookStatus(
  dto: ParticipantListItemResponse
): ParticipatingSchoolRow['textbookStatus'] {
  const extra = dto as ParticipantListItemResponse & { textbookDeliveryStatus?: string | null }
  const delivery = extra.textbookDeliveryStatus?.trim()
  if (delivery) return mapTextbookDeliveryStatusToBadge(delivery)
  return mapMaterialAssignmentStatusToTextbookStatus(dto.materialAssignmentStatus)
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
  const teacherPhone = dto.phone?.trim() || dto.contact?.trim() || undefined
  const teacherEmail = dto.email?.trim() || undefined
  const region = [dto.regionSido, dto.regionSigungu].filter(Boolean).join(' ').trim()
  const sessions = mapSessionProgressToParticipatingSchoolSessions(dto.sessions)
  return {
    id: toId(dto.participantId),
    organizationId: dto.organizationId ?? undefined,
    teacherMemberId: dto.teacherMemberId,
    no: index + 1,
    schoolName: dto.organizationName?.trim() || dto.memberName?.trim() || '기관명 없음',
    region,
    educationGrade: formatApplicantGradeLabel(dto.grade),
    classCount: dto.classCount ?? 0,
    studentCount: dto.studentCount ?? 0,
    lectureRound: sessions.length > 0 ? String(sessions.length) : '',
    textbookStatus: readOrganizationTextbookStatus(dto),
    textbookId: dto.textbookId != null ? String(dto.textbookId) : undefined,
    textbookName: dto.textbookName?.trim() || undefined,
    approvalStatus: 'approved',
    teacherName: dto.teacherName?.trim() || '-',
    teacherPhone,
    teacherMobile: teacherPhone,
    teacherEmail,
    contact: teacherPhone,
    addressDetail: dto.homeAddressSummary?.trim() || undefined,
    instructors: '',
    sessions: sessions.length > 0 ? sessions : undefined,
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
    instructorApplicationId:
      dto.sourceApplicationId != null ? String(dto.sourceApplicationId) : undefined,
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
    educationSchedules: mapParticipantSessionsToEducationSchedules(dto.sessions),
    activityWithdrawn:
      dto.giveUpAt != null || dto.participantStatus?.trim().toUpperCase() === 'GIVE_UP',
  }
}

/** participants(VOLUNTEER) codegen 미반영 enrich — BE additive 필드 */
type ParticipantVolunteerListEnriched = ParticipantListItemResponse & {
  contact?: string | null
  phone?: string | null
  email?: string | null
  id1365?: string | null
  external1365Id?: string | null
  assignedOrganizationNames?: string[] | null
  assignedInstitutionNames?: string[] | null
  volunteerKind?: 'GENERAL' | 'EMPLOYEE' | null
}

function readParticipantVolunteerEnriched(
  dto: ParticipantListItemResponse
): ParticipantVolunteerListEnriched {
  return dto as ParticipantVolunteerListEnriched
}

export function mapParticipantToParticipatingVolunteerRow(
  dto: ParticipantListItemResponse,
  index: number,
  programId: string
): ParticipatingVolunteerRow {
  const enriched = readParticipantVolunteerEnriched(dto)
  const affiliation = resolveStoredAffiliation({
    affiliationOrganizationId: dto.organizationId,
    affiliationDisplayName: dto.organizationName,
  })
  const assignedInstitutionNames =
    readParticipantStringArray(enriched.assignedInstitutionNames) ??
    readParticipantStringArray(enriched.assignedOrganizationNames) ??
    (dto.organizationName?.trim() ? [dto.organizationName.trim()] : [])
  const contact = enriched.contact?.trim() || enriched.phone?.trim() || ''
  const email = enriched.email?.trim() || ''
  const id1365 =
    enriched.id1365?.trim() || enriched.external1365Id?.trim() || ''

  return {
    id: toId(dto.participantId),
    volunteerApplicationId:
      dto.sourceApplicationId != null ? String(dto.sourceApplicationId) : undefined,
    volunteerKind:
      enriched.volunteerKind === 'GENERAL' || enriched.volunteerKind === 'EMPLOYEE'
        ? enriched.volunteerKind
        : undefined,
    memberId: dto.memberId,
    programId,
    no: index + 1,
    volunteerName: dto.memberName?.trim() || '이름 없음',
    affiliationOrganizationId: affiliation.affiliationOrganizationId,
    affiliation: affiliation.affiliation,
    id1365,
    assignedInstitutionNames,
    sessions: mapSessionProgressToParticipatingSchoolSessions(dto.sessions),
    contact: contact || '-',
    email: email || '-',
    contactRaw: contact || undefined,
    emailRaw: email || undefined,
    activityWithdrawn:
      dto.giveUpAt != null || dto.participantStatus?.trim().toUpperCase() === 'GIVE_UP',
  }
}
