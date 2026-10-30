import type { ProgramDetail } from '../model/types'

function present(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  return trimmed && trimmed !== '-' ? trimmed : ''
}

function firstAndLast(values: readonly string[]): string {
  const first = values[0] ?? ''
  const last = values[values.length - 1] ?? first
  return first && last && first !== last ? `${first} ~ ${last}` : first
}

/** Gemini 프로그램 정보 — 운영 기간에 모집 기간을 쓰지 않는다. 교육일, 없으면 연수 요청 가능 기간. */
export function resolveGeminiProgramOperatingPeriodLabel(
  program: Pick<
    ProgramDetail,
    | 'detailCase'
    | 'operatingPeriodLabel'
    | 'recruitmentPeriodLabel'
    | 'geminiTrainingRequestPeriodLabel'
    | 'educationScheduleLines'
    | 'eventSchedules'
  >,
): string {
  if (program.detailCase !== 'gemini') {
    return present(program.operatingPeriodLabel) || program.operatingPeriodLabel?.trim() || ''
  }

  const educationLines = (program.educationScheduleLines ?? [])
    .map(line => present(line))
    .filter(Boolean)
  if (educationLines.length > 0) return firstAndLast(educationLines)

  const eventDates = (program.eventSchedules ?? [])
    .map(event => present(event.dateLabel))
    .filter(Boolean)
  if (eventDates.length > 0) return firstAndLast(eventDates)

  const training = present(program.geminiTrainingRequestPeriodLabel)
  if (training) return training

  const operating = present(program.operatingPeriodLabel)
  const recruitment = present(program.recruitmentPeriodLabel)
  if (operating && operating !== recruitment) return operating
  return '-'
}
