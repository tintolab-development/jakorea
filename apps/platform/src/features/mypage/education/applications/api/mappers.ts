import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import { formatDisplayDateRange } from '@/shared/lib/format-display-date'
import type { ProgramDetail, ProgramDetailCase } from '@/features/program'
import { mapPortalCategoryLabel } from '@/features/program/lib/portal-category'
import { mapApplicationWindowToRecruitmentStatus } from '@/features/program/lib/map-from-cms'
import {
  formatInterviewAtLabel,
  resolveApplicationContentFromAnswers,
  resolvePreferredEducationScheduleLabelFromAnswers,
} from '../lib/application-content-from-answers'
import { buildTeacherApplicationContentFromPortal } from '../lib/teacher-application-content-from-portal'
import { isOrganizationEducationApplication } from '../lib/organization-education-application'
import { readUjatPortalBannerState, readUjatRevisionReason } from '../lib/ujat-portal-banner'
import { buildUjatApplicationContentFromPortal } from '../lib/ujat-application-content-from-answers'
import { buildUjatVolunteerApplicationProfileFromAnswers } from '../lib/ujat-volunteer-application-content-from-answers'
import type {
  EducationApplicationListItem,
  EducationDisplayStatus,
  EducationTeacherAssignment,
  EducationTeacherAssignedInstructor,
  EducationTeacherDeliveryStatus,
  EducationUjatTemporarySchedule,
} from '../model/types'
import {
  resolveLastParticipatedSession,
  resolvePortalWithdrawalPhase,
} from './map-portal-withdrawal-phase'
import type {
  PortalProgramApplicationDetail,
  PortalProgramApplicationListItem,
  ProgramApplicationType,
  PortalTeacherAssignmentItem,
  PortalTeacherAssignmentTextbook,
} from './types'

const DISPLAY_STATUS_FROM_API: Record<string, EducationDisplayStatus> = {
  '결과 대기': 'waiting_result',
  승인대기: 'waiting_result',
  '승인 대기': 'waiting_result',
  '서류 합격': 'document_passed',
  '진행 중': 'in_progress',
  진행중: 'in_progress',
  '진행 완료': 'completed',
  '활동 포기': 'withdrawn',
  '신청 반려': 'rejected',
  '승인 취소': 'rejected',
  '작성 중': 'waiting_result',
  '신청 취소': 'cancelled',
  // 영문/코드형 displayStatus (일부 환경·상세 폴백)
  WAITING_RESULT: 'waiting_result',
  WAITING: 'waiting_result',
  DOCUMENT_PASSED: 'document_passed',
  DOC_PASSED: 'document_passed',
  IN_PROGRESS: 'in_progress',
  INSTRUCTOR_REPORTS_PENDING: 'in_progress',
  COMPLETED: 'completed',
  FINISHED: 'completed',
  WITHDRAWN: 'withdrawn',
  GIVE_UP: 'withdrawn',
  GIVEN_UP: 'withdrawn',
  REJECTED: 'rejected',
  AUTO_REJECTED: 'rejected',
  INTERVIEW_FAILED: 'rejected',
  CANCELLED_BY_ADMIN: 'rejected',
  APPROVAL_CANCELLED: 'rejected',
  CANCELLED: 'cancelled',
  CANCELED: 'cancelled',
}

const APPLICATION_TYPE_SET = new Set<ProgramApplicationType>([
  'INDIVIDUAL',
  'ORGANIZATION',
  'INSTRUCTOR',
  'VOLUNTEER',
])

function portalPublicFileContentUrl(fileObjectId: number): string {
  return `/api/portal/public/files/${fileObjectId}/content`
}

function readApplicationType(value: string | undefined): ProgramApplicationType | null {
  const normalized = value?.trim().toUpperCase()
  if (normalized && APPLICATION_TYPE_SET.has(normalized as ProgramApplicationType)) {
    return normalized as ProgramApplicationType
  }
  return null
}

function mapDisplayStatus(value: string | undefined): EducationDisplayStatus | null {
  const normalized = value?.trim()
  if (!normalized) return null
  if (normalized in DISPLAY_STATUS_FROM_API) {
    return DISPLAY_STATUS_FROM_API[normalized]!
  }
  const upper = normalized.toUpperCase()
  if (upper in DISPLAY_STATUS_FROM_API) {
    return DISPLAY_STATUS_FROM_API[upper]!
  }
  return null
}

function hasStatus(value: string, tokens: readonly string[]): boolean {
  return tokens.includes(value)
}

/** Application GET `program.surveyConfigured` / `satisfactionConfigured` — boolean only. */
function readConfiguredFlag(value: unknown): boolean | undefined {
  if (value === true || value === false) return value
  return undefined
}

function resolveDisplayStatusFromApplicationFields(input: {
  applicationStatus?: string | null
  participationStatus?: string | null
}): EducationDisplayStatus {
  const applicationStatus = (input.applicationStatus ?? '').trim().toUpperCase()
  const participationStatus = (input.participationStatus ?? '').trim().toUpperCase()

  if (
    hasStatus(applicationStatus, [
      'REJECTED',
      'AUTO_REJECTED',
      'FINAL_REJECTED',
      'FINAL_FAILED',
      'FAILED',
      'INTERVIEW_FAILED',
      'CANCELLED_BY_ADMIN',
      'APPROVAL_CANCELLED',
    ])
  ) {
    return 'rejected'
  }
  if (hasStatus(applicationStatus, ['CANCELLED', 'CANCELED'])) return 'cancelled'
  if (
    applicationStatus.startsWith('GIVE_UP') ||
    applicationStatus === 'GIVEN_UP' ||
    participationStatus.startsWith('GIVE_UP') ||
    participationStatus === 'WITHDRAWN'
  ) {
    return 'withdrawn'
  }
  if (applicationStatus === 'COMPLETED' || applicationStatus === 'FINISHED') {
    return 'completed'
  }
  if (
    hasStatus(applicationStatus, ['FINAL_SELECTED', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'PARTICIPATING']) ||
    hasStatus(participationStatus, ['IN_PROGRESS', 'ACTIVE', 'PARTICIPATING', 'ONGOING'])
  ) {
    return 'in_progress'
  }
  if (
    hasStatus(applicationStatus, [
      'DOCUMENT_PASSED',
      'DOC_PASSED',
      'INTERVIEW_WAITING',
      'INTERVIEW_ASSIGNED',
      'WAITING_ASSIGNMENT',
    ])
  ) {
    return 'document_passed'
  }
  return 'waiting_result'
}

/** 상세·목록 공통: GET displayStatus SSOT. 수료·사업종료일로 재계산하지 않는다. */
export function resolvePortalDisplayStatus(
  detail: PortalProgramApplicationDetail | PortalProgramApplicationListItem,
): EducationDisplayStatus {
  const fromLabel = mapDisplayStatus(detail.displayStatus)
  if (fromLabel) return fromLabel

  const participation =
    'participation' in detail && detail.participation
      ? detail.participation
      : undefined

  return resolveDisplayStatusFromApplicationFields({
    applicationStatus: detail.applicationStatus,
    participationStatus: detail.participationStatus ?? participation?.status,
  })
}

function mapDetailCase(
  applicationType: ProgramApplicationType,
  programGroup: string | undefined,
  programType?: string,
): ProgramDetailCase {
  const type = (programType ?? '').trim().toUpperCase()
  const isGemini =
    type === 'GEMINI_TRAINING' || type === 'GEMINI' || type === 'VISITING_TRAINING'
  if (applicationType === 'VOLUNTEER') {
    return (programGroup ?? '').toUpperCase() === 'UJAT' ? 'ujat-volunteer' : 'volunteer'
  }
  if (applicationType === 'INSTRUCTOR') return 'instructor'
  if (isGemini) return 'gemini'
  if (applicationType === 'ORGANIZATION' && (programGroup ?? '').toUpperCase() === 'UJAT') {
    return 'ujat-participant'
  }
  return 'general'
}

function mapCategoryLabel(
  input: {
    applicationType: ProgramApplicationType
    programType?: string
    programGroup?: string
    portalCategories?: string[]
  },
): string {
  if (input.portalCategories != null) {
    return mapPortalCategoryLabel(input.portalCategories, input.programType)
  }

  const group = (input.programGroup ?? '').trim().toUpperCase()
  if (group === 'UJAT') {
    return mapPortalCategoryLabel(
      [input.applicationType === 'ORGANIZATION' ? 'ORGANIZATION' : 'YOUTH_YOUNG'],
      input.programType,
    )
  }

  if (input.programType?.trim()) {
    return mapPortalCategoryLabel(undefined, input.programType)
  }

  const fallbackCategory = input.applicationType === 'INSTRUCTOR'
    ? 'INSTRUCTOR'
    : input.applicationType === 'ORGANIZATION'
      ? 'ORGANIZATION'
      : 'YOUTH_YOUNG'
  return mapPortalCategoryLabel([fallbackCategory], undefined)
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined): string {
  return formatDisplayDateRange(start, end, { empty: '-' })
}

function parseRecruitmentDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * 모집 배지는 프로그램 모집기간 기준(프로그램 목록과 동일).
 * 신청 진행 상태(displayStatus)는 내 신청 상태라 모집 상태와 다르다 — 기간이 없을 때만 폴백.
 */
export function mapApplicationRecruitmentStatus(input: {
  recruitmentStartAt?: string | null
  recruitmentEndAt?: string | null
  displayStatus: EducationDisplayStatus
}): RecruitmentStatus {
  const start = parseRecruitmentDate(input.recruitmentStartAt)
  const end = parseRecruitmentDate(input.recruitmentEndAt)
  if (start && end) return mapApplicationWindowToRecruitmentStatus(start, end)
  if (input.displayStatus === 'in_progress') return 'recruiting'
  return 'closed'
}

export function mapPortalProgramApplicationListItem(
  row: PortalProgramApplicationListItem,
): EducationApplicationListItem | null {
  const applicationType = readApplicationType(row.applicationType)
  const title = row.programTitle?.trim()
  if (!applicationType || row.applicationId == null || row.programId == null || !title) return null

  const displayStatus = resolvePortalDisplayStatus(row)
  const withdrawalPhase = resolvePortalWithdrawalPhase(row, displayStatus)
  const lastParticipatedSession = resolveLastParticipatedSession(row)
  const detailCase = mapDetailCase(applicationType, row.programGroup, row.programType)
  const thumbnailUrl =
    row.thumbnailFileObjectId == null ? undefined : portalPublicFileContentUrl(row.thumbnailFileObjectId)
  const ujatPortalBannerState = readUjatPortalBannerState(row.supplement)
  const ujatRevisionReason = readUjatRevisionReason(row.supplement)
  const ujatAssignmentRevision = row.supplement?.ujat?.assignmentRevision

  return {
    id: String(row.applicationId),
    applicationType,
    programId: String(row.programId),
    recruitmentId: row.recruitmentId,
    categoryLabel: mapCategoryLabel({
      applicationType,
      programType: row.programType,
      programGroup: row.programGroup,
      portalCategories: row.portalCategories,
    }),
    title,
    recruitmentPeriodLabel: formatDateRange(row.recruitmentStartAt, row.recruitmentEndAt),
    operatingPeriodLabel: formatDateRange(row.educationStartAt, row.educationEndAt),
    recruitmentStatus: mapApplicationRecruitmentStatus({
      recruitmentStartAt: row.recruitmentStartAt,
      recruitmentEndAt: row.recruitmentEndAt,
      displayStatus,
    }),
    // TODO(BE): 목록 응답에 교육대상·교육형태 필드가 추가되면 여기서 매핑 (상세와 같은 라벨 함수 사용)
    educationTargetLabel: '',
    educationFormLabel: '',
    thumbnailUrl,
    displayStatus,
    ...(withdrawalPhase ? { withdrawalPhase } : {}),
    ...(lastParticipatedSession != null ? { lastParticipatedSession } : {}),
    detailCase,
    programType: row.programType,
    programGroup: row.programGroup,
    ...(typeof row.pendingSurveyCount === 'number' && Number.isFinite(row.pendingSurveyCount)
      ? { pendingSurveyCount: row.pendingSurveyCount }
      : {}),
    ...(typeof row.certificateAvailable === 'boolean'
      ? { certificateAvailable: row.certificateAvailable }
      : {}),
    ...(Array.isArray(row.availableActions)
      ? { availableActions: row.availableActions.filter(action => typeof action === 'string') }
      : {}),
    ...(ujatPortalBannerState ? { ujatPortalBannerState } : {}),
    ...(ujatRevisionReason ? { ujatRevisionReason } : {}),
    ...(typeof ujatAssignmentRevision === 'number' ? { ujatAssignmentRevision } : {}),
  }
}

/**
 * BE handoff: `interviewAtLabel` 우선, 없으면 `assignedInterviewStartAt` FE 포맷.
 * `hasInterview === false`면 배너용 라벨을 붙이지 않는다.
 */
function resolveInterviewFields(
  detail: PortalProgramApplicationDetail,
  displayStatus: EducationDisplayStatus,
): {
  hasInterview: boolean
  interviewAtLabel?: string
} {
  const interviewAtLabel =
    (typeof detail.interviewAtLabel === 'string' && detail.interviewAtLabel.trim()) ||
    formatInterviewAtLabel(detail.assignedInterviewStartAt) ||
    undefined

  const interviewEnabledOnProgram = detail.program?.interviewEnabled === true
  const hasAssignedSlot = Boolean(detail.assignedInterviewStartAt?.trim())

  if (typeof detail.hasInterview === 'boolean') {
    const hasInterview =
      detail.hasInterview ||
      (displayStatus === 'document_passed' &&
        (interviewEnabledOnProgram || hasAssignedSlot || Boolean(interviewAtLabel)))
    return {
      hasInterview,
      ...(interviewAtLabel ? { interviewAtLabel } : {}),
    }
  }

  const hasInterview =
    interviewEnabledOnProgram || Boolean(interviewAtLabel) || hasAssignedSlot
  return {
    hasInterview,
    ...(interviewAtLabel ? { interviewAtLabel } : {}),
  }
}

function readSummaryCount(summary: unknown, key: string): number | undefined {
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return undefined
  const value = (summary as Record<string, unknown>)[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normalizeApplicationAnswers(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw)
      return normalizeApplicationAnswers(parsed)
    } catch {
      return {}
    }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const record = raw as Record<string, unknown>
  const nested = record.answers
  if (nested && typeof nested === 'object' && !Array.isArray(nested) && !('documentId' in nested)) {
    const nestedRecord = nested as Record<string, unknown>
    if (Object.keys(nestedRecord).some(key => key.includes('-seed-') || key.includes('schedule'))) {
      return nestedRecord
    }
  }
  return record
}

function mapUjatTemporarySchedule(
  detail: PortalProgramApplicationDetail,
): EducationUjatTemporarySchedule | undefined {
  const temporarySchedule = detail.supplement?.ujat?.temporarySchedule
  if (!temporarySchedule) return undefined
  return {
    slots: (temporarySchedule.slots ?? []).map(slot => ({
      scheduleId: slot.scheduleId ?? null,
      scheduleStartAt: slot.scheduleStartAt ?? null,
      grade: slot.grade ?? null,
      className: slot.className ?? null,
      studentCount: slot.studentCount ?? null,
      assignmentStatus: slot.assignmentStatus ?? null,
    })),
  }
}

function mapTeacherDeliveryStatus(
  status: PortalTeacherAssignmentTextbook['deliveryStatus'],
): EducationTeacherDeliveryStatus {
  switch (status) {
    case 'SHIPPING':
      return 'shipping'
    case 'DELIVERED':
      return 'completed'
    case 'PREPARING':
    default:
      return 'before'
  }
}

/**
 * 상세 응답의 teacherAssignment는 교재와 강사 카드 조회 가능 여부만 제공한다.
 * 실제 강사 목록·동의서는 assigned-instructors API 응답을 사용한다.
 */
export function mapTeacherAssignedInstructors(
  assignments: PortalTeacherAssignmentItem[] | null | undefined,
): EducationTeacherAssignedInstructor[] {
  const instructorByMemberId = new Map<number, EducationTeacherAssignedInstructor>()
  for (const assignment of assignments ?? []) {
    const instructor = mapTeacherAssignedInstructor(assignment)
    if (instructor && instructor.instructorMemberId != null) {
      // 한 강사가 여러 교육 일정에 배정돼도 카드에는 한 번만 표시한다.
      // API가 전달한 첫 배정 순서는 Figma의 좌우 탐색 순서로 유지한다.
      instructorByMemberId.set(instructor.instructorMemberId, instructor)
    }
  }
  return [...instructorByMemberId.values()]
}

function mapTeacherAssignment(
  detail: PortalProgramApplicationDetail,
): EducationTeacherAssignment | undefined {
  if (!detail.teacherAssignment) return undefined

  const textbook = detail.teacherAssignment.textbook

  return {
    instructors: mapTeacherAssignedInstructors(detail.teacherAssignment.assignments),
    ...(textbook
      ? {
          textbook: {
            title: textbook.title?.trim() ?? '',
            kitCountLabel: textbook.kitCountLabel?.trim() ?? '',
            volumeCountLabel: textbook.volumeCountLabel?.trim() ?? '',
            deliveryStatus: mapTeacherDeliveryStatus(textbook.deliveryStatus),
          },
        }
      : {}),
  }
}

function mapTeacherAssignedInstructor(
  assignment: PortalTeacherAssignmentItem,
): EducationTeacherAssignedInstructor | undefined {
  const name = assignment.instructorName?.trim()
  const instructorMemberId = assignment.instructorMemberId
  if (!name || instructorMemberId == null) return undefined

  return {
    id: String(instructorMemberId),
    instructorMemberId,
    name,
    ...(assignment.instructorPhone?.trim() ? { phone: assignment.instructorPhone.trim() } : {}),
    ...(assignment.instructorEmail?.trim() ? { email: assignment.instructorEmail.trim() } : {}),
  }
}

function readOverlayString(row: Record<string, unknown> | undefined, key: string): string {
  if (!row) return ''
  const raw = row[key]
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  return ''
}

function asOverlayRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

function nestedOverlayRecord(
  row: Record<string, unknown> | undefined,
  ...path: string[]
): Record<string, unknown> | undefined {
  let current: Record<string, unknown> | undefined = row
  for (const part of path) {
    current = asOverlayRecord(current?.[part])
    if (!current) return undefined
  }
  return current
}

function pickGeminiInstitutionOverlay(
  detail: PortalProgramApplicationDetail,
): Record<string, unknown> {
  const row = detail as Record<string, unknown>
  const program = asOverlayRecord(detail.program)
  const organizationApplication = asOverlayRecord(detail.organizationApplication)
  const nestedInst =
    nestedOverlayRecord(row, 'application', 'gemini', 'inst') ??
    nestedOverlayRecord(row, 'gemini', 'inst') ??
    nestedOverlayRecord(row, 'geminiApplication')
  const overlay: Record<string, unknown> = {}
  const assign = (target: string, ...keys: string[]) => {
    if (overlay[target]) return
    for (const source of [row, nestedInst, organizationApplication, program]) {
      for (const key of keys) {
        const value = readOverlayString(source, key)
        if (value) {
          overlay[target] = value
          return
        }
      }
    }
  }
  assign(
    'institutionName',
    'institutionName',
    'organizationName',
    'schoolName',
    'approvedInstitutionName',
  )
  assign('applicationGrade', 'applicationGrade', 'grade', 'educationGrade', 'requestedGrade')
  assign('regionLabel', 'regionLabel', 'institutionAddress', 'address')
  assign('addressDetail', 'addressDetail', 'detailAddress', 'institutionAddressDetail')
  assign(
    'teacherName',
    'teacherName',
    'managerName',
    'contactName',
    'teacherContactName',
    'contactTeacherName',
  )
  assign('teacherTel', 'teacherTel', 'contactPhone', 'contactTel')
  assign('teacherMobile', 'teacherMobile', 'contactMobile')
  assign('teacherEmail', 'teacherEmail', 'contactEmail')
  assign('officialNeed', 'officialNeed', 'officialDocumentRequired')
  assign('officialDetail', 'officialDetail', 'officialDocumentRequiredInfo')
  return overlay
}

function mergeApplicationAnswers(
  answers: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...answers }
  for (const [key, value] of Object.entries(overlay)) {
    const existing = merged[key]
    if (existing == null || existing === '') merged[key] = value
  }
  return merged
}

export function mapPortalProgramApplicationDetail(
  detail: PortalProgramApplicationDetail,
  knownApplicationType?: ProgramApplicationType | null,
): EducationApplicationListItem | null {
  const displayStatus = resolvePortalDisplayStatus(detail)
  const mapped = mapPortalProgramApplicationListItem({
    ...detail,
    applicationType: detail.applicationType ?? knownApplicationType ?? undefined,
    displayStatus:
      detail.displayStatus ??
      Object.entries(DISPLAY_STATUS_FROM_API).find(([, status]) => status === displayStatus)?.[0],
    // 상세 화면의 식별값·제목은 신청 상세 응답의 루트 필드만 사용한다.
    // nested program 값으로 보정하면 다른 모집행 또는 오래된 projection이
    // 화면에 섞일 수 있다.
    programType: detail.programType ?? detail.program?.programType,
    programGroup: detail.programGroup,
    portalCategories: detail.portalCategories ?? detail.program?.portalCategories,
    thumbnailFileObjectId: detail.thumbnailFileObjectId ?? detail.program?.thumbnailFileObjectId,
    educationStartAt: detail.educationStartAt,
    educationEndAt: detail.educationEndAt,
  })
  if (!mapped) return null
  mapped.displayStatus = displayStatus
  const withdrawalPhase = resolvePortalWithdrawalPhase(detail, displayStatus)
  if (withdrawalPhase) mapped.withdrawalPhase = withdrawalPhase
  else delete mapped.withdrawalPhase
  const lastParticipatedSession = resolveLastParticipatedSession(detail)
  if (lastParticipatedSession != null) mapped.lastParticipatedSession = lastParticipatedSession
  else delete mapped.lastParticipatedSession
  mapped.recruitmentStatus = mapApplicationRecruitmentStatus({
    recruitmentStartAt: detail.recruitmentStartAt ?? detail.program?.recruitmentStartAt,
    recruitmentEndAt: detail.recruitmentEndAt ?? detail.program?.recruitmentEndAt,
    displayStatus,
  })
  mapped.cancellable = detail.cancellable ?? detail.capabilities?.canCancelApplication
  // 상세는 certificateAvailable이 없음 — capabilities.canIssueCertificate를 쓴다.
  // 목록 row를 spread해도 상세에 없는 필드로 덮지 않도록 상세 힌트만 설정한다.
  if (typeof detail.capabilities?.canIssueCertificate === 'boolean') {
    mapped.canIssueCertificate = detail.capabilities.canIssueCertificate
  }
  const participantId = detail.participation?.participantId
  if (typeof participantId === 'number' && Number.isFinite(participantId) && participantId > 0) {
    mapped.participantId = participantId
  }
  const certificateStatus = detail.participation?.certificateStatus?.trim()
  if (certificateStatus) {
    mapped.certificateStatus = certificateStatus
  }
  if (typeof detail.capabilities?.canSubmitSatisfaction === 'boolean') {
    mapped.canSubmitSatisfaction = detail.capabilities.canSubmitSatisfaction
  }
  if (typeof detail.capabilities?.canSubmitSurvey === 'boolean') {
    mapped.canSubmitSurvey = detail.capabilities.canSubmitSurvey
  }
  const satisfactionPendingCount = readSummaryCount(detail.summary, 'satisfactionPendingCount')
  if (satisfactionPendingCount != null) {
    mapped.satisfactionPendingCount = satisfactionPendingCount
  }
  const surveyPendingCount = readSummaryCount(detail.summary, 'surveyPendingCount')
  if (surveyPendingCount != null) {
    mapped.surveyPendingCount = surveyPendingCount
  }
  if (detail.program) {
    mapped.programConfig = {
      programType: detail.program.programType,
      educationFormLabel: detail.program.educationFormLabel,
      educationJournalEnabled: detail.program.educationJournalEnabled,
      surveyConfigured: readConfiguredFlag(detail.program.surveyConfigured),
      satisfactionConfigured: readConfiguredFlag(detail.program.satisfactionConfigured),
    }
  }
  if (detail.portalWarningCode?.trim()) {
    mapped.portalWarningCode = detail.portalWarningCode.trim()
  }
  const recruitmentLabel = formatDateRange(
    detail.program?.recruitmentStartAt,
    detail.program?.recruitmentEndAt,
  )
  if (recruitmentLabel !== '-') mapped.recruitmentPeriodLabel = recruitmentLabel

  const answers = mergeApplicationAnswers(
    normalizeApplicationAnswers(detail.answers),
    pickGeminiInstitutionOverlay(detail),
  )
  const fromAnswers = resolveApplicationContentFromAnswers(answers)
  const preferredFromBlocks = resolvePreferredEducationScheduleLabelFromAnswers({
    preferredScheduleBlocks: detail.preferredScheduleBlocks ?? [],
  })
  if (fromAnswers.selfIntroMotivation) {
    mapped.selfIntroMotivation = fromAnswers.selfIntroMotivation
  }
  const preferredLabel =
    fromAnswers.preferredEducationScheduleLabel ?? preferredFromBlocks
  if (preferredLabel) {
    mapped.preferredEducationScheduleLabel = preferredLabel
  }
  if (fromAnswers.preferredScheduleOptionValues?.length) {
    mapped.preferredScheduleOptionValues = fromAnswers.preferredScheduleOptionValues
  }
  if (detail.preferredScheduleBlocks?.length) {
    mapped.preferredScheduleBlocks = detail.preferredScheduleBlocks
  }
  if (Object.keys(answers).length > 0) {
    mapped.applicationAnswers = answers
  }
  if (detail.formResponseId != null && Number.isFinite(detail.formResponseId)) {
    mapped.formResponseId = detail.formResponseId
  }
  if (detail.formBindingId != null && Number.isFinite(detail.formBindingId)) {
    mapped.formBindingId = detail.formBindingId
  }
  const formResponseStatus = detail.formResponseStatus?.trim()
  if (formResponseStatus) {
    mapped.formResponseStatus = formResponseStatus
  }
  const ujatTemporarySchedule = mapUjatTemporarySchedule(detail)
  if (ujatTemporarySchedule) {
    mapped.ujatTemporarySchedule = ujatTemporarySchedule
  }
  const preferredEducationDateOptions = detail.supplement?.ujat?.preferredEducationDateOptions
  if (Array.isArray(preferredEducationDateOptions)) {
    mapped.ujatPreferredEducationDateOptions = preferredEducationDateOptions.flatMap(row => {
      const id = typeof row?.id === 'string' ? row.id.trim() : ''
      const date = typeof row?.date === 'string' ? row.date.trim() : ''
      const label = typeof row?.label === 'string' ? row.label.trim() : ''
      if (!id || !date) return []
      return [{ id, date, label: label || date }]
    })
  }

  const interview = resolveInterviewFields(detail, displayStatus)
  mapped.hasInterview = interview.hasInterview
  if (interview.interviewAtLabel) mapped.interviewAtLabel = interview.interviewAtLabel

  const applicationType =
    readApplicationType(detail.applicationType) ??
    (knownApplicationType ? readApplicationType(knownApplicationType) ?? knownApplicationType : null)
  if (applicationType === 'ORGANIZATION' || applicationType === 'INDIVIDUAL') {
    const teacherAssignment = mapTeacherAssignment(detail)
    if (teacherAssignment) mapped.teacherAssignment = teacherAssignment
  }
  const nestedProgram = detail.program as
    | Pick<
        ProgramDetail,
        'programAudience' | 'programType' | 'registrationKind' | 'educationScheduleLines' | 'eventSchedules' | 'educationFormLabel'
      >
    | undefined
  const isOrganizationApplication = isOrganizationEducationApplication(
    {
      applicationType: applicationType ?? mapped.applicationType,
      categoryLabel: mapped.categoryLabel,
      applicationAnswers: answers,
    },
    nestedProgram,
  )
  if (isOrganizationApplication) {
    mapped.teacherApplicationContent = buildTeacherApplicationContentFromPortal(
      {
        applicationType: 'ORGANIZATION',
        programAudience: nestedProgram?.programAudience,
        detailCase: mapped.detailCase,
        programGroup: detail.programGroup ?? detail.program?.programGroup,
        answers,
        preferredScheduleBlocks: detail.preferredScheduleBlocks,
        preferredScheduleOptionValues: mapped.preferredScheduleOptionValues,
        preferredEducationScheduleLabel: mapped.preferredEducationScheduleLabel,
      },
      nestedProgram,
    )
  }

  if (mapped.detailCase === 'ujat-participant') {
    const ujatContent = buildUjatApplicationContentFromPortal({
      answers,
      preferredScheduleBlocks: detail.preferredScheduleBlocks,
    })
    if (ujatContent) mapped.ujatApplicationContent = ujatContent
  }

  if (mapped.detailCase === 'ujat-volunteer') {
    const volunteerProfile = buildUjatVolunteerApplicationProfileFromAnswers(answers)
    if (volunteerProfile) mapped.ujatVolunteerApplicationContent = volunteerProfile
  }

  return mapped
}
