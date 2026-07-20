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
  | 'passOrReserve'
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
  return 'passOrReserve'
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
