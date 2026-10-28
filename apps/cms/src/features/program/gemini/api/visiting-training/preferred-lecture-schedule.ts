import type { PreferredScheduleBlock } from '@/shared/api/generated/dashboard/schemas/preferredScheduleBlock'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

/** `YYYY-MM-DD` → `2026. 01. 09` (+ optional weekday). */
function formatScheduleDate(dateIso: string, dayOfWeek?: string | null): string {
  const trimmed = dateIso.trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed)
  if (!match) return trimmed

  const year = match[1]!
  const month = match[2]!
  const day = match[3]!
  const base = `${year}.${month}.${day}`

  const fromField = dayOfWeek?.trim()
  if (fromField) {
    const bare = fromField.replace(/[()]/g, '')
    return `${base}(${bare})`
  }

  const parsed = new Date(`${year}-${month}-${day}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return base
  return `${base}(${WEEKDAY_KO[parsed.getDay()]})`
}

function formatSessionClockRange(block: PreferredScheduleBlock): string {
  const times = block.sessionTimes ?? []
  const first = times[0]
  const last = times[times.length - 1] ?? first
  const start = first?.startTime?.trim() || first?.timeRange?.trim()
  const end = last?.endTime?.trim() || last?.timeRange?.trim()
  if (start && end && start !== end) return `${start} ~ ${end}`
  return start || end || ''
}

function formatSessionCountLabel(block: PreferredScheduleBlock): string {
  const times = block.sessionTimes ?? []
  const sessionCount =
    block.sessionCount != null && block.sessionCount > 0
      ? block.sessionCount
      : times.length > 0
        ? times.length
        : null
  return sessionCount != null ? `${sessionCount}차시` : ''
}

/**
 * BE `preferredScheduleBlocks` → CMS 셀 파서 포맷.
 * Figma: `N지망 : 2026.01.09(금) 09:00 ~ 11:20 | 2차시` 멀티라인.
 */
export function formatGeminiPreferredLectureScheduleFromBlocks(
  blocks: PreferredScheduleBlock[] | null | undefined
): string {
  if (!blocks?.length) return ''

  const lines = [...blocks]
    .filter(block => block != null)
    .sort((a, b) => (a.preferenceRank ?? 0) - (b.preferenceRank ?? 0))
    .map(block => {
      const rank = block.preferenceRank ?? 0
      if (rank <= 0) return null
      const dateRaw = block.date?.trim()
      if (!dateRaw) return null
      const datePart = formatScheduleDate(dateRaw, block.dayOfWeek)
      const clock = formatSessionClockRange(block)
      const session = formatSessionCountLabel(block)
      const datetime = clock ? `${datePart} ${clock}` : datePart
      if (session) return `${rank}지망 : ${datetime} | ${session}`
      return clock ? `${rank}지망 : ${datetime}` : null
    })
    .filter((line): line is string => Boolean(line))

  return lines.join('\n')
}

export type GeminiApproveScheduleCard = {
  rank: number
  title: string
  detail: string
  scheduleId: number | null
}

export function formatGeminiApproveScheduleCard(
  block: PreferredScheduleBlock
): GeminiApproveScheduleCard | null {
  const rank = block.preferenceRank ?? 0
  if (rank <= 0) return null
  const dateRaw = block.date?.trim()
  if (!dateRaw) return null
  const datePart = formatScheduleDate(dateRaw, block.dayOfWeek)
  const clock = formatSessionClockRange(block)
  const title = clock ? `${datePart} ${clock}` : datePart
  const rankLabel = `${rank}지망`
  const round =
    block.round != null && block.round > 0 ? `${block.round}회차` : ''
  const session = formatSessionCountLabel(block)
  const detail = [rankLabel, round, session].filter(Boolean).join(' | ')
  const scheduleId =
    block.scheduleId != null && block.scheduleId > 0 ? block.scheduleId : null
  return { rank, title, detail, scheduleId }
}

export function listGeminiApproveScheduleCards(
  blocks: PreferredScheduleBlock[] | null | undefined
): GeminiApproveScheduleCard[] {
  if (!blocks?.length) return []
  return [...blocks]
    .sort((a, b) => (a.preferenceRank ?? 0) - (b.preferenceRank ?? 0))
    .map(formatGeminiApproveScheduleCard)
    .filter((card): card is GeminiApproveScheduleCard => card != null)
}

/** text 우선, 없으면 blocks → 표시 문자열. */
export function resolveGeminiPreferredLectureSchedule(dto: {
  preferredLectureScheduleText?: string | null
  preferredScheduleBlocks?: PreferredScheduleBlock[] | null
}): string {
  const text = dto.preferredLectureScheduleText?.trim()
  if (text) return text
  return formatGeminiPreferredLectureScheduleFromBlocks(dto.preferredScheduleBlocks)
}
