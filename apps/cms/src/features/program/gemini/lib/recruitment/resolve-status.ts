import dayjs, { type Dayjs } from 'dayjs'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import type {
  GeminiRecruitmentDisplayStatus,
  GeminiRecruitmentPeriodStatus,
  GeminiRecruitmentRow,
} from '../../model/recruitment/types'

/** 사용자 페이지 게시 상태 — 종료 시 삭제 vs 종료 표기는 API·운영 정책 확정 후 연동 */
export type GeminiRecruitmentUserPagePublicationState = 'unpublished' | 'published' | 'ended'

/**
 * 신청 기간과 기준일(기본: 오늘)을 비교해 모집 공고 상태를 산출한다.
 * - 기간 시작 전: 예정
 * - 기간 내(시작·종료일 포함): 진행 중
 * - 기간 종료 후: 종료
 */
export function resolveRecruitmentStatus(
  applicationPeriodStart: string,
  applicationPeriodEnd: string,
  referenceDate: Dayjs | string = dayjs()
): GeminiRecruitmentPeriodStatus {
  const today = (typeof referenceDate === 'string' ? dayjs(referenceDate) : referenceDate).startOf(
    'day'
  )
  const start = dayjs(applicationPeriodStart).startOf('day')
  const end = dayjs(applicationPeriodEnd).startOf('day')

  if (!start.isValid() || !end.isValid()) {
    return 'SCHEDULED'
  }

  if (today.isBefore(start)) {
    return 'SCHEDULED'
  }
  if (today.isAfter(end)) {
    return 'ENDED'
  }
  return 'IN_PROGRESS'
}

/** 목록·필터용 — 임시저장 행은 기간과 무관하게 DRAFT */
export function resolveRecruitmentDisplayStatus(
  row: Pick<GeminiRecruitmentRow, 'isDraft' | 'applicationPeriodStart' | 'applicationPeriodEnd'>,
  referenceDate: Dayjs | string = dayjs()
): GeminiRecruitmentDisplayStatus {
  if (row.isDraft) return 'DRAFT'
  return resolveRecruitmentStatus(
    row.applicationPeriodStart,
    row.applicationPeriodEnd,
    referenceDate
  )
}

/** UJAT 프로그램 상세 — `StatusBadge domain="programEnrollment" variant="text"` 와 동일 토큰 */
export function geminiRecruitmentStatusToEnrollmentDisplay(
  status: GeminiRecruitmentPeriodStatus
): ProgramEnrollmentDisplayStatus {
  switch (status) {
    case 'SCHEDULED':
      return 'EDUCATION_SCHEDULED'
    case 'IN_PROGRESS':
      return 'EDUCATION_IN_PROGRESS'
    case 'ENDED':
      return 'PROGRAM_ENDED'
  }
}

/** CMS 목록 상태에 대응하는 사용자 페이지 게시 상태(mock·파생용) */
export function resolveRecruitmentUserPagePublicationState(
  status: GeminiRecruitmentPeriodStatus
): GeminiRecruitmentUserPagePublicationState {
  if (status === 'IN_PROGRESS') return 'published'
  if (status === 'ENDED') return 'ended'
  return 'unpublished'
}

export function resolveRecruitmentUserPagePublicationLabel(
  state: GeminiRecruitmentUserPagePublicationState
): string {
  switch (state) {
    case 'published':
      return '게시 중'
    case 'ended':
      return '종료'
    case 'unpublished':
      return '미게시'
  }
}
