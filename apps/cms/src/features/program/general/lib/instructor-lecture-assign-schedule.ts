import dayjs, { type Dayjs } from 'dayjs'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { resolveGeneralProgramLocalById } from '@/features/program/general/lib/general-program-local-cache'
import { getGeneralInstitutionApplicationsForProgram } from '@/features/program/general/lib/institution-applications'
import type { Program } from '@/types/domain'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

export type InstructorLectureAssignSlot = {
  key: string
  dateKey: string
  schoolId: string
  schoolName: string
  region: string
  sessionRound: number
  sessionLabel: string
  timeRange: string
  assignedCount: number
  disabled?: boolean
}

export type InstructorLectureAssignItem = {
  slotKey: string
  dateKey: string
  schoolId: string
  schoolName: string
  sessionLabel: string
  timeRange: string
  dateLabel: string
  tagLabel: string
}

/** 개인 프로그램 강의 배정 — 기관 ID 대체값 */
export const INDIVIDUAL_PROGRAM_LECTURE_SCHOOL_ID = 'individual-program'

function parseEducationScheduleLine(
  line: string
): { dateKey: string; startTime?: string; endTime?: string } | null {
  const match = line.match(
    /(\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일(?:\([^)]*\))?\s*(?:(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2}))?/
  )
  if (!match) return null
  const year = `20${match[1]}`
  const month = match[2]!.padStart(2, '0')
  const day = match[3]!.padStart(2, '0')
  return {
    dateKey: `${year}-${month}-${day}`,
    startTime: match[4],
    endTime: match[5],
  }
}

function normalizeIndividualTimeRange(startTime?: string, endTime?: string): string {
  const start = startTime?.trim()
  const end = endTime?.trim()
  if (start && end) {
    const formatPart = (part: string) => {
      const m = part.match(/^(\d{1,2}):(\d{2})$/)
      if (!m) return part
      return `${m[1]!.padStart(2, '0')}:${m[2]}`
    }
    return `${formatPart(start)} ~ ${formatPart(end)}`
  }
  return '종일'
}

function buildIndividualSlotKey(dateKey: string, sessionRound: number): string {
  return `${dateKey}|${INDIVIDUAL_PROGRAM_LECTURE_SCHOOL_ID}|${sessionRound}`
}

export function formatIndividualLectureAssignSlotLabel(
  date: Dayjs,
  timeRange: string,
  sessionLabel: string
): string {
  const dateLabel = formatLectureAssignDateLabel(date)
  return `${dateLabel} ${timeRange} | ${sessionLabel}`
}

export function formatIndividualLectureAssignTagLabel(date: Dayjs, timeRange: string): string {
  return `${formatLectureAssignDateLabel(date)} ${timeRange}`
}

export type ParsedInstructorLectureAssignSchedule = {
  slotsByDateKey: Map<string, InstructorLectureAssignSlot[]>
  clickableDateKeys: Set<string>
  holidayDateKeys: Set<string>
  disabledDate: (date: Dayjs) => boolean
  rangeStart: Dayjs
  rangeEnd: Dayjs
  scheduleMonth: Dayjs
}

function buildSlotKey(dateKey: string, schoolId: string, sessionRound: number): string {
  return `${dateKey}|${schoolId}|${sessionRound}`
}

function parseSessionDateKey(dateRaw: string): string | null {
  const cleaned = dateRaw.trim().replace(/\s/g, '')
  const parts = cleaned.split(/[.\\/]/).filter(Boolean)
  if (parts.length < 3) return null
  const y = parts[0]!.length === 2 ? `20${parts[0]}` : parts[0]!
  const m = parts[1]!.padStart(2, '0')
  const d = parts[2]!.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function normalizeTimeRange(timeRange: string): string {
  const normalized = timeRange.replace(/\s*~\s*/g, ' ~ ').trim()
  const parts = normalized.split('~').map(part => {
    const p = part.trim()
    const m = p.match(/^(\d{1,2}):(\d{2})$/)
    if (m) return `${m[1]!.padStart(2, '0')}:${m[2]}`
    return p
  })
  return parts.join(' ~ ')
}

function sessionLabelFromSession(session: ParticipatingSchoolSession): string {
  if (session.classNum?.includes('차시')) return session.classNum
  return `${session.round}차시`
}

function regionDisplay(region: string): string {
  const token = region.trim().split(/\s+/)[0] ?? region
  return token
}

function slotFromInstitutionSession(
  institution: ApplicantSchoolRow,
  session: ParticipatingSchoolSession
): InstructorLectureAssignSlot | null {
  const dateKey = parseSessionDateKey(session.date)
  if (!dateKey) return null
  const sessionRound = session.round
  const key = buildSlotKey(dateKey, institution.id, sessionRound)
  return {
    key,
    dateKey,
    schoolId: institution.id,
    schoolName: institution.schoolName,
    region: regionDisplay(institution.region),
    sessionRound,
    sessionLabel: sessionLabelFromSession(session),
    timeRange: normalizeTimeRange(session.timeRange),
    assignedCount: 0,
    disabled: session.status === 'completed',
  }
}

function mergeSlot(
  map: Map<string, InstructorLectureAssignSlot>,
  slot: InstructorLectureAssignSlot
): void {
  if (!map.has(slot.key)) {
    map.set(slot.key, slot)
  }
}

export function formatLectureAssignDateLabel(date: Dayjs): string {
  const y = date.year() % 100
  const m = date.month() + 1
  const d = date.date()
  const weekday = WEEKDAY_KO[date.day()]
  return `${y}년 ${m}월 ${d}일(${weekday})`
}

export function formatLectureAssignTagLabel(date: Dayjs, schoolName: string): string {
  const y = date.year() % 100
  const m = date.month() + 1
  const d = date.date()
  const weekday = WEEKDAY_KO[date.day()]
  const shortSchool = schoolName.replace(/초등학교$/, '초').replace(/중학교$/, '중')
  return `${y}년 ${m}월 ${d}일(${weekday}) ${shortSchool}`
}

/** 승인된 기관 신청의 희망 교육 일정만 슬롯으로 변환 (강사 신청 — 강의 진행 가능 일정) */
export function getApprovedInstitutionLectureScheduleSlots(
  programId: string
): InstructorLectureAssignSlot[] {
  const slotMap = new Map<string, InstructorLectureAssignSlot>()
  for (const institution of getGeneralInstitutionApplicationsForProgram(programId)) {
    if (institution.approvalStatus !== 'approved') continue
    for (const session of institution.sessions ?? []) {
      const slot = slotFromInstitutionSession(institution, session)
      if (slot) mergeSlot(slotMap, slot)
    }
  }
  return [...slotMap.values()].sort((a, b) => {
    const byDate = a.dateKey.localeCompare(b.dateKey)
    if (byDate !== 0) return byDate
    const bySchool = a.schoolName.localeCompare(b.schoolName, 'ko')
    if (bySchool !== 0) return bySchool
    return a.sessionRound - b.sessionRound
  })
}

export function parseInstructorLectureAssignSchedule(
  programId: string
): ParsedInstructorLectureAssignSchedule {
  const institutions = getGeneralInstitutionApplicationsForProgram(programId)
  const slotMap = new Map<string, InstructorLectureAssignSlot>()

  for (const institution of institutions) {
    for (const session of institution.sessions ?? []) {
      const slot = slotFromInstitutionSession(institution, session)
      if (slot) mergeSlot(slotMap, slot)
    }
  }

  const slotsByDateKey = new Map<string, InstructorLectureAssignSlot[]>()
  const clickableDateKeys = new Set<string>()

  for (const slot of slotMap.values()) {
    const list = slotsByDateKey.get(slot.dateKey) ?? []
    list.push(slot)
    slotsByDateKey.set(slot.dateKey, list)
    clickableDateKeys.add(slot.dateKey)
  }

  for (const [, slots] of slotsByDateKey) {
    slots.sort((a, b) => a.schoolName.localeCompare(b.schoolName, 'ko'))
  }

  const rangeStart = dayjs('2026-03-01')
  const rangeEnd = dayjs('2026-03-31')

  const disabledDate = (date: Dayjs) => {
    if (date.isBefore(rangeStart, 'month') || date.isAfter(rangeEnd, 'month')) {
      return false
    }
    const dateKey = date.format('YYYY-MM-DD')
    return !clickableDateKeys.has(dateKey)
  }

  return {
    slotsByDateKey,
    clickableDateKeys,
    holidayDateKeys: new Set<string>(),
    disabledDate,
    rangeStart,
    rangeEnd,
    scheduleMonth: rangeStart.startOf('month'),
  }
}

export function getApplicantPreferredDateKeys(instructor: ApplicantInstructorRow): Set<string> {
  const keys = new Set<string>()
  for (const school of instructor.preferredSchools ?? []) {
    const range = school.dateRange?.trim()
    if (!range) continue
    const match = range.match(/^(\d{4})\.(\d{2})\.(\d{2})/)
    if (!match) continue
    const start = dayjs(`${match[1]}-${match[2]}-${match[3]}`)
    const endMatch = range.match(/~\s*(\d{4})\.(\d{2})\.(\d{2})/)
    const end = endMatch
      ? dayjs(`${endMatch[1]}-${endMatch[2]}-${endMatch[3]}`)
      : start
    let cursor = start.startOf('day')
    while (!cursor.isAfter(end, 'day')) {
      keys.add(cursor.format('YYYY-MM-DD'))
      cursor = cursor.add(1, 'day')
    }
  }
  return keys
}

export function countLectureSlotAssignments(
  slotKey: string,
  instructors: ApplicantInstructorRow[],
  excludeInstructorId?: string
): number {
  let count = 0
  for (const row of instructors) {
    if (excludeInstructorId && row.id === excludeInstructorId) continue
    const lectures = row.assignedLectures ?? []
    count += lectures.filter(item => item.slotKey === slotKey).length
  }
  return count
}

export function getSchoolIdForDateFromAssignments(
  assignedItems: InstructorLectureAssignItem[],
  dateKey: string
): string | null {
  const item = assignedItems.find(entry => entry.dateKey === dateKey)
  return item?.schoolId ?? null
}

export function isLectureAssignSlotDisabled(
  slot: InstructorLectureAssignSlot,
  assignedItems: InstructorLectureAssignItem[]
): boolean {
  if (slot.disabled) return true
  const lockedSchoolId = getSchoolIdForDateFromAssignments(assignedItems, slot.dateKey)
  if (lockedSchoolId == null) return false
  return lockedSchoolId !== slot.schoolId
}

export function getSlotsForLectureAssignDate(
  schedule: ParsedInstructorLectureAssignSchedule,
  dateKey: string,
  assignedItems: InstructorLectureAssignItem[],
  instructors: ApplicantInstructorRow[],
  excludeInstructorId?: string
): InstructorLectureAssignSlot[] {
  const slots = schedule.slotsByDateKey.get(dateKey) ?? []
  return slots.map(slot => ({
    ...slot,
    assignedCount: countLectureSlotAssignments(slot.key, instructors, excludeInstructorId),
    disabled: isLectureAssignSlotDisabled(slot, assignedItems),
  }))
}

export function toLectureAssignItem(slot: InstructorLectureAssignSlot): InstructorLectureAssignItem {
  const date = dayjs(slot.dateKey)
  const dateLabel = formatLectureAssignDateLabel(date)
  return {
    slotKey: slot.key,
    dateKey: slot.dateKey,
    schoolId: slot.schoolId,
    schoolName: slot.schoolName,
    sessionLabel: slot.sessionLabel,
    timeRange: slot.timeRange,
    dateLabel,
    tagLabel: formatLectureAssignTagLabel(date, slot.schoolName),
  }
}

export function resolveLectureAssignModalCalendarState(
  schedule: ParsedInstructorLectureAssignSchedule,
  instructor: ApplicantInstructorRow
): { scheduleMonth: Dayjs; selectedDate: Dayjs } {
  const preferredKeys = getApplicantPreferredDateKeys(instructor)
  const firstPreferred = [...preferredKeys].sort().find(key => schedule.clickableDateKeys.has(key))
  const firstClickable = [...schedule.clickableDateKeys].sort()[0]
  const initialKey = firstPreferred ?? firstClickable ?? schedule.scheduleMonth.format('YYYY-MM-DD')
  const selectedDate = dayjs(initialKey)
  return {
    scheduleMonth: selectedDate.startOf('month'),
    selectedDate,
  }
}

export function getAssignedLectureDateKeys(
  assignedItems: InstructorLectureAssignItem[]
): Set<string> {
  return new Set(assignedItems.map(item => item.dateKey))
}

export function resolveIndividualProgramEducationScheduleLines(program: Program): string[] {
  const direct =
    program.generalCommonInfo?.educationScheduleLines?.map(line => line.trim()).filter(Boolean) ??
    []
  if (direct.length > 0) return direct

  const seeded = resolveGeneralProgramLocalById(String(program.id))
  const fromSeed =
    seeded?.generalCommonInfo?.educationScheduleLines?.map(line => line.trim()).filter(Boolean) ??
    []
  if (fromSeed.length > 0) return fromSeed

  return []
}

export function resolveProgramForIndividualLectureAssign(
  program: Program | null | undefined,
  programId: string
): Program {
  const seeded = resolveGeneralProgramLocalById(programId)
  if (program && seeded) {
    const scheduleLines = resolveIndividualProgramEducationScheduleLines({
      ...seeded,
      ...program,
      generalCommonInfo: {
        ...seeded.generalCommonInfo,
        ...program.generalCommonInfo,
      },
    })
    return {
      ...seeded,
      ...program,
      generalCommonInfo: {
        ...seeded.generalCommonInfo,
        ...program.generalCommonInfo,
        educationScheduleLines: scheduleLines,
      },
    }
  }

  if (program) {
    const scheduleLines = resolveIndividualProgramEducationScheduleLines(program)
    return {
      ...program,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        educationScheduleLines: scheduleLines,
      },
    }
  }

  if (seeded) {
    const scheduleLines = resolveIndividualProgramEducationScheduleLines(seeded)
    return {
      ...seeded,
      generalCommonInfo: {
        ...seeded.generalCommonInfo,
        educationScheduleLines: scheduleLines,
      },
    }
  }

  return {
    id: programId,
    generalProgramAudience: 'individual',
    generalCommonInfo: {
      educationScheduleLines: [] as string[],
    },
  } as unknown as Program
}

export function parseIndividualInstructorLectureAssignSchedule(
  program: Program
): InstructorLectureAssignSlot[] {
  const lines = resolveIndividualProgramEducationScheduleLines(program)
  const slots: InstructorLectureAssignSlot[] = []

  lines.forEach((line, index) => {
    const parsed = parseEducationScheduleLine(line)
    if (!parsed) return
    const sessionRound = index + 1
    const sessionLabel = `${sessionRound}차시`
    const timeRange = normalizeIndividualTimeRange(parsed.startTime, parsed.endTime)
    const key = buildIndividualSlotKey(parsed.dateKey, sessionRound)
    slots.push({
      key,
      dateKey: parsed.dateKey,
      schoolId: INDIVIDUAL_PROGRAM_LECTURE_SCHOOL_ID,
      schoolName: program.mainTitle?.trim() || program.title?.trim() || '개인 프로그램',
      region: '',
      sessionRound,
      sessionLabel,
      timeRange,
      assignedCount: 0,
    })
  })

  return slots
}

export function isIndividualLectureAssignSlotDisabled(
  slot: InstructorLectureAssignSlot,
  instructor: ApplicantInstructorRow
): boolean {
  if (slot.disabled) return true
  const preferences = instructor.preferredScheduleSlots
  if (!preferences?.length) return false
  const matched = preferences.find(item => item.slotKey === slot.key)
  if (!matched) return false
  return !matched.assignable
}

export function getIndividualLectureAssignSlots(
  program: Program,
  instructor: ApplicantInstructorRow,
  allInstructors: ApplicantInstructorRow[],
  excludeInstructorId?: string
): InstructorLectureAssignSlot[] {
  return parseIndividualInstructorLectureAssignSchedule(program).map(slot => ({
    ...slot,
    assignedCount: countLectureSlotAssignments(slot.key, allInstructors, excludeInstructorId),
    disabled: isIndividualLectureAssignSlotDisabled(slot, instructor),
  }))
}

export function toIndividualLectureAssignItem(
  slot: InstructorLectureAssignSlot
): InstructorLectureAssignItem {
  const date = dayjs(slot.dateKey)
  return {
    slotKey: slot.key,
    dateKey: slot.dateKey,
    schoolId: slot.schoolId,
    schoolName: slot.schoolName,
    sessionLabel: slot.sessionLabel,
    timeRange: slot.timeRange,
    dateLabel: formatLectureAssignDateLabel(date),
    tagLabel: formatIndividualLectureAssignTagLabel(date, slot.timeRange),
  }
}
