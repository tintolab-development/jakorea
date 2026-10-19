import dayjs, { type Dayjs } from 'dayjs'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { resolveGeneralProgramLocalById } from '@/features/program/general/lib/general-program-local-cache'
import { getGeneralInstitutionApplicationsForProgram } from '@/features/program/general/lib/institution-applications'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { Program } from '@/types/domain'

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
  /** 지정 시 개인 프로그램 칩·태그 라벨로 그대로 사용 */
  label?: string
  /** 승인 API `scheduleId` — PERIOD 구간 등 composite key와 분리 */
  scheduleId?: number
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
  scheduleId?: number
  organizationApplicationId?: number | null
  /** 승인 API에 전달할 일정별 리드 강사 여부 */
  scheduleLead?: boolean
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

function normalizeTimeRange(timeRange: string | null | undefined): string {
  const normalized = (timeRange ?? '').replace(/\s*~\s*/g, ' ~ ').trim()
  if (!normalized) return '종일'

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
  const labelParsed = session.scheduleLabel
    ? parseEducationScheduleLine(session.scheduleLabel)
    : null
  const dateKey = parseSessionDateKey(session.date) ?? labelParsed?.dateKey ?? null
  if (!dateKey) return null
  const sessionRound = session.round
  const resolvedScheduleId = session.resolvedScheduleId
  const hasResolvedSchedule =
    resolvedScheduleId != null && Number.isFinite(resolvedScheduleId) && resolvedScheduleId > 0
  const key = hasResolvedSchedule
    ? String(resolvedScheduleId)
    : buildSlotKey(dateKey, institution.id, sessionRound)
  const remoteScheduleUnresolved =
    session.scheduleUnresolved === true ||
    (resolvedScheduleId !== undefined && !hasResolvedSchedule)
  return {
    key,
    ...(hasResolvedSchedule ? { scheduleId: resolvedScheduleId } : {}),
    dateKey,
    schoolId: institution.id,
    schoolName: institution.schoolName,
    region: regionDisplay(institution.region),
    sessionRound,
    sessionLabel: sessionLabelFromSession(session),
    timeRange:
      session.timeRange && session.timeRange !== '-'
        ? normalizeTimeRange(session.timeRange)
        : labelParsed?.startTime && labelParsed?.endTime
          ? normalizeTimeRange(`${labelParsed.startTime} ~ ${labelParsed.endTime}`)
          : normalizeTimeRange(session.timeRange),
    assignedCount: 0,
    disabled: session.status === 'completed' || remoteScheduleUnresolved,
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
  return formatCmsScheduleDisplayLabel(date.format('YYYY-MM-DD'))
}

export function formatLectureAssignTagLabel(date: Dayjs, schoolName: string): string {
  const shortSchool = schoolName.replace(/초등학교$/, '초').replace(/중학교$/, '중')
  return `${formatLectureAssignDateLabel(date)} ${shortSchool}`
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

/** 기관 신청 행 → 강의 배정 캘린더. remote 목록을 넘기면 mock 캐시를 쓰지 않는다. */
export function parseInstructorLectureAssignScheduleFromInstitutions(
  institutions: ApplicantSchoolRow[],
  options?: { approvedOnly?: boolean }
): ParsedInstructorLectureAssignSchedule {
  const approvedOnly = options?.approvedOnly !== false
  const slotMap = new Map<string, InstructorLectureAssignSlot>()

  for (const institution of institutions) {
    if (approvedOnly && institution.approvalStatus !== 'approved') continue
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

  const sortedDateKeys = [...clickableDateKeys].sort()
  const rangeStart = sortedDateKeys[0]
    ? dayjs(sortedDateKeys[0]).startOf('month')
    : dayjs('2026-03-01')
  const rangeEnd = sortedDateKeys.length
    ? dayjs(sortedDateKeys[sortedDateKeys.length - 1]).endOf('month')
    : dayjs('2026-03-31')

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

export function parseInstructorLectureAssignSchedule(
  programId: string
): ParsedInstructorLectureAssignSchedule {
  return parseInstructorLectureAssignScheduleFromInstitutions(
    getGeneralInstitutionApplicationsForProgram(programId),
    { approvedOnly: false }
  )
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
    const end = endMatch ? dayjs(`${endMatch[1]}-${endMatch[2]}-${endMatch[3]}`) : start
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

export function toLectureAssignItem(
  slot: InstructorLectureAssignSlot
): InstructorLectureAssignItem {
  const date = dayjs(slot.dateKey)
  const dateLabel = formatLectureAssignDateLabel(date)
  const scheduleId = slot.scheduleId ?? parseScheduleIdFromSlotKey(slot.key)
  const organizationApplicationId =
    slot.schoolId !== INDIVIDUAL_PROGRAM_LECTURE_SCHOOL_ID ? Number(slot.schoolId) : undefined
  return {
    slotKey: slot.key,
    dateKey: slot.dateKey,
    schoolId: slot.schoolId,
    schoolName: slot.schoolName,
    sessionLabel: slot.sessionLabel,
    timeRange: slot.timeRange,
    dateLabel,
    tagLabel: formatLectureAssignTagLabel(date, slot.schoolName),
    ...(scheduleId != null && scheduleId > 0 ? { scheduleId } : {}),
    ...(organizationApplicationId != null &&
    Number.isFinite(organizationApplicationId) &&
    organizationApplicationId > 0
      ? { organizationApplicationId }
      : {}),
  }
}

/** `186659` 또는 `186659:2026-10-27T15:00:00.000Z` 형태에서 scheduleId 추출 */
export function parseScheduleIdFromSlotKey(slotKey: string): number | null {
  const trimmed = slotKey.trim()
  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  const head = trimmed.split(':')[0]
  const parsed = Number(head)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export type InstructorApplicationApprovalAssignmentInput = {
  scheduleId: number
  organizationApplicationId?: number
  scheduleLead: boolean
}

export function mapLectureAssignItemsToApprovalAssignments(
  assignments: InstructorLectureAssignItem[]
): InstructorApplicationApprovalAssignmentInput[] {
  return assignments.flatMap((assignment, index) => {
    const scheduleId = assignment.scheduleId ?? parseScheduleIdFromSlotKey(assignment.slotKey)
    if (scheduleId == null || scheduleId < 1) return []
    const orgFromItem = assignment.organizationApplicationId
    const orgFromSchool =
      assignment.schoolId !== INDIVIDUAL_PROGRAM_LECTURE_SCHOOL_ID
        ? Number(assignment.schoolId)
        : NaN
    const organizationApplicationId =
      orgFromItem != null && Number.isFinite(orgFromItem) && orgFromItem > 0
        ? orgFromItem
        : Number.isFinite(orgFromSchool) && orgFromSchool > 0
          ? orgFromSchool
          : undefined
    return [
      {
        scheduleId,
        ...(organizationApplicationId != null ? { organizationApplicationId } : {}),
        scheduleLead: assignment.scheduleLead ?? index === 0,
      },
    ]
  })
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
  const scheduleId = slot.scheduleId ?? parseScheduleIdFromSlotKey(slot.key)
  return {
    slotKey: slot.key,
    dateKey: slot.dateKey,
    schoolId: slot.schoolId,
    schoolName: slot.schoolName,
    sessionLabel: slot.sessionLabel,
    timeRange: slot.timeRange,
    dateLabel: date.isValid() ? formatLectureAssignDateLabel(date) : '',
    tagLabel: slot.label ?? formatIndividualLectureAssignTagLabel(date, slot.timeRange),
    ...(scheduleId != null && scheduleId > 0 ? { scheduleId } : {}),
  }
}

export type InstructorApplicationScheduleSlotInput = {
  scheduleId?: number | null
  startAt?: string | null
  endAt?: string | null
  assignable?: boolean | null
  label?: string | null
}

function scheduleSlotIdentityKey(
  scheduleId: number,
  startAt?: string | null,
  index?: number
): string {
  const start = startAt?.trim()
  if (start) return `${scheduleId}:${start}`
  return `${scheduleId}:${index ?? 0}`
}

function formatScheduleSlotRangeLabel(
  scheduleId: number,
  startAt?: string | null,
  endAt?: string | null
) {
  const start = startAt ? dayjs(startAt) : null
  const end = endAt ? dayjs(endAt) : null
  if (!start?.isValid()) return `일정 ${scheduleId}`
  const startLabel = `${formatLectureAssignDateLabel(start)} ${start.format('HH:mm')}`
  if (!end?.isValid()) return startLabel
  if (end.isSame(start, 'day')) return `${startLabel} ~ ${end.format('HH:mm')}`
  return `${startLabel} ~ ${formatLectureAssignDateLabel(end)} ${end.format('HH:mm')}`
}

/** 강사 신청 상세 `availableScheduleSlots` → 개인 프로그램 강의 배정 슬롯 */
export function buildIndividualLectureAssignSlotsFromScheduleSlots(
  scheduleSlots: InstructorApplicationScheduleSlotInput[],
  options: {
    schoolName: string
    allInstructors: ApplicantInstructorRow[]
    excludeInstructorId?: string
  }
): InstructorLectureAssignSlot[] {
  const slots: InstructorLectureAssignSlot[] = []
  const seen = new Set<string>()
  scheduleSlots.forEach((item, index) => {
    const scheduleId = item.scheduleId
    if (scheduleId == null || !Number.isFinite(scheduleId) || scheduleId < 1) return
    const key = scheduleSlotIdentityKey(scheduleId, item.startAt, index)
    if (seen.has(key)) return
    seen.add(key)
    const start = item.startAt ? dayjs(item.startAt) : null
    const end = item.endAt ? dayjs(item.endAt) : null
    const periodLabel = item.label?.trim()
    const assignable = item.assignable !== false
    slots.push({
      key,
      scheduleId,
      dateKey: start?.isValid() ? start.format('YYYY-MM-DD') : '',
      schoolId: INDIVIDUAL_PROGRAM_LECTURE_SCHOOL_ID,
      schoolName: options.schoolName,
      region: '',
      sessionRound: 0,
      sessionLabel: '',
      timeRange:
        start?.isValid() && end?.isValid()
          ? `${start.format('HH:mm')} ~ ${end.format('HH:mm')}`
          : '',
      assignedCount: countLectureSlotAssignments(
        key,
        options.allInstructors,
        options.excludeInstructorId
      ),
      disabled: !assignable,
      label: periodLabel || formatScheduleSlotRangeLabel(scheduleId, item.startAt, item.endAt),
    })
  })
  return slots.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
}
