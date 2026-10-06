import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import type { ProgramDetailCase } from '@/features/program'
import type { EducationApplicationListItem, EducationDisplayStatus } from '../model/types'
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
  applicationType: ProgramApplicationType,
  programGroup: string | undefined,
): string {
  const group = (programGroup ?? '').toUpperCase()
  if (group === 'UJAT') return 'UJAT'
  if (group === 'ONE_COMPANY_ONE_SCHOOL') return '1사1교'
  if (group === 'TRAINED_TEACHER') return '교육받은 교사'
  if (applicationType === 'INSTRUCTOR') return '강사'
  if (applicationType === 'VOLUNTEER') return '봉사'
  if (applicationType === 'ORGANIZATION') return '기관'
  return '일반'
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined): string {
  const startLabel = formatDate(start)
  const endLabel = formatDate(end)
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`
  if (startLabel) return startLabel
  if (endLabel) return endLabel
  return '-'
}

function mapRecruitmentStatus(displayStatus: EducationDisplayStatus): RecruitmentStatus {
  if (displayStatus === 'in_progress') return 'recruiting'
  return 'closed'
}

export function mapPortalProgramApplicationListItem(
  row: PortalProgramApplicationListItem,
): EducationApplicationListItem | null {
  const applicationType = readApplicationType(row.applicationType)
  if (!applicationType || row.applicationId == null || row.programId == null) return null

  const displayStatus = resolvePortalDisplayStatus(row)
  const detailCase = mapDetailCase(applicationType, row.programGroup)
  const thumbnailUrl =
    row.thumbnailFileObjectId == null ? undefined : portalPublicFileContentUrl(row.thumbnailFileObjectId)

  return {
    id: String(row.applicationId),
    applicationType,
    programId: String(row.programId),
    recruitmentId: row.recruitmentId,
    categoryLabel: mapCategoryLabel(applicationType, row.programGroup),
    title: row.programTitle?.trim() || '프로그램',
    recruitmentPeriodLabel: formatDateRange(row.recruitmentStartAt, row.recruitmentEndAt),
    operatingPeriodLabel: formatDateRange(row.educationStartAt, row.educationEndAt),
    recruitmentStatus: mapRecruitmentStatus(displayStatus),
    educationTargetLabel: '전체',
    educationForm: 'offline',
    educationFormLabel: '오프라인',
    thumbnailUrl,
    displayStatus,
    detailCase,
  }
}

export function mapPortalProgramApplicationDetail(
  detail: PortalProgramApplicationDetail,
): EducationApplicationListItem | null {
  const displayStatus = resolvePortalDisplayStatus(detail)
  const mapped = mapPortalProgramApplicationListItem({
    ...detail,
    displayStatus:
      detail.displayStatus ??
      Object.entries(DISPLAY_STATUS_FROM_API).find(([, status]) => status === displayStatus)?.[0],
    programTitle: detail.programTitle ?? detail.program?.title,
    programId: detail.programId ?? detail.program?.programId,
    programType: detail.programType ?? detail.program?.programType,
    programGroup: detail.programGroup ?? detail.program?.programGroup,
    thumbnailFileObjectId: detail.thumbnailFileObjectId ?? detail.program?.thumbnailFileObjectId,
    educationStartAt: detail.educationStartAt ?? detail.program?.educationStartAt,
    educationEndAt: detail.educationEndAt ?? detail.program?.educationEndAt,
  })
  if (!mapped) return null
  mapped.displayStatus = displayStatus
  mapped.recruitmentStatus = mapRecruitmentStatus(displayStatus)
  mapped.cancellable = detail.cancellable ?? detail.capabilities?.canCancelApplication
  const recruitmentLabel = formatDateRange(
    detail.program?.recruitmentStartAt,
    detail.program?.recruitmentEndAt,
  )
  if (recruitmentLabel !== '-') mapped.recruitmentPeriodLabel = recruitmentLabel
  return mapped
}
