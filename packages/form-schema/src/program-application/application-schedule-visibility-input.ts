import type { ApplicationScheduleVisibilityInput } from './schedule-paragraph-visibility.js'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function mapRuntimeEducationStructure(
  value: unknown
): ApplicationScheduleVisibilityInput['educationStructure'] {
  const raw = String(value ?? '').trim().toUpperCase()
  if (raw === 'SCHEDULE') return 'schedule'
  if (raw === 'CURRICULUM') return 'curriculum'
  return undefined
}

function mapRuntimeSessionRound(
  value: unknown
): ApplicationScheduleVisibilityInput['sessionRound'] {
  const raw = String(value ?? '').trim().toUpperCase()
  if (raw === 'MULTI') return 'multi'
  if (raw === 'SINGLE') return 'single'
  return undefined
}

function mapRuntimeScheduleMode(
  value: unknown
): ApplicationScheduleVisibilityInput['educationScheduleMode'] {
  const raw = String(value ?? '').trim().toUpperCase()
  if (raw === 'PERIOD' || raw === 'DATE_PERIOD') return 'period'
  if (raw === 'DATE' || raw === 'FIXED_DATE') return 'date'
  return undefined
}

function readEducationScheduleLinesFromRuntime(runtime: unknown): readonly string[] | undefined {
  if (!isRecord(runtime)) return undefined
  const raw = runtime.educationScheduleLines
  if (!Array.isArray(raw)) return undefined
  const lines = raw
    .map(line => (line == null ? '' : String(line).trim()))
    .filter(Boolean)
  return lines.length > 0 ? lines : undefined
}

/** form-bindings `runtimeContext` → 일정 단락 노출·line:N fallback 입력. */
export function applicationScheduleVisibilityFromRuntimeContext(
  runtime: unknown
): Partial<ApplicationScheduleVisibilityInput> | null {
  if (!isRecord(runtime)) return null
  const educationStructure = mapRuntimeEducationStructure(runtime.educationStructure)
  const sessionRound = mapRuntimeSessionRound(runtime.sessionRound)
  const educationScheduleMode = mapRuntimeScheduleMode(
    runtime.educationScheduleMode ?? runtime.scheduleMode
  )
  const educationScheduleLines = readEducationScheduleLinesFromRuntime(runtime)
  if (
    !educationStructure &&
    !sessionRound &&
    !educationScheduleMode &&
    !educationScheduleLines
  ) {
    return null
  }
  return {
    educationStructure,
    sessionRound,
    educationScheduleMode,
    educationScheduleLines,
  }
}

export function readEducationScheduleLinesForApplicationForm(
  runtime: unknown,
  programLines?: readonly string[]
): readonly string[] | undefined {
  const fromRuntime = readEducationScheduleLinesFromRuntime(runtime)
  if (fromRuntime && fromRuntime.length > 0) return fromRuntime
  if (programLines && programLines.length > 0) return programLines
  return undefined
}

export function mergeApplicationScheduleVisibilityInput(
  parts: {
    runtime?: unknown
    program?: Partial<ApplicationScheduleVisibilityInput>
    educationScheduleLines?: readonly string[]
  }
): ApplicationScheduleVisibilityInput {
  const fromRuntime = applicationScheduleVisibilityFromRuntimeContext(parts.runtime) ?? {}
  const fromProgram = parts.program ?? {}
  const lines = readEducationScheduleLinesForApplicationForm(
    parts.runtime,
    parts.educationScheduleLines ?? fromProgram.educationScheduleLines,
  )
  return {
    educationStructure:
      fromRuntime.educationStructure ??
      fromProgram.educationStructure,
    sessionRound: fromRuntime.sessionRound ?? fromProgram.sessionRound,
    educationScheduleMode:
      fromRuntime.educationScheduleMode ?? fromProgram.educationScheduleMode,
    educationScheduleLines: lines,
  }
}
