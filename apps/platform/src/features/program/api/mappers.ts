import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import type {
  EducationForm,
  EducationTargetKey,
  ProgramDetail,
  ProgramDetailCase,
  ProgramListItem,
} from '../model/types'
import type {
  PortalCurriculum,
  PortalProgramDetail,
  PortalProgramListItem,
  PortalRecruitment,
  PortalSchedule,
} from './types'

const RECRUITMENT_STATUS = {
  scheduled: 'scheduled',
  recruiting: 'recruiting',
  closed: 'closed',
} as const satisfies Record<string, RecruitmentStatus>

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

const CATEGORY_LABEL = {
  youth: '청소년 · 청년',
  institution: '기관',
  instructor: '강사',
} as const

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

function formatDateLabel(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const w = WEEKDAY_KO[date.getDay()]
  return `${y}.${m}.${d}(${w})`
}

function formatYmdCompact(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

function formatRange(start: Date | null, end: Date | null): string {
  if (!start && !end) return '-'
  if (start && end) return `${formatDateLabel(start)} – ${formatDateLabel(end)}`
  if (start) return formatDateLabel(start)
  return end ? formatDateLabel(end) : '-'
}

function formatCompactRange(start: Date | null, end: Date | null): string {
  if (!start && !end) return '-'
  if (start && !end) return formatYmdCompact(start)
  if (!start && end) return formatYmdCompact(end)
  if (!start || !end) return '-'
  return `${formatYmdCompact(start)} – ${formatYmdCompact(end)}`
}

function stripHtmlToText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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

function mapEducationTarget(value: string | undefined): {
  key: EducationTargetKey | null
  educationTargetLabel: string
  educationTargetGroupLabel: string
} {
  const key = (value ?? '').trim().toLowerCase()
  if (key in TARGET_LABELS) {
    const labels = TARGET_LABELS[key as EducationTargetKey]
    return { key: key as EducationTargetKey, ...labels }
  }
  return { key: null, educationTargetLabel: '전체', educationTargetGroupLabel: '전체' }
}

function mapCategory(categories: string[] | undefined, programType: string | undefined) {
  const codes = (categories ?? []).map(item => item.trim().toUpperCase())
  if (codes.includes('INSTRUCTOR')) return 'instructor' as const
  if (codes.includes('ORGANIZATION')) return 'institution' as const
  if (codes.includes('YOUTH_YOUNG')) return 'youth' as const
  switch ((programType ?? '').trim().toUpperCase()) {
    case 'TRAINED_TEACHER':
      return 'instructor' as const
    case 'GENERAL_ORGANIZATION':
    case 'GEMINI':
    case 'COMPANY_SCHOOL':
    case 'ECONOMY':
      return 'institution' as const
    default:
      return 'youth' as const
  }
}

function mapDetailCase(
  programType: string | undefined,
  categories: string[] | undefined,
  recruitments: PortalRecruitment[] | undefined,
): ProgramDetailCase {
  const type = (programType ?? '').trim().toUpperCase()
  const codes = (categories ?? []).map(item => item.trim().toUpperCase())
  if (type === 'TRAINED_TEACHER' || codes.includes('INSTRUCTOR')) return 'instructor'
  if (type === 'GEMINI' || type === 'VISITING_TRAINING') return 'gemini'
  if (type === 'UJAT') {
    const volunteer = (recruitments ?? []).some(
      row => (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER',
    )
    return volunteer ? 'ujat-volunteer' : 'ujat-participant'
  }
  const volunteer = (recruitments ?? []).some(
    row => (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER',
  )
  if (volunteer) return 'volunteer'
  const instructor = (recruitments ?? []).some(
    row => (row.recruitmentType ?? '').toUpperCase() === 'INSTRUCTOR',
  )
  if (instructor) return 'instructor'
  return 'general'
}

function mapRecruitmentStatus(
  periodStatus: string | undefined,
  recruitmentStatus: string | undefined,
  recruitments: PortalRecruitment[] | undefined,
): RecruitmentStatus {
  if ((recruitments ?? []).some(row => row.open === true)) return RECRUITMENT_STATUS.recruiting
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
      return RECRUITMENT_STATUS.closed
    default:
      break
  }
  switch ((periodStatus ?? '').trim().toUpperCase()) {
    case 'SCHEDULED':
    case 'PLANNED':
      return RECRUITMENT_STATUS.scheduled
    case 'RECRUITING':
      return RECRUITMENT_STATUS.recruiting
    case 'COMPLETED':
    case 'CLOSED':
      return RECRUITMENT_STATUS.closed
    default:
      break
  }
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
      return '강사 모집'
    case 'VOLUNTEER':
      return '봉사자 모집'
    default:
      return '참여자 모집'
  }
}

function mapSessions(curricula: PortalCurriculum[] | undefined) {
  return (curricula ?? []).flatMap(curriculum =>
    (curriculum.sessions ?? []).map((session, index) => ({
      sessionLabel: `${session.sessionNo ?? index + 1}회차`,
      title: readString(session.title) ?? readString(curriculum.title) ?? '교육 회차',
      description: readString(session.content) ?? '',
    })),
  )
}

function mapEventSchedules(schedules: PortalSchedule[] | undefined) {
  return (schedules ?? []).map((schedule, index) => ({
    scheduleLabel: `일정 ${schedule.sessionNo ?? index + 1}`,
    name: readString(schedule.scheduleName) ?? `교육 일정 ${schedule.sessionNo ?? index + 1}`,
    dateLabel: formatRange(toDate(schedule.startAt), toDate(schedule.endAt)),
  }))
}

function venueFromSchedules(schedules: PortalSchedule[] | undefined): string {
  const first = (schedules ?? []).find(
    row => readString(row.locationName) || readString(row.address),
  )
  if (!first) return ''
  const parts = [first.locationName, first.address, first.addressDetail]
    .map(readString)
    .filter((value): value is string => Boolean(value))
  return parts.join(' ')
}

function contactValue(phone?: string, email?: string): string {
  const p = readString(phone)
  const e = readString(email)
  if (p && e) return `${p} · ${e}`
  return p || e || ''
}

export function mapPortalProgramDetail(remote: PortalProgramDetail): ProgramDetail | null {
  const programId = remote.programId
  const title = readString(remote.title)
  if (programId == null || !title) return null

  const category = mapCategory(remote.portalCategories, remote.programType)
  const detailCase = mapDetailCase(remote.programType, remote.portalCategories, remote.recruitments)
  const educationForm = mapEducationForm(remote.operationMethod)
  const targets = mapEducationTarget(remote.educationTarget)
  const roleLabel = ROLE_LABEL[detailCase]
  const opStart = toDate(remote.businessStartDate)
  const opEnd = toDate(remote.businessEndDate)
  const primaryRecruitment = remote.recruitments?.[0]
  const appStart = toDate(primaryRecruitment?.startAt)
  const appEnd = toDate(primaryRecruitment?.endAt)
  const recruitmentStatus = mapRecruitmentStatus(
    remote.periodStatus,
    remote.recruitmentStatus,
    remote.recruitments,
  )
  const educationFormLabel = EDUCATION_FORM_LABEL[educationForm]
  const educationVenueLabel =
    readString(remote.venue) || venueFromSchedules(remote.schedules) || educationFormLabel
  const businessFieldLabel = readString(remote.businessField) || '-'
  const educationTargetDetailLabel =
    readString(remote.educationTargetDetail) ||
    readString(remote.recruitmentTargetDetail) ||
    targets.educationTargetLabel
  const thumbnailUrl =
    remote.thumbnailFileObjectId != null
      ? portalPublicFileContentUrl(remote.thumbnailFileObjectId)
      : undefined
  const sessions = mapSessions(remote.curricula)
  const eventSchedules = sessions.length > 0 ? [] : mapEventSchedules(remote.schedules)
  const recruitmentPeriodLabel = formatCompactRange(appStart, appEnd)

  const extraSections = [
    { title: '추가 내용', body: stripHtmlToText(readString(remote.additionalContentHtml) ?? '') },
    { title: '모집 안내', body: readString(remote.recruitmentGuide) ?? '' },
    { title: '학습 지원 내용', body: readString(remote.learningSupportContent) ?? '' },
    { title: '기타사항', body: readString(remote.otherMatters) ?? '' },
    { title: '비고', body: readString(remote.remarks) ?? '' },
  ].filter(section => section.body.length > 0)

  return {
    id: String(programId),
    category,
    categoryLabel: CATEGORY_LABEL[category],
    title,
    operatingPeriodLabel: formatRange(opStart, opEnd),
    operatingPeriodStart: opStart ? formatYmd(opStart) : '1970-01-01',
    operatingPeriodEnd: opEnd ? formatYmd(opEnd) : '1970-01-01',
    applicationStartDate: appStart ? formatYmd(appStart) : null,
    applicationEndDate: appEnd ? formatYmd(appEnd) : null,
    recruitmentPeriodLabel,
    applicationPeriodLabel: recruitmentPeriodLabel,
    recruitmentStatus,
    educationTargetKey: targets.key,
    educationTargetLabel: targets.educationTargetLabel,
    educationForm,
    educationFormLabel,
    thumbnailUrl,
    detailImageUrl: thumbnailUrl,
    sponsor: (remote.sponsorNames ?? []).map(readString).filter(Boolean).join(', ') || '-',
    summary: readString(remote.summary) ?? readString(remote.description) ?? '',
    isRecruiting: recruitmentStatus === RECRUITMENT_STATUS.recruiting,
    businessFieldLabel,
    educationTargetGroupLabel: targets.educationTargetGroupLabel,
    educationTargetDetailLabel,
    educationVenueLabel,
    detailCase,
    programAudience: remote.applicationTargetMode?.toUpperCase() === 'INDIVIDUAL' ? 'individual' : 'organization',
    participationMethod: 'individual',
    recruitmentRoleLabel: roleLabel,
    basicInfoFields: [
      { label: '사업 분야', value: businessFieldLabel },
      { label: '모집 구분', value: roleLabel },
      { label: '교육 형태', value: educationFormLabel },
      { label: '교육 대상', value: targets.educationTargetGroupLabel },
      { label: '교육 대상 상세', value: educationTargetDetailLabel },
      { label: '교육 장소', value: educationVenueLabel },
    ].filter(field => field.value.trim().length > 0 && field.value !== '-'),
    educationStructure: sessions.length > 0 ? 'curriculum' : 'schedule',
    sessionRound: sessions.length > 1 || eventSchedules.length > 1 ? 'multi' : 'single',
    educationScheduleMode: 'period',
    educationScheduleLines: eventSchedules.map(item => item.dateLabel).filter(label => label !== '-'),
    maxPreferredScheduleCount: 1,
    sessions,
    eventSchedules,
    recruitmentPhaseGroupLabel: '모집 일정',
    recruitmentPhases: (remote.recruitments ?? []).map(row => ({
      label: recruitmentTypeLabel(row.recruitmentType),
      value: formatCompactRange(toDate(row.startAt), toDate(row.endAt)),
    })),
    educationSchedules: eventSchedules.map((item, index) => ({
      label: `교육 일정 ${index + 1}`,
      value: `${item.name} · ${item.dateLabel}`,
    })),
    extraSections,
    contactValue: contactValue(remote.contactPhone, remote.contactEmail),
    applicationMethodLabel: '지원방법',
    applicationMethodValue: '',
    attachments: (remote.attachments ?? []).flatMap(file => {
      if (file.fileObjectId == null) return []
      return [
        {
          name: readString(file.originalFileName) ?? '첨부파일',
          url: portalPublicFileDownloadUrl(file.fileObjectId),
        },
      ]
    }),
  }
}

export function mapPortalProgramListItem(remote: PortalProgramListItem): ProgramListItem | null {
  const programId = remote.programId
  const title = readString(remote.title)
  if (programId == null || !title) return null

  const category = mapCategory(remote.portalCategories, remote.programType)
  const educationForm = mapEducationForm(remote.operationMethod)
  const targets = mapEducationTarget(remote.educationTarget)
  const opStart = toDate(remote.businessStartDate)
  const opEnd = toDate(remote.businessEndDate)
  const appStart = toDate(remote.recruitmentStartAt)
  const appEnd = toDate(remote.recruitmentEndAt)
  const recruitmentStatus = mapRecruitmentStatus(
    undefined,
    remote.recruitmentStatus,
    undefined,
  )

  return {
    id: String(programId),
    category,
    categoryLabel: CATEGORY_LABEL[category],
    title,
    operatingPeriodLabel: formatRange(opStart, opEnd),
    operatingPeriodStart: opStart ? formatYmd(opStart) : '1970-01-01',
    operatingPeriodEnd: opEnd ? formatYmd(opEnd) : '1970-01-01',
    applicationStartDate: appStart ? formatYmd(appStart) : null,
    applicationEndDate: appEnd ? formatYmd(appEnd) : null,
    recruitmentPeriodLabel: formatCompactRange(appStart, appEnd),
    recruitmentStatus,
    educationTargetKey: targets.key,
    educationTargetLabel:
      targets.key != null ? targets.educationTargetLabel : CATEGORY_LABEL[category],
    educationForm,
    educationFormLabel: EDUCATION_FORM_LABEL[educationForm],
    thumbnailUrl:
      remote.thumbnailFileObjectId != null
        ? portalPublicFileContentUrl(remote.thumbnailFileObjectId)
        : undefined,
  }
}
