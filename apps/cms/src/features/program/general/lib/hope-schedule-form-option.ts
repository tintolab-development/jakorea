import { resolveFixedScheduleLinesToChoiceItems } from '@jakorea/form-schema/program-application'
import type { ApplicantSessionLineInput } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-session-format'
import type { InstitutionApplicationProgramBridge } from './institution-application-program-bridge'
import {
  shouldShowInstitutionApplicationPreferredScheduleParagraph,
  shouldShowInstitutionApplicationScheduleParagraph,
} from './institution-application-program-bridge'
import { formatCmsScheduleDisplayLabel } from './organization-preferred-schedule-label'

const CLOCK_RE = /(\d{1,2}):(\d{2})/g
const DATE_DOT_RE = /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/
const DATE_ISO_RE = /(\d{4})-(\d{2})-(\d{2})/
const DATE_KO_RE = /(\d{2,4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/

function pad2(value: number | string): string {
  return String(value).padStart(2, '0')
}

function dateKeyFromText(text: string | undefined): string | null {
  const trimmed = text?.trim() ?? ''
  if (!trimmed) return null
  const dotted = DATE_DOT_RE.exec(trimmed)
  if (dotted) return `${dotted[1]}-${pad2(dotted[2])}-${pad2(dotted[3])}`
  const iso = DATE_ISO_RE.exec(trimmed)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const korean = DATE_KO_RE.exec(trimmed)
  if (!korean) return null
  const yearRaw = korean[1] ?? ''
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw
  return `${year}-${pad2(korean[2] ?? '')}-${pad2(korean[3] ?? '')}`
}

function clocksFromText(text: string | undefined): string[] {
  const trimmed = text?.trim() ?? ''
  if (!trimmed || trimmed === '-') return []
  return [...trimmed.matchAll(CLOCK_RE)].map(
    match => `${pad2(match[1] ?? '0')}:${match[2] ?? '00'}`
  )
}

function readFixedScheduleChoiceItems(bridge: InstitutionApplicationProgramBridge) {
  const lines = (bridge.educationScheduleLines ?? []).map(line => line.trim()).filter(Boolean)
  if (lines.length === 0) return []
  return resolveFixedScheduleLinesToChoiceItems(
    {
      educationStructure: bridge.educationStructure,
      sessionRound: bridge.sessionRound,
      educationScheduleMode: bridge.educationScheduleMode,
      educationScheduleLines: lines,
    },
    lines,
    {
      curriculumChartSessionCount: bridge.curriculumChartSessionCount,
      educationRoundCount: bridge.educationRoundCount,
      sessionsPerRound: bridge.sessionsPerRound,
    }
  )
}

function isFixedScheduleForm(bridge: InstitutionApplicationProgramBridge): boolean {
  if (!shouldShowInstitutionApplicationScheduleParagraph(bridge)) return false
  if (shouldShowInstitutionApplicationPreferredScheduleParagraph(bridge)) return false
  return (bridge.educationScheduleLines?.length ?? 0) > 0
}

/**
 * 신청 폼 고정 일정 선택지와 같은 문구.
 * 기간형 지망(날짜 직접 선택)이거나 선택지를 특정할 수 없으면 null.
 */
export function resolveHopeScheduleFormOptionLabel(
  session: ApplicantSessionLineInput,
  bridge?: InstitutionApplicationProgramBridge | null
): string | null {
  if (!bridge || !isFixedScheduleForm(bridge)) return null
  const items = readFixedScheduleChoiceItems(bridge)
  if (items.length === 0) return null

  const rawLabel = session.scheduleLabel?.trim() ?? ''
  const lineMatch = /^line:(\d+)/i.exec(rawLabel)
  if (lineMatch) {
    const item = items[Number(lineMatch[1])]
    return item?.label?.trim() || null
  }

  const byExactLabel = items.find(item => item.label.trim() === rawLabel)
  if (byExactLabel) return byExactLabel.label

  const sessionDateKey =
    dateKeyFromText(session.date) ?? dateKeyFromText(rawLabel)
  if (!sessionDateKey) return null

  const sameDate = items.filter(item => dateKeyFromText(item.label) === sessionDateKey)
  if (sameDate.length === 1) return sameDate[0]?.label ?? null
  if (sameDate.length === 0) return null

  const sessionClocks = clocksFromText(session.timeRange)
  if (sessionClocks.length === 0) return null
  const clockHit = sameDate.find(item => {
    const optionClocks = clocksFromText(item.label)
    return sessionClocks.some(clock => optionClocks.includes(clock))
  })
  return clockHit?.label ?? null
}

export function formatHopeScheduleFormOptionLine(
  session: ApplicantSessionLineInput,
  bridge?: InstitutionApplicationProgramBridge | null
): string | null {
  const label = resolveHopeScheduleFormOptionLabel(session, bridge)
  if (!label) return null
  return formatCmsScheduleDisplayLabel(label) || null
}
