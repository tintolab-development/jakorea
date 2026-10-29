import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import type {
  EducationForm,
  EducationTargetKey,
  ProgramBasicInfoField,
  ProgramDetail,
  ProgramDetailCase,
  ProgramEventSchedule,
  ProgramExtraSection,
  ProgramLabeledValue,
  ProgramListItem,
  ProgramParticipationMethod,
  ProgramSession,
  ProgramTab,
  ProgramVolunteerInterviewSchedule,
} from '../model/types'
import { PROGRAM_TAB_LABEL, programTabLabels } from '../lib/constants.ts'
import { fallbackPortalTab, isUjatProgramType, mapPortalTabs } from '../lib/portal-category.ts'
import {
  programTabFromPortalTab,
  selectRecruitmentsForFocus,
  type PortalRecruitmentFocus,
} from '../lib/portal-recruitment.ts'
import { readCanonicalPreEducationNoticeFlag } from '../lib/portal-application-hidden-paragraph-ids.ts'
import type {
  PortalCurriculum,
  PortalEducationCurriculumSession,
  PortalEducationScheduleDetail,
  PortalProgramDetail,
  PortalProgramListItem,
  PortalRecruitment,
  PortalSchedule,
  PortalVolunteerInterviewSchedule,
} from './types'
import { extraSection, rewriteAdminFileContentSrcsForPortal } from '../lib/html-body.ts'
import {
  educationScheduleDetailCardLabel,
  formatEducationScheduleRangeForDetailCard,
  formatEducationScheduleLineForDetailCard,
} from '../lib/education-schedule-detail-display.ts'
import {
  appendCurriculumSingleDateFixedScheduleSessionSuffix,
  shouldShowApplicationPreferredScheduleParagraph,
} from '@jakorea/form-schema/program-application'
import {
  formatDisplayDate,
  formatDisplayDateRange,
  normalizeScheduleDisplayLabel,
  parseScheduleDisplayLabel,
} from '../../../shared/lib/format-display-date.ts'
import { toDisplayEducationScheduleName } from '../../../shared/lib/education-schedule-name.ts'

function mapPortalMaxPreferredScheduleCount(
  remote: PortalProgramDetail,
  isTrainedTeacher: boolean,
  usesEducationProgressFields: boolean
): number {
  // 교육받은 교사 기간형의 실제 상한은 신청 폼 Runtime이 내려준다.
  // Runtime이 없는 경우에도 근거 없는 2지망을 만들어내지 않도록 안전한 최소값만 둔다.
  if (isTrainedTeacher) return 1
  if (!usesEducationProgressFields) return 1
  const visibility = {
    educationStructure:
      remote.educationStructure === 'schedule' ? ('schedule' as const) : ('curriculum' as const),
    sessionRound: remote.sessionRound === 'multi' ? ('multi' as const) : ('single' as const),
    educationScheduleMode:
      remote.educationScheduleMode === 'period' ? ('period' as const) : ('date' as const),
    educationScheduleLines: remote.educationScheduleLines ?? [],
  }
  return shouldShowApplicationPreferredScheduleParagraph(visibility) ? 10 : 1
}

function appendSessionSuffixToEducationScheduleLines(
  lines: readonly string[],
  input: {
    educationStructure: ProgramDetail['educationStructure']
    sessionRound: ProgramDetail['sessionRound']
    educationScheduleMode: ProgramDetail['educationScheduleMode']
    sessions: readonly ProgramSession[]
  },
): string[] {
  return lines.map((line, index) =>
    appendCurriculumSingleDateFixedScheduleSessionSuffix(
      line,
      {
        educationStructure: input.educationStructure,
        sessionRound: input.sessionRound,
        educationScheduleMode: input.educationScheduleMode,
        educationScheduleLines: lines,
      },
      {
        curriculumSessions: input.sessions.map(session => ({
          sessionLabel: session.sessionLabel,
          title: session.title,
        })),
      },
      index,
    )
  )
}

const RECRUITMENT_STATUS = {
  scheduled: 'scheduled',
  recruiting: 'recruiting',
  closed: 'closed',
} as const satisfies Record<string, RecruitmentStatus>

const EDUCATION_FORM_LABEL: Record<EducationForm, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '온/오프라인',
  participant_choice: '참여자 선택',
}

const TARGET_LABELS: Record<
  EducationTargetKey,
  { educationTargetLabel: string; educationTargetGroupLabel: string }
> = {
  elementary: { educationTargetLabel: '초등학생', educationTargetGroupLabel: '초등학교' },
  middle: { educationTargetLabel: '중학생', educationTargetGroupLabel: '중학교' },
  high: { educationTargetLabel: '고등학생', educationTargetGroupLabel: '고등학교' },
  university: { educationTargetLabel: '대학(원)생', educationTargetGroupLabel: '대학' },
  adult: { educationTargetLabel: '성인', educationTargetGroupLabel: '성인' },
}

const ROLE_LABEL: Record<ProgramDetailCase, string> = {
  instructor: '강사',
  volunteer: '봉사자',
  'ujat-volunteer': 'UJAT 봉사자',
  'ujat-participant': '기관',
  gemini: '교육생',
  general: '참여자',
}

export function parsePortalProgramId(value: string | null | undefined): number | null {
  if (!value?.trim()) return null
  if (!/^\d+$/.test(value.trim())) return null
  const id = Number.parseInt(value, 10)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export function portalPublicFileContentUrl(fileObjectId: number): string {
  return `/api/portal/public/files/${fileObjectId}/content`
}

export function portalPublicFileDownloadUrl(fileObjectId: number): string {
  return `/api/portal/public/files/${fileObjectId}/download`
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** 기관 참여자 모집 행. 강사·봉사자 행은 제외한다. */
function resolvePortalProgramAudience(
  remote: PortalProgramDetail,
  focus?: PortalRecruitmentFocus | null,
): 'organization' | 'individual' {
  const focusTypes = (focus?.applicationTypes ?? [])
    .map(type => type.trim().toUpperCase())
    .filter(Boolean)
  if (focusTypes.includes('ORGANIZATION') && !focusTypes.includes('INDIVIDUAL')) {
    return 'organization'
  }
  if (focus?.portalTab === 'ORGANIZATION') return 'organization'
  return remote.applicationTargetMode?.toUpperCase() === 'INDIVIDUAL' ? 'individual' : 'organization'
}

function isOrganizationParticipantRecruitment(row: PortalRecruitment | undefined): boolean {
  if (!row) return false
  const recruitmentType = row.recruitmentType?.trim().toUpperCase()
  if (recruitmentType === 'INSTRUCTOR' || recruitmentType === 'VOLUNTEER') return false
  const targetType = row.targetType?.trim().toUpperCase()
  const applicationType = row.applicationType?.trim().toUpperCase()
  const applicationTypes = (row.applicationTypes ?? []).map(type => type.trim().toUpperCase())
  return (
    targetType === 'ORGANIZATION' ||
    applicationType === 'ORGANIZATION' ||
    applicationTypes.includes('ORGANIZATION')
  )
}

/**
 * 기관 참여자 모집의 「사전 안내 사항 작성 여부」.
 * 포커스가 강사·봉사자 행이면 그 행과 프로그램 최상위를 쓰지 않는다.
 * 필드가 없으면 undefined. 기관 신청 화면에서만 레거시 기본값 true를 적용한다.
 */
function readPortalPreEducationNoticeRequired(
  remote: PortalProgramDetail,
  independentRow: PortalRecruitment | undefined,
): boolean | undefined {
  if (independentRow) {
    if (!isOrganizationParticipantRecruitment(independentRow)) return undefined
    return readCanonicalPreEducationNoticeFlag(independentRow) ?? readCanonicalPreEducationNoticeFlag(remote)
  }

  const organizationRows = (remote.recruitments ?? []).filter(isOrganizationParticipantRecruitment)
  const rowFlags = organizationRows
    .map(row => readCanonicalPreEducationNoticeFlag(row))
    .filter((flag): flag is boolean => flag !== undefined)
  if (rowFlags.length > 0 && rowFlags.every(flag => flag === rowFlags[0])) return rowFlags[0]
  if (
    organizationRows.length > 0 ||
    remote.applicationTargetMode?.trim().toUpperCase() === 'ORGANIZATION'
  ) {
    return readCanonicalPreEducationNoticeFlag(remote)
  }
  return undefined
}

function toDate(value: string | undefined): Date | null {
  if (!value?.trim()) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatRange(start: Date | null, end: Date | null): string {
  return formatDisplayDateRange(start, end, { empty: '-' })
}

function mapEducationForm(value: string | undefined): EducationForm {
  switch ((value ?? '').trim().toUpperCase()) {
    case 'ONLINE':
      return 'online'
    case 'HYBRID':
    case 'BLENDED':
    case 'ONLINE_OFFLINE':
      return 'hybrid'
    case 'PARTICIPANT_CHOICE':
      return 'participant_choice'
    default:
      return 'offline'
  }
}

/** API 계약의 canonical 값은 lower-case지만 구 응답/직접 연동 값도 동일 의미로 정규화한다. */
function isMultiSessionRound(value: string | null | undefined): boolean {
  const normalized = (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
  return ['multi', 'multiple', 'multi_round', 'multiple_round', '복수회차'].includes(normalized)
}

function mapEducationTarget(value: string | undefined): {
  key: EducationTargetKey | null
  keys: EducationTargetKey[]
  educationTargetLabel: string
  educationTargetGroupLabel: string
} {
  const key = (value ?? '').trim().toLowerCase()
  if (key in TARGET_LABELS) {
    const labels = TARGET_LABELS[key as EducationTargetKey]
    const typed = key as EducationTargetKey
    return { key: typed, keys: [typed], ...labels }
  }
  return { key: null, keys: [], educationTargetLabel: '전체', educationTargetGroupLabel: '전체' }
}

/** Portal 복수 `educationTargets` 우선. 없을 때만 단수 `educationTarget`. */
function mapEducationTargets(remote: { educationTarget?: string; educationTargets?: string[] }): {
  key: EducationTargetKey | null
  keys: EducationTargetKey[]
  educationTargetLabel: string
  educationTargetGroupLabel: string
} {
  /** CMS `TARGET_LEVEL_LABEL` 과 동일 — 목록·상세 조인 표시 */
  const CMS_TARGET_LEVEL_LABEL: Record<EducationTargetKey, string> = {
    elementary: '초등학교',
    middle: '중학교',
    high: '고등학교',
    university: '대학(원)생',
    adult: '성인',
  }

  const fromArray = (remote.educationTargets ?? [])
    .flatMap(item => String(item).split(/[,|/]/u))
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
  const source =
    fromArray.length > 0
      ? fromArray
      : (remote.educationTarget ?? '')
          .split(/[,|/]/u)
          .map(item => item.trim().toLowerCase())
          .filter(Boolean)
  const keys = [...new Set(source)].filter((key): key is EducationTargetKey => key in TARGET_LABELS)
  if (keys.length === 0) {
    return mapEducationTarget(remote.educationTarget)
  }
  if (keys.length === 1) {
    return mapEducationTarget(keys[0])
  }
  const joined = keys.map(key => CMS_TARGET_LEVEL_LABEL[key]).join(', ')
  return {
    key: keys[0] ?? null,
    keys,
    educationTargetLabel: joined,
    educationTargetGroupLabel: joined,
  }
}

/**
 * 공개 모집 탭 배지.
 * `portalCategories`가 오면 그 배열 전체를 쓴다. 진행 중 행 하나만 남기지 않는다.
 * 필드가 없는 구 응답만 programType으로 탭 하나를 만든다.
 */
function mapCategory(categories: string[] | undefined, programType: string | undefined): ProgramTab {
  return mapPortalTabs(categories, programType)[0] ?? fallbackPortalTab(programType)
}

const KNOWN_RECRUITMENT_STATUS = new Set([
  'OPEN',
  'RECRUITING',
  'SCHEDULED',
  'PLANNED',
  'UPCOMING',
  'CLOSED',
  'COMPLETED',
  'NONE',
])

/** 탭에서 고른 모집 행만. OPEN이 하나라도 있으면 모집 중. */
function aggregateRecruitmentStatus(rows: readonly PortalRecruitment[]): RecruitmentStatus {
  if (rows.length === 0) return RECRUITMENT_STATUS.closed
  const mapped = rows.map(row => {
    const status = (row.status ?? '').trim().toUpperCase()
    if (KNOWN_RECRUITMENT_STATUS.has(status)) return mapRecruitmentStatus(row.status, undefined)
    return mapRecruitmentStatus(undefined, [row])
  })
  if (mapped.some(status => status === RECRUITMENT_STATUS.recruiting)) {
    return RECRUITMENT_STATUS.recruiting
  }
  if (mapped.some(status => status === RECRUITMENT_STATUS.scheduled)) {
    return RECRUITMENT_STATUS.scheduled
  }
  return RECRUITMENT_STATUS.closed
}

function recruitmentWindow(rows: readonly PortalRecruitment[]): { start: Date | null; end: Date | null } {
  let start: Date | null = null
  let end: Date | null = null
  for (const row of rows) {
    const rowStart = toDate(row.startAt)
    const rowEnd = toDate(row.endAt)
    if (rowStart && (!start || rowStart < start)) start = rowStart
    if (rowEnd && (!end || rowEnd > end)) end = rowEnd
  }
  return { start, end }
}

/**
 * 진입 탭의 신청 유형으로 상세 케이스를 고른다.
 * TRAINED_TEACHER는 기관 참가이지 강사 모집이 아니다.
 */
function detailCaseForFocus(
  programType: string | undefined,
  applicationTypes: readonly string[],
): ProgramDetailCase {
  const type = (programType ?? '').trim().toUpperCase()
  if (type === 'GEMINI_TRAINING' || type === 'GEMINI' || type === 'VISITING_TRAINING') {
    return 'gemini'
  }
  const types = new Set(applicationTypes.map(item => item.trim().toUpperCase()))
  const only = types.size === 1 ? [...types][0] : undefined
  if (only === 'VOLUNTEER') return type === 'UJAT' ? 'ujat-volunteer' : 'volunteer'
  if (only === 'INSTRUCTOR') return type === 'UJAT' ? 'ujat-volunteer' : 'instructor'
  if (only === 'ORGANIZATION' && type === 'UJAT') return 'ujat-participant'
  return 'general'
}

function mapDetailCase(
  programType: string | undefined,
  categories: string[] | undefined,
  recruitments: PortalRecruitment[] | undefined
): ProgramDetailCase {
  const type = (programType ?? '').trim().toUpperCase()
  const codes = (categories ?? []).map(item => item.trim().toUpperCase())
  // Portal SSOT = GEMINI_TRAINING. GEMINI / VISITING_TRAINING 은 CMS preview·레거시 alias.
  // programType이 Gemini면 portalCategories의 INSTRUCTOR보다 우선 (찾아가는 연수 상세 케이스 유지).
  if (type === 'GEMINI_TRAINING' || type === 'GEMINI' || type === 'VISITING_TRAINING') {
    return 'gemini'
  }
  // 교육받은 교사는 강사 모집이 아니라 기관(ORGANIZATION) 참여형 프로그램이다.
  // 포커스 없는 상세도 일반 기관 프로그램과 같은 기본정보·추가 섹션을 사용한다.
  if (type === 'TRAINED_TEACHER') return 'general'
  if (type === 'UJAT') {
    const volunteer = (recruitments ?? []).some(
      row => (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER'
    )
    return volunteer ? 'ujat-volunteer' : 'ujat-participant'
  }
  if (codes.includes('INSTRUCTOR')) return 'instructor'
  const volunteer = (recruitments ?? []).some(
    row => (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER'
  )
  if (volunteer) return 'volunteer'
  const instructor = (recruitments ?? []).some(
    row => (row.recruitmentType ?? '').toUpperCase() === 'INSTRUCTOR'
  )
  if (instructor) return 'instructor'
  return 'general'
}

/**
 * 모집 배지는 `recruitmentStatus`만 본다.
 * `periodStatus`가 SCHEDULED여도 모집 예정으로 만들지 않는다.
 */
function mapRecruitmentStatus(
  recruitmentStatus: string | undefined,
  recruitments: PortalRecruitment[] | undefined
): RecruitmentStatus {
  switch ((recruitmentStatus ?? '').trim().toUpperCase()) {
    case 'RECRUITING':
    case 'OPEN':
      return RECRUITMENT_STATUS.recruiting
    case 'SCHEDULED':
    case 'PLANNED':
    case 'UPCOMING':
      return RECRUITMENT_STATUS.scheduled
    case 'CLOSED':
    case 'COMPLETED':
    case 'NONE':
      return RECRUITMENT_STATUS.closed
    default:
      break
  }
  if ((recruitments ?? []).some(row => row.open === true)) return RECRUITMENT_STATUS.recruiting
  const now = Date.now()
  const windows = (recruitments ?? []).flatMap(row => {
    const start = toDate(row.startAt)
    const end = toDate(row.endAt)
    if (!start || !end) return []
    return [{ start, end }]
  })
  if (windows.some(window => now >= window.start.getTime() && now <= window.end.getTime())) {
    return RECRUITMENT_STATUS.recruiting
  }
  if (windows.some(window => now < window.start.getTime())) return RECRUITMENT_STATUS.scheduled
  return RECRUITMENT_STATUS.closed
}

function recruitmentTypeLabel(value: string | undefined): string {
  switch ((value ?? '').trim().toUpperCase()) {
    case 'INSTRUCTOR':
      return '강사 모집 기간'
    case 'VOLUNTEER':
      return '봉사자 모집 기간'
    default:
      return '참여자 모집 기간'
  }
}

function recruitmentRoleShort(value: string | undefined): string {
  switch ((value ?? '').trim().toUpperCase()) {
    case 'INSTRUCTOR':
      return '강사'
    case 'VOLUNTEER':
      return '봉사자'
    default:
      return '참여자'
  }
}

function recruitmentTypeKey(value: string | undefined): string {
  const key = (value ?? '').trim().toUpperCase()
  return key || 'PARTICIPANT'
}

const SCHEDULE_KIND_LABEL: Record<string, string> = {
  PRE_EDUCATION: '봉사자 사전교육',
  EDUCATION: '교육 진행',
  CLOSING: '해단식',
  SESSION: '기관',
}

const TERM_LABEL: Record<string, string> = {
  FIRST_HALF: '상반기',
  SECOND_HALF: '하반기',
}

const UJAT_KIND_ORDER: Record<string, number> = {
  SESSION: 0,
  PRE_EDUCATION: 1,
  EDUCATION: 2,
  CLOSING: 3,
}

const UJAT_TERM_ORDER: Record<string, number> = {
  FIRST_HALF: 0,
  SECOND_HALF: 1,
}

const UNCONFIRMED_SCHEDULE_DATE_LABEL = '일정 미정'

function visibleSchedules(schedules: PortalSchedule[] | undefined): PortalSchedule[] {
  return (schedules ?? []).filter(row => row.publiclyVisible !== false)
}

function scheduleTitle(schedule: PortalSchedule): string {
  const kind = readString(schedule.scheduleKind)?.toUpperCase()
  const kindLabel = kind ? SCHEDULE_KIND_LABEL[kind] : undefined
  const term = readString(schedule.term)?.toUpperCase()
  const termLabel = term ? TERM_LABEL[term] : undefined
  const name = toDisplayEducationScheduleName(schedule.scheduleName)
  const parts = [kindLabel, termLabel, name].filter((value): value is string => Boolean(value))
  return parts.join(' ')
}

function mapSessions(curricula: PortalCurriculum[] | undefined) {
  return (curricula ?? []).flatMap(curriculum =>
    (curriculum.sessions ?? []).map((session, index) => ({
      sessionLabel: `${session.sessionNo ?? index + 1}회차`,
      title: readString(session.title) ?? readString(curriculum.title) ?? '교육 회차',
      description: readString(session.content) ?? '',
    }))
  )
}

function mapEventSchedules(schedules: PortalSchedule[] | undefined) {
  return visibleSchedules(schedules).flatMap((schedule, index) => {
    const name = scheduleTitle(schedule)
    const dateLabel = formatRange(toDate(schedule.startAt), toDate(schedule.endAt))
    if (!name && dateLabel === '-') return []

    return [
      {
        scheduleLabel: `일정 ${schedule.sessionNo ?? index + 1}`,
        name,
        dateLabel,
        ...(schedule.scheduleId != null ? { scheduleId: schedule.scheduleId } : {}),
        ...(readString(schedule.startAt) ? { startAt: readString(schedule.startAt)! } : {}),
        ...(readString(schedule.endAt) ? { endAt: readString(schedule.endAt)! } : {}),
      },
    ]
  })
}

function mapUjatPublicEventSchedules(schedules: PortalSchedule[] | undefined) {
  return visibleSchedules(schedules)
    .slice()
    .sort((left, right) => {
      const leftTerm = readString(left.term)?.toUpperCase() ?? ''
      const rightTerm = readString(right.term)?.toUpperCase() ?? ''
      const termDiff = (UJAT_TERM_ORDER[leftTerm] ?? 99) - (UJAT_TERM_ORDER[rightTerm] ?? 99)
      if (termDiff !== 0) return termDiff
      const leftKind = readString(left.scheduleKind)?.toUpperCase() ?? ''
      const rightKind = readString(right.scheduleKind)?.toUpperCase() ?? ''
      return (UJAT_KIND_ORDER[leftKind] ?? 99) - (UJAT_KIND_ORDER[rightKind] ?? 99)
    })
    .flatMap(schedule => {
      const kind = readString(schedule.scheduleKind)?.toUpperCase()
      const term = readString(schedule.term)?.toUpperCase()
      const kindLabel = kind ? SCHEDULE_KIND_LABEL[kind] : undefined
      const termLabel = term ? TERM_LABEL[term] : undefined
      const fallbackName = toDisplayEducationScheduleName(schedule.scheduleName) ?? ''
      const scheduleLabel = termLabel ?? kindLabel ?? '일정'
      const name = termLabel ? (kindLabel ?? fallbackName) : kindLabel ? '' : fallbackName
      const formatted = formatRange(toDate(schedule.startAt), toDate(schedule.endAt))
      const dateLabel = formatted === '-' ? UNCONFIRMED_SCHEDULE_DATE_LABEL : formatted
      if (!scheduleLabel && !name) return []

      return [
        {
          scheduleLabel,
          name,
          dateLabel,
          ...(schedule.scheduleId != null ? { scheduleId: schedule.scheduleId } : {}),
          ...(readString(schedule.startAt) ? { startAt: readString(schedule.startAt)! } : {}),
          ...(readString(schedule.endAt) ? { endAt: readString(schedule.endAt)! } : {}),
        },
      ]
    })
}

function venueFromSchedules(schedules: PortalSchedule[] | undefined): string {
  const first = visibleSchedules(schedules).find(
    row => readString(row.locationName) || readString(row.address)
  )
  if (!first) return ''
  const parts = [first.locationName, first.address, first.addressDetail]
    .map(readString)
    .filter((value): value is string => Boolean(value))
  return parts.join(' ')
}

function mapRecruitmentPhases(recruitments: PortalRecruitment[] | undefined) {
  const rows = recruitments ?? []
  const qualify = rows.length > 1
  const typeCounts = new Map<string, number>()
  for (const row of rows) {
    const key = recruitmentTypeKey(row.recruitmentType)
    typeCounts.set(key, (typeCounts.get(key) ?? 0) + 1)
  }
  const typeSeen = new Map<string, number>()

  return rows.flatMap(row => {
    const typeKey = recruitmentTypeKey(row.recruitmentType)
    const seen = (typeSeen.get(typeKey) ?? 0) + 1
    typeSeen.set(typeKey, seen)
    const role = recruitmentRoleShort(row.recruitmentType)
    const roleTag =
      qualify && (typeCounts.get(typeKey) ?? 0) > 1 ? `${role}${seen}` : qualify ? role : null
    const selectionLabel = (base: string) => (roleTag ? `${roleTag} ${base}` : base)
    const periodLabel =
      roleTag && (typeCounts.get(typeKey) ?? 0) > 1
        ? `${roleTag} 모집 기간`
        : recruitmentTypeLabel(row.recruitmentType)

    const recruitmentStart = toDate(row.startAt)
    const recruitmentEnd = toDate(row.endAt)
    const phases: ProgramLabeledValue[] = recruitmentStart || recruitmentEnd
      ? [
          {
            label: periodLabel,
            value: formatRange(recruitmentStart, recruitmentEnd),
          },
        ]
      : []
    const interviewOff = row.interviewEnabled === false
    const hasInterviewDates = Boolean(
      readString(row.documentPassAnnouncementAt ?? undefined) ||
        readString(row.interviewStartAt ?? undefined) ||
        readString(row.interviewEndAt ?? undefined)
    )
    if (!interviewOff && (row.interviewEnabled === true || hasInterviewDates)) {
      const documentAt = toDate(row.documentPassAnnouncementAt ?? undefined)
      if (documentAt) {
        phases.push({
          label: selectionLabel('1차 합격자 발표일'),
          value: formatDisplayDate(documentAt),
        })
      }
      const interviewStart = toDate(row.interviewStartAt ?? undefined)
      const interviewEnd = toDate(row.interviewEndAt ?? undefined)
      if (interviewStart || interviewEnd) {
        phases.push({
          label: selectionLabel('면접 기간'),
          value: formatRange(interviewStart, interviewEnd),
        })
      }
    }
    const finalAt = toDate(row.finalPassAnnouncementAt ?? undefined)
    if (finalAt) {
      phases.push({
        label: selectionLabel('최종 합격자 발표'),
        value: formatDisplayDate(finalAt),
      })
    }
    return phases
  })
}

function mapParticipationMethod(remote: PortalProgramDetail): ProgramParticipationMethod {
  const raw = String(remote.participationMethod ?? '')
    .trim()
    .toLowerCase()
  if (raw === 'team') return 'team'
  /** CMS·map-from-cms와 동일 — 미전달 시 개인 참여(팀 정보 단락 비노출) */
  return 'individual'
}

const VENUE_KIND_LABEL: Record<string, string> = {
  inside: '기관 안',
  inside_school: '기관 안',
  outside: '기관 밖',
  outside_school: '기관 밖',
  other: '기타',
}

/** 기타는 상세만, 기관 안/밖은 `구분 | 상세`로 표시한다. */
export function formatPortalEducationVenue(
  venue: string | null | undefined,
  venueKind: string | null | undefined
): string {
  const detail = venue?.trim() ?? ''
  const normalizedKind = (venueKind ?? '').trim().toLowerCase()
  if (normalizedKind === 'other') return detail

  const kindLabel = VENUE_KIND_LABEL[normalizedKind] ?? ''
  if (!kindLabel) return detail
  if (!detail || detail === kindLabel) return kindLabel

  const detailWithoutKind = detail.replace(new RegExp(`^${kindLabel}\\s*(?:,|\\|)\\s*`), '').trim()
  return detailWithoutKind ? `${kindLabel} | ${detailWithoutKind}` : kindLabel
}

/** 참여자·기관·Gemini만 학습 지원. 강사·봉사자는 기타사항. */
function showsLearningSupport(detailCase: ProgramDetailCase): boolean {
  return detailCase === 'general' || detailCase === 'ujat-participant' || detailCase === 'gemini'
}

function showsOtherMatters(detailCase: ProgramDetailCase): boolean {
  return detailCase === 'instructor' || detailCase === 'volunteer' || detailCase === 'ujat-volunteer'
}

/** 빈 에디터(`<p></p>`, `<p><br></p>`)와 CMS 공란 표식은 섹션을 만들지 않는다. */
function visibleCopy(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '-' || trimmed === '해당 없음' || trimmed === '해당없음') return ''
  const plain = trimmed
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\u200b/g, '')
    .trim()
  return plain.length === 0 ? '' : trimmed
}

function contactValue(
  name?: string | null,
  phone?: string | null,
  email?: string | null,
): string {
  const n = readString(name)
  const p = readString(phone)
  const e = readString(email)
  return [n, p ? `Tel : ${p}` : '', e ? `E-mail : ${e}` : ''].filter(Boolean).join(', ')
}

function isGeneralEducationProgressProgram(programType: string | undefined): boolean {
  const type = (programType ?? '').trim().toUpperCase()
  return type === 'GENERAL_INDIVIDUAL' || type === 'GENERAL_ORGANIZATION'
}

/** 공통정보가 투영된 상세. 유형과 무관하게 교육 진행 컴포넌트를 쓴다. */
function hasProjectedEducationProgress(remote: PortalProgramDetail): boolean {
  return remote.educationStructure === 'curriculum' || remote.educationStructure === 'schedule'
}

function optionalText(value: string | null | undefined): string | undefined {
  const text = value?.trim()
  return text ? text : undefined
}

/** `educationForm` 우선. 없을 때만 프로그램 컬럼 `operationMethod`. */
function resolveEducationFormCode(
  educationForm: string | null | undefined,
  operationMethod: string | null | undefined
): EducationForm {
  const code = optionalText(educationForm) ?? optionalText(operationMethod)
  return mapEducationForm(code)
}

function resolveOperatingRange(args: {
  operationStart?: string | null
  operationEnd?: string | null
  businessStart?: string | null
  businessEnd?: string | null
}): { start: Date | null; end: Date | null } {
  const operationStart = toDate(args.operationStart ?? undefined)
  const operationEnd = toDate(args.operationEnd ?? undefined)
  if (operationStart || operationEnd) return { start: operationStart, end: operationEnd }
  return {
    start: toDate(args.businessStart ?? undefined),
    end: toDate(args.businessEnd ?? undefined),
  }
}

/** 상세 운영 기간은 모집 행 날짜. 없으면 사업 기간. */
function recruitmentOperatingDates(recruitments: PortalRecruitment[] | undefined): {
  start?: string | null
  end?: string | null
} {
  const row = (recruitments ?? []).find(
    item => optionalText(item.operationStartDate) || optionalText(item.operationEndDate)
  )
  return { start: row?.operationStartDate, end: row?.operationEndDate }
}

type EducationProgressRowVisibility = {
  /** 루트 교육 형태가 있으면 행 값은 반복하지 않는다. */
  showEducationForm: boolean
  /** 기간형 배정 정보는 교육받은 교사 프로그램에서만 공개한다. */
  showAssignmentPeriod: boolean
  /** 개인 일반 「교육 진행 장소」 일정별일 때만 행마다 장소를 보인다. */
  showEducationPlace: boolean
}

/** 사전 교육 행에는 교육 장소를 싣지 않는다. */
function isPortalPreEducationRow(row: {
  blockKind?: string
  sessionLabel?: string
  scheduleLabel?: string
}): boolean {
  if (row.blockKind === 'preEducation') return true
  return [row.sessionLabel, row.scheduleLabel].some(label =>
    /^사전\s*교육/.test(label?.trim() ?? '')
  )
}

function educationPlaceRowLabel(
  row: {
    educationPlaceAddress?: string | null
    blockKind?: string
    sessionLabel?: string
    scheduleLabel?: string
  },
  rows: EducationProgressRowVisibility
): string | undefined {
  if (!rows.showEducationPlace || isPortalPreEducationRow(row)) return undefined
  return optionalText(row.educationPlaceAddress)
}

function mapPortalCurriculumSessions(
  sessions: PortalEducationCurriculumSession[] | undefined,
  structure: PortalProgramDetail['educationStructure'],
  rows: EducationProgressRowVisibility
): ProgramSession[] {
  if (structure !== 'curriculum') return []
  return (sessions ?? []).map(session => {
    const dateLabel = optionalText(session.scheduleDateLabel)
    const educationFormLabel = rows.showEducationForm
      ? optionalText(session.educationFormLabel)
      : undefined
    const participationMethodLabel = optionalText(session.participationMethodLabel)
    const assignmentPeriod = rows.showAssignmentPeriod
      ? optionalText(session.assignmentPeriod)
      : undefined
    const educationPlaceLabel = educationPlaceRowLabel(session, rows)
    return {
      sessionLabel: session.sessionLabel ?? '',
      title: session.title ?? '',
      description: session.description ?? '',
      ...(dateLabel ? { dateLabel: normalizeScheduleDisplayLabel(dateLabel) } : {}),
      ...(educationFormLabel ? { educationFormLabel } : {}),
      ...(participationMethodLabel ? { participationMethodLabel } : {}),
      ...(session.assignmentEnabled !== undefined
        ? { assignmentEnabled: session.assignmentEnabled }
        : {}),
      ...(assignmentPeriod ? { assignmentPeriod } : {}),
      ...(educationPlaceLabel ? { educationPlaceLabel } : {}),
    }
  })
}

function formatGroupTimes(times: PortalEducationScheduleDetail['groupTimes']): string | undefined {
  const labels = (times ?? [])
    .map(slot => {
      const start = slot.startTime?.trim() ?? ''
      const end = slot.endTime?.trim() ?? ''
      if (start && end) return `${start} ~ ${end}`
      return start || end
    })
    .filter(label => label.length > 0)
  if (labels.length === 0) return undefined
  if (labels.length === 1) return labels[0]
  return labels
    .map((label, index) => `그룹 ${String.fromCharCode(65 + index)} : ${label}`)
    .join(' | ')
}

function mapPortalScheduleDetails(
  details: PortalEducationScheduleDetail[] | undefined,
  structure: PortalProgramDetail['educationStructure'],
  sessionRound: PortalProgramDetail['sessionRound'],
  rows: EducationProgressRowVisibility
): ProgramEventSchedule[] {
  if (structure !== 'schedule') return []
  return (details ?? []).flatMap(detail => {
    const rawScheduleLabel = detail.scheduleLabel?.trim() ?? ''
    const scheduleLabel =
      isMultiSessionRound(sessionRound)
        ? rawScheduleLabel.replace(/^세부\s*일정/, '행사 일정')
        : rawScheduleLabel
    const timeSummary =
      optionalText(detail.progressTimeSummary) ?? formatGroupTimes(detail.groupTimes)
    const scheduleDateLabel = optionalText(detail.scheduleDateLabel)
    const scheduleDateHasTime = Boolean(
      scheduleDateLabel && parseScheduleDisplayLabel(scheduleDateLabel).timeRange
    )
    // A date-only schedule still needs its canonical date and its group/time
    // summary. Only a date label that already contains a time is authoritative
    // for the time portion, for both single- and multi-round schedules.
    const dateLabel = (scheduleDateHasTime ? [scheduleDateLabel] : [scheduleDateLabel, timeSummary])
      .filter((part): part is string => Boolean(part))
      .map(part => normalizeScheduleDisplayLabel(part))
      .filter(Boolean)
      .join(' ')
    const educationFormLabel = rows.showEducationForm
      ? optionalText(detail.educationFormLabel)
      : undefined
    const participationMethodLabel = optionalText(detail.participationMethodLabel)
    const assignmentPeriod = rows.showAssignmentPeriod
      ? optionalText(detail.assignmentPeriod)
      : undefined
    const educationPlaceLabel = educationPlaceRowLabel(detail, rows)
    const name = toDisplayEducationScheduleName(detail.name) ?? ''
    if (
      !name &&
      !dateLabel &&
      !educationFormLabel &&
      !participationMethodLabel &&
      !assignmentPeriod &&
      !educationPlaceLabel &&
      detail.assignmentEnabled === undefined
    ) {
      return []
    }

    return [
      {
        scheduleLabel,
        name,
        dateLabel,
        ...(detail.blockKind ? { blockKind: detail.blockKind } : {}),
        ...(educationFormLabel ? { educationFormLabel } : {}),
        ...(participationMethodLabel ? { participationMethodLabel } : {}),
        ...(detail.assignmentEnabled !== undefined
          ? { assignmentEnabled: detail.assignmentEnabled }
          : {}),
        ...(assignmentPeriod ? { assignmentPeriod } : {}),
        ...(educationPlaceLabel ? { educationPlaceLabel } : {}),
      },
    ]
  })
}

function mapPortalEducationScheduleRange(
  range: PortalProgramDetail['educationScheduleRange'],
): ProgramDetail['educationScheduleRange'] {
  const start = optionalText(range?.start)
  const end = optionalText(range?.end)
  if (!start && !end) return null
  return { start: start ?? null, end: end ?? null }
}

const EDUCATION_TARGET_CODE = new Set(['elementary', 'middle', 'high', 'university', 'adult'])

/** 교육 대상 상세 문장. `high` 같은 대상 코드는 설명으로 쓰지 않는다. */
function mapEducationTargetDetailLabel(
  remote: PortalProgramDetail,
  fallbackLabel: string,
  useRecruitmentDetailFallback: boolean,
): string {
  const detail = readString(remote.educationTargetDetail)
  if (detail && !EDUCATION_TARGET_CODE.has(detail.toLowerCase())) return detail
  if (useRecruitmentDetailFallback) {
    const recruitmentDetail = readString(remote.recruitmentTargetDetail)
    if (recruitmentDetail && !EDUCATION_TARGET_CODE.has(recruitmentDetail.toLowerCase())) {
      return recruitmentDetail
    }
  }
  return fallbackLabel
}

/** 세부내용 「교육 일정」 카드. 일정형 복수 회차는 배열이 있어도 카드를 숨긴다. */
function mapPortalEducationScheduleCards(
  remote: PortalProgramDetail,
  educationScheduleLines: readonly string[],
): ProgramLabeledValue[] {
  if (remote.educationStructure === 'schedule' && isMultiSessionRound(remote.sessionRound)) {
    return []
  }
  const mode = remote.educationScheduleMode === 'period' ? 'period' : 'date'
  if (mode === 'period') {
    const rangeLabel = formatEducationScheduleRangeForDetailCard(
      remote.educationScheduleRange?.start,
      remote.educationScheduleRange?.end,
    )
    if (!rangeLabel) return []
    return [{ label: educationScheduleDetailCardLabel(0, 1), value: rangeLabel }]
  }
  const lines = educationScheduleLines
    .map(line => formatEducationScheduleLineForDetailCard(line, mode))
    .filter(value => value.trim().length > 0 && value !== '-')
  return lines.map((value, index) => ({
    label: educationScheduleDetailCardLabel(index, lines.length),
    value,
  }))
}

function mapEventScheduleCards(
  eventSchedules: readonly ProgramEventSchedule[],
): ProgramLabeledValue[] {
  return eventSchedules.flatMap((item, index) => {
    const name = item.name.trim()
    const dateLabel = item.dateLabel.trim() && item.dateLabel !== '-' ? item.dateLabel.trim() : ''
    const value = [name, dateLabel].filter(Boolean).join(' · ')
    if (!value) return []
    return [
      {
        label: educationScheduleDetailCardLabel(index, eventSchedules.length),
        value,
      },
    ]
  })
}

/**
 * 봉사자 모집 행 `volunteerInterviewSchedule` → `ProgramDetail` 필드.
 * 프로그램 상세 세부내용에는 비노출(신청 폼·후속 연동용).
 */
function mapVolunteerInterviewSchedule(
  recruitments: PortalRecruitment[] | undefined
): ProgramVolunteerInterviewSchedule | undefined {
  const remote = (recruitments ?? [])
    .map(row => row.volunteerInterviewSchedule)
    .find((schedule): schedule is PortalVolunteerInterviewSchedule => schedule != null)
  if (remote == null) return undefined

  const periodLabel = formatDisplayDateRange(remote.periodStartDate, remote.periodEndDate, {
    empty: '-',
  })
  const availableTimeSlots = readString(remote.availableTimeSlots ?? undefined)
  const recurringUnavailable = readString(remote.recurringUnavailable ?? undefined)
  const options = (remote.options ?? []).flatMap(option => {
    const id = readString(option.id)
    const label = readString(option.label)
    if (!id || !label) return []
    return [{ id, label: normalizeScheduleDisplayLabel(label) }]
  })

  const hasPeriod = periodLabel !== '-'
  if (!hasPeriod && !availableTimeSlots && !recurringUnavailable && options.length === 0) {
    return undefined
  }

  return {
    ...(hasPeriod ? { periodLabel } : {}),
    ...(availableTimeSlots ? { availableTimeSlots } : {}),
    ...(recurringUnavailable ? { recurringUnavailable } : {}),
    options,
  }
}

function compactBasicInfoFields(fields: ProgramBasicInfoField[]): ProgramBasicInfoField[] {
  return fields.filter(field => field.value.trim().length > 0 && field.value !== '-')
}

function formatGeminiMinStudentCountLabel(remote: PortalProgramDetail): string {
  const raw = remote.minStudentCount ?? remote.totalParticipants
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return ''
  return `${raw}명`
}

/** 기본정보 그리드 레이아웃 — TRAINED_TEACHER는 강사 모집 카드가 아닌 교육 대상형. */
function portalBasicInfoLayoutCase(
  programType: string | undefined,
  detailCase: ProgramDetailCase
): ProgramDetailCase {
  if ((programType ?? '').trim().toUpperCase() === 'TRAINED_TEACHER') return 'general'
  return detailCase
}

/** VOLUNTEER/INSTRUCTOR 포커스 — `recruitmentTarget` 우선, 없으면 `recruitmentTargets` 코드 조합. */
function resolvePortalRecruitmentTargetGroupLabel(remote: PortalProgramDetail): string {
  const explicit = readString(remote.recruitmentTarget)
  if (explicit) return explicit
  const fromCodes = mapEducationTargets({ educationTargets: remote.recruitmentTargets })
  if (fromCodes.keys.length > 0) return fromCodes.educationTargetGroupLabel
  return ''
}

function resolvePortalRecruitmentTargetDetailLabel(remote: PortalProgramDetail): string {
  const detail = readString(remote.recruitmentTargetDetail)
  if (detail && !EDUCATION_TARGET_CODE.has(detail.toLowerCase())) return detail
  return ''
}

function educationTargetBasicInfoFields(args: {
  educationTargetGroupLabel: string
  educationTargetDetailLabel: string
}): ProgramBasicInfoField[] {
  return [
    { label: '교육 대상', value: args.educationTargetGroupLabel },
    { label: '교육 대상 상세', value: args.educationTargetDetailLabel },
  ]
}

function buildPortalBasicInfoFields(args: {
  detailCase: ProgramDetailCase
  usesEducationProgressFields: boolean
  businessFieldLabel: string
  educationFormLabel: string
  educationTargetGroupLabel: string
  educationTargetDetailLabel: string
  recruitmentTargetGroupLabel: string
  recruitmentTargetDetailLabel: string
  educationVenueLabel: string
  geminiMinStudentCountLabel?: string
}): ProgramBasicInfoField[] {
  switch (args.detailCase) {
    case 'instructor':
      return compactBasicInfoFields([
        { label: '사업 분야', value: args.businessFieldLabel },
        {
          label: '모집 대상',
          value: args.recruitmentTargetGroupLabel || args.recruitmentTargetDetailLabel,
        },
        ...educationTargetBasicInfoFields(args),
        { label: '모집 지역', value: args.educationVenueLabel },
      ])
    case 'volunteer':
      return compactBasicInfoFields([
        { label: '사업 분야', value: args.businessFieldLabel },
        { label: '모집 대상', value: args.recruitmentTargetGroupLabel },
        { label: '모집 대상 상세', value: args.recruitmentTargetDetailLabel },
        ...educationTargetBasicInfoFields(args),
        ...(!args.usesEducationProgressFields || args.educationFormLabel
          ? [{ label: '교육 형태', value: args.educationFormLabel }]
          : []),
        { label: '교육 장소', value: args.educationVenueLabel },
      ])
    case 'ujat-volunteer':
      return compactBasicInfoFields([
        { label: '사업 분야', value: args.businessFieldLabel },
        {
          label: '모집 대상',
          value: args.recruitmentTargetGroupLabel || '대학(원)생',
        },
        ...educationTargetBasicInfoFields(args),
        { label: '교육 지역', value: args.educationVenueLabel },
      ])
    case 'ujat-participant':
      return compactBasicInfoFields([
        { label: '사업 분야', value: args.businessFieldLabel },
        {
          label: '대상',
          value: args.educationTargetDetailLabel || '초등학교',
        },
        { label: '교육 지역', value: args.educationVenueLabel },
        { label: '교육 형태', value: args.educationFormLabel },
      ])
    case 'gemini':
      return compactBasicInfoFields([
        { label: '교육 형태', value: args.educationFormLabel },
        { label: '교육 대상', value: args.educationTargetGroupLabel },
        { label: '교육 대상 상세', value: args.educationTargetDetailLabel },
        { label: '최소 수강 인원', value: args.geminiMinStudentCountLabel ?? '' },
        { label: '교육 장소', value: args.educationVenueLabel },
      ])
    default: {
      const fields: ProgramBasicInfoField[] = [{ label: '사업 분야', value: args.businessFieldLabel }]
      if (!args.usesEducationProgressFields || args.educationFormLabel) {
        fields.push({ label: '교육 형태', value: args.educationFormLabel })
      }
      fields.push(
        ...educationTargetBasicInfoFields(args),
        { label: '교육 장소', value: args.educationVenueLabel }
      )
      return compactBasicInfoFields(fields)
    }
  }
}

/**
 * 포털 상세는 `recruitmentId`가 있으면 행 썸네일을 응답 최상위에 둔다.
 * 행 객체에 id가 없고 키만 빠졌으면 그 최상위 값을 쓴다. 행이 null이면 비운다.
 */
function resolveFocusedThumbnailFileObjectId(
  row: PortalRecruitment | undefined,
  remoteThumbnailFileObjectId: number | null | undefined
): number | null | undefined {
  if (row == null) return remoteThumbnailFileObjectId
  if (row.thumbnailFileObjectId != null) return row.thumbnailFileObjectId
  if (row.thumbnailFileObjectId === null) return undefined
  return remoteThumbnailFileObjectId
}

function isIndependentRecruitmentProgram(programType: string | undefined): boolean {
  const type = programType?.trim().toUpperCase()
  return type === 'UJAT' || type === 'GENERAL' || (type?.startsWith('GENERAL_') ?? false)
}

export function mapPortalProgramDetail(
  remote: PortalProgramDetail,
  focus?: PortalRecruitmentFocus | null,
): ProgramDetail | null {
  const programId = remote.programId
  const title = readString(remote.title)
  if (programId == null || !title) return null

  const selected = focus ? selectRecruitmentsForFocus(remote.recruitments, focus) : null
  const hasExactRecruitmentFocus = Boolean(
    focus?.recruitmentIds?.filter(id => Number.isSafeInteger(id) && id > 0).length === 1,
  )
  if (hasExactRecruitmentFocus && (!selected || selected.ambiguous || selected.rows.length !== 1)) {
    // 신청 상세가 지정한 모집행을 확인하지 못한 경우 다른 모집행이나
    // 프로그램 최상위 값을 대표값으로 사용하지 않는다.
    return null
  }
  const recruitmentResolved = selected != null && !selected.ambiguous && selected.rows.length === 1
  const recruitmentRows = recruitmentResolved
    ? selected.rows
    : selected?.ambiguous
      ? []
      : remote.recruitments
  const focusedTab = focus?.portalTab
  const categories = focusedTab
    ? [programTabFromPortalTab(focusedTab)]
    : mapPortalTabs(remote.portalCategories, remote.programType)
  const category = focusedTab
    ? programTabFromPortalTab(focusedTab)
    : mapCategory(remote.portalCategories, remote.programType)
  const detailCase =
    recruitmentResolved && selected
      ? detailCaseForFocus(remote.programType, selected.applicationTypes)
      : selected?.ambiguous && selected.applicationTypes.length === 1
        ? detailCaseForFocus(remote.programType, selected.applicationTypes)
        : mapDetailCase(remote.programType, remote.portalCategories, remote.recruitments)
  const perScheduleEducationForm = remote.educationFormScheduleDetail === 'perSchedule'
  const educationForm = resolveEducationFormCode(remote.educationForm, remote.operationMethod)
  const programType = readString(remote.programType)?.toUpperCase()
  const targets = mapEducationTargets(remote)
  const hasEducationTargetCodes = targets.keys.length > 0
  const recruitmentTargetGroupLabel = resolvePortalRecruitmentTargetGroupLabel(remote)
  const recruitmentTargetDetailLabel = resolvePortalRecruitmentTargetDetailLabel(remote)
  const roleLabel = ROLE_LABEL[detailCase]
  const isTrainedTeacher = programType === 'TRAINED_TEACHER'
  const recruitmentOperation = recruitmentOperatingDates(
    recruitmentResolved ? recruitmentRows : remote.recruitments,
  )
  const operating = resolveOperatingRange({
    operationStart: recruitmentOperation.start,
    operationEnd: recruitmentOperation.end,
    businessStart: remote.businessStartDate,
    businessEnd: remote.businessEndDate,
  })
  const opStart = operating.start
  const opEnd = operating.end
  const primaryRecruitment = recruitmentResolved
    ? recruitmentRows?.[0]
    : selected?.ambiguous
      ? undefined
      : remote.recruitments?.[0]
  const focusedWindow = recruitmentResolved ? recruitmentWindow(selected!.rows) : null
  const appStart = focusedWindow
    ? focusedWindow.start
    : toDate(primaryRecruitment?.startAt)
  const appEnd = focusedWindow
    ? focusedWindow.end
    : toDate(primaryRecruitment?.endAt)
  const recruitmentStatus = recruitmentResolved
    ? aggregateRecruitmentStatus(selected!.rows)
    : selected?.ambiguous
      ? RECRUITMENT_STATUS.closed
      : mapRecruitmentStatus(remote.recruitmentStatus, remote.recruitments)
  const apiEducationFormLabel = perScheduleEducationForm
    ? undefined
    : optionalText(remote.educationFormLabel)
  const educationFormLabel = apiEducationFormLabel ?? EDUCATION_FORM_LABEL[educationForm]
  // 개인 일반 「교육 진행 장소」: common은 공통 주소 → venue, perSchedule은 행마다 보이므로 단일 항목을 숨긴다.
  // 새 필드가 없으면 기존 순서(venue → 첫 일정 주소 → 교육 형태)를 유지한다.
  const educationPlaceMode =
    remote.educationPlaceScheduleDetail === 'common' ||
    remote.educationPlaceScheduleDetail === 'perSchedule'
      ? remote.educationPlaceScheduleDetail
      : null
  const perScheduleEducationPlace = educationPlaceMode === 'perSchedule'
  const educationVenueLabel = perScheduleEducationPlace
    ? ''
    : optionalText(remote.educationPlaceAddress) ||
      formatPortalEducationVenue(remote.venue, remote.venueKind) ||
      venueFromSchedules(remote.schedules) ||
      (perScheduleEducationForm ? '' : educationFormLabel)
  const businessFieldLabel = readString(remote.businessField) || '-'
  const educationTargetGroupLabel = hasEducationTargetCodes ? targets.educationTargetGroupLabel : ''
  const educationTargetDetailLabel = mapEducationTargetDetailLabel(
    remote,
    hasEducationTargetCodes ? targets.educationTargetLabel : '',
    detailCase !== 'instructor' &&
      detailCase !== 'volunteer' &&
      detailCase !== 'ujat-volunteer',
  )
  const independentRow =
    recruitmentResolved && selected?.rows.length === 1 && isIndependentRecruitmentProgram(programType)
      ? selected.rows[0]
      : undefined
  const thumbnailFileObjectId = resolveFocusedThumbnailFileObjectId(
    independentRow,
    remote.thumbnailFileObjectId
  )
  const thumbnailUrl =
    thumbnailFileObjectId != null ? portalPublicFileContentUrl(thumbnailFileObjectId) : undefined
  const usesEducationProgressFields =
    hasProjectedEducationProgress(remote) || isGeneralEducationProgressProgram(programType)
  const legacySessions = mapSessions(remote.curricula)
  const legacyEventSchedules = legacySessions.length > 0 ? [] : mapEventSchedules(remote.schedules)
  const isUjatDetailCase = detailCase === 'ujat-participant' || detailCase === 'ujat-volunteer'
  const ujatRuntimeSchedules = isUjatDetailCase ? mapUjatPublicEventSchedules(remote.schedules) : []
  const rowVisibility: EducationProgressRowVisibility = {
    showEducationForm: perScheduleEducationForm || !optionalText(remote.educationFormLabel),
    showAssignmentPeriod: isTrainedTeacher,
    showEducationPlace: perScheduleEducationPlace,
  }
  const sessions = usesEducationProgressFields
    ? mapPortalCurriculumSessions(
        remote.curriculumSessions,
        remote.educationStructure,
        rowVisibility
      )
    : legacySessions
  const projectedScheduleDetails = usesEducationProgressFields
    ? mapPortalScheduleDetails(
        remote.scheduleDetails,
        remote.educationStructure,
        remote.sessionRound,
        rowVisibility
      )
    : legacyEventSchedules
  // UJAT's published schedule rows are the canonical half/pre-education/closing
  // schedule source. A projected common-info structure may be present as well,
  // but it must not hide the actual program_schedule rows returned by the portal API.
  const eventSchedules =
    isUjatDetailCase && ujatRuntimeSchedules.length > 0
      ? ujatRuntimeSchedules
      : projectedScheduleDetails.length > 0
        ? projectedScheduleDetails
        : legacyEventSchedules
  const educationStructure = usesEducationProgressFields
    ? remote.educationStructure === 'schedule'
      ? 'schedule'
      : 'curriculum'
    : sessions.length > 0
      ? 'curriculum'
      : 'schedule'
  const sessionRound = usesEducationProgressFields
    ? isMultiSessionRound(remote.sessionRound)
      ? 'multi'
      : 'single'
    : sessions.length > 1 || eventSchedules.length > 1
      ? 'multi'
      : 'single'
  const educationScheduleMode = usesEducationProgressFields
    ? remote.educationScheduleMode === 'period'
      ? 'period'
      : 'date'
    : 'period'
  const educationScheduleLines = (
    usesEducationProgressFields
      ? appendSessionSuffixToEducationScheduleLines(remote.educationScheduleLines ?? [], {
          educationStructure,
          sessionRound,
          educationScheduleMode,
          sessions,
        })
      : eventSchedules.map(item => item.dateLabel).filter(label => label !== '-')
  ).map(line => normalizeScheduleDisplayLabel(line))
  const recruitmentPeriodLabel = formatRange(appStart, appEnd)
  const geminiTrainingRequestStart = toDate(remote.trainingRequestStartDate ?? undefined)
  const geminiTrainingRequestEnd = toDate(remote.trainingRequestEndDate ?? undefined)
  const geminiTrainingRequestPeriodLabel =
    detailCase === 'gemini' && (geminiTrainingRequestStart || geminiTrainingRequestEnd)
      ? formatRange(geminiTrainingRequestStart, geminiTrainingRequestEnd)
      : ''
  const geminiMinStudentCountLabel =
    detailCase === 'gemini' ? formatGeminiMinStudentCountLabel(remote) : ''
  // 교육 형태 '일정 별 상이'(perSchedule) — 모집공고 공통 표기는 온/오프라인
  const educationFormLabelForDetail = perScheduleEducationForm
    ? EDUCATION_FORM_LABEL.hybrid
    : educationFormLabel

  const programDescription = visibleCopy(
    readString(independentRow ? independentRow.programDescription : remote.description) ?? ''
  )
  const recruitmentGuide = visibleCopy(
    readString(independentRow ? independentRow.recruitmentGuide : remote.recruitmentGuide) ?? ''
  )
  const additionalContent = visibleCopy(
    rewriteAdminFileContentSrcsForPortal(
      readString(independentRow ? independentRow.additionalContentHtml : remote.additionalContentHtml) ??
        ''
    )
  )
  const learningSupportContent = visibleCopy(
    readString(independentRow ? independentRow.learningSupportContent : remote.learningSupportContent) ??
      ''
  )
  const otherMatters = visibleCopy(readString(remote.otherMatters) ?? '')
  const remarks = visibleCopy(readString(independentRow ? independentRow.remarks : remote.remarks) ?? '')
  const preEducationNoticeRequired = readPortalPreEducationNoticeRequired(remote, independentRow)
  const extraSections: ProgramExtraSection[] = [
    extraSection('모집 안내', recruitmentGuide),
    { title: '추가 내용', body: additionalContent, bodyFormat: 'html' as const },
    ...(showsLearningSupport(detailCase)
      ? [extraSection('학습 지원 내용', learningSupportContent)]
      : []),
    ...(showsOtherMatters(detailCase) ? [extraSection('기타사항', otherMatters)] : []),
    extraSection('비고', remarks),
  ].filter(section => visibleCopy(section.body).length > 0)
  const volunteerInterviewSchedule = mapVolunteerInterviewSchedule(
    selected?.ambiguous
      ? undefined
      : recruitmentResolved
        ? recruitmentRows
        : remote.recruitments
  )

  return {
    id: String(programId),
    category,
    categories,
    categoryLabel: programTabLabels(categories),
    title: readString(independentRow?.announcementTitle) ?? title,
    operatingPeriodLabel: formatRange(opStart, opEnd),
    operatingPeriodStart: opStart ? formatYmd(opStart) : '1970-01-01',
    operatingPeriodEnd: opEnd ? formatYmd(opEnd) : '1970-01-01',
    applicationStartDate: appStart ? formatYmd(appStart) : null,
    applicationEndDate: appEnd ? formatYmd(appEnd) : null,
    recruitmentPeriodLabel,
    applicationPeriodLabel: recruitmentPeriodLabel,
    ...(geminiTrainingRequestPeriodLabel
      ? { geminiTrainingRequestPeriodLabel }
      : {}),
    ...(geminiMinStudentCountLabel ? { geminiMinStudentCountLabel } : {}),
    recruitmentStatus,
    educationTargetKey: targets.key,
    educationTargetKeys: targets.keys,
    educationTargetLabel: targets.educationTargetLabel,
    educationForm,
    educationFormLabel: educationFormLabelForDetail,
    thumbnailUrl,
    detailImageUrl: thumbnailUrl,
    sponsor: (remote.sponsorNames ?? []).map(readString).filter(Boolean).join(', ') || '-',
    summary: independentRow
      ? programDescription
      : visibleCopy(readString(remote.description) ?? readString(remote.summary) ?? ''),
    isRecruiting: recruitmentStatus === RECRUITMENT_STATUS.recruiting,
    businessFieldLabel,
    educationTargetGroupLabel,
    educationTargetDetailLabel,
    educationVenueLabel,
    detailCase,
    programType,
    educationJournalEnabled: remote.educationJournalEnabled,
    registrationKind: isTrainedTeacher ? 'trainedTeachers' : undefined,
    programAudience: resolvePortalProgramAudience(remote, focus),
    participationMethod: mapParticipationMethod(remote),
    ...(preEducationNoticeRequired !== undefined
      ? {
          preEducationNoticeRequired,
          advanceGuidanceRequired: preEducationNoticeRequired,
        }
      : {}),
    recruitmentRoleLabel: roleLabel,
    ...(selected?.ambiguous
      ? { recruitmentSelectionAmbiguous: true }
      : recruitmentResolved && selected
        ? {
            focusedRecruitmentIds: selected.recruitmentIds,
            focusedApplicationTypes: selected.applicationTypes,
            ...(selected.applicationTypes.length === 1
              ? { applicationType: selected.applicationTypes[0] }
              : {}),
          }
        : {}),
    basicInfoFields: buildPortalBasicInfoFields({
      detailCase: portalBasicInfoLayoutCase(programType, detailCase),
      usesEducationProgressFields,
      businessFieldLabel,
      educationFormLabel: perScheduleEducationForm
        ? EDUCATION_FORM_LABEL.hybrid
        : usesEducationProgressFields
          ? (apiEducationFormLabel ?? '')
          : educationFormLabel,
      educationTargetGroupLabel,
      educationTargetDetailLabel,
      recruitmentTargetGroupLabel,
      recruitmentTargetDetailLabel,
      educationVenueLabel,
      geminiMinStudentCountLabel,
    }),
    educationStructure,
    sessionRound,
    educationScheduleMode,
    educationScheduleRange: mapPortalEducationScheduleRange(remote.educationScheduleRange),
    educationScheduleLines,
    maxPreferredScheduleCount: mapPortalMaxPreferredScheduleCount(
      remote,
      isTrainedTeacher,
      usesEducationProgressFields
    ),
    sessions,
    eventSchedules,
    recruitmentPhaseGroupLabel:
      detailCase === 'gemini' ? '신청 및 연수 기간' : '모집 및 선별 기간',
    recruitmentPhases: mapRecruitmentPhases(
      selected?.ambiguous
        ? undefined
        : recruitmentResolved
          ? recruitmentRows
          : remote.recruitments,
    ).map(phase =>
      detailCase === 'gemini' && phase.label === '참여자 모집 기간'
        ? { ...phase, label: '기관 모집 기간' }
        : phase,
    ),
    educationSchedules:
      isUjatDetailCase
        ? []
        : usesEducationProgressFields
          ? mapPortalEducationScheduleCards(remote, educationScheduleLines)
          : mapEventScheduleCards(eventSchedules),
    ...(volunteerInterviewSchedule ? { volunteerInterviewSchedule } : {}),
    extraSections,
    contactValue: contactValue(
      independentRow?.contactName !== undefined ? independentRow.contactName : remote.contactName,
      independentRow?.contactPhone !== undefined ? independentRow.contactPhone : remote.contactPhone,
      independentRow?.contactEmail !== undefined ? independentRow.contactEmail : remote.contactEmail
    ),
    applicationMethodLabel: independentRow ? '지원 방법' : '지원방법',
    applicationMethodValue: visibleCopy(
      rewriteAdminFileContentSrcsForPortal(
        readString(
          independentRow
            ? (independentRow.applicationMethod ?? undefined)
            : (remote.applicationMethod ?? undefined)
        ) ?? ''
      )
    ),
    attachments: (
      (independentRow?.attachments !== undefined ? independentRow.attachments : remote.attachments) ?? []
    ).flatMap(file => {
      const fileObjectId = Number(file.fileObjectId)
      if (!Number.isFinite(fileObjectId) || fileObjectId <= 0) return []
      return [
        {
          name: readString(file.originalFileName) ?? '첨부파일',
          url: portalPublicFileDownloadUrl(fileObjectId),
        },
      ]
    }),
  }
}

export function mapPortalProgramListItem(remote: PortalProgramListItem): ProgramListItem | null {
  const programId = remote.programId
  const title = readString(remote.title)
  if (programId == null || !title) return null

  const categories = mapPortalTabs(remote.portalCategories, remote.programType)
  const category = mapCategory(remote.portalCategories, remote.programType)
  const educationForm = resolveEducationFormCode(remote.educationForm, remote.operationMethod)
  const targets = mapEducationTargets(remote)
  const operating = resolveOperatingRange({
    operationStart: remote.operationStartDate,
    operationEnd: remote.operationEndDate,
    businessStart: remote.businessStartDate,
    businessEnd: remote.businessEndDate,
  })
  const opStart = operating.start
  const opEnd = operating.end
  const appStart = toDate(remote.recruitmentStartAt)
  const appEnd = toDate(remote.recruitmentEndAt)
  const recruitmentStatus = mapRecruitmentStatus(remote.recruitmentStatus, undefined)

  return {
    id: String(programId),
    programType: readString(remote.programType)?.toUpperCase() ?? '',
    category,
    categories,
    categoryLabel: programTabLabels(categories),
    title,
    operatingPeriodLabel: formatRange(opStart, opEnd),
    operatingPeriodStart: opStart ? formatYmd(opStart) : '1970-01-01',
    operatingPeriodEnd: opEnd ? formatYmd(opEnd) : '1970-01-01',
    applicationStartDate: appStart ? formatYmd(appStart) : null,
    applicationEndDate: appEnd ? formatYmd(appEnd) : null,
    recruitmentPeriodLabel: formatRange(appStart, appEnd),
    recruitmentStatus,
    educationTargetKey: targets.key,
    educationTargetKeys: targets.keys,
    educationTargetLabel:
      targets.key != null ? targets.educationTargetLabel : PROGRAM_TAB_LABEL[category],
    educationForm,
    educationFormLabel: EDUCATION_FORM_LABEL[educationForm],
    applicationTypes: (remote.availableApplicationTypes ?? [])
      .map(item => item.trim().toUpperCase())
      .filter(item =>
        isUjatProgramType(remote.programType) ? item !== 'INSTRUCTOR' : Boolean(item),
      ),
    ...(remote.recruitmentId != null &&
    Number.isSafeInteger(remote.recruitmentId) &&
    remote.recruitmentId > 0
      ? { recruitmentId: remote.recruitmentId }
      : {}),
    ...(readString(remote.recruitmentType)
      ? { recruitmentType: readString(remote.recruitmentType)!.toUpperCase() }
      : {}),
    ...(readString(remote.targetType)
      ? { targetType: readString(remote.targetType)!.toUpperCase() }
      : {}),
    ...(readString(remote.applicationType) &&
    !(
      isUjatProgramType(remote.programType) &&
      readString(remote.applicationType)!.toUpperCase() === 'INSTRUCTOR'
    )
      ? { applicationType: readString(remote.applicationType)!.toUpperCase() }
      : {}),
    thumbnailUrl:
      remote.thumbnailFileObjectId != null
        ? portalPublicFileContentUrl(remote.thumbnailFileObjectId)
        : undefined,
  }
}
