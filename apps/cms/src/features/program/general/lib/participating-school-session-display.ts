import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { ApplicantSessionLineInput } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-session-format'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { resolveInstitutionApplicationSessionPeriodPart } from '@/features/program/general/lib/institution-application-session-display'
import { resolveInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import {
  formatCmsScheduleDisplayLabel,
  formatOrganizationScheduleRangeLabel,
} from '@/features/program/general/lib/organization-preferred-schedule-label'
import { resolveSchoolDetailAttendanceSessionLeadLabel } from '@/features/program/general/lib/school-detail-attendance-display'
import { PRE_EDUCATION_DISPLAY_LABEL } from '@/features/program/general/lib/schedule-detail-form'
import { isProgramSchedulePreEducation } from '@/features/program/shared/lib/program-schedule-canonical'
import {
  formatEducationRoundSessionLabel,
  parseConfirmedCurriculumSessionCount,
  positiveEducationNumber,
  toDisplayEducationScheduleName,
} from '@/shared/lib/education-schedule-name'
import type { Program } from '@/types/domain'

function padTimePart(part: string): string {
  const trimmed = part.trim()
  const [h, m = '00'] = trimmed.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

function parseTimeRangeMinutes(timeRange: string): { start: number; end: number } | null {
  const [startRaw, endRaw = startRaw] = timeRange.split('~')
  const start = padTimePart(startRaw)
  const end = padTimePart(endRaw)
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return null
  }
  return {
    start: startHour * 60 + startMinute,
    end: endHour * 60 + endMinute,
  }
}

function formatMinutes(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export type GeneralEducationCurriculumSessionRef = {
  sessionNo?: number | null
  title?: string | null
  sessionLabel?: string | null
  isPreEducation?: boolean
}

export type GeneralEducationScheduleShape = {
  educationStructure?: 'curriculum' | 'schedule' | null
  sessionRound?: 'single' | 'multi' | null
  educationScheduleMode?: 'date' | 'period' | null
  /** 커리큘럼 단일 — 교육 진행 차시 수 */
  curriculumSessionCount?: number | null
  /** 회차순 커리큘럼 라벨. `N차시`만 진행 시간 줄에 붙인다. */
  curriculumSessionLabels?: readonly string[] | null
  /** 회차별 커리큘럼 원본. 차시는 sessionNo 매칭으로만 읽는다. */
  curriculumSessions?: readonly GeneralEducationCurriculumSessionRef[] | null
}

const RANK_SUFFIX_RE = /\s*\|\s*\d+\s*지망\s*$/u
const SESSION_SUFFIX_RE = /\s*\|\s*(?:\d+\s*)?(?:차시|회차)\s*$/u
const CLOCK_RE = /\d{1,2}:\d{2}/

function stripDisplaySuffix(label: string): string {
  return label.replace(RANK_SUFFIX_RE, '').replace(SESSION_SUFFIX_RE, '').trim()
}

function labelHasClock(label: string): boolean {
  return CLOCK_RE.test(stripDisplaySuffix(label))
}

function readExplicitSessionCount(session: {
  classNum?: string
  duration?: string
  scheduleLabel?: string
}): string | null {
  const sources = [session.classNum, session.duration, session.scheduleLabel]
  for (const source of sources) {
    const match = source?.match(/(\d+)\s*차시/)
    if (match) return `${match[1]}차시`
  }
  return null
}

/**
 * 커리큘럼·단일·날짜 — 모든 일정 줄에 커리큘럼 총 차시(`N차시`)를 붙인다.
 * sessionNo·round(일정 순번)로 차시 라벨을 고르지 않는다. 총 차시가 1 이하면 일시만.
 */
function readCurriculumSingleDateTotalSessionText(
  shape: GeneralEducationScheduleShape
): string | null {
  const fromCount = shape.curriculumSessionCount
  const total =
    typeof fromCount === 'number' && Number.isFinite(fromCount) && fromCount > 0
      ? Math.trunc(fromCount)
      : (shape.curriculumSessionLabels ?? []).filter(label => /\d+\s*차시/.test(label)).length
  return total > 1 ? `${total}차시` : null
}

function readCurriculumSessionText(
  session: { round?: number; classNum?: string; duration?: string; scheduleLabel?: string },
  shape: GeneralEducationScheduleShape | null | undefined
): string | null {
  if (shape?.educationStructure !== 'curriculum') return null
  if (shape.sessionRound === 'single' && shape.educationScheduleMode === 'date') {
    return readCurriculumSingleDateTotalSessionText(shape)
  }
  const explicit = readExplicitSessionCount(session)
  if (explicit) return explicit
  const round = session.round
  if (round != null && round > 0) {
    const fromLabel = shape.curriculumSessionLabels?.[round - 1]?.match(/(\d+)\s*차시/)
    if (fromLabel) return `${fromLabel[1]}차시`
  }
  if (shape.sessionRound !== 'multi') {
    const count = shape.curriculumSessionCount
    if (typeof count === 'number' && Number.isFinite(count) && count > 0) return `${Math.trunc(count)}차시`
  }
  return null
}

function composeEducationDateTime(session: {
  date: string
  dayOfWeek: string
  timeRange: string
  scheduleLabel?: string
}): string {
  const label = session.scheduleLabel?.trim()
  if (label && labelHasClock(label)) {
    return formatCmsScheduleDisplayLabel(stripDisplaySuffix(label))
  }
  const time = session.timeRange?.trim() ?? ''
  const hasClock = CLOCK_RE.test(time) && time !== '-' && !/^00:00\s*~\s*00:00$/.test(time.replace(/\s/g, ''))
  const datePart = session.date?.trim()
    ? `${session.date.replace(/\./g, '. ')}(${session.dayOfWeek})`
    : ''
  if (datePart && hasClock) {
    const [startRaw, endRaw] = time.split('~')
    const timePart = `${padTimePart(startRaw)} ~ ${padTimePart(endRaw ?? startRaw)}`
    return formatCmsScheduleDisplayLabel(`${datePart} ${timePart}`)
  }
  if (label) return formatCmsScheduleDisplayLabel(stripDisplaySuffix(label))
  if (datePart) return formatCmsScheduleDisplayLabel(datePart)
  return ''
}

/** 일정·단일·기간 — 세부 일정 진행 시간의 첫 시작 ~ 마지막 종료 */
export function resolveScheduleDetailTimeSpan(
  details: ReadonlyArray<{ progressTimeSummary?: string | null }> | null | undefined
): string | null {
  const ranges: Array<{ start: number; end: number }> = []
  for (const detail of details ?? []) {
    const summary = detail.progressTimeSummary?.trim()
    if (!summary) continue
    for (const part of summary.split(/\s*\|\s*/)) {
      const match = part
        .trim()
        .replace(/^그룹\s+\S+\s*:\s*/, '')
        .match(/(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})/)
      if (!match) continue
      const range = parseTimeRangeMinutes(`${match[1]}~${match[2]}`)
      if (!range || (range.start === 0 && range.end === 0)) continue
      ranges.push(range)
    }
  }
  if (ranges.length === 0) return null
  const start = Math.min(...ranges.map(range => range.start))
  const end = Math.max(...ranges.map(range => range.end))
  return `${formatMinutes(start)} ~ ${formatMinutes(end)}`
}

/**
 * 일반 프로그램 교육 진행 시간 한 줄.
 * 커리큘럼에 차시가 있을 때만 `| N차시`를 붙인다. 지망 순위는 값에 넣지 않는다.
 */
export function formatGeneralEducationScheduleLine(
  session: {
    date: string
    dayOfWeek: string
    timeRange: string
    scheduleLabel?: string
    classNum?: string
    duration?: string
    round?: number
  },
  shape?: GeneralEducationScheduleShape | null,
  options?: { detailScheduleTimeSpan?: string | null }
): string {
  const structure = shape?.educationStructure
  const round = shape?.sessionRound
  const mode = shape?.educationScheduleMode
  const scheduleSinglePeriod =
    structure === 'schedule' && round === 'single' && mode === 'period'

  let base = ''
  if (scheduleSinglePeriod) {
    const datePart = session.date?.trim()
      ? formatCmsScheduleDisplayLabel(
          `${session.date.replace(/\./g, '. ')}(${session.dayOfWeek})`
        )
      : ''
    const span = options?.detailScheduleTimeSpan?.trim()
    base = datePart && span ? `${datePart} ${span}` : composeEducationDateTime(session)
  } else {
    base = composeEducationDateTime(session)
  }
  if (!base) return ''
  if (structure === 'schedule') return base

  const sessionText = readCurriculumSessionText(session, shape)
  if (sessionText && !base.includes(sessionText)) return `${base} | ${sessionText}`
  return base
}

function parseConfirmedRoundNumberFromSessionLabel(
  value: string | null | undefined
): number | null {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  const match = /^(\d+)\s*회차$/u.exec(trimmed)
  return match ? positiveEducationNumber(Number(match[1])) : null
}

function isSyntheticRoundAsSessionToken(token: string, roundNumber: number | null): boolean {
  const trimmed = token.trim()
  if (!trimmed || trimmed === '-') return true
  if (/^\d+\s*교시$/u.test(trimmed)) return true
  if (/^\d+\s*지망$/u.test(trimmed)) return true
  if (roundNumber != null && trimmed === `${roundNumber}회차`) return true
  if (roundNumber != null && trimmed === `${roundNumber}차시`) return true
  return false
}

function parseRealCurriculumSessionCount(
  raw: string | null | undefined,
  roundNumber: number | null
): number | null {
  if (!raw || isSyntheticRoundAsSessionToken(raw, roundNumber)) return null
  return parseConfirmedCurriculumSessionCount(raw)
}

export function resolveParticipatingProgressRoundNumber(
  session: Pick<ParticipatingSchoolSession, 'sessionNo' | 'round'>
): number | null {
  return positiveEducationNumber(session.sessionNo) ?? positiveEducationNumber(session.round)
}

export function resolveParticipatingProgressCurriculumSessionCount(
  session: Pick<
    ParticipatingSchoolSession,
    'sessionNo' | 'round' | 'classNum' | 'scheduleLabel' | 'duration' | 'curriculumSessionCount'
  >,
  shape?: GeneralEducationScheduleShape | null
): number | null {
  const roundNumber = resolveParticipatingProgressRoundNumber(session)
  const fromApi = positiveEducationNumber(session.curriculumSessionCount)
  if (fromApi != null) return fromApi
  const fromClassNum = parseRealCurriculumSessionCount(session.classNum, roundNumber)
  if (fromClassNum != null) return fromClassNum
  const fromDuration = parseConfirmedCurriculumSessionCount(session.duration)
  if (fromDuration != null) return fromDuration
  const fromScheduleLabel = parseRealCurriculumSessionCount(session.scheduleLabel, roundNumber)
  if (fromScheduleLabel != null) return fromScheduleLabel

  const rows = shape?.curriculumSessions ?? []
  if (roundNumber != null) {
    const matched = rows.find(row => {
      if (row.isPreEducation) return false
      const rowRound =
        positiveEducationNumber(row.sessionNo) ??
        parseConfirmedRoundNumberFromSessionLabel(row.sessionLabel)
      return rowRound === roundNumber
    })
    if (matched) {
      const fromTitle = parseConfirmedCurriculumSessionCount(matched.title)
      if (fromTitle != null) return fromTitle
      const fromRowLabel = parseConfirmedCurriculumSessionCount(matched.sessionLabel)
      if (fromRowLabel != null) return fromRowLabel
    }
  }

  if (shape?.educationStructure === 'curriculum' && shape.sessionRound === 'single') {
    const count = shape.curriculumSessionCount
    if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
      return Math.trunc(count)
    }
  }

  return null
}

/**
 * 참여자·참여 기관 진행 현황 「교육 진행 일정」.
 * 사전교육은 canonical만으로 판정하고, 회차는 sessionNo/명시적 round, 차시는 확인된 커리큘럼만 쓴다.
 */
export function formatParticipatingProgressEducationScheduleLine(
  session: ParticipatingSchoolSession,
  shape?: GeneralEducationScheduleShape | null
): string {
  const fromInstant = formatOrganizationScheduleRangeLabel(session.startAt, session.endAt)
  const dateTime = fromInstant || composeEducationDateTime(session)

  if (isProgramSchedulePreEducation(session)) {
    if (!dateTime) return PRE_EDUCATION_DISPLAY_LABEL
    if (dateTime.includes(PRE_EDUCATION_DISPLAY_LABEL)) return dateTime
    return formatCmsScheduleDisplayLabel(`${dateTime} | ${PRE_EDUCATION_DISPLAY_LABEL}`)
  }

  const suffix = formatEducationRoundSessionLabel({
    roundNumber: resolveParticipatingProgressRoundNumber(session),
    curriculumSessionCount: resolveParticipatingProgressCurriculumSessionCount(session, shape),
  })
  if (!dateTime) return suffix
  if (!suffix) return dateTime
  if (dateTime.includes(suffix)) return dateTime
  return `${dateTime} | ${suffix}`
}

export function withParticipatingProgressCurriculumShape(
  shape: GeneralEducationScheduleShape | null | undefined,
  program: {
    generalCommonInfo?: {
      curriculumSessions?: readonly GeneralEducationCurriculumSessionRef[] | null
    } | null
  } | null | undefined
): GeneralEducationScheduleShape | null {
  const curriculumSessions = program?.generalCommonInfo?.curriculumSessions ?? null
  const curriculumSessionLabels = readCurriculumSessionLabels(program)
  if (!shape && !curriculumSessions?.length && curriculumSessionLabels.length === 0) return null
  return {
    ...(shape ?? {}),
    curriculumSessionLabels,
    curriculumSessions,
  }
}

export function readCurriculumSessionLabels(
  program: {
    generalCommonInfo?: {
      curriculumSessions?: ReadonlyArray<{ sessionLabel?: string | null; title?: string | null }> | null
    } | null
  } | null
  | undefined
): string[] {
  return (program?.generalCommonInfo?.curriculumSessions ?? []).map(session => {
    if (session.sessionLabel?.includes('차시')) return session.sessionLabel
    if (session.title?.includes('차시')) return session.title
    return session.sessionLabel ?? ''
  })
}

export function readProgramEducationScheduleLines(
  program: {
    generalCommonInfo?: {
      educationScheduleLines?: readonly string[] | null
      scheduleDetails?: ReadonlyArray<{ scheduleDateLabel?: string | null }> | null
    } | null
  } | null
  | undefined
): string[] {
  const lines = (program?.generalCommonInfo?.educationScheduleLines ?? [])
    .map(line => line.trim())
    .filter(Boolean)
  if (lines.length > 0) return lines
  return (program?.generalCommonInfo?.scheduleDetails ?? [])
    .map(detail => detail.scheduleDateLabel?.trim() ?? '')
    .filter(Boolean)
}

function educationScheduleLineSession(line: string, index: number): ParticipatingSchoolSession {
  return {
    round: index + 1,
    date: '',
    dayOfWeek: '',
    duration: '',
    format: '',
    classNum: '',
    timeRange: '',
    scheduleLabel: line,
  }
}

/**
 * 목록·상세·진행이 같은 세션 목록을 포맷터에 넣도록 맞춘다.
 * 일정·복수는 교육 진행(일정형) 줄, 일정·단일·기간은 날짜당 한 줄이다.
 */
function sessionHasOwnClockRange(session: ParticipatingSchoolSession): boolean {
  const time = session.timeRange?.replace(/\s/g, '') ?? ''
  return /^\d{1,2}:\d{2}~\d{1,2}:\d{2}$/.test(time) && time !== '00:00~00:00'
}

export function prepareGeneralEducationScheduleSessions(
  sessions: readonly ParticipatingSchoolSession[],
  shape?: GeneralEducationScheduleShape | null,
  options?: {
    detailScheduleTimeSpan?: string | null
    educationScheduleLines?: readonly string[] | null
  }
): ParticipatingSchoolSession[] {
  if (shape?.educationStructure === 'schedule' && shape.sessionRound === 'multi') {
    const lines = (options?.educationScheduleLines ?? []).map(line => line.trim()).filter(Boolean)
    if (lines.length > 0) return lines.map(educationScheduleLineSession)
  }

  if (
    shape?.educationStructure === 'schedule' &&
    shape.sessionRound === 'single' &&
    shape.educationScheduleMode === 'period'
  ) {
    const span = options?.detailScheduleTimeSpan?.trim()
    const seen = new Set<string>()
    const collapsed: ParticipatingSchoolSession[] = []
    for (const session of sessions) {
      // 기관이 시각까지 저장한 PERIOD 희망 행은 그 행의 시각을 그대로 쓰고, 날짜로 합치지 않는다.
      if (session.hopeScheduleConfirmed !== undefined && sessionHasOwnClockRange(session)) {
        collapsed.push(session)
        continue
      }
      const key = `${session.date}|${session.dayOfWeek}`
      if (seen.has(key)) continue
      seen.add(key)
      collapsed.push({
        ...session,
        scheduleLabel: undefined,
        timeRange: span || session.timeRange,
      })
    }
    return collapsed
  }

  return [...sessions]
}

/** 스크린샷 형식: YYYY.MM.DD(요일) HH:mm ~ HH:mm | N회차 */
export function formatParticipatingSchoolSessionLine(s: ParticipatingSchoolSession): string {
  const fromInstant = formatOrganizationScheduleRangeLabel(s.startAt, s.endAt)
  const scheduleLabel = s.scheduleLabel?.trim()
  let base = ''
  if (fromInstant) {
    base = fromInstant
  } else if (scheduleLabel) {
    base = formatCmsScheduleDisplayLabel(scheduleLabel)
  } else {
    const datePart = s.date.replace(/\s/g, '')
    const [startRaw, endRaw] = s.timeRange.split('~')
    const timePart = `${padTimePart(startRaw)} ~ ${padTimePart(endRaw ?? startRaw)}`
    base = formatCmsScheduleDisplayLabel(`${datePart}(${s.dayOfWeek}) ${timePart}`)
  }
  const roundLabel = resolveAssignmentRoundSessionSuffix(s)
  if (roundLabel && !base.includes(roundLabel)) return `${base} | ${roundLabel}`
  return base
}

function resolveAssignmentRoundSessionSuffix(s: ParticipatingSchoolSession): string {
  if (isProgramSchedulePreEducation(s)) return PRE_EDUCATION_DISPLAY_LABEL
  return formatEducationRoundSessionLabel({
    roundNumber: resolveParticipatingProgressRoundNumber(s),
    curriculumSessionCount: resolveParticipatingProgressCurriculumSessionCount(s),
  })
}

function participatingSchoolSessionToApplicantInput(
  s: ParticipatingSchoolSession
): ApplicantSessionLineInput {
  return {
    date: s.date,
    dayOfWeek: s.dayOfWeek,
    duration: s.duration,
    format: s.format,
    classNum: s.classNum,
    timeRange: s.timeRange,
    round: s.round,
  }
}

function resolveVolunteerAssignmentSessionName(
  s: ParticipatingSchoolSession,
  program: Program
): string | undefined {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const { sessionRound, educationStructure } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })

  if (sessionRound === 'single') return undefined

  if (educationStructure === 'schedule') {
    const label = resolveParticipatingInstitutionScheduleRowLabel(program, s)
    return label === '교육 일정' ? undefined : label
  }

  const bridge = resolveInstitutionApplicationProgramBridge(program)
  const periodPart = resolveInstitutionApplicationSessionPeriodPart(
    participatingSchoolSessionToApplicantInput(s),
    bridge
  )
  if (periodPart) return periodPart

  const label = resolveParticipatingInstitutionScheduleRowLabel(program, s)
  return label === '교육 일정' ? undefined : label
}

/**
 * 참여 봉사자 배정 현황 — 날짜 / 진행 시간 / 교육 차시·회차(또는 일정명)
 * - 단일 회차: 차시·회차 생략
 * - 일정형 + 복수 회차: 일정명
 * - 진행 시간·차시·회차 없을 수 있음(희망 일정)
 */
export function formatVolunteerAssignmentScheduleLine(
  s: ParticipatingSchoolSession,
  program?: Program
): string {
  const dateWithDow = formatCmsScheduleDisplayLabel(`${s.date}(${s.dayOfWeek})`)

  const timeRange = s.timeRange?.trim()
  let timePart = ''
  if (timeRange) {
    const [startRaw, endRaw] = timeRange.split('~')
    timePart = `${padTimePart(startRaw)} ~ ${padTimePart(endRaw ?? startRaw)}`
  }

  const fromInstant = formatOrganizationScheduleRangeLabel(s.startAt, s.endAt)
  const dateTimeBase = fromInstant || (timePart ? `${dateWithDow} ${timePart}` : dateWithDow)

  if (!program) {
    const roundLabel = resolveAssignmentRoundSessionSuffix(s)
    if (roundLabel) return formatCmsScheduleDisplayLabel(`${dateTimeBase} | ${roundLabel}`)
    return formatCmsScheduleDisplayLabel(dateTimeBase)
  }

  const shape: GeneralEducationScheduleShape = {
    educationStructure: program.generalProgramEducationStructure,
    sessionRound: program.generalProgramSessionRound,
    educationScheduleMode: program.generalCommonInfo?.educationScheduleMode,
    curriculumSessionCount: program.generalCommonInfo?.curriculumSessions?.length,
    curriculumSessionLabels: readCurriculumSessionLabels(program),
  }
  const { sessionRound, educationStructure } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: program.generalCommonInfo?.curriculumSessions ?? null,
  })

  if (educationStructure === 'curriculum') {
    const progressShape: GeneralEducationScheduleShape = {
      ...shape,
      curriculumSessions: program.generalCommonInfo?.curriculumSessions ?? null,
    }
    const roundLabel = formatEducationRoundSessionLabel({
      roundNumber: sessionRound === 'single' ? null : resolveParticipatingProgressRoundNumber(s),
      curriculumSessionCount: resolveParticipatingProgressCurriculumSessionCount(s, progressShape),
    })
    if (roundLabel) return formatCmsScheduleDisplayLabel(`${dateTimeBase} | ${roundLabel}`)
    return formatCmsScheduleDisplayLabel(dateTimeBase)
  }

  const sessionName =
    sessionRound === 'single' ? undefined : resolveVolunteerAssignmentSessionName(s, program)

  if (sessionName) return formatCmsScheduleDisplayLabel(`${dateTimeBase} | ${sessionName}`)
  return formatCmsScheduleDisplayLabel(dateTimeBase)
}

export function buildParticipatingSchoolSessionLines(
  sessions: ParticipatingSchoolSession[] | undefined
): string[] {
  if (!sessions?.length) return []
  return sessions.map(formatParticipatingSchoolSessionLine)
}

/** 1사1교 참여 기관 목록 — 신청 날짜별 `첫 차시 시작 ~ 마지막 차시 종료 | 신청 총 차시` */
export function buildParticipatingSchoolPreferredScheduleLines(
  sessions: ParticipatingSchoolSession[] | undefined
): string[] {
  if (!sessions?.length) return []

  const grouped = new Map<string, ParticipatingSchoolSession[]>()
  for (const session of sessions.filter(s => s.status !== 'not_planned')) {
    const key = `${session.date}|${session.dayOfWeek}`
    const prev = grouped.get(key)
    if (prev) prev.push(session)
    else grouped.set(key, [session])
  }

  return Array.from(grouped.values()).map(group => {
    const first = group[0]!
    const datePart = first.date.replace(/\./g, '. ')
    const ranges = group
      .map(session => parseTimeRangeMinutes(session.timeRange))
      .filter((range): range is NonNullable<typeof range> => range != null)
    const fromDuration = group.reduce((sum, session) => {
      const match = /^(\d+)\s*차시/.exec(session.duration?.trim() ?? '')
      return sum + (match ? Number.parseInt(match[1]!, 10) : 0)
    }, 0)
    /** duration(N차시) 우선 — round는 지망순·sessionIndex일 수 있어 총 차시로 쓰지 않음 */
    const totalSessions = fromDuration > 0 ? fromDuration : Math.max(group.length, 1)

    if (ranges.length === 0) {
      return formatCmsScheduleDisplayLabel(`${datePart}(${first.dayOfWeek}) | ${totalSessions}차시`)
    }

    const start = Math.min(...ranges.map(range => range.start))
    const end = Math.max(...ranges.map(range => range.end))
    return formatCmsScheduleDisplayLabel(
      `${datePart}(${first.dayOfWeek}) ${formatMinutes(start)} ~ ${formatMinutes(end)} | ${totalSessions}차시`
    )
  })
}

function positiveScheduleId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.trunc(value)
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10)
  }
  return null
}

function resolveAssignedScheduleDisplayName(
  program: Program,
  session: ParticipatingSchoolSession
): string | undefined {
  if (isProgramSchedulePreEducation(session)) return PRE_EDUCATION_DISPLAY_LABEL

  const fromSession = toDisplayEducationScheduleName(
    session.scheduleName ?? session.educationScheduleLabel
  )
  if (fromSession) return fromSession

  const scheduleId = positiveScheduleId(session.resolvedScheduleId)
  if (scheduleId == null) return undefined

  const fromSchedules = (program.schedules ?? []).find(
    row => positiveScheduleId(row.id) === scheduleId
  )
  if (fromSchedules) {
    if (isProgramSchedulePreEducation(fromSchedules)) return PRE_EDUCATION_DISPLAY_LABEL
    const name = toDisplayEducationScheduleName(fromSchedules.scheduleName)
    if (name) return name
  }

  const fromRound = (program.rounds ?? []).find(row => positiveScheduleId(row.id) === scheduleId)
  return toDisplayEducationScheduleName(fromRound?.curriculum)
}

/**
 * 참여 기관·참여자 상세 — 교육 진행 일정 행 라벨 (진행 내용 기준)
 * - 단일 회차: 교육 일정
 * - 배정 일정(`scheduleId` / `scheduleName` / PRE_EDUCATION)이 있으면 그 이름
 * - 없으면 복수 회차 공통정보 회차·일정명 (`round`, 사전교육 행은 출석/과제와 같이 제외)
 */
export function resolveParticipatingInstitutionScheduleRowLabel(
  program: Program,
  session: ParticipatingSchoolSession
): string {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const { sessionRound } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })

  if (sessionRound === 'single') {
    return '교육 일정'
  }

  return (
    resolveAssignedScheduleDisplayName(program, session) ??
    resolveSchoolDetailAttendanceSessionLeadLabel(program, session.round)
  )
}
