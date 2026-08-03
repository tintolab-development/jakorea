/**
 * CMS Program-like → Platform ProgramListItem / ProgramDetail 매퍼.
 * 4유형 fixture(일반·1사1교·교육받은 교사·Gemini)와 홈 목록을 연결한다.
 */

import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import type {
  EducationForm,
  EducationTargetKey,
  ProgramAttachment,
  ProgramBasicInfoField,
  ProgramDetail,
  ProgramDetailCase,
  ProgramEducationStructure,
  ProgramEventSchedule,
  ProgramExtraSection,
  ProgramLabeledValue,
  ProgramListItem,
  ProgramSession,
} from '../model/types'
import type {
  CmsEducationStructure,
  CmsLifecycleStatus,
  CmsParticipantType,
  CmsProgramDeliveryType,
  CmsProgramLike,
  CmsTargetLevel,
} from '../model/cms-program.types'
import {
  recruitmentPeriodPhaseLabel,
  recruitmentPhaseGroupLabel,
  recruitmentRoleLabelForCase,
  resolveProgramDetailCase,
  shouldIncludeInterviewStages,
} from './detail-case.ts'

/** domain RECRUITMENT_STATUS 값과 동일 (value import 없이 런타임 selfcheck 가능) */
const RECRUITMENT_STATUS = {
  scheduled: 'scheduled',
  recruiting: 'recruiting',
  closed: 'closed',
} as const satisfies Record<string, RecruitmentStatus>

const EDUCATION_FORM_LABEL_MAP: Record<EducationForm, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '온/오프라인',
  participant_choice: '참여자 선택',
}

/** @jakorea/domain education-target 라벨과 동일 (런타임 package dist 의존 제거) */
const TARGET_LEVEL_LABELS: Record<
  CmsTargetLevel,
  { educationTargetLabel: string; educationTargetGroupLabel: string }
> = {
  elementary: { educationTargetLabel: '초등학생', educationTargetGroupLabel: '초등학교' },
  middle: { educationTargetLabel: '중학생', educationTargetGroupLabel: '중학교' },
  high: { educationTargetLabel: '고등학생', educationTargetGroupLabel: '고등학교' },
  university: { educationTargetLabel: '대학(원)생', educationTargetGroupLabel: '대학' },
  adult: { educationTargetLabel: '성인', educationTargetGroupLabel: '성인' },
}

const CATEGORY_LABEL: Record<ProgramListItem['category'], string> = {
  youth: '청소년 · 청년',
  institution: '기관',
  instructor: '강사',
}

const SCHEDULED_LIFECYCLES = new Set<CmsLifecycleStatus>([
  'planned',
  'instructor_recruitment_planned',
  'volunteer_recruitment_planned',
  'participant_instructor_recruitment_planned',
])

const RECRUITING_LIFECYCLES = new Set<CmsLifecycleStatus>([
  'recruiting_students',
  'recruiting_instructors',
  'recruiting_volunteers',
  'participant_instructor_recruiting',
])

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

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

/** 2026.04.03(금) 형태 */
function formatDateLabel(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const w = WEEKDAY_KO[date.getDay()]
  return `${y}.${m}.${d}(${w})`
}

/** 모집 기간 라벨 — 항상 YYYY.MM.DD – YYYY.MM.DD (동일 연도라도 종료 연도 생략 안 함 → 목록 우측 너비 고정) */
function formatRecruitmentRangeLabel(start: Date | null, end: Date | null): string {
  if (!start && !end) return '-'
  if (start && !end) return formatYmdCompact(start)
  if (!start && end) return formatYmdCompact(end)
  if (!start || !end) return '-'
  return `${formatYmdCompact(start)} – ${formatYmdCompact(end)}`
}

function formatYmdCompact(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

function formatOperatingPeriodLabel(start: Date | null, end: Date | null): string {
  if (!start && !end) return '-'
  if (start && end) return `${formatDateLabel(start)} – ${formatDateLabel(end)}`
  if (start) return formatDateLabel(start)
  return end ? formatDateLabel(end) : '-'
}

/**
 * 참여자 / 출처 유형 → Platform 카테고리.
 *
 * CMS 프로그램 종류 → 탭 매핑 (의도):
 * - 일반: audience 대분류 (기관·개인)
 * - 1사1교(economy): 기관 (학교·기관 모집)
 * - 교육받은 교사: 강사 (교사 연수·직무)
 * - Gemini 찾아가는 연수: 기관 (학교 대상 연수 공고)
 * - fallback: participantTypes → CMS category
 */
export function resolvePlatformCategory(
  program: Pick<
    CmsProgramLike,
    | 'generalParticipantTypes'
    | 'generalProgramAudience'
    | 'category'
    | 'registrationKind'
    | 'ujatProgressStatus'
    | 'lifecycleStatus'
  > &
    Partial<Pick<CmsProgramLike, 'id'>>
): ProgramListItem['category'] {
  if (program.registrationKind === 'trainedTeachers') return 'instructor'
  if (program.registrationKind === 'gemini') return 'institution'
  if (program.registrationKind === 'economy') return 'institution'

  if (program.registrationKind === 'ujat') {
    // UJAT 봉사 모집 → 청소년·청년 탭 / 기관(학교) 모집 → 기관 탭
    if (program.ujatProgressStatus === 'VOLUNTEER_RECRUITING') return 'youth'
    return 'institution'
  }

  const detailCase = resolveProgramDetailCase({
    id: program.id ?? '',
    registrationKind: program.registrationKind,
    lifecycleStatus: program.lifecycleStatus,
    generalParticipantTypes: program.generalParticipantTypes,
    ujatProgressStatus: program.ujatProgressStatus,
  })
  if (detailCase === 'instructor') return 'instructor'
  if (detailCase === 'volunteer') return 'youth'
  if (detailCase === 'ujat-volunteer') return 'youth'
  if (detailCase === 'ujat-participant' || detailCase === 'gemini') return 'institution'

  if (program.generalProgramAudience === 'organization') return 'institution'
  if (program.generalProgramAudience === 'individual') return 'youth'

  const types = program.generalParticipantTypes ?? []
  const typeSet = new Set<CmsParticipantType>(types)

  if (typeSet.has('teacher_instructor')) return 'instructor'
  if (typeSet.has('school_institution')) return 'institution'
  if (typeSet.has('individual') || typeSet.has('volunteer')) return 'youth'

  const cmsCategory = program.category
  if (cmsCategory === 'instructor') return 'instructor'
  if (cmsCategory === 'school') return 'institution'
  if (cmsCategory === 'individual' || cmsCategory === 'volunteer') return 'youth'

  return 'youth'
}

/**
 * Platform 모집현황은 모집 중 / 모집 완료 2단.
 * CMS lifecycle 의 planned·scheduled 계열은 공개 목록에서 「모집 중」으로 합친다.
 */
export function mapLifecycleToRecruitmentStatus(
  lifecycle: CmsLifecycleStatus | undefined
): RecruitmentStatus {
  if (!lifecycle) return RECRUITMENT_STATUS.recruiting
  if (SCHEDULED_LIFECYCLES.has(lifecycle)) return RECRUITMENT_STATUS.recruiting
  if (RECRUITING_LIFECYCLES.has(lifecycle)) return RECRUITMENT_STATUS.recruiting
  return RECRUITMENT_STATUS.closed
}

export function mapDeliveryType(
  type: CmsProgramDeliveryType | undefined,
  educationFormLabel?: string
): EducationForm {
  const label = educationFormLabel?.trim()
  if (label) {
    if (label.includes('참여자') && label.includes('선택')) {
      return 'participant_choice'
    }
    if (label.includes('온·오프') || label.includes('온/오프') || label.includes('하이브리드')) {
      return 'hybrid'
    }
    if (label.includes('온라인')) return 'online'
    if (label.includes('오프라인')) return 'offline'
  }

  if (type === 'online') return 'online'
  if (type === 'hybrid') return 'hybrid'
  return 'offline'
}

function resolveTitle(program: CmsProgramLike): string {
  const announcement = program.generalCommonInfo?.announcementTitle?.trim()
  if (announcement) return announcement
  return program.title?.trim() || program.mainTitle?.trim() || '프로그램 모집 안내'
}

function resolveSponsor(program: CmsProgramLike): string {
  return program.generalCommonInfo?.sponsorDisplayName?.trim() || 'JA Korea'
}

function resolveTargetLabels(program: CmsProgramLike): {
  educationTargetKey: EducationTargetKey | null
  educationTargetLabel: string
  educationTargetGroupLabel: string
  educationTargetDetailLabel: string
} {
  const detailOverride = program.generalCommonInfo?.educationTargetDetailLabel?.trim()
  const level = program.targetLevel
  if (level && level in TARGET_LEVEL_LABELS) {
    const labels = TARGET_LEVEL_LABELS[level]
    return {
      educationTargetKey: level,
      educationTargetLabel: labels.educationTargetLabel,
      educationTargetGroupLabel: labels.educationTargetGroupLabel,
      educationTargetDetailLabel: detailOverride || labels.educationTargetLabel,
    }
  }
  return {
    educationTargetKey: null,
    educationTargetLabel: '전체',
    educationTargetGroupLabel: '전체',
    educationTargetDetailLabel: detailOverride || '전체',
  }
}

function formatOptionalDateRange(
  startIso: string | undefined,
  endIso: string | undefined
): string {
  return formatRecruitmentRangeLabel(toDate(startIso), toDate(endIso))
}

function formatOptionalDate(iso: string | undefined): string {
  const date = toDate(iso)
  return date ? formatDateLabel(date) : '-'
}

/**
 * 상세 케이스별 기본정보 그리드.
 * 스크린샷 식별 키(모집 구분·대상·지역 등)를 역할에 맞게 노출한다.
 */
export function mapBasicInfoFields(
  program: CmsProgramLike,
  detailCase: ProgramDetailCase,
  args: {
    businessFieldLabel: string
    educationFormLabel: string
    educationTargetGroupLabel: string
    educationTargetDetailLabel: string
    educationVenueLabel: string
    roleLabel: string
  }
): ProgramBasicInfoField[] {
  const affiliation =
    program.generalCommonInfo?.recruitmentAffiliationLabel?.trim() || ''
  const volunteerTarget =
    program.volunteerTarget?.trim() || args.educationTargetDetailLabel
  const sessionCount = program.generalCommonInfo?.sessionCountLabel?.trim()

  switch (detailCase) {
    case 'instructor':
      return [
        { label: '사업 분야', value: args.businessFieldLabel },
        { label: '모집 구분', value: args.roleLabel },
        { label: '대상', value: volunteerTarget || args.educationTargetGroupLabel },
        { label: '모집 지역', value: args.educationVenueLabel },
        ...(affiliation
          ? [{ label: '모집 소속', value: affiliation }]
          : []),
      ]
    case 'volunteer':
      return [
        { label: '사업 분야', value: args.businessFieldLabel },
        { label: '모집 구분', value: args.roleLabel },
        {
          label: '대상',
          value: volunteerTarget || args.educationTargetDetailLabel,
        },
        { label: '교육 형태', value: args.educationFormLabel },
        { label: '교육 장소', value: args.educationVenueLabel },
      ]
    case 'ujat-volunteer':
      return [
        { label: '사업 분야', value: args.businessFieldLabel },
        { label: '모집 구분', value: args.roleLabel },
        {
          label: '대상',
          value: volunteerTarget || '대학(원)생',
        },
        {
          label: '교육 지역',
          value: args.educationVenueLabel,
        },
        ...(affiliation
          ? [{ label: '모집 소속', value: affiliation }]
          : []),
      ]
    case 'ujat-participant':
      return [
        { label: '사업 분야', value: args.businessFieldLabel },
        { label: '모집 구분', value: args.roleLabel },
        {
          label: '대상',
          value: args.educationTargetDetailLabel || '초등학교',
        },
        { label: '교육 지역', value: args.educationVenueLabel },
        { label: '교육 형태', value: args.educationFormLabel },
      ]
    case 'gemini':
      return [
        { label: '교육 형태', value: args.educationFormLabel },
        { label: '교육 대상', value: args.educationTargetGroupLabel },
        {
          label: '교육 대상 상세',
          value: args.educationTargetDetailLabel,
        },
        ...(sessionCount
          ? [{ label: '교육 기수', value: sessionCount }]
          : [{ label: '교육 장소', value: args.educationVenueLabel }]),
      ]
    default:
      return [
        { label: '사업 분야', value: args.businessFieldLabel },
        { label: '교육 형태', value: args.educationFormLabel },
        { label: '교육대상', value: args.educationTargetGroupLabel },
        { label: '교육 대상 상세', value: args.educationTargetDetailLabel },
        { label: '교육 장소', value: args.educationVenueLabel },
      ]
  }
}

function resolvePrimaryApplicationWindow(
  program: CmsProgramLike,
  detailCase: ProgramDetailCase
): { start: Date | null; end: Date | null } {
  if (
    (detailCase === 'volunteer' || detailCase === 'ujat-volunteer') &&
    (program.volunteerApplicationStartDate || program.volunteerApplicationEndDate)
  ) {
    return {
      start: toDate(program.volunteerApplicationStartDate),
      end: toDate(program.volunteerApplicationEndDate),
    }
  }
  return {
    start: toDate(program.applicationStartDate),
    end: toDate(program.applicationEndDate),
  }
}

function resolveEducationStructure(
  structure: CmsEducationStructure | undefined
): ProgramEducationStructure {
  return structure === 'schedule' ? 'schedule' : 'curriculum'
}

function defaultSessions(): ProgramSession[] {
  return [
    {
      sessionLabel: '1차시',
      title: '1단원 프로그램 안내',
      description: '프로그램 목표와 진행 방식을 안내합니다.',
    },
    {
      sessionLabel: '2차시',
      title: '2단원 본 활동',
      description: '핵심 학습 활동을 진행합니다.',
    },
  ]
}

/**
 * 커리큘럼형: curriculumSessions → 차시/회차.
 * 일정형: 빈 배열 (기본정보에 행사·세부 일정 블록을 씀).
 */
function mapSessions(program: CmsProgramLike): ProgramSession[] {
  if (program.generalProgramEducationStructure === 'schedule') {
    return []
  }

  const sessions = program.generalCommonInfo?.curriculumSessions
  if (sessions?.length) {
    const isMulti = program.generalProgramSessionRound === 'multi'
    return sessions.map((session, index) => {
      const fallbackLabel = isMulti ? `${index + 1}회차` : `${index + 1}차시`
      const dateLabel = session.assignmentPeriod?.trim()
      return {
        sessionLabel: session.sessionLabel?.trim() || fallbackLabel,
        title: session.title?.trim() || `교육 ${index + 1}`,
        description: session.description?.trim() || '',
        ...(dateLabel ? { dateLabel } : {}),
      }
    })
  }

  const rounds = program.rounds?.filter(round => round.curriculum?.trim())
  if (rounds?.length) {
    return rounds.map((round, index) => ({
      sessionLabel: `${round.roundNumber ?? index + 1}회차`,
      title: `교육 ${round.roundNumber ?? index + 1}`,
      description: round.curriculum?.trim() || '',
    }))
  }

  return defaultSessions()
}

/**
 * 일정형 기본정보: scheduleDetails → 세부 일정 / 행사 일정.
 * 커리큘럼형: 빈 배열.
 */
function mapEventSchedules(program: CmsProgramLike): ProgramEventSchedule[] {
  if (program.generalProgramEducationStructure !== 'schedule') {
    return []
  }

  const details = program.generalCommonInfo?.scheduleDetails
  if (!details?.length) return []

  return details.map((detail, index) => {
    const pad = String(index + 1).padStart(2, '0')
    const scheduleLabel = detail.scheduleLabel?.trim() || `세부 일정 ${pad}`
    const name = detail.name?.trim() || ''
    const dateParts = [detail.scheduleDateLabel?.trim(), detail.progressTimeSummary?.trim()].filter(
      Boolean
    )
    return {
      scheduleLabel,
      name,
      dateLabel: dateParts.join(' · ') || '-',
    }
  })
}

/**
 * 세부내용 「교육 일정 N」 카드.
 * - educationScheduleLines 우선
 * - 커리큘럼형: lines 없으면 운영 기간 1줄 폴백
 * - 일정형: lines 없으면 빈 배열 (행사 일정은 기본정보 블록)
 */
function mapEducationSchedules(program: CmsProgramLike): ProgramLabeledValue[] {
  const lines = program.generalCommonInfo?.educationScheduleLines?.filter(line => line.trim())
  if (lines?.length) {
    return lines.map((line, index) => ({
      label: `교육 일정 ${index + 1}`,
      value: line.trim(),
    }))
  }

  if (program.generalProgramEducationStructure === 'schedule') {
    return []
  }

  const start = toDate(program.startDate)
  const end = toDate(program.endDate)
  if (start || end) {
    return [
      {
        label: '교육 일정 1',
        value: formatOperatingPeriodLabel(start, end),
      },
    ]
  }

  return [
    {
      label: '교육 일정 1',
      value: '-',
    },
  ]
}

function mapRecruitmentPhases(
  program: CmsProgramLike,
  detailCase: ProgramDetailCase,
  appStart: Date | null,
  appEnd: Date | null
): ProgramLabeledValue[] {
  const periodLabel = recruitmentPeriodPhaseLabel(detailCase)
  const phases: ProgramLabeledValue[] = [
    {
      label: periodLabel,
      value: formatRecruitmentRangeLabel(appStart, appEnd),
    },
  ]

  if (shouldIncludeInterviewStages(detailCase)) {
    phases.push(
      {
        label: '1차 서류 합격자 발표',
        value: formatOptionalDate(program.documentPassAnnouncementDate),
      },
      {
        label: '면접 기간',
        value: formatOptionalDateRange(
          program.interviewStartDate,
          program.interviewEndDate
        ),
      }
    )
  }

  const finalValue =
    formatOptionalDate(program.finalPassAnnouncementDate) !== '-'
      ? formatOptionalDate(program.finalPassAnnouncementDate)
      : formatOptionalDate(program.resultAnnouncementDate)

  phases.push({
    label: '최종 합격자 발표',
    value: finalValue,
  })

  return phases
}

/** mock 등 실파일 URL 이 없을 때 표시용 placeholder — 상세에서 빈 파일·원 파일명으로 다운로드 */
function mapAttachments(program: CmsProgramLike): ProgramAttachment[] {
  const names = program.attachmentFileNames?.filter(name => name.trim())
  if (names?.length) {
    return names.map(name => ({ name: name.trim(), url: '#' }))
  }
  return []
}

function mapExtraSections(program: CmsProgramLike): ProgramExtraSection[] {
  const sections: ProgramExtraSection[] = []
  const guide = program.recruitmentGuide?.trim()
  if (guide) {
    sections.push({ title: '모집안내', body: guide })
  }
  const other = program.otherNotes?.trim()
  if (other) {
    sections.push({ title: '기타사항', body: other })
  }
  const notes = program.generalCommonInfo?.notes?.trim()
  if (notes) {
    sections.push({ title: '비고', body: notes })
  }
  return sections
}

export type MapCmsProgramOptions = {
  /** 목록용 저해상 썸네일 URL (없을 때 생략) */
  thumbnailUrl?: string
  /** 상세 배너용 고해상 이미지 URL (없을 때 생략 → 상세에서 thumbnail 폴백) */
  detailImageUrl?: string
}

export type ResolveProgramImages = (id: string) =>
  | Pick<MapCmsProgramOptions, 'thumbnailUrl' | 'detailImageUrl'>
  | undefined

/**
 * CMS 프로그램 스냅샷 1건 → Platform 상세(목록 공통 필드 포함) 1건.
 * 다중 참여자 유형은 우선순위 단일 카테고리로 귀속한다.
 */
export function mapCmsProgramToPlatformDetail(
  program: CmsProgramLike,
  options: MapCmsProgramOptions = {}
): ProgramDetail {
  const detailCase = resolveProgramDetailCase(program)
  const category = resolvePlatformCategory(program)
  const recruitmentStatus = mapLifecycleToRecruitmentStatus(program.lifecycleStatus)
  const educationForm = mapDeliveryType(
    program.type,
    program.generalCommonInfo?.educationFormLabel
  )
  const targets = resolveTargetLabels(program)
  const roleLabel = recruitmentRoleLabelForCase(detailCase)

  const opStart = toDate(program.startDate)
  const opEnd = toDate(program.endDate)
  const primaryWindow = resolvePrimaryApplicationWindow(program, detailCase)
  const appStart = primaryWindow.start
  const appEnd = primaryWindow.end
  // 목록 정렬용 — 원본 application* 우선, 없으면 봉사 창
  const listAppStart =
    toDate(program.applicationStartDate) ?? toDate(program.volunteerApplicationStartDate)
  const listAppEnd =
    toDate(program.applicationEndDate) ?? toDate(program.volunteerApplicationEndDate)

  const title = resolveTitle(program)
  const summary =
    program.description?.trim() &&
    !program.description.startsWith('유형 mock') &&
    !program.description.includes('임시 저장')
      ? program.description.trim()
      : ''

  const isRecruiting = recruitmentStatus === RECRUITMENT_STATUS.recruiting
  const recruitmentPeriodLabel = formatRecruitmentRangeLabel(appStart, appEnd)
  const applicationMethodValue = program.applicationMethod?.trim() ?? ''
  const educationStructure = resolveEducationStructure(
    program.generalProgramEducationStructure
  )
  const businessFieldLabel = program.businessArea?.trim() || '경제금융'
  const educationFormLabel = EDUCATION_FORM_LABEL_MAP[educationForm]
  const educationVenueLabel =
    program.district?.trim() || educationFormLabel

  return {
    id: program.id,
    category,
    categoryLabel: CATEGORY_LABEL[category],
    title,
    operatingPeriodLabel: formatOperatingPeriodLabel(opStart, opEnd),
    operatingPeriodStart: opStart ? formatYmd(opStart) : '1970-01-01',
    operatingPeriodEnd: opEnd ? formatYmd(opEnd) : '1970-01-01',
    applicationStartDate: listAppStart ? formatYmd(listAppStart) : null,
    applicationEndDate: listAppEnd ? formatYmd(listAppEnd) : null,
    recruitmentPeriodLabel,
    applicationPeriodLabel: recruitmentPeriodLabel,
    recruitmentStatus,
    educationTargetKey: targets.educationTargetKey,
    educationTargetLabel: targets.educationTargetLabel,
    educationForm,
    educationFormLabel,
    thumbnailUrl: options.thumbnailUrl,
    detailImageUrl: options.detailImageUrl,
    sponsor: resolveSponsor(program),
    summary,
    isRecruiting,
    businessFieldLabel,
    educationTargetGroupLabel: targets.educationTargetGroupLabel,
    educationTargetDetailLabel: targets.educationTargetDetailLabel,
    educationVenueLabel,
    detailCase,
    recruitmentRoleLabel: roleLabel,
    basicInfoFields: mapBasicInfoFields(program, detailCase, {
      businessFieldLabel,
      educationFormLabel,
      educationTargetGroupLabel: targets.educationTargetGroupLabel,
      educationTargetDetailLabel: targets.educationTargetDetailLabel,
      educationVenueLabel,
      roleLabel,
    }),
    educationStructure,
    sessions: mapSessions(program),
    eventSchedules: mapEventSchedules(program),
    recruitmentPhaseGroupLabel: recruitmentPhaseGroupLabel(detailCase),
    recruitmentPhases: mapRecruitmentPhases(program, detailCase, appStart, appEnd),
    educationSchedules: mapEducationSchedules(program),
    extraSections: mapExtraSections(program),
    applicationMethodLabel: '지원방법',
    applicationMethodValue,
    attachments: mapAttachments(program),
  }
}

export function mapCmsProgramToPlatformListItem(
  program: CmsProgramLike,
  options: MapCmsProgramOptions = {}
): ProgramListItem {
  const detail = mapCmsProgramToPlatformDetail(program, options)
  return {
    id: detail.id,
    category: detail.category,
    categoryLabel: detail.categoryLabel,
    title: detail.title,
    operatingPeriodLabel: detail.operatingPeriodLabel,
    operatingPeriodStart: detail.operatingPeriodStart,
    operatingPeriodEnd: detail.operatingPeriodEnd,
    applicationStartDate: detail.applicationStartDate,
    applicationEndDate: detail.applicationEndDate,
    recruitmentPeriodLabel: detail.recruitmentPeriodLabel,
    recruitmentStatus: detail.recruitmentStatus,
    educationTargetKey: detail.educationTargetKey,
    educationTargetLabel: detail.educationTargetLabel,
    educationForm: detail.educationForm,
    educationFormLabel: detail.educationFormLabel,
    thumbnailUrl: detail.thumbnailUrl,
  }
}

export function mapCmsProgramsToPlatformDetails(
  programs: readonly CmsProgramLike[],
  resolveImages?: ResolveProgramImages
): ProgramDetail[] {
  return programs.map(program =>
    mapCmsProgramToPlatformDetail(program, resolveImages?.(program.id) ?? {})
  )
}
