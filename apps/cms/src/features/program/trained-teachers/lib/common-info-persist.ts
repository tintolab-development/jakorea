/**
 * 교육받은 교사 상세 공통정보 persist — 폼·draft nested 정본.
 * 브라우저 overlay store / stale session overlay maps 를 source 로 쓰지 않는다.
 */
import type {
  GeneralProgramCurriculumSessionRow,
  GeneralProgramScheduleDetailRow,
  Program,
} from '@/types/domain'
import { educationScheduleRangeFromPeriodLines } from '@/features/template/lib/format-education-schedule-line'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'
import { TRAINED_TEACHER_TRAINING_SCHEDULE_NAME } from './is-trained-teachers-primary-program'

/** 전환된 공통정보 overlay — persist·hydrate 에서 source 로 쓰지 않는다. */
export const TRAINED_TEACHER_CONVERTED_OVERLAY_PREFIXES = [
  'trainedTeachersRegistration.basicInfo.',
  'trainedTeachersRegistration.typeSettings.',
  'trainedTeachersRegistration.educationCurriculum.',
  'trainedTeachersRegistration.educationScheduleCurriculum.',
  'trainedTeachersRegistration.educationScheduleSettings.',
  'generalRegistration.basicInfo.',
  'generalRegistration.typeSettings.',
  'generalRegistration.educationCurriculum.',
  'generalRegistration.educationScheduleCurriculum.',
  'generalRegistration.educationScheduleSettings.',
  'generalRegistration.kpi.',
] as const

/** 세션 maps 전용 alias — 기존 import 호환 */
export const TRAINED_TEACHER_STALE_SESSION_OVERLAY_PREFIXES =
  TRAINED_TEACHER_CONVERTED_OVERLAY_PREFIXES

/** LNB 설문 체크 미러. canonical keys 가 있으면 이 키만 남긴다. */
export const TRAINED_TEACHER_OVERLAY_KEEP_EXACT = [
  'trainedTeachersRegistration.basicInfo.surveyItems',
] as const

const JOURNAL_OVERLAY_KEYS = [
  'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled',
  'generalRegistration.educationCurriculum.educationJournalEnabled',
] as const

function progressGroupLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index)
}

/** 그룹별 시간 텍스트 배열 → progressTimeSummary (2개 이상일 때만 그룹 라벨) */
export function joinTrainedTeachersProgressGroups(groups: string[]): string {
  const filled = groups.map(g => g.trim()).filter(Boolean)
  if (filled.length === 0) return ''
  if (filled.length === 1) return filled[0]
  return filled.map((g, i) => `그룹 ${progressGroupLetter(i)} : ${g}`).join(' | ')
}

export function applyTrainedTeachersProgressGroupsToScheduleDetails(
  details: GeneralProgramScheduleDetailRow[],
  progressGroupsByDetail: string[][],
  sessionRound: 'single' | 'multi'
): GeneralProgramScheduleDetailRow[] {
  if (sessionRound !== 'single') return details
  return details.map((detail, index) => ({
    ...detail,
    progressTimeSummary: joinTrainedTeachersProgressGroups(
      progressGroupsByDetail[index] ?? ['']
    ),
  }))
}

export type TrainedTeachersNestedPersist = Pick<
  NonNullable<Program['generalCommonInfo']>,
  'curriculumSessions' | 'scheduleDetails'
>

/**
 * 현재 교육구조의 nested만 채우고 비활성 쪽은 명시 [].
 * B configJson 은 키 생략 시 구값을 지우지 않으므로 비활성도 항상 보낸다.
 */
export function buildTrainedTeachersNestedCommonInfo(args: {
  educationStructure: 'curriculum' | 'schedule'
  curriculumSessions?: GeneralProgramCurriculumSessionRow[]
  scheduleDetails?: GeneralProgramScheduleDetailRow[]
}): TrainedTeachersNestedPersist {
  if (args.educationStructure === 'curriculum') {
    return {
      curriculumSessions: args.curriculumSessions ?? [],
      scheduleDetails: [],
    }
  }
  return {
    curriculumSessions: [],
    scheduleDetails: args.scheduleDetails ?? [],
  }
}

export function emptyTrainedTeachersScheduleDetail(
  sessionRound: 'single' | 'multi'
): GeneralProgramScheduleDetailRow {
  return {
    scheduleLabel: sessionRound === 'multi' ? '행사 일정 01' : '세부 일정 01',
    name: '',
  }
}

export function emptyTrainedTeachersCurriculumSession(
  sessionRound: 'single' | 'multi'
): GeneralProgramCurriculumSessionRow {
  return {
    sessionLabel: sessionRound === 'multi' ? '1회차' : '1차시',
    title: '',
    description: '',
  }
}

/** 구조·회차 변경 시 활성 nested를 기본 1행으로 교체하고 비활성 쪽은 []. */
export function rebuildTrainedTeachersDraftForTypeChange(input: {
  educationStructure: 'curriculum' | 'schedule'
  sessionRound: 'single' | 'multi'
}): {
  curriculumSessions: GeneralProgramCurriculumSessionRow[]
  scheduleDetails: GeneralProgramScheduleDetailRow[]
  progressGroupsByDetail: string[][]
} {
  if (input.educationStructure === 'schedule') {
    return {
      curriculumSessions: [],
      scheduleDetails: [emptyTrainedTeachersScheduleDetail(input.sessionRound)],
      progressGroupsByDetail: [['']],
    }
  }
  return {
    curriculumSessions: [emptyTrainedTeachersCurriculumSession(input.sessionRound)],
    scheduleDetails: [],
    progressGroupsByDetail: [],
  }
}

/** 일정형 → 세부 프로그램 「해당없음」. 커리큘럼형으로 돌아올 때 센티널만 비운다. */
export function resolveTrainedTeachersDetailedProgramForStructure(args: {
  nextStructure: 'curriculum' | 'schedule'
  currentDetailedProgramId?: string
}): { detailedProgramId: string; detailedProgramName: string } | null {
  if (args.nextStructure === 'schedule') {
    return {
      detailedProgramId: TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
      detailedProgramName: '해당없음',
    }
  }
  if (args.currentDetailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE) {
    return { detailedProgramId: '', detailedProgramName: '' }
  }
  return null
}

function isConvertedOverlayKey(key: string): boolean {
  if ((TRAINED_TEACHER_OVERLAY_KEEP_EXACT as readonly string[]).includes(key)) {
    return false
  }
  return TRAINED_TEACHER_CONVERTED_OVERLAY_PREFIXES.some(
    prefix => key === prefix.slice(0, -1) || key.startsWith(prefix)
  )
}

export function omitTrainedTeacherStaleSessionOverlayKeys(
  overlay: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!overlay) return overlay
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(overlay)) {
    if (isConvertedOverlayKey(key)) continue
    next[key] = value
  }
  return Object.keys(next).length > 0 ? next : undefined
}

function overlayYesNo(value: unknown): boolean | undefined {
  if (value === true || value === 'yes') return true
  if (value === false || value === 'no') return false
  return undefined
}

export function readTrainedTeacherOverlayJournalEnabled(
  overlay: Record<string, unknown> | undefined
): boolean | undefined {
  if (!overlay) return undefined
  for (const key of JOURNAL_OVERLAY_KEYS) {
    const parsed = overlayYesNo(overlay[key])
    if (parsed !== undefined) return parsed
  }
  return undefined
}

function explicitBoolean(
  canonical: boolean | undefined,
  fallback: boolean | undefined
): boolean {
  if (canonical === true || canonical === false) return canonical
  return fallback === true
}

/**
 * 상세 조회·수정 시드 — canonical nested 정본.
 * overlay 는 canonical 이 없을 때만 journal fallback.
 */
export function resolveTrainedTeachersCanonicalCommonInfo(
  program: Program
): NonNullable<Program['generalCommonInfo']> {
  const nested = program.generalCommonInfo ?? {}
  const overlay =
    program.registrationOverlay != null && typeof program.registrationOverlay === 'object'
      ? program.registrationOverlay
      : undefined
  return {
    ...nested,
    educationJournalEnabled: explicitBoolean(
      nested.educationJournalEnabled,
      readTrainedTeacherOverlayJournalEnabled(overlay)
    ),
    teacherTrainingEnabled: nested.teacherTrainingEnabled === true,
    educationScheduleLines: Array.isArray(nested.educationScheduleLines)
      ? nested.educationScheduleLines
      : undefined,
    curriculumSessions: Array.isArray(nested.curriculumSessions)
      ? nested.curriculumSessions
      : undefined,
    scheduleDetails: Array.isArray(nested.scheduleDetails)
      ? nested.scheduleDetails
      : undefined,
  }
}

/** B PATCH (`trained-teacher/detail`) 전용. A programs JSON 에는 넣지 않는다. */
export const TRAINED_TEACHER_INFO_DETAIL_OWNED_COMMON_INFO_KEYS = [
  'curriculumSessions',
  'scheduleDetails',
  'educationScheduleLines',
  'educationScheduleMode',
  'educationScheduleRange',
  'teacherTrainingEnabled',
  'educationJournalEnabled',
  'teacherTrainingScheduleName',
] as const

export function omitTrainedTeacherInfoDetailOwnedCommonInfo(
  common: Program['generalCommonInfo'] | undefined
): Program['generalCommonInfo'] | undefined {
  if (!common) return common
  const next = { ...common } as Record<string, unknown>
  for (const key of TRAINED_TEACHER_INFO_DETAIL_OWNED_COMMON_INFO_KEYS) {
    delete next[key]
  }
  return next as NonNullable<Program['generalCommonInfo']>
}

export type TrainedTeachersCommonInfoSaveSlices = {
  extraCommonInfo: NonNullable<Program['generalCommonInfo']>
  infoDetailCommonInfo: NonNullable<Program['generalCommonInfo']>
}

/**
 * A programs extra + B detail payload 를 같은 RHF/draft 값으로 만든다.
 * overlay·기존 nested 를 입력값으로 재사용하지 않는다.
 */
export function buildTrainedTeachersCommonInfoSaveSlices(args: {
  educationStructure: 'curriculum' | 'schedule'
  teacherTrainingEnabled: boolean
  educationJournalEnabled: boolean
  curriculumSessions?: GeneralProgramCurriculumSessionRow[]
  scheduleDetails?: GeneralProgramScheduleDetailRow[]
  educationScheduleLines?: string[]
  educationScheduleMode?: 'date' | 'period'
  educationScheduleRange?: { start: string; end: string } | null
}): TrainedTeachersCommonInfoSaveSlices {
  const nested = buildTrainedTeachersNestedCommonInfo({
    educationStructure: args.educationStructure,
    curriculumSessions: args.curriculumSessions,
    scheduleDetails: args.scheduleDetails,
  })
  const trainingEnabled = args.teacherTrainingEnabled === true
  const derivedRange =
    args.educationScheduleMode == null
      ? args.educationScheduleRange
      : educationScheduleRangeFromPeriodLines({
          mode: args.educationScheduleMode,
          lines: args.educationScheduleLines ?? [],
        })
  const common: NonNullable<Program['generalCommonInfo']> = {
    ...nested,
    teacherTrainingEnabled: trainingEnabled,
    educationJournalEnabled: args.educationJournalEnabled === true,
    teacherTrainingScheduleName: trainingEnabled ? TRAINED_TEACHER_TRAINING_SCHEDULE_NAME : '',
    ...(args.educationScheduleLines !== undefined
      ? { educationScheduleLines: args.educationScheduleLines }
      : {}),
    ...(args.educationScheduleMode ? { educationScheduleMode: args.educationScheduleMode } : {}),
    ...(args.educationScheduleMode != null || args.educationScheduleRange !== undefined
      ? { educationScheduleRange: derivedRange ?? null }
      : {}),
  }
  return {
    extraCommonInfo: common,
    infoDetailCommonInfo: common,
  }
}
