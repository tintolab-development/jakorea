import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import {
  formatDisplayClockLabel,
  formatDisplayDate,
} from '../../../../../shared/lib/format-display-date.ts'
import type { PortalPreferredScheduleBlock } from '@/features/program/api/application-types'
import type {
  EducationUjatApplicationContent,
  EducationUjatApplicationInstitution,
  EducationUjatClassPeriod,
  EducationUjatClassTimeBlock,
  EducationUjatGradeBlock,
} from '../model/types'

const EMPTY_DISPLAY = '-'

const GRADE_INFO_KEYS = [
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo,
  'gradeBlocks',
  'gradeApplicationInfo',
] as const

const CLASS_TIME_KEYS = [
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeClassTime,
  'classTimeRows',
  'gradeClassTime',
] as const

const PREFERRED_SCHEDULE_ANSWER_KEYS = [
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule,
  'preferredEducationDates',
  'preferredEducationSchedule',
] as const

const OVERLAY_GRADE_DETAIL_KEY = 'ujatApplication.gradeDetailByBlock'
const OVERLAY_GRADE_BY_BLOCK_KEY = 'ujatApplication.applicationGradeByBlockId'
const OVERLAY_CLASS_TIME_CHECKED_KEY = 'ujatApplication.classTimeCheckedByBlock'
const OVERLAY_CLASS_TIME_PERIODS_KEY = 'ujatApplication.classTimePeriodsByBlock'
const OVERLAY_PREFERRED_IDS_KEY = 'ujatApplication.preferredScheduleSelectedIds'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null
}

function readTrimmed(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function displayOrDash(value: string): string {
  return value.trim() || EMPTY_DISPLAY
}

function pickAnswer(answers: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (key in answers) return answers[key]
  }
  return undefined
}

function formatGradeLabel(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed === 'all' || trimmed === '전체' || trimmed === '전체 학년') return '전체 학년'
  if (trimmed.endsWith('학년')) return trimmed
  if (/^\d+$/.test(trimmed)) return `${trimmed}학년`
  return trimmed
}

function formatClassCountLabel(raw: unknown): string {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return `${raw}학급`
  const trimmed = readTrimmed(raw)
  if (!trimmed) return ''
  if (trimmed.endsWith('학급')) return trimmed
  if (/^\d+$/.test(trimmed)) return `${trimmed}학급`
  return trimmed
}

function formatClassRowLabel(classNo: string, studentCount: string): string {
  const no = classNo.replace(/반$/, '').trim()
  const count = studentCount.replace(/명$/, '').trim()
  if (!no && !count) return ''
  if (no && count) return `${no}반 ${count}명`
  if (no) return `${no}반`
  return `${count}명`
}

function unwrapList(raw: unknown): unknown[] {
  const direct = asArray(raw)
  if (direct) return direct
  const record = asRecord(raw)
  if (!record) return []
  for (const key of ['blocks', 'items', 'gradeBlocks', 'classTimeRows', 'rows', 'dates'] as const) {
    const nested = asArray(record[key])
    if (nested) return nested
  }
  return []
}

function mapGradeBlock(raw: unknown): EducationUjatGradeBlock | null {
  const record = asRecord(raw)
  if (!record) return null

  const gradeLabel = formatGradeLabel(
    readTrimmed(record.gradeLabel) ||
      readTrimmed(record.grade) ||
      readTrimmed(record.applicationGrade),
  )
  const classCountLabel = formatClassCountLabel(
    record.classCount ?? record.classCountInput ?? record.totalClassCount,
  )
  const classesRaw = asArray(record.classes) ?? asArray(record.classRows)
  const classParts: string[] = []
  if (classesRaw) {
    for (const row of classesRaw) {
      const item = asRecord(row)
      if (!item) continue
      const label = formatClassRowLabel(
        readTrimmed(item.classNo) || readTrimmed(item.className),
        readTrimmed(item.studentCount) || readTrimmed(item.headcount),
      )
      if (label) classParts.push(label)
    }
  }
  if (classParts.length === 0) {
    const classNoByIndex = asRecord(record.classNoByIndex)
    const studentCountByIndex = asRecord(record.studentCountByIndex)
    if (classNoByIndex || studentCountByIndex) {
      const indexes = new Set<string>([
        ...Object.keys(classNoByIndex ?? {}),
        ...Object.keys(studentCountByIndex ?? {}),
      ])
      const sorted = [...indexes].sort((a, b) => Number(a) - Number(b))
      for (const index of sorted) {
        const label = formatClassRowLabel(
          readTrimmed(classNoByIndex?.[index]),
          readTrimmed(studentCountByIndex?.[index]),
        )
        if (label) classParts.push(label)
      }
    }
  }

  if (!gradeLabel && !classCountLabel && classParts.length === 0) return null
  return {
    gradeLabel: displayOrDash(gradeLabel),
    classCountLabel,
    classesLabel: classParts.join(', '),
  }
}

function mapGradeBlocksFromOverlay(
  answers: Record<string, unknown>,
  paragraphAnswer: unknown,
): EducationUjatGradeBlock[] {
  const paragraph = asRecord(paragraphAnswer)
  const detailByBlock =
    asRecord(paragraph?.[OVERLAY_GRADE_DETAIL_KEY]) ??
    asRecord(paragraph?.gradeDetailByBlock) ??
    asRecord(answers[OVERLAY_GRADE_DETAIL_KEY])
  const gradeByBlock =
    asRecord(paragraph?.[OVERLAY_GRADE_BY_BLOCK_KEY]) ??
    asRecord(paragraph?.applicationGradeByBlockId) ??
    asRecord(answers[OVERLAY_GRADE_BY_BLOCK_KEY])
  if (!detailByBlock && !gradeByBlock) return []

  const ids = [
    ...new Set([...Object.keys(gradeByBlock ?? {}), ...Object.keys(detailByBlock ?? {})]),
  ]
  return ids
    .map(id =>
      mapGradeBlock({
        grade: readTrimmed(gradeByBlock?.[id]),
        ...(asRecord(detailByBlock?.[id]) ?? {}),
      }),
    )
    .filter((block): block is EducationUjatGradeBlock => Boolean(block))
}

function mapGradeBlocks(answers: Record<string, unknown>): EducationUjatGradeBlock[] {
  const raw = pickAnswer(answers, GRADE_INFO_KEYS)
  const fromList = unwrapList(raw)
    .map(mapGradeBlock)
    .filter((block): block is EducationUjatGradeBlock => Boolean(block))
  if (fromList.length > 0) return fromList
  return mapGradeBlocksFromOverlay(answers, raw)
}

function periodIndexFromKey(key: string): number | null {
  const match = /(?:period)?(\d+)/i.exec(key.trim())
  if (!match) return null
  const index = Number(match[1])
  return Number.isFinite(index) && index > 0 ? index : null
}

function formatPeriodTime(raw: unknown): string {
  const record = asRecord(raw)
  if (record) {
    const start =
      readTrimmed(record.start) ||
      readTrimmed(record.startTime) ||
      readTrimmed(record.startAt)
    const end =
      readTrimmed(record.end) ||
      readTrimmed(record.endTime) ||
      readTrimmed(record.endAt)
    const startLabel = start ? formatDisplayClockLabel(start) || formatClockFromDateTime(start) : ''
    const endLabel = end ? formatDisplayClockLabel(end) || formatClockFromDateTime(end) : ''
    if (startLabel && endLabel) return `${startLabel}~${endLabel}`
    return startLabel || endLabel
  }
  const text = readTrimmed(raw)
  if (!text) return ''
  if (text.includes('~') || text.includes('-')) {
    const [start, end] = text.split(/~|-/).map(part => part.trim())
    if (start && end) {
      return `${formatDisplayClockLabel(start) || start}~${formatDisplayClockLabel(end) || end}`
    }
  }
  return formatDisplayClockLabel(text) || text
}

function formatClockFromDateTime(value: string): string {
  if (/^\d{1,2}:\d{2}/.test(value)) return formatDisplayClockLabel(value)
  const match = /T(\d{2}):(\d{2})/.exec(value)
  if (match) return `${match[1]}:${match[2]}`
  const formatted = formatDisplayDate(value)
  return formatted ? formatDisplayClockLabel(value) : ''
}

function mapClassPeriods(rawPeriods: unknown): EducationUjatClassPeriod[] {
  const list = asArray(rawPeriods)
  if (list) {
    return list.flatMap((item, index) => {
      const timeLabel = formatPeriodTime(item)
      if (!timeLabel) return []
      const record = asRecord(item)
      const periodLabel =
        readTrimmed(record?.periodLabel) ||
        readTrimmed(record?.classPeriod) ||
        `${index + 1}교시`
      return [{ periodLabel: periodLabel.endsWith('교시') ? periodLabel : `${periodLabel}교시`, timeLabel }]
    })
  }

  const record = asRecord(rawPeriods)
  if (!record) return []
  return Object.entries(record)
    .map(([key, value]) => {
      const index = periodIndexFromKey(key)
      const timeLabel = formatPeriodTime(value)
      if (index == null || !timeLabel) return null
      return { index, periodLabel: `${index}교시`, timeLabel }
    })
    .filter((row): row is { index: number; periodLabel: string; timeLabel: string } => Boolean(row))
    .sort((a, b) => a.index - b.index)
    .map(({ periodLabel, timeLabel }) => ({ periodLabel, timeLabel }))
}

function mapClassTimeBlock(raw: unknown): EducationUjatClassTimeBlock | null {
  const record = asRecord(raw)
  if (!record) return null
  const gradeRangeLabel = formatGradeRangeLabel(
    readTrimmed(record.gradeRangeLabel) ||
      readTrimmed(record.gradeLabel) ||
      readTrimmed(record.grades),
    record,
  )
  const periods = mapClassPeriods(record.periods ?? record.sessionTimes ?? record.times)
  if (!gradeRangeLabel && periods.length === 0) return null
  return {
    gradeRangeLabel: displayOrDash(gradeRangeLabel),
    periods,
  }
}

function formatGradeRangeLabel(raw: string, record: Record<string, unknown>): string {
  if (raw) {
    if (raw === 'all' || raw === '전체') return '전체 학년'
    if (raw.includes(',')) {
      return raw
        .split(',')
        .map(part => formatGradeLabel(part))
        .filter(Boolean)
        .join(', ')
    }
    return formatGradeLabel(raw)
  }
  const grades = asArray(record.gradeValues) ?? asArray(record.checkedGrades)
  if (grades?.length) {
    const labels = grades
      .map(item => formatGradeLabel(readTrimmed(item)))
      .filter(Boolean)
    if (labels.includes('전체 학년')) return '전체 학년'
    return labels.join(', ')
  }
  return ''
}

function mapClassTimeBlocksFromOverlay(
  answers: Record<string, unknown>,
  paragraphAnswer: unknown,
): EducationUjatClassTimeBlock[] {
  const paragraph = asRecord(paragraphAnswer)
  const checkedByBlock =
    asRecord(paragraph?.[OVERLAY_CLASS_TIME_CHECKED_KEY]) ??
    asRecord(paragraph?.classTimeCheckedByBlock) ??
    asRecord(answers[OVERLAY_CLASS_TIME_CHECKED_KEY])
  const periodsByBlock =
    asRecord(paragraph?.[OVERLAY_CLASS_TIME_PERIODS_KEY]) ??
    asRecord(paragraph?.classTimePeriodsByBlock) ??
    asRecord(answers[OVERLAY_CLASS_TIME_PERIODS_KEY])
  if (!checkedByBlock && !periodsByBlock) return []

  const ids = [
    ...new Set([...Object.keys(checkedByBlock ?? {}), ...Object.keys(periodsByBlock ?? {})]),
  ]
  return ids
    .map(id => {
      const checked = asRecord(checkedByBlock?.[id]) ?? {}
      const allSelected = checked.all === true || checked['all'] === true
      const gradeLabels = allSelected
        ? ['전체 학년']
        : Object.entries(checked)
            .filter(([key, value]) => key !== 'all' && value === true)
            .map(([key]) => formatGradeLabel(key))
            .filter(Boolean)
      return mapClassTimeBlock({
        gradeRangeLabel: gradeLabels.join(', '),
        periods: periodsByBlock?.[id],
      })
    })
    .filter((block): block is EducationUjatClassTimeBlock => Boolean(block))
}

function mapClassTimeBlocks(answers: Record<string, unknown>): EducationUjatClassTimeBlock[] {
  const raw = pickAnswer(answers, CLASS_TIME_KEYS)
  const fromList = unwrapList(raw)
    .map(mapClassTimeBlock)
    .filter((block): block is EducationUjatClassTimeBlock => Boolean(block))
  if (fromList.length > 0) return fromList
  return mapClassTimeBlocksFromOverlay(answers, raw)
}

function formatPreferredDate(raw: unknown): string {
  const record = asRecord(raw)
  if (record) {
    const fromFields =
      readTrimmed(record.dateText) ||
      readTrimmed(record.date) ||
      readTrimmed(record.startAt) ||
      readTrimmed(record.label)
    if (!fromFields) return ''
    return formatDisplayDate(fromFields) || fromFields
  }
  const text = readTrimmed(raw)
  if (!text) return ''
  return formatDisplayDate(text) || text
}

function preferredDatesFromBlocks(
  blocks: readonly PortalPreferredScheduleBlock[] | readonly unknown[] | null | undefined,
): string[] {
  if (!blocks?.length) return []
  const labels: string[] = []
  for (const block of blocks) {
    const label = formatPreferredDate(block)
    if (label) labels.push(label)
  }
  return labels
}

function preferredDatesFromAnswer(raw: unknown, answers: Record<string, unknown>): string[] {
  const fromList = unwrapList(raw)
    .map(formatPreferredDate)
    .filter(Boolean)
  if (fromList.length > 0) return fromList

  const record = asRecord(raw)
  const overlayIds =
    asArray(record?.[OVERLAY_PREFERRED_IDS_KEY]) ??
    asArray(record?.preferredScheduleSelectedIds) ??
    asArray(record?.selectedIds) ??
    asArray(answers[OVERLAY_PREFERRED_IDS_KEY])
  if (overlayIds?.length) {
    return overlayIds.map(formatPreferredDate).filter(Boolean)
  }
  return []
}

function formatTeacherContact(row: Record<string, unknown>): string {
  return [
    readTrimmed(row.teacherName),
    readTrimmed(row.teacherTel) || readTrimmed(row.tel),
    readTrimmed(row.teacherMobile) || readTrimmed(row.mobile),
    readTrimmed(row.teacherEmail) || readTrimmed(row.email),
  ]
    .filter(Boolean)
    .join(' | ')
}

function mapInstitution(
  answers: Record<string, unknown>,
): EducationUjatApplicationInstitution {
  const basicRaw = answers[UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo]
  const row = asRecord(basicRaw) ?? {}
  const name =
    readTrimmed(row.schoolName) ||
    readTrimmed(row.institutionName) ||
    readTrimmed(row.organizationName)
  const address =
    readTrimmed(row.regionLabel) ||
    readTrimmed(row.organizationAddress) ||
    readTrimmed(row.institutionAddress)
  const addressDetail =
    readTrimmed(row.addressDetail) ||
    readTrimmed(row.detailAddress) ||
    readTrimmed(row['application.ujat.inst.basicInfo.detailAddress'])
  const teacherContact = formatTeacherContact(row)
  const otherRequests =
    readTrimmed(row.otherRequests) ||
    readTrimmed(row['application.ujat.inst.basicInfo.otherRequests'])

  return {
    name: displayOrDash(name),
    address: displayOrDash(address),
    addressDetail: displayOrDash(addressDetail),
    teacherContact: displayOrDash(teacherContact),
    otherRequests: displayOrDash(otherRequests),
  }
}

export function hasUjatApplicationContent(content: EducationUjatApplicationContent | undefined): boolean {
  if (!content) return false
  const institutionFilled = [
    content.institution.name,
    content.institution.address,
    content.institution.addressDetail,
    content.institution.teacherContact,
    content.institution.otherRequests,
  ].some(value => value.trim() && value.trim() !== EMPTY_DISPLAY)
  return (
    content.preferredDates.length > 0 ||
    content.gradeBlocks.length > 0 ||
    content.classTimeBlocks.length > 0 ||
    institutionFilled
  )
}

export function buildUjatApplicationContentFromPortal(input: {
  answers?: Record<string, unknown> | null
  preferredScheduleBlocks?: readonly PortalPreferredScheduleBlock[] | readonly unknown[] | null
}): EducationUjatApplicationContent | undefined {
  const answers = input.answers ?? {}
  const fromBlocks = preferredDatesFromBlocks(input.preferredScheduleBlocks)
  const preferredDates =
    fromBlocks.length > 0
      ? fromBlocks
      : preferredDatesFromAnswer(pickAnswer(answers, PREFERRED_SCHEDULE_ANSWER_KEYS), answers)

  const content: EducationUjatApplicationContent = {
    preferredDates,
    institution: mapInstitution(answers),
    gradeBlocks: mapGradeBlocks(answers),
    classTimeBlocks: mapClassTimeBlocks(answers),
  }
  return hasUjatApplicationContent(content) ? content : undefined
}
