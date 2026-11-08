import {
  SECOND_INTERVIEW_SCREENING_LIST_BADGE_LABELS,
  SECOND_INTERVIEW_SCREENING_STATUS_LABELS,
  VOLUNTEER_ACTIVITY_WITHDRAWN_LABEL,
  type SecondInterviewScreeningStatus,
} from './second-interview-screening-constants'

/** 팝오버·리스트 뱃지·테이블 공통 색상 톤 */
export type SecondInterviewScreeningTone =
  | 'waiting'
  | 'fail'
  | 'withdrawn'
  | 'pass'
  | 'reserve'
  | 'completed'

export type SecondInterviewScreeningEffectiveStatus =
  | SecondInterviewScreeningStatus
  | 'withdrawn'

export function resolveSecondInterviewScreeningTone(
  status: SecondInterviewScreeningEffectiveStatus
): SecondInterviewScreeningTone {
  if (status === 'withdrawn') return 'withdrawn'
  if (status === 'waiting') return 'waiting'
  if (status === 'fail') return 'fail'
  if (status === 'completed') return 'completed'
  if (status === 'pass') return 'pass'
  return 'reserve'
}

/**
 * Figma Status / Tag / 면접 결과(14804:19719) — 리스트 Tag 글자·테두리 색.
 * 활동 포기는 Tag 시안에 없어 기존 적색 톤을 유지한다.
 */
const SECOND_INTERVIEW_SCREENING_TAG_ACCENT: Record<SecondInterviewScreeningTone, string> = {
  waiting: 'var(--Status-green-main, #1e8c29)',
  fail: 'var(--Status-red-main, #c32f4a)',
  withdrawn: 'var(--Status-red-main, #c32f4a)',
  pass: 'var(--Status-blue-main, #017eaf)',
  reserve: 'var(--Status-blue-main, #017eaf)',
  completed: 'rgba(61, 61, 61, 0.8)',
}

export function resolveSecondInterviewScreeningTagPresentation(
  status: SecondInterviewScreeningEffectiveStatus
): { label: string; accentColor: string } {
  return {
    label: resolveSecondInterviewScreeningListBadgeLabel(status),
    accentColor: SECOND_INTERVIEW_SCREENING_TAG_ACCENT[resolveSecondInterviewScreeningTone(status)],
  }
}

export function resolveSecondInterviewScreeningPopoverLabel(
  status: SecondInterviewScreeningEffectiveStatus
): string {
  if (status === 'withdrawn') return VOLUNTEER_ACTIVITY_WITHDRAWN_LABEL
  return SECOND_INTERVIEW_SCREENING_STATUS_LABELS[status]
}

export function resolveSecondInterviewScreeningListBadgeLabel(
  status: SecondInterviewScreeningEffectiveStatus
): string {
  if (status === 'withdrawn') return VOLUNTEER_ACTIVITY_WITHDRAWN_LABEL
  return SECOND_INTERVIEW_SCREENING_LIST_BADGE_LABELS[status]
}

export function formatSecondInterviewScoreLabel(totalScore: number | null | undefined): string {
  return totalScore != null ? `${totalScore}점` : '-'
}

/** 면접 진행 대기 시 점수 대신 `-` */
export function formatSecondInterviewListScoreLabel(
  status: SecondInterviewScreeningEffectiveStatus,
  totalScore: number | null | undefined
): string {
  if (status === 'waiting') return '-'
  return formatSecondInterviewScoreLabel(totalScore)
}
