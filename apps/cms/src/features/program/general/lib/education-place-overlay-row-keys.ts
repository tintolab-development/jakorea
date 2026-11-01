import {
  isPreEducationCurriculumSession,
  isPreEducationScheduleBlock,
} from '@/features/program/general/lib/schedule-detail-form'

/**
 * 커리큘럼 사전 행 판정 — educationFormBySession 키와 같은 카운터
 * (라벨에 「사전」「연수」가 있으면 사전 행).
 */
export function isPreCurriculumRowForOverlayKey(row: {
  sessionLabel?: string
  isPreEducation?: boolean
  preEducation?: boolean
}): boolean {
  const label = row.sessionLabel ?? ''
  return isPreEducationCurriculumSession(row) || label.includes('사전') || label.includes('연수')
}

/** 일정형 사전 행 판정 — educationFormByDetail 키와 같은 카운터 */
export function isPreScheduleRowForOverlayKey(
  row: Parameters<typeof isPreEducationScheduleBlock>[0]
): boolean {
  const label = row.scheduleLabel ?? ''
  return isPreEducationScheduleBlock(row) || label.includes('사전') || label.includes('연수')
}
