import type {
  ProgramRegistrationEducationScheduleMode,
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'

import {
  shouldUseRemoteDraftApiForTemplateCode,
} from '@/features/template/lib/form-template-remote-draft'

export const PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE = 'registration-general' as const
export const PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE = 'registration-economy' as const

export {
  REGISTRATION_GENERAL_USE_REMOTE_DRAFT_API,
  shouldUseRemoteDraftApiForTemplateCode,
} from '@/features/template/lib/form-template-remote-draft'

/** @deprecated `shouldUseRemoteDraftApiForTemplateCode` 사용 */
export function shouldUseRegistrationGeneralRemoteDraftApi(templateCode: string): boolean {
  return shouldUseRemoteDraftApiForTemplateCode(templateCode)
}

export type ProgramRegistrationParticipantSelection = {
  individual: boolean
  organization: boolean
  teacherInstructor: boolean
  volunteer: boolean
}

export type ProgramRegistrationEditorState = {
  participant: ProgramRegistrationParticipantSelection
  programType: ProgramRegistrationType
  sessionRoundType: ProgramRegistrationSessionRoundType
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
  curriculumSessionCount: number
  curriculumChartSessionCount: number
  scheduleCurriculumDetailCount: number
  scheduleCurriculumGroupCount: number
  scheduleCurriculumPreEducation: boolean
  trainedTeachersTeacherTrainingEnabled: boolean
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  /** 일반 등록 폼 기본 정보 — 후원사 (draft editorState 복원용) */
  sponsorId?: string
  /** 일반 등록 폼 기본 정보 — 후원사 담당자 */
  sponsorContactId?: string
  /** 일반 등록 폼 기본 정보 — 프로그램 제목(국문) */
  programTitleKo?: string
  activeParagraphId?: string | null
}

export function buildProgramRegistrationEditorState(
  state: ProgramRegistrationEditorState
): Record<string, unknown> {
  return { ...state }
}

function isParticipantSelection(value: unknown): value is ProgramRegistrationParticipantSelection {
  if (value == null || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return (
    typeof row.individual === 'boolean' &&
    typeof row.organization === 'boolean' &&
    typeof row.teacherInstructor === 'boolean' &&
    typeof row.volunteer === 'boolean'
  )
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback
}

/** draft/API extensionJson에서 id가 number로 올 수 있음 */
function readOptionalIdString(value: unknown, fallback?: string): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

function readScheduleDetailKind(
  value: unknown,
  fallback: ProgramRegistrationScheduleDetailKind
): ProgramRegistrationScheduleDetailKind {
  return value === 'common' || value === 'perSchedule' ? value : fallback
}

export function applyProgramRegistrationEditorState(
  editorState: Record<string, unknown> | undefined,
  defaults: ProgramRegistrationEditorState
): ProgramRegistrationEditorState {
  if (editorState == null) return defaults

  const participant = isParticipantSelection(editorState.participant)
    ? editorState.participant
    : defaults.participant

  const programType: ProgramRegistrationType =
    editorState.programType === 'schedule' ? 'schedule' : defaults.programType

  const sessionRoundType: ProgramRegistrationSessionRoundType =
    editorState.sessionRoundType === 'multi' ? 'multi' : defaults.sessionRoundType

  const educationScheduleMode: ProgramRegistrationEducationScheduleMode =
    editorState.educationScheduleMode === 'period' ? 'period' : defaults.educationScheduleMode

  return {
    participant,
    programType,
    sessionRoundType,
    educationFormScheduleDetail: readScheduleDetailKind(
      editorState.educationFormScheduleDetail,
      defaults.educationFormScheduleDetail
    ),
    participationScheduleDetail: readScheduleDetailKind(
      editorState.participationScheduleDetail,
      defaults.participationScheduleDetail
    ),
    ipsScheduleDetail: readScheduleDetailKind(
      editorState.ipsScheduleDetail,
      defaults.ipsScheduleDetail
    ),
    curriculumSessionCount: readNumber(
      editorState.curriculumSessionCount,
      defaults.curriculumSessionCount
    ),
    curriculumChartSessionCount: readNumber(
      editorState.curriculumChartSessionCount,
      defaults.curriculumChartSessionCount
    ),
    scheduleCurriculumDetailCount: readNumber(
      editorState.scheduleCurriculumDetailCount,
      defaults.scheduleCurriculumDetailCount
    ),
    scheduleCurriculumGroupCount: readNumber(
      editorState.scheduleCurriculumGroupCount,
      defaults.scheduleCurriculumGroupCount
    ),
    scheduleCurriculumPreEducation:
      typeof editorState.scheduleCurriculumPreEducation === 'boolean'
        ? editorState.scheduleCurriculumPreEducation
        : defaults.scheduleCurriculumPreEducation,
    trainedTeachersTeacherTrainingEnabled:
      typeof editorState.trainedTeachersTeacherTrainingEnabled === 'boolean'
        ? editorState.trainedTeachersTeacherTrainingEnabled
        : defaults.trainedTeachersTeacherTrainingEnabled,
    educationScheduleMode,
    sponsorId: readOptionalIdString(editorState.sponsorId, defaults.sponsorId),
    sponsorContactId: readOptionalIdString(
      editorState.sponsorContactId,
      defaults.sponsorContactId
    ),
    programTitleKo:
      typeof editorState.programTitleKo === 'string' ? editorState.programTitleKo : defaults.programTitleKo,
    activeParagraphId:
      typeof editorState.activeParagraphId === 'string' ? editorState.activeParagraphId : null,
  }
}
