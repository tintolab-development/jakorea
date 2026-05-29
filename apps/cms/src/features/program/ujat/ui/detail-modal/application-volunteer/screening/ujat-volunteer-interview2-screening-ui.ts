import type { UjatSecondInterviewScreeningStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { UJAT_SECOND_INTERVIEW_SCREENING_STATUS_LABELS } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'

/** 팝오버·리스트 뱃지 공통 톤 */
export type UjatInterview2ScreeningTone = 'waiting' | 'fail' | 'passOrReserve' | 'completed'

export function ujatInterview2ScreeningTone(
  status: UjatSecondInterviewScreeningStatus
): UjatInterview2ScreeningTone {
  if (status === 'waiting') return 'waiting'
  if (status === 'fail') return 'fail'
  if (status === 'completed') return 'completed'
  return 'passOrReserve'
}

export function ujatInterview2ScreeningPopoverLabel(
  status: UjatSecondInterviewScreeningStatus
): string {
  return UJAT_SECOND_INTERVIEW_SCREENING_STATUS_LABELS[status]
}

const INTERVIEW2_LIST_BADGE_LABELS: Record<UjatSecondInterviewScreeningStatus, string> = {
  waiting: '진행 대기',
  completed: '진행 완료',
  pass: '면접 합격',
  fail: '불합격',
  reserve1: '예비 1',
  reserve2: '예비 2',
  reserve3: '예비 3',
  reserve4: '예비 4',
}

export function ujatInterview2ScreeningListBadgeLabel(
  status: UjatSecondInterviewScreeningStatus
): string {
  return INTERVIEW2_LIST_BADGE_LABELS[status]
}

export function formatUjatInterview2ScoreLabel(totalScore: number | null | undefined): string {
  return totalScore != null ? `${totalScore}점` : '-'
}
