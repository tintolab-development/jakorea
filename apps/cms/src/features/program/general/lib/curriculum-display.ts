import type {
  GeneralProgramAudienceKind,
  GeneralProgramEducationStructure,
  GeneralProgramSessionRoundKind,
  GeneralProgramCurriculumSessionRow,
} from '@/types/domain'
import { resolveGeneralProgramVariantFromProgram } from '@/features/program/general/lib/variant'

const CURRICULUM_OVERLAY_PROGRESS_SESSION_BY_ROUND_KEY =
  'generalRegistration.educationCurriculum.progressSessionByRound'
const CURRICULUM_OVERLAY_ROUND_CONTENT_BY_ROUND_KEY =
  'generalRegistration.educationCurriculum.roundContentByRound'
const CURRICULUM_OVERLAY_ASSIGNMENT_BY_ROUND_KEY =
  'generalRegistration.educationCurriculum.assignmentByRound'
const CURRICULUM_OVERLAY_UNIT_NAME_BY_SESSION_KEY =
  'generalRegistration.educationCurriculum.unitNameBySession'
const CURRICULUM_OVERLAY_UNIT_CONTENT_BY_SESSION_KEY =
  'generalRegistration.educationCurriculum.unitContentBySession'
const CURRICULUM_OVERLAY_IPS_BY_SESSION_KEY =
  'generalRegistration.educationCurriculum.ipsBySession'

function overlayRecordHasText(raw: unknown): boolean {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return false
  return Object.values(raw).some(value => typeof value === 'string' && value.trim() !== '')
}

function overlayAssignmentHasValue(raw: unknown): boolean {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return false
  return Object.values(raw).some(value => {
    if (value == null || typeof value !== 'object' || Array.isArray(value)) return false
    const row = value as { enabled?: boolean; period?: string }
    return row.enabled === true || Boolean(row.period?.trim())
  })
}

function overlayRoundKeys(raw: unknown, mode: 'text' | 'assignment' = 'text'): number[] {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return []
  return Object.entries(raw)
    .filter(([, value]) => {
      if (mode === 'assignment') {
        if (value == null || typeof value !== 'object' || Array.isArray(value)) return false
        const row = value as { enabled?: boolean; period?: string }
        return row.enabled === true || Boolean(row.period?.trim())
      }
      return typeof value === 'string' && value.trim() !== ''
    })
    .map(([key]) => Number(key))
    .filter(key => Number.isFinite(key) && key > 0)
}

/** 등록 overlay에 복수 회차(진행 차시·회차 내용·과제)가 남아 있는지 */
export function hasGeneralCurriculumMultiRoundOverlay(
  overlay?: Record<string, unknown> | null
): boolean {
  if (!overlay) return false
  return (
    overlayRecordHasText(overlay[CURRICULUM_OVERLAY_PROGRESS_SESSION_BY_ROUND_KEY]) ||
    overlayRecordHasText(overlay[CURRICULUM_OVERLAY_ROUND_CONTENT_BY_ROUND_KEY]) ||
    overlayAssignmentHasValue(overlay[CURRICULUM_OVERLAY_ASSIGNMENT_BY_ROUND_KEY])
  )
}

/** overlay에 저장된 복수 회차 개수. 단수 시드용 빈 assignment 맵은 세지 않는다. */
export function countGeneralCurriculumMultiRoundsFromOverlay(
  overlay?: Record<string, unknown> | null
): number {
  if (!overlay) return 0
  const keys = [
    ...overlayRoundKeys(overlay[CURRICULUM_OVERLAY_PROGRESS_SESSION_BY_ROUND_KEY]),
    ...overlayRoundKeys(overlay[CURRICULUM_OVERLAY_ROUND_CONTENT_BY_ROUND_KEY]),
    ...overlayRoundKeys(overlay[CURRICULUM_OVERLAY_ASSIGNMENT_BY_ROUND_KEY], 'assignment'),
  ]
  return keys.length > 0 ? Math.max(...keys) : 0
}

function isLegacyPreEducationUnitText(value: unknown): boolean {
  return typeof value === 'string' && /사전|연수/.test(value.trim())
}

/**
 * 구 데이터는 사전 교육을 `unitNameBySession["1"]`에 넣고 1·2·3차시를 2·3·4번에 둔다.
 * 키 최댓값을 그대로 쓰면 수정 화면에 빈 회차가 하나 더 생긴다.
 */
function legacyPreEducationUnitShift(overlay: Record<string, unknown>): number {
  const raw = overlay[CURRICULUM_OVERLAY_UNIT_NAME_BY_SESSION_KEY]
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return 0
  return isLegacyPreEducationUnitText((raw as Record<string, unknown>)['1']) ? 1 : 0
}

/** overlay 단원명·교육 내용(차트 차시) 개수. 사전 교육이 1번 칸이면 그 칸은 차시·회차가 아니다. */
export function countGeneralCurriculumUnitSessionsFromOverlay(
  overlay?: Record<string, unknown> | null
): number {
  if (!overlay) return 0
  const shift = legacyPreEducationUnitShift(overlay)
  const keys = [
    ...overlayRoundKeys(overlay[CURRICULUM_OVERLAY_UNIT_NAME_BY_SESSION_KEY]),
    ...overlayRoundKeys(overlay[CURRICULUM_OVERLAY_UNIT_CONTENT_BY_SESSION_KEY]),
  ].filter(key => shift === 0 || key !== 1)
  if (keys.length === 0) return 0
  return Math.max(...keys) - shift
}

function overlayIpsSessionKeys(raw: unknown): number[] {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return []
  return Object.entries(raw)
    .filter(([, value]) => {
      if (value == null || typeof value !== 'object' || Array.isArray(value)) return false
      const row = value as { category?: string }
      return Boolean(row.category?.trim())
    })
    .map(([key]) => Number(key))
    .filter(key => Number.isFinite(key) && key > 0)
}

/** overlay IPS 일정별 맵 개수 */
export function countGeneralCurriculumIpsSessionsFromOverlay(
  overlay?: Record<string, unknown> | null
): number {
  if (!overlay) return 0
  const keys = overlayIpsSessionKeys(overlay[CURRICULUM_OVERLAY_IPS_BY_SESSION_KEY])
  return keys.length > 0 ? Math.max(...keys) : 0
}

/** 수정 overlay에 남아 있는 교육 진행 슬롯 수 (회차·단원·IPS) */
export function countGeneralCurriculumOverlaySessions(
  overlay?: Record<string, unknown> | null
): number {
  return Math.max(
    countGeneralCurriculumMultiRoundsFromOverlay(overlay),
    countGeneralCurriculumUnitSessionsFromOverlay(overlay),
    countGeneralCurriculumIpsSessionsFromOverlay(overlay)
  )
}

export function curriculumSessionHasRoundLabel(
  session: Pick<GeneralProgramCurriculumSessionRow, 'sessionLabel'> | null | undefined
): boolean {
  return /회차/.test(session?.sessionLabel ?? '')
}

/** Program·commonInfo·커리큘럼 차시에서 유형 필드 보강 (mock seed 누락·구버전 데이터 대비) */
export function resolveEffectiveGeneralProgramTypeFields(input: {
  generalProgramAudience?: GeneralProgramAudienceKind | null
  generalProgramEducationStructure?: GeneralProgramEducationStructure | null
  generalProgramSessionRound?: GeneralProgramSessionRoundKind | null
  curriculumSessions?: GeneralProgramCurriculumSessionRow[] | null
  registrationOverlay?: Record<string, unknown> | null
}): {
  audience: GeneralProgramAudienceKind
  educationStructure: GeneralProgramEducationStructure
  sessionRound: GeneralProgramSessionRoundKind
} {
  const variant = resolveGeneralProgramVariantFromProgram({
    generalProgramAudience: input.generalProgramAudience ?? undefined,
    generalProgramEducationStructure: input.generalProgramEducationStructure ?? undefined,
    generalProgramSessionRound: input.generalProgramSessionRound ?? undefined,
  })
  const sessions = input.curriculumSessions ?? []

  const educationStructure =
    input.generalProgramEducationStructure ??
    variant?.educationStructure ??
    (sessions.length > 0 ? 'curriculum' : 'curriculum')

  const fromOverlay = hasGeneralCurriculumMultiRoundOverlay(input.registrationOverlay)
  const fromSessionLabels = sessions.some(session => curriculumSessionHasRoundLabel(session))
  const explicitRound =
    input.generalProgramSessionRound === 'single' || input.generalProgramSessionRound === 'multi'
      ? input.generalProgramSessionRound
      : undefined
  const sessionRound: GeneralProgramSessionRoundKind =
    educationStructure === 'schedule'
      ? (explicitRound ?? variant?.sessionRound ?? 'single')
      : (explicitRound ??
        (fromOverlay || fromSessionLabels
          ? 'multi'
          : (variant?.sessionRound ??
            (isGeneralProgramMultiRoundCurriculum({
              educationStructure,
              curriculumSessions: sessions,
            })
              ? 'multi'
              : 'single'))))

  const audience =
    input.generalProgramAudience ??
    variant?.audience ??
    'organization'

  return { audience, educationStructure, sessionRound }
}

export function isGeneralProgramMultiRoundCurriculum(input: {
  educationStructure?: GeneralProgramEducationStructure | null
  sessionRound?: GeneralProgramSessionRoundKind | null
  curriculumSessions?: GeneralProgramCurriculumSessionRow[] | null
}): boolean {
  if (input.educationStructure === 'schedule') return false
  if (input.sessionRound === 'multi') return true
  if (input.sessionRound === 'single') return false

  const sessions = input.curriculumSessions ?? []
  return sessions.some(session => /회차/.test(session.sessionLabel ?? ''))
}

export function formatGeneralProgramCurriculumAssignmentView(
  assignmentEnabled?: boolean,
  assignmentPeriod?: string
): { status: string; period?: string } {
  if (!assignmentEnabled) return { status: '없음' }
  const period = assignmentPeriod?.trim()
  if (!period) return { status: '있음' }
  return { status: '있음', period }
}
