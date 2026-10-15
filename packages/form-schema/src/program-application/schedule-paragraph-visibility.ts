/**
 * 일반 프로그램 참여자 신청(개인·학교/기관) — 진행 희망 교육 일정 단락 노출 규칙.
 * CMS 신청 양식 미리보기·등록 위저드와 Platform 신청 화면이 함께 쓴다.
 *
 * - 일정형 + 복수 회차: 단락 숨김
 * - 날짜 지정 + 고유 달력일 ≤ 1: 단락 숨김 (같은 날 AM/PM은 하루)
 * - 기간 지정 + (커리큘럼형 또는 일정형 단일): 1지망·2지망 희망 일정 UI
 * - 그 외(날짜 지정, 고유 일자 2일 이상): 등록된 교육 진행 예정일 선택지
 * - 일정형·단일·날짜 지정: 커리큘럼·단일·날짜와 동일(고정 체크박스·1타임 설명·고유 일 1일 숨김)
 */

export type ApplicationScheduleVisibilityInput = {
  educationStructure?: 'curriculum' | 'schedule'
  sessionRound?: 'single' | 'multi'
  educationScheduleMode?: 'date' | 'period'
  educationScheduleLines?: readonly string[]
}

const SCHEDULE_DATE_PART_RE = /(\d{2,4})년\s*(\d{1,2})월\s*(\d{1,2})일/

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * 교육 진행 예정일 줄의 고유 달력일 수.
 * `26년` / `2026년` 표기, 기간 줄(시작일만), 같은 날 복수 슬롯을 처리한다.
 */
export function countUniqueEducationScheduleCalendarDays(
  lines: readonly string[] | undefined
): number {
  if (!lines?.length) return 0
  const seen = new Set<string>()
  for (const line of lines) {
    const match = line.trim().match(SCHEDULE_DATE_PART_RE)
    if (!match) continue
    const yearRaw = Number(match[1])
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw
    const month = Number(match[2])
    const day = Number(match[3])
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) continue
    if (month < 1 || month > 12 || day < 1 || day > 31) continue
    seen.add(`${year}-${pad2(month)}-${pad2(day)}`)
  }
  return seen.size
}

export function shouldShowApplicationScheduleParagraph(
  input: ApplicationScheduleVisibilityInput
): boolean {
  if (input.educationStructure === 'schedule' && input.sessionRound === 'multi') {
    return false
  }
  if (input.educationScheduleMode !== 'period') {
    return countUniqueEducationScheduleCalendarDays(input.educationScheduleLines) > 1
  }
  return true
}

/** 희망 일정 신청 — 최대 일정 수 필드(및 지망 UI) 노출 */
export function shouldShowApplicationMaxScheduleFields(
  input: ApplicationScheduleVisibilityInput
): boolean {
  if (input.educationScheduleMode !== 'period') return false
  const structure = input.educationStructure
  const round = input.sessionRound
  if (structure === 'curriculum' && (round === 'single' || round === 'multi')) return true
  if (structure === 'schedule' && round === 'single') return true
  return false
}

/** 희망 차시 — 일정당 최대 차시 (커리큘럼형 + 복수 회차 + 기간 지정) */
export function shouldShowApplicationMaxSessionsPerDayField(
  input: ApplicationScheduleVisibilityInput
): boolean {
  return (
    input.educationStructure === 'curriculum' &&
    input.sessionRound === 'multi' &&
    input.educationScheduleMode === 'period'
  )
}

/** 일정형 + 단일 + 기간 지정 지망 — 희망 교육일만 (차시·시간 없음) */
export function shouldShowApplicationSchedulePeriodDateOnlyPreferred(
  input: ApplicationScheduleVisibilityInput
): boolean {
  return (
    input.educationStructure === 'schedule' &&
    input.sessionRound === 'single' &&
    input.educationScheduleMode === 'period' &&
    shouldShowApplicationPreferredScheduleParagraph(input)
  )
}

/** 커리큘럼 + 기간 지정 지망 — 희망 차시 셀렉 (모집 1일 최대 차시 필드와 별개) */
export function shouldShowApplicationPreferredScheduleSessionSelect(
  input: ApplicationScheduleVisibilityInput
): boolean {
  return (
    input.educationStructure === 'curriculum' &&
    input.educationScheduleMode === 'period' &&
    shouldShowApplicationPreferredScheduleParagraph(input)
  )
}

/** 진행 희망 교육 일정 단락을 1지망·2지망 희망 일정 UI로 렌더할지 */
export function shouldShowApplicationPreferredScheduleParagraph(
  input: ApplicationScheduleVisibilityInput
): boolean {
  if (!shouldShowApplicationScheduleParagraph(input)) return false
  return (
    shouldShowApplicationMaxScheduleFields(input) ||
    shouldShowApplicationMaxSessionsPerDayField(input)
  )
}
