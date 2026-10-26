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
import type {
  EducationApplicationListItem,
  EducationDisplayStatus,
  EducationUjatTemporarySchedule,
} from '../model/types'
import type {
  PortalProgramApplicationDetail,
  PortalProgramApplicationListItem,
  ProgramApplicationType,
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
  '작성 중': 'waiting_result',
  '신청 취소': 'withdrawn',
  // 영문/코드형 displayStatus (일부 환경·상세 폴백)
  WAITING_RESULT: 'waiting_result',
  WAITING: 'waiting_result',
  DOCUMENT_PASSED: 'document_passed',
  DOC_PASSED: 'document_passed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FINISHED: 'completed',
  WITHDRAWN: 'withdrawn',
  GIVE_UP: 'withdrawn',
  GIVEN_UP: 'withdrawn',
  REJECTED: 'rejected',
  AUTO_REJECTED: 'rejected',
  CANCELLED: 'withdrawn',
  CANCELED: 'withdrawn',
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

function resolveDisplayStatusFromApplicationFields(input: {
  applicationStatus?: string | null
  participationStatus?: string | null
  completionStatus?: string | null
}): EducationDisplayStatus {
  const applicationStatus = (input.applicationStatus ?? '').trim().toUpperCase()
  const participationStatus = (input.participationStatus ?? '').trim().toUpperCase()
  const completionStatus = (input.completionStatus ?? '').trim().toUpperCase()

  if (hasStatus(applicationStatus, ['REJECTED', 'AUTO_REJECTED', 'FINAL_REJECTED', 'FINAL_FAILED', 'FAILED'])) {
    return 'rejected'
  }
  if (hasStatus(applicationStatus, ['CANCELLED', 'CANCELED'])) return 'withdrawn'
  if (
    applicationStatus.startsWith('GIVE_UP') ||
    applicationStatus === 'GIVEN_UP' ||
    participationStatus.startsWith('GIVE_UP') ||
    participationStatus === 'WITHDRAWN'
  ) {
    return 'withdrawn'
  }
  if (
    completionStatus === 'COMPLETED' ||
    participationStatus === 'COMPLETED' ||
    applicationStatus === 'COMPLETED' ||
    applicationStatus === 'FINISHED'
  ) {
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

/** 상세·목록 공통: displayStatus 우선, 없으면 applicationStatus·참여 상태로 탭 분류. */
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
    completionStatus: participation?.completionStatus,
  })
}

function mapDetailCase(
  applicationType: ProgramApplicationType,
  programGroup: string | undefined,
): ProgramDetailCase {
  if (applicationType === 'VOLUNTEER') {
    return (programGroup ?? '').toUpperCase() === 'UJAT' ? 'ujat-volunteer' : 'volunteer'
  }
  if (applicationType === 'INSTRUCTOR') return 'instructor'
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
  const detailCase = mapDetailCase(applicationType, row.programGroup)
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
    educationTargetLabel: '전체',
    educationForm: 'offline',
    educationFormLabel: '오프라인',
    thumbnailUrl,
    displayStatus,
    detailCase,
    ...(row.pendingSurveyCount != null && row.pendingSurveyCount > 0
      ? { pendingSurveyCount: row.pendingSurveyCount }
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
    programType: detail.programType,
    programGroup: detail.programGroup,
    portalCategories: detail.portalCategories ?? detail.program?.portalCategories,
    thumbnailFileObjectId: detail.thumbnailFileObjectId ?? detail.program?.thumbnailFileObjectId,
    educationStartAt: detail.educationStartAt,
    educationEndAt: detail.educationEndAt,
  })
  if (!mapped) return null
  mapped.displayStatus = displayStatus
  mapped.recruitmentStatus = mapApplicationRecruitmentStatus({
    recruitmentStartAt: detail.recruitmentStartAt ?? detail.program?.recruitmentStartAt,
    recruitmentEndAt: detail.recruitmentEndAt ?? detail.program?.recruitmentEndAt,
    displayStatus,
  })
  mapped.cancellable = detail.cancellable ?? detail.capabilities?.canCancelApplication
  if (detail.certificateAvailable != null) {
    mapped.certificateAvailable = detail.certificateAvailable
  }
  if (detail.program) {
    mapped.programConfig = {
      programType: detail.program.programType,
      educationFormLabel: detail.program.educationFormLabel,
      educationJournalEnabled: detail.program.educationJournalEnabled,
      surveyConfigured: detail.program.surveyConfigured,
      satisfactionConfigured: detail.program.satisfactionConfigured,
    }
  }
  const recruitmentLabel = formatDateRange(
    detail.program?.recruitmentStartAt,
    detail.program?.recruitmentEndAt,
  )
  if (recruitmentLabel !== '-') mapped.recruitmentPeriodLabel = recruitmentLabel

  const answers = normalizeApplicationAnswers(detail.answers)
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

  const interview = resolveInterviewFields(detail, displayStatus)
  mapped.hasInterview = interview.hasInterview
  if (interview.interviewAtLabel) mapped.interviewAtLabel = interview.interviewAtLabel

  const applicationType =
    readApplicationType(detail.applicationType) ??
    (knownApplicationType ? readApplicationType(knownApplicationType) ?? knownApplicationType : null)
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

  return mapped
}
