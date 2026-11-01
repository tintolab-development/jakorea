/**
 * 봉사현황 · 신청 내용 — 봉사자 신청서 answers 중 자기소개 외 항목.
 * - 자유 작성 항목 전체(문항 라벨 + 답변, 서버 items 순서)
 * - JA 봉사 프로그램 진행 경험 여부
 * - 이전 참여 JA 봉사 프로그램(진행 경험 「있음」일 때만 — 신청 폼 숨김 규칙과 동일)
 * 개인정보 동의표는 다른 신청 유형의 신청 내용에서도 노출하지 않으므로 제외한다.
 */

import {
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS,
  PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS,
  PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS,
} from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'
import { parseScheduleDisplayLabel } from '@/shared/lib/format-display-date'

export type VolunteerApplicationTextSection = {
  key: string
  title: string
  body: string
}

export type VolunteerApplicationInfoField = {
  key: string
  label: string
  value: string
}

export type VolunteerApplicationExtras = {
  /** 자유 작성 항목 — 비어 있으면 기존 「자기소개 및 지원동기」 단일 섹션 사용 */
  freeTextSections: VolunteerApplicationTextSection[]
  infoFields: VolunteerApplicationInfoField[]
}

const FREE_TEXT_KEYS = [
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems,
] as const

/**
 * Figma 11005:340435 「신청 내용」 — 시드 문항은 질문문이 아닌 요약 라벨로 노출.
 * 템플릿에서 문항 문구를 바꾼 경우(제출 label ≠ 시드 label)는 제출 label을 그대로 쓴다.
 */
const FREE_TEXT_DISPLAY_LABEL: Record<string, string> = {
  intro: '1. 자기소개 및 지원동기',
  educationExperience: '2. 교육봉사, 강사 아르바이트 등 교육 진행 경험',
  necessity: '3. 초등학생 대상 경제 교육의 필요성에 대해 본인의 생각을 자유롭게 작성',
  jaExperience:
    '4. 초·중·고 당시 학교에서 JA Korea 경제금융교육을 들은 경험 혹은 진행하는 프로그램에 지원하여 참여한 경험',
}

function resolveFreeTextTitle(
  id: string | undefined,
  submittedLabel: string | undefined,
  index: number,
): string {
  const seed = PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS.find(q => q.id === id)
  const display = id ? FREE_TEXT_DISPLAY_LABEL[id] : undefined
  if (display && (!submittedLabel || submittedLabel === seed?.label)) return display
  return submittedLabel ?? seed?.label ?? `자유 작성 항목 ${index + 1}`
}

const JA_EXPERIENCE_LABEL: Record<string, string> = {
  [PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS.yes]: '있음',
  [PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS.no]: '없음',
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'string') {
    try {
      return asRecord(JSON.parse(value))
    } catch {
      return null
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readTrimmed(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function readFreeTextSections(answers: Record<string, unknown>): VolunteerApplicationTextSection[] {
  for (const key of FREE_TEXT_KEYS) {
    const items = asRecord(answers[key])?.items
    if (!Array.isArray(items)) continue
    const sections = items.flatMap((item, index) => {
      const row = asRecord(item)
      if (!row) return []
      const body = readTrimmed(row.bodyText)
      if (!body) return []
      const id = readTrimmed(row.id)
      const title = resolveFreeTextTitle(id, readTrimmed(row.label), index)
      return [{ key: `free-text-${id ?? index}`, title, body }]
    })
    if (sections.length > 0) return sections
  }
  return []
}

function readJaExperienceOptionId(raw: unknown): string | undefined {
  const direct = readTrimmed(raw)
  if (direct) return direct
  if (Array.isArray(raw)) return readJaExperienceOptionId(raw[0])
  const row = asRecord(raw)
  if (!row) return undefined
  return (
    readTrimmed(row.selectedOptionId) ??
    readTrimmed(row.option_value) ??
    readTrimmed(row.value) ??
    readTrimmed(row.id)
  )
}

export function resolveVolunteerApplicationExtrasFromAnswers(
  answers: Record<string, unknown> | null | undefined,
): VolunteerApplicationExtras {
  if (!answers) return { freeTextSections: [], infoFields: [] }

  const infoFields: VolunteerApplicationInfoField[] = []
  const experienceId = readJaExperienceOptionId(
    answers[PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.jaVolunteerExperience],
  )
  if (experienceId) {
    infoFields.push({
      key: 'ja-experience',
      label: 'JA 봉사 프로그램 진행 경험 여부',
      value: JA_EXPERIENCE_LABEL[experienceId] ?? experienceId,
    })
  }

  if (experienceId === PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS.yes) {
    const previous = asRecord(answers[PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousJaProgram])
    const year = readTrimmed(previous?.applicationYear)
    const name = readTrimmed(previous?.programName)
    if (year || name) {
      infoFields.push({
        key: 'previous-ja-program',
        label: '이전 참여 JA 봉사 프로그램',
        value: [year ? `${year}년` : undefined, name].filter(Boolean).join(', '),
      })
    }
  }

  return { freeTextSections: readFreeTextSections(answers), infoFields }
}

const TRAILING_TIME_RANGE_RE = /\s+\d{1,2}:\d{2}(?:\s*~\s*\d{1,2}:\d{2})?$/

/**
 * Figma 「… 가능 일정」 카드 — 같은 날짜의 시간대를 한 줄로 묶는다.
 * `2026년 10월 31일(토) 09:30 ~ 11:30` + `… 13:30 ~ 15:30` → `2026년 10월 31일(토), 09:30 ~ 11:30, 13:30 ~ 15:30`
 * 날짜는 서버(제출) 순서상 처음 나온 위치, 시간은 제출 순서 그대로. 해석 못 하는 줄(`|` 포함 등)은 그대로 둔다.
 */
export function groupScheduleLinesByDate(lines: readonly string[]): string[] {
  const out: Array<{ dateKey?: string; dateText: string; times: string[] }> = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const parsed = line.includes('|') ? {} : parseScheduleDisplayLabel(line)
    const dateText = parsed.timeRange ? line.replace(TRAILING_TIME_RANGE_RE, '').trim() : ''
    if (!parsed.dateKey || !parsed.timeRange || !dateText || dateText === line) {
      out.push({ dateText: line, times: [] })
      continue
    }
    const existing = out.find(row => row.dateKey === parsed.dateKey)
    if (existing) {
      if (!existing.times.includes(parsed.timeRange)) existing.times.push(parsed.timeRange)
      continue
    }
    out.push({ dateKey: parsed.dateKey, dateText, times: [parsed.timeRange] })
  }
  return out.map(row => (row.times.length > 0 ? [row.dateText, ...row.times].join(', ') : row.dateText))
}
