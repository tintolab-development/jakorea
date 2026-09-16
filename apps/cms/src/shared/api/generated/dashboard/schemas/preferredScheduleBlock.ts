/**
 * Hand-maintained additive schema (OpenAPI PreferredScheduleBlock).
 * Full dashboard orval regenerate currently fails unrelated path-param validation.
 */
import type { PreferredScheduleSessionTime } from './preferredScheduleSessionTime'

export type PreferredScheduleBlockDayOfWeek =
  | '월'
  | '화'
  | '수'
  | '목'
  | '금'
  | '토'
  | '일'

export interface PreferredScheduleBlock {
  preferenceRank?: number
  /** YYYY-MM-DD */
  date?: string
  dayOfWeek?: PreferredScheduleBlockDayOfWeek
  sessionCount?: number
  sessionTimes?: PreferredScheduleSessionTime[]
}
