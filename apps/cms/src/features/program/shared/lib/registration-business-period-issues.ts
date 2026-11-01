import { parseEducationScheduleLineToRange } from '@/features/template/lib/format-education-schedule-line'
import { peekGeneralRegistrationWizardRhf } from '@/features/program/general/lib/overlay-phase1/registration-wizard-rhf-api'
import { peekCompanySchoolRegistrationRhf } from '@/features/program/1c-1s/lib/registration-rhf-api'
import { peekTrainedTeachersRegistrationRhf } from '@/features/program/trained-teachers/lib/registration-rhf-api'
import {
  type BusinessCalendarPeriod,
  isOutsideBusinessPeriod,
  readBusinessCalendarPeriod,
  toBusinessPeriodCalendarYmd,
} from './registration-business-period-calendar'

export type RegistrationBusinessPeriodDateIssue = {
  fieldKey: string
  fieldLabel: string
  dateYmd: string
}

const SKIP_KEY_RE = /operationRangeSeal$|operationAnchorIso$/i

const LABEL_BY_SUFFIX: Array<{ match: RegExp; label: string }> = [
  { match: /programRangeSeal$/i, label: '프로그램 운영 기간' },
  { match: /recruitRangeSeal$/i, label: '모집 기간' },
  { match: /interviewRangeSeal$/i, label: '면접 일정' },
  { match: /dateRangeSeal$/i, label: '교육 진행 기간' },
  { match: /docDeadlineIso$/i, label: '1차 서류 합격자 발표일' },
  { match: /finalAnnounceIso$/i, label: '최종 합격자 발표일' },
  { match: /scheduleLines$/i, label: '교육 진행 예정일' },
  { match: /preEducation/i, label: '사전교육 일정' },
  { match: /scheduleDate/i, label: '교육 진행 일정' },
  { match: /singleDateIso$/i, label: '교육 진행 일정' },
  { match: /periodDateIso$/i, label: '교육 진행 일정' },
]

function labelForKey(key: string): string {
  const suffix = (key.split('.').pop() ?? key).replace(/\[\d+\]$/g, '')
  for (const row of LABEL_BY_SUFFIX) {
    if (row.match.test(suffix) || row.match.test(key)) return row.label
  }
  if (/instructor/i.test(key) && /interview/i.test(key)) return '강사 면접일'
  if (/volunteer/i.test(key) && /interview/i.test(key)) return '봉사자 면접일'
  return '일정'
}

function pushIssue(
  issues: RegistrationBusinessPeriodDateIssue[],
  seen: Set<string>,
  fieldKey: string,
  dateYmd: string,
  period: BusinessCalendarPeriod
): void {
  if (!isOutsideBusinessPeriod(dateYmd, period)) return
  const token = `${fieldKey}:${dateYmd}`
  if (seen.has(token)) return
  seen.add(token)
  issues.push({ fieldKey, fieldLabel: labelForKey(fieldKey), dateYmd })
}

function walkValue(
  issues: RegistrationBusinessPeriodDateIssue[],
  seen: Set<string>,
  period: BusinessCalendarPeriod,
  key: string,
  value: unknown,
  depth: number
): void {
  if (depth > 6 || value == null) return
  if (SKIP_KEY_RE.test(key)) return

  const periodSeal = readBusinessCalendarPeriod(value)
  if (periodSeal) {
    pushIssue(issues, seen, key, periodSeal.start, period)
    pushIssue(issues, seen, key, periodSeal.end, period)
    return
  }

  if (typeof value === 'string') {
    const ymd = toBusinessPeriodCalendarYmd(value)
    if (ymd) {
      pushIssue(issues, seen, key, ymd, period)
      return
    }
    const lineRange = parseEducationScheduleLineToRange(value)
    if (lineRange) {
      const start = toBusinessPeriodCalendarYmd(lineRange[0])
      const end = toBusinessPeriodCalendarYmd(lineRange[1])
      if (start) pushIssue(issues, seen, key, start, period)
      if (end) pushIssue(issues, seen, key, end, period)
    }
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      walkValue(issues, seen, period, `${key}[${index}]`, item, depth + 1)
    })
    return
  }

  if (typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value as Record<string, unknown>)) {
      const nextKey = key ? `${key}.${childKey}` : childKey
      walkValue(issues, seen, period, nextKey, child, depth + 1)
    }
  }
}

export function collectDatesOutsideBusinessPeriod(
  records: readonly Record<string, unknown>[],
  period: BusinessCalendarPeriod | null
): RegistrationBusinessPeriodDateIssue[] {
  if (period == null) return []
  const issues: RegistrationBusinessPeriodDateIssue[] = []
  const seen = new Set<string>()
  for (const record of records) {
    walkValue(issues, seen, period, '', record, 0)
  }
  return issues
}

type UjatBusinessPeriodSource = { start: unknown; end: unknown }

let ujatBusinessPeriod: UjatBusinessPeriodSource | null = null
const ujatBusinessPeriodListeners = new Set<() => void>()

/** UJAT 등록 위저드 공통정보 RHF(startDate/endDate)를 달력 제약에 연결한다. */
export function publishUjatRegistrationBusinessPeriod(next: UjatBusinessPeriodSource | null): void {
  ujatBusinessPeriod = next
  ujatBusinessPeriodListeners.forEach(listener => listener())
}

export function subscribeUjatRegistrationBusinessPeriod(listener: () => void): () => void {
  ujatBusinessPeriodListeners.add(listener)
  return () => {
    ujatBusinessPeriodListeners.delete(listener)
  }
}

export function readActiveRegistrationBusinessPeriod(): BusinessCalendarPeriod | null {
  const fromUjat = readBusinessCalendarPeriod(
    ujatBusinessPeriod
      ? { start: ujatBusinessPeriod.start, end: ujatBusinessPeriod.end }
      : null
  )
  if (fromUjat) return fromUjat
  const general = peekGeneralRegistrationWizardRhf()?.getValues().operationRangeSeal
  const fromGeneral = readBusinessCalendarPeriod(general)
  if (fromGeneral) return fromGeneral
  const companySchool = peekCompanySchoolRegistrationRhf()?.getValues().operationRange
  const fromCs = readBusinessCalendarPeriod(companySchool)
  if (fromCs) return fromCs
  const trained = peekTrainedTeachersRegistrationRhf()?.getValues() as
    | { startDate?: unknown; endDate?: unknown }
    | undefined
  const fromTt = readBusinessCalendarPeriod(
    trained ? { start: trained.startDate, end: trained.endDate } : null
  )
  if (fromTt) return fromTt
  return null
}

/**
 * 등록 위저드는 사업 운영 기간 확인 모달을 띄우지 않는다.
 * 달력 disable은 Context가 담당한다.
 */
export function reportRegistrationBusinessPeriodIssuesIfAny(_handlers?: {
  showAlert: (args: { title: string; content: string }) => void
  reportIncomplete?: (keys: readonly string[]) => void
}): boolean {
  return false
}

export function collectCurrentRegistrationBusinessPeriodDateIssues(): {
  period: BusinessCalendarPeriod | null
  issues: RegistrationBusinessPeriodDateIssue[]
} {
  const period = readActiveRegistrationBusinessPeriod()
  const records: Record<string, unknown>[] = []
  if (ujatBusinessPeriod) {
    records.push({
      'ujat.basicInfo.startDate': ujatBusinessPeriod.start,
      'ujat.basicInfo.endDate': ujatBusinessPeriod.end,
    })
  }
  const generalRhf = peekGeneralRegistrationWizardRhf()?.getValues()
  if (generalRhf) records.push(generalRhf as unknown as Record<string, unknown>)
  const csRhf = peekCompanySchoolRegistrationRhf()?.getValues()
  if (csRhf) records.push(csRhf as unknown as Record<string, unknown>)
  const ttRhf = peekTrainedTeachersRegistrationRhf()?.getValues()
  if (ttRhf) records.push(ttRhf as unknown as Record<string, unknown>)
  return { period, issues: collectDatesOutsideBusinessPeriod(records, period) }
}
