import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import type {
  EducationForm,
  EducationTargetKey,
  ProgramBasicInfoField,
  ProgramDetail,
  ProgramDetailCase,
  ProgramEventSchedule,
  ProgramLabeledValue,
  ProgramListItem,
  ProgramSession,
} from '../model/types'
import type {
  PortalCurriculum,
  PortalEducationCurriculumSession,
  PortalEducationScheduleDetail,
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

/** Portal 복수 `educationTargets` 우선. 없을 때만 단수 `educationTarget`. */
function mapEducationTargets(remote: {
  educationTarget?: string
  educationTargets?: string[]
}): {
  key: EducationTargetKey | null
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
  const keys = [...new Set(source)].filter(
    (key): key is EducationTargetKey => key in TARGET_LABELS
  )
  if (keys.length === 0) {
    return mapEducationTarget(remote.educationTarget)
  }
  if (keys.length === 1) {
    return mapEducationTarget(keys[0])
  }
  const joined = keys.map(key => CMS_TARGET_LEVEL_LABEL[key]).join(', ')
  return {
    key: keys[0] ?? null,
    educationTargetLabel: joined,
    educationTargetGroupLabel: joined,
  }
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

const SCHEDULE_KIND_LABEL: Record<string, string> = {
  PRE_EDUCATION: '사전교육',
  EDUCATION: '교육',
  CLOSING: '수료·폐회',
  SESSION: '회차',
}

const TERM_LABEL: Record<string, string> = {
  FIRST_HALF: '전반',
  SECOND_HALF: '후반',
}

function visibleSchedules(schedules: PortalSchedule[] | undefined): PortalSchedule[] {
  return (schedules ?? []).filter(row => row.publiclyVisible !== false)
}

function scheduleTitle(schedule: PortalSchedule, index: number): string {
  const kind = readString(schedule.scheduleKind)?.toUpperCase()
  const kindLabel = kind ? SCHEDULE_KIND_LABEL[kind] : undefined
  const term = readString(schedule.term)?.toUpperCase()
  const termLabel = term ? TERM_LABEL[term] : undefined
  const name = readString(schedule.scheduleName)
  const parts = [kindLabel, termLabel, name].filter((value): value is string => Boolean(value))
  return parts.join(' ') || `교육 일정 ${index + 1}`
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
  return visibleSchedules(schedules).map((schedule, index) => ({
    scheduleLabel: `일정 ${schedule.sessionNo ?? index + 1}`,
    name: scheduleTitle(schedule, index),
    dateLabel: formatRange(toDate(schedule.startAt), toDate(schedule.endAt)),
  }))
}

function venueFromSchedules(schedules: PortalSchedule[] | undefined): string {
  const first = visibleSchedules(schedules).find(
    row => readString(row.locationName) || readString(row.address),
  )
  if (!first) return ''
  const parts = [first.locationName, first.address, first.addressDetail]
    .map(readString)
    .filter((value): value is string => Boolean(value))
  return parts.join(' ')
}

function mapRecruitmentPhases(recruitments: PortalRecruitment[] | undefined) {
  return (recruitments ?? []).flatMap(row => {
    const phases = [
      {
        label: recruitmentTypeLabel(row.recruitmentType),
        value: formatCompactRange(toDate(row.startAt), toDate(row.endAt)),
      },
    ]
    const interviewOff = row.interviewEnabled === false
    const hasInterviewDates = Boolean(
      readString(row.documentPassAnnouncementAt ?? undefined) ||
        readString(row.interviewStartAt ?? undefined) ||
        readString(row.interviewEndAt ?? undefined),
    )
    if (!interviewOff && (row.interviewEnabled === true || hasInterviewDates)) {
      const documentAt = toDate(row.documentPassAnnouncementAt ?? undefined)
      if (documentAt) {
        phases.push({ label: '1차 서류 합격자 발표', value: formatYmdCompact(documentAt) })
      }
      const interviewStart = toDate(row.interviewStartAt ?? undefined)
      const interviewEnd = toDate(row.interviewEndAt ?? undefined)
      if (interviewStart || interviewEnd) {
        phases.push({
          label: '2차 면접 기간',
          value: formatCompactRange(interviewStart, interviewEnd),
        })
      }
    }
    const finalAt = toDate(row.finalPassAnnouncementAt ?? undefined)
    if (finalAt) {
      phases.push({ label: '최종 합격자 발표', value: formatYmdCompact(finalAt) })
    }
    return phases
  })
}

function contactValue(phone?: string, email?: string): string {
  const p = readString(phone)
  const e = readString(email)
  if (p && e) return `${p} · ${e}`
  return p || e || ''
}

function isGeneralEducationProgressProgram(programType: string | undefined): boolean {
  const type = (programType ?? '').trim().toUpperCase()
  return type === 'GENERAL_INDIVIDUAL' || type === 'GENERAL_ORGANIZATION'
}

function educationFormFromDisplayLabel(label: string): EducationForm | null {
  switch (label.trim()) {
    case '온라인':
      return 'online'
    case '오프라인':
      return 'offline'
    case '온/오프라인':
    case '온·오프라인':
      return 'hybrid'
    case '참여자 선택':
      return 'participant_choice'
    default:
      return null
  }
}

function optionalText(value: string | null | undefined): string | undefined {
  const text = value?.trim()
  return text ? text : undefined
}

function mapPortalCurriculumSessions(
  sessions: PortalEducationCurriculumSession[] | undefined,
  structure: PortalProgramDetail['educationStructure'],
): ProgramSession[] {
  if (structure !== 'curriculum') return []
  return (sessions ?? []).map(session => ({
    sessionLabel: session.sessionLabel ?? '',
    title: session.title ?? '',
    description: session.description ?? '',
    ...(optionalText(session.scheduleDateLabel)
      ? { dateLabel: session.scheduleDateLabel?.trim() }
      : {}),
    ...(optionalText(session.educationFormLabel)
      ? { educationFormLabel: session.educationFormLabel?.trim() }
      : {}),
    ...(optionalText(session.participationMethodLabel)
      ? { participationMethodLabel: session.participationMethodLabel?.trim() }
      : {}),
    ...(optionalText(session.ipsTypeSummary)
      ? { ipsTypeSummary: session.ipsTypeSummary?.trim() }
      : {}),
    ...(optionalText(session.assignmentPeriod)
      ? { assignmentPeriod: session.assignmentPeriod?.trim() }
      : {}),
  }))
}

function formatGroupTimes(
  times: PortalEducationScheduleDetail['groupTimes'],
): string | undefined {
  const labels = (times ?? [])
    .map(slot => {
      const start = slot.startTime?.trim() ?? ''
      const end = slot.endTime?.trim() ?? ''
      if (start && end) return `${start} ~ ${end}`
      return start || end
    })
    .filter(label => label.length > 0)
  return labels.length > 0 ? labels.join(', ') : undefined
}

function mapPortalScheduleDetails(
  details: PortalEducationScheduleDetail[] | undefined,
  structure: PortalProgramDetail['educationStructure'],
): ProgramEventSchedule[] {
  if (structure !== 'schedule') return []
  return (details ?? []).map(detail => {
    const timeSummary = optionalText(detail.progressTimeSummary) ?? formatGroupTimes(detail.groupTimes)
    const dateLabel = [optionalText(detail.scheduleDateLabel), timeSummary]
      .filter((part): part is string => Boolean(part))
      .join(' · ')
    return {
      scheduleLabel: detail.scheduleLabel ?? '',
      name: detail.name ?? '',
      dateLabel,
      ...(detail.blockKind ? { blockKind: detail.blockKind } : {}),
      ...(optionalText(detail.educationFormLabel)
        ? { educationFormLabel: detail.educationFormLabel?.trim() }
        : {}),
      ...(optionalText(detail.participationMethodLabel)
        ? { participationMethodLabel: detail.participationMethodLabel?.trim() }
        : {}),
      ...(optionalText(detail.ipsTypeSummary)
        ? { ipsTypeSummary: detail.ipsTypeSummary?.trim() }
        : {}),
      ...(optionalText(detail.assignmentPeriod)
        ? { assignmentPeriod: detail.assignmentPeriod?.trim() }
        : {}),
    }
  })
}

/** 세부내용 「교육 일정 N」. 일정형 복수 회차는 배열이 있어도 카드를 숨긴다. */
function mapPortalEducationScheduleCards(remote: PortalProgramDetail): ProgramLabeledValue[] {
  if (remote.educationStructure === 'schedule' && remote.sessionRound === 'multi') return []
  return (remote.educationScheduleLines ?? []).map((line, index) => ({
    label: `교육 일정 ${index + 1}`,
    value: line,
  }))
}

const PARTICIPATION_METHOD_LABEL = {
  individual: '개인',
  team: '팀',
} as const

function buildPortalBasicInfoFields(args: {
  usesEducationProgressFields: boolean
  businessFieldLabel: string
  roleLabel: string
  educationFormLabel: string
  participationMethodLabel: string
  ipsTypeSummary: string
  educationTargetGroupLabel: string
  educationTargetDetailLabel: string
  educationVenueLabel: string
}): ProgramBasicInfoField[] {
  const fields: ProgramBasicInfoField[] = [
    { label: '사업 분야', value: args.businessFieldLabel },
    { label: '모집 구분', value: args.roleLabel },
  ]
  if (!args.usesEducationProgressFields || args.educationFormLabel) {
    fields.push({ label: '교육 형태', value: args.educationFormLabel })
  }
  if (args.participationMethodLabel) {
    fields.push({ label: '참여 방식', value: args.participationMethodLabel })
  }
  if (args.ipsTypeSummary) {
    fields.push({ label: 'IPS 유형', value: args.ipsTypeSummary })
  }
  fields.push(
    { label: '교육 대상', value: args.educationTargetGroupLabel },
    { label: '교육 대상 상세', value: args.educationTargetDetailLabel },
    { label: '교육 장소', value: args.educationVenueLabel },
  )
  return fields.filter(field => field.value.trim().length > 0 && field.value !== '-')
}

export function mapPortalProgramDetail(remote: PortalProgramDetail): ProgramDetail | null {
  const programId = remote.programId
  const title = readString(remote.title)
  if (programId == null || !title) return null

  const category = mapCategory(remote.portalCategories, remote.programType)
  const detailCase = mapDetailCase(remote.programType, remote.portalCategories, remote.recruitments)
  const educationForm = mapEducationForm(remote.operationMethod)
  const targets = mapEducationTargets(remote)
  const roleLabel = ROLE_LABEL[detailCase]
  const programType = readString(remote.programType)?.toUpperCase()
  const isTrainedTeacher = programType === 'TRAINED_TEACHER'
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
  const usesEducationProgressFields = isGeneralEducationProgressProgram(programType)
  const legacySessions = mapSessions(remote.curricula)
  const legacyEventSchedules =
    legacySessions.length > 0 ? [] : mapEventSchedules(remote.schedules)
  const sessions = usesEducationProgressFields
    ? mapPortalCurriculumSessions(remote.curriculumSessions, remote.educationStructure)
    : legacySessions
  const eventSchedules = usesEducationProgressFields
    ? mapPortalScheduleDetails(remote.scheduleDetails, remote.educationStructure)
    : legacyEventSchedules
  const recruitmentPeriodLabel = formatCompactRange(appStart, appEnd)
  const apiEducationFormLabel = optionalText(remote.educationFormLabel)
  const educationFormForDetail =
    usesEducationProgressFields && apiEducationFormLabel
      ? (educationFormFromDisplayLabel(apiEducationFormLabel) ?? educationForm)
      : educationForm
  const educationFormLabelForDetail =
    usesEducationProgressFields && apiEducationFormLabel
      ? apiEducationFormLabel
      : EDUCATION_FORM_LABEL[educationForm]
  const participationMethod =
    usesEducationProgressFields && remote.participationMethod === 'team' ? 'team' : 'individual'
  const ipsTypeSummary = usesEducationProgressFields
    ? optionalText(remote.ipsTypeSummary)
    : undefined

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
    educationForm: educationFormForDetail,
    educationFormLabel: educationFormLabelForDetail,
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
    programType,
    registrationKind: isTrainedTeacher ? 'trainedTeachers' : undefined,
    programAudience: remote.applicationTargetMode?.toUpperCase() === 'INDIVIDUAL' ? 'individual' : 'organization',
    participationMethod,
    recruitmentRoleLabel: roleLabel,
    basicInfoFields: buildPortalBasicInfoFields({
      usesEducationProgressFields,
      businessFieldLabel,
      roleLabel,
      educationFormLabel: usesEducationProgressFields
        ? (apiEducationFormLabel ?? '')
        : educationFormLabel,
      participationMethodLabel:
        usesEducationProgressFields && remote.participationMethod
          ? PARTICIPATION_METHOD_LABEL[remote.participationMethod]
          : '',
      ipsTypeSummary: ipsTypeSummary ?? '',
      educationTargetGroupLabel: targets.educationTargetGroupLabel,
      educationTargetDetailLabel,
      educationVenueLabel,
    }),
    educationStructure: usesEducationProgressFields
      ? remote.educationStructure === 'schedule'
        ? 'schedule'
        : 'curriculum'
      : sessions.length > 0
        ? 'curriculum'
        : 'schedule',
    sessionRound: usesEducationProgressFields
      ? remote.sessionRound === 'multi'
        ? 'multi'
        : 'single'
      : sessions.length > 1 || eventSchedules.length > 1
        ? 'multi'
        : 'single',
    educationScheduleMode: usesEducationProgressFields
      ? remote.educationScheduleMode === 'period'
        ? 'period'
        : 'date'
      : 'period',
    educationScheduleLines: usesEducationProgressFields
      ? [...(remote.educationScheduleLines ?? [])]
      : eventSchedules.map(item => item.dateLabel).filter(label => label !== '-'),
    maxPreferredScheduleCount: isTrainedTeacher ? 2 : 1,
    sessions,
    eventSchedules,
    recruitmentPhaseGroupLabel: '모집 일정',
    recruitmentPhases: mapRecruitmentPhases(remote.recruitments),
    educationSchedules: usesEducationProgressFields
      ? mapPortalEducationScheduleCards(remote)
      : eventSchedules.map((item, index) => ({
          label: `교육 일정 ${index + 1}`,
          value: `${item.name} · ${item.dateLabel}`,
        })),
    extraSections,
    contactValue: contactValue(remote.contactPhone, remote.contactEmail),
    applicationMethodLabel: '지원방법',
    applicationMethodValue: readString(remote.applicationMethod ?? undefined) ?? '',
    attachments: (remote.attachments ?? []).flatMap(file => {
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

  const category = mapCategory(remote.portalCategories, remote.programType)
  const educationForm = mapEducationForm(remote.operationMethod)
  const targets = mapEducationTargets(remote)
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
