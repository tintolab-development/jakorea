import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { ApplicantSessionLineInput } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-session-format'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { resolveInstitutionApplicationSessionPeriodPart } from '@/features/program/general/lib/institution-application-session-display'
import { resolveInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { resolveSchoolDetailAttendanceSessionLeadLabel } from '@/features/program/general/lib/school-detail-attendance-display'
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

export type GeneralEducationScheduleShape = {
  educationStructure?: 'curriculum' | 'schedule' | null
  sessionRound?: 'single' | 'multi' | null
  educationScheduleMode?: 'date' | 'period' | null
  /** 커리큘럼 단일 — 교육 진행 차시 수 */
  curriculumSessionCount?: number | null
  /** 회차순 커리큘럼 라벨. `N차시`만 진행 시간 줄에 붙인다. */
  curriculumSessionLabels?: readonly string[] | null
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

function readCurriculumSessionText(
  session: { round?: number; classNum?: string; duration?: string; scheduleLabel?: string },
  shape: GeneralEducationScheduleShape | null | undefined
): string | null {
  if (shape?.educationStructure !== 'curriculum') return null
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

/** 스크린샷 형식: YYYY.MM.DD(요일) HH:mm ~ HH:mm | N차시 */
export function formatParticipatingSchoolSessionLine(s: ParticipatingSchoolSession): string {
  const scheduleLabel = s.scheduleLabel?.trim()
  if (scheduleLabel) return formatCmsScheduleDisplayLabel(scheduleLabel)

  const datePart = s.date.replace(/\s/g, '')
  const [startRaw, endRaw] = s.timeRange.split('~')
  const timePart = `${padTimePart(startRaw)} ~ ${padTimePart(endRaw ?? startRaw)}`
  return formatCmsScheduleDisplayLabel(`${datePart}(${s.dayOfWeek}) ${timePart} | ${s.round}차시`)
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

  if (!program) {
    const base = timePart ? `${dateWithDow} ${timePart}` : dateWithDow
    if (s.round) return formatCmsScheduleDisplayLabel(`${base} | ${s.round}차시`)
    return formatCmsScheduleDisplayLabel(base)
  }

  const { sessionRound } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: program.generalCommonInfo?.curriculumSessions ?? null,
  })

  const sessionName =
    sessionRound === 'single' ? undefined : resolveVolunteerAssignmentSessionName(s, program)

  if (timePart && sessionName) return formatCmsScheduleDisplayLabel(`${dateWithDow} ${timePart} | ${sessionName}`)
  if (timePart) return formatCmsScheduleDisplayLabel(`${dateWithDow} ${timePart}`)
  if (sessionName) return formatCmsScheduleDisplayLabel(`${dateWithDow} | ${sessionName}`)
  return formatCmsScheduleDisplayLabel(dateWithDow)
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

/**
 * 참여 기관 상세 — 교육 진행 일정 행 라벨 (진행 내용 기준)
 * - 단일 회차: 교육 일정
 * - 복수 회차 + 커리큘럼형: 회차명 (curriculumSessions[].sessionLabel)
 * - 복수 회차 + 일정형: 일정명 (scheduleDetails[].name)
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

  return resolveSchoolDetailAttendanceSessionLeadLabel(program, session.round)
}
