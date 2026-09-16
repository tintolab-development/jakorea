/**
 * Hand-maintained additive schema (OpenAPI PreferredScheduleSessionTime).
 * Full dashboard orval regenerate currently fails unrelated path-param validation.
 */

export interface PreferredScheduleSessionTime {
  sessionIndex?: number
  classPeriod?: string
  startTime?: string
  endTime?: string
  /** `HH:mm ~ HH:mm` — display SoT when present */
  timeRange?: string
}
