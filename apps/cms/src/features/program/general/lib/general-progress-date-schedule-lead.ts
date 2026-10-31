import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import {
  resolveGeneralProgramCommonInfo,
  resolveGeneralProgramScheduleDetailsForView,
} from '@/features/program/general/lib/detail-common-info-display'
import {
  isPreEducationScheduleBlock,
  PRE_EDUCATION_DISPLAY_LABEL,
} from '@/features/program/general/lib/schedule-detail-form'
import { readProgramScheduleCanonicalFields } from '@/features/program/shared/lib/program-schedule-canonical'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'
import type { GeneralProgramScheduleDetailRow, Program } from '@/types/domain'

/**
 * 일정형 · 단일 회차 · 날짜 지정(스펙 ⑤) 진행 현황 출석·과제 헤더.
 * 일정 ID 직접 연결 · 회차/차시 없음 — `sessionNo`로 세부 일정을 찾지 않는다.
 * 표기: `일시 ㅣ 일정명`(Notion), 맞는 세부 일정명이 없으면 일시만.
 */
export function isGeneralScheduleSingleDateProgram(program: Program | null | undefined): boolean {
  if (!program) return false
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const { educationStructure, sessionRound } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })
  return (
    educationStructure === 'schedule' &&
    sessionRound === 'single' &&
    commonInfo.educationScheduleMode === 'date'
  )
}

const CLOCK_RANGE_RE = /(\d{1,2})\s*:\s*(\d{2})\s*~\s*(\d{1,2})\s*:\s*(\d{2})/gu
const DOT_DATE_RE = /(\d{4})\s*[.-]\s*(\d{1,2})\s*[.-]\s*(\d{1,2})/u
const KOREAN_DATE_RE = /(\d{2,4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/u

function pad2(value: string): string {
  return value.padStart(2, '0')
}

function readClockRanges(text: string | undefined): string[] {
  if (!text?.trim()) return []
  return Array.from(text.matchAll(CLOCK_RANGE_RE), match => {
    const [, sh = '', sm = '', eh = '', em = ''] = match
    return `${pad2(sh)}:${sm}~${pad2(eh)}:${em}`
  })
}

/** `2026.11.16(월) …` · `2026-11-16…` · `26년 11월 16일(월) …` → `2026-11-16` */
function readDetailDateKey(text: string | undefined): string | null {
  if (!text?.trim()) return null
  const dotted = DOT_DATE_RE.exec(text)
  if (dotted) {
    const [, y = '', m = '', d = ''] = dotted
    return `${y}-${pad2(m)}-${pad2(d)}`
  }
  const korean = KOREAN_DATE_RE.exec(text)
  if (!korean) return null
  const [, rawYear = '', m = '', d = ''] = korean
  const y = rawYear.length === 2 ? `20${rawYear}` : rawYear
  return `${y}-${pad2(m)}-${pad2(d)}`
}

function seoulParts(iso: string | null | undefined): { dateKey: string; clock: string } | null {
  if (!iso?.trim()) return null
  const stamp = new Date(iso)
  if (Number.isNaN(stamp.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(stamp)
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''
  const hour = pick('hour') === '24' ? '00' : pick('hour')
  return {
    dateKey: `${pick('year')}-${pick('month')}-${pick('day')}`,
    clock: `${pad2(hour)}:${pick('minute')}`,
  }
}

/**
 * 사전 교육 블록이 이 일정에 해당하는지 — 날짜와 시작·종료 시각이 모두 같아야 한다.
 * - 날짜: 사전 교육 진행 일정(`scheduleDateLabel`, 실제 입력값). 공통 정보에 없으면 등록 overlay
 *   `scheduleDateByDetailIso`(조회 리졸버). 날짜를 얻을 수 없으면 매칭하지 않는다.
 * - 시각: 진행 시간(`progressTimeSummary`) 또는 진행 일정 라벨의 시각.
 */
function preEducationBlockMatchesSchedule(
  detail: GeneralProgramScheduleDetailRow,
  dateKey: string,
  clockRange: string
): boolean {
  const detailDateKey = readDetailDateKey(detail.scheduleDateLabel)
  if (!detailDateKey || detailDateKey !== dateKey) return false
  const ranges = [
    ...readClockRanges(detail.progressTimeSummary),
    ...readClockRanges(detail.scheduleDateLabel),
  ]
  return ranges.includes(clockRange)
}

/**
 * 일반 세부 일정이 이 일정에 해당하는지 — 그룹별 진행 시간(시작·종료)만 본다.
 * ⑤의 실제 날짜는 「교육 진행 일정 설정」이 정하므로 세부 일정의 진행 일정 날짜
 * (`scheduleDateLabel` / `scheduleDateByDetailIso`)는 매칭에 쓰지 않는다.
 * 그룹 진행 시간(`progressTimeSummary` ← overlay `groupTimesByDetail`)이 없으면 매칭하지 않는다.
 */
function regularDetailMatchesScheduleTime(
  detail: GeneralProgramScheduleDetailRow,
  clockRange: string
): boolean {
  return readClockRanges(detail.progressTimeSummary).includes(clockRange)
}

function isPreEducationScheduleRole(schedule: object): boolean {
  const { scheduleRole } = readProgramScheduleCanonicalFields(schedule)
  return String(scheduleRole ?? '').trim().toUpperCase() === 'PRE_EDUCATION'
}

/**
 * ⑤ 일정에 덧붙일 세부 일정명. 기본명은 제외.
 * 사전교육 일정(scheduleRole=PRE_EDUCATION, 또는 날짜·시각이 맞는 사전 교육 블록)의 일정명은 「사전교육」.
 * 맞는 세부 일정이 없거나 서로 다른 이름이 둘 이상 맞으면 빈 문자열(일시만).
 */
export function resolveGeneralScheduleSingleDateDetailName(
  program: Program,
  schedule: { startAt?: string | null; endAt?: string | null }
): string {
  if (isPreEducationScheduleRole(schedule)) return PRE_EDUCATION_DISPLAY_LABEL
  const start = seoulParts(schedule.startAt)
  const end = seoulParts(schedule.endAt)
  if (!start || !end) return ''
  const clockRange = `${start.clock}~${end.clock}`
  const details = resolveGeneralProgramScheduleDetailsForView(
    program,
    resolveGeneralProgramCommonInfo(program)
  )
  const names = new Set<string>()
  for (const detail of details) {
    const name = isPreEducationScheduleBlock(detail)
      ? PRE_EDUCATION_DISPLAY_LABEL
      : toDisplayEducationScheduleName(detail.name)
    if (!name) continue
    const matches = isPreEducationScheduleBlock(detail)
      ? preEducationBlockMatchesSchedule(detail, start.dateKey, clockRange)
      : regularDetailMatchesScheduleTime(detail, clockRange)
    if (matches) names.add(name)
  }
  const [only] = [...names]
  return names.size === 1 && only ? only : ''
}
