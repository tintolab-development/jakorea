import {
  educationScheduleRangeHasClock,
  parseEducationScheduleLineToRange,
  parseStoredEducationScheduleRange,
} from '@/features/template/lib/format-education-schedule-line'

/** 교육 진행 「진행 일정」 저장값(표기 줄 또는 ISO)에 시각이 포함됐는지 */
export function isEducationScheduleProgressLineWithRequiredClock(
  line: string | null | undefined
): boolean {
  const trimmed = line?.trim()
  if (!trimmed) return false
  const range =
    parseEducationScheduleLineToRange(trimmed) ?? parseStoredEducationScheduleRange(trimmed)
  if (!range) return false
  return educationScheduleRangeHasClock(range)
}

/** 비어 있거나 시각이 없으면 true — 등록 필수 검증용 */
export function isEducationScheduleProgressLineMissingOrWithoutClock(
  line: string | null | undefined
): boolean {
  const trimmed = line?.trim()
  if (!trimmed) return true
  return !isEducationScheduleProgressLineWithRequiredClock(trimmed)
}

/** 비어 있거나 파싱 불가면 true — 일정형 진행 일정(날짜만) 검증용 */
export function isEducationScheduleProgressLineMissing(
  line: string | null | undefined
): boolean {
  const trimmed = line?.trim()
  if (!trimmed) return true
  const range =
    parseEducationScheduleLineToRange(trimmed) ?? parseStoredEducationScheduleRange(trimmed)
  return !range
}
