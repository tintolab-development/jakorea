import type { ApplicantSessionLineInput } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-session-format'
import type { InstitutionApplicationProgramBridge } from './institution-application-program-bridge'
import {
  shouldShowInstitutionApplicationMaxSessionsPerDayField,
  shouldShowInstitutionApplicationPreferredScheduleParagraph,
  shouldShowInstitutionApplicationScheduleParagraph,
} from './institution-application-program-bridge'

export const INSTITUTION_APPLICATION_SESSIONS_TABLE_MAX_VISIBLE = 3
export const INSTITUTION_APPLICATION_SESSIONS_TABLE_OVERFLOW_HEAD = 2

function resolveSessionRoundNumber(session: ApplicantSessionLineInput): number | null {
  if (session.round != null && session.round > 0) return session.round
  const labeled = session.classNum.match(/(\d+)\s*(?:차시|회차)/)
  if (labeled) return Number.parseInt(labeled[1]!, 10)
  return null
}

/** 기관 신청 목록·상세 — 진행 희망 교육 일정 열/섹션 노출 (일정형+복수 회차 제외) */
export function shouldShowInstitutionApplicationSessionsColumn(
  bridge: InstitutionApplicationProgramBridge
): boolean {
  return shouldShowInstitutionApplicationScheduleParagraph(bridge)
}

/**
 * 신청 상세 — 진행 희망 교육 일정 행 라벨
 * - 날짜 선택(기간)형: 1지망, 2지망 …
 * - 날짜 지정형(및 기본): 희망 일정 01, 02 …
 */
export function formatInstitutionApplicationScheduleRowLabel(
  rank: number,
  bridge?: InstitutionApplicationProgramBridge | null
): string {
  if (bridge?.educationScheduleMode === 'period') {
    return `${rank}지망`
  }
  return `희망 일정 ${String(rank).padStart(2, '0')}`
}

/**
 * 신청 폼 설정에 따른 차시/회차 접미사.
 * 고정 일정 선택·차시 필드 없는 유형은 null (일자+시간만).
 */
export function resolveInstitutionApplicationSessionPeriodPart(
  session: ApplicantSessionLineInput,
  bridge: InstitutionApplicationProgramBridge
): string | null {
  if (!shouldShowInstitutionApplicationScheduleParagraph(bridge)) {
    return null
  }

  const roundNumber = resolveSessionRoundNumber(session)
  if (roundNumber == null) return null

  if (shouldShowInstitutionApplicationMaxSessionsPerDayField(bridge)) {
    return `${roundNumber}차시`
  }

  if (
    shouldShowInstitutionApplicationPreferredScheduleParagraph(bridge) &&
    bridge.educationStructure === 'schedule'
  ) {
    return `${roundNumber}회차`
  }

  return null
}

export function getInstitutionApplicationSessionsTableSlice(
  sessions: readonly ApplicantSessionLineInput[] | undefined
): {
  displaySessions: ApplicantSessionLineInput[]
  restCount: number
} {
  const list = sessions ?? []
  const total = list.length
  const showCount =
    total <= INSTITUTION_APPLICATION_SESSIONS_TABLE_MAX_VISIBLE
      ? total
      : INSTITUTION_APPLICATION_SESSIONS_TABLE_OVERFLOW_HEAD
  return {
    displaySessions: list.slice(0, showCount),
    restCount: total - showCount,
  }
}
