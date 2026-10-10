function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/** Portal / CMS form-bindings render `scheduleInputMode`. */
export type ApplicationScheduleInputMode = 'date_time_requests' | 'fixed_schedule_options'

export function readApplicationScheduleInputMode(
  runtime: unknown,
  paragraph?: unknown
): ApplicationScheduleInputMode | null {
  const fromParagraph =
    isRecord(paragraph) && typeof paragraph.scheduleInputMode === 'string'
      ? paragraph.scheduleInputMode
      : isRecord(paragraph) && typeof paragraph.runtimeInputMode === 'string'
        ? paragraph.runtimeInputMode
        : null
  const fromRuntime =
    isRecord(runtime) && typeof runtime.scheduleInputMode === 'string'
      ? runtime.scheduleInputMode
      : null
  const raw = String(fromParagraph ?? fromRuntime ?? '')
    .trim()
    .toLowerCase()
  if (raw === 'date_time_requests') return 'date_time_requests'
  if (raw === 'fixed_schedule_options') return 'fixed_schedule_options'
  return null
}
