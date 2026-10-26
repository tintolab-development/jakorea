import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'
import { UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS } from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-keys'

export type UjatApplicationInstitutionEditorState = {
  ujatGradeApplicationBlockIds: string[]
  ujatApplicationGradeByBlockId: Record<string, string | undefined>
  ujatGradeClassTimeBlockIds: string[]
}

export function buildParticipantApplicationEditorState(args: {
  variant: ProgramParticipantApplicationEditorVariant
  volunteerExceptionScheduleCount: number
  ujatVolunteerApplicationType: 'new' | 'ujat-graduate'
  ujatGradeApplicationBlockIds: string[]
  ujatApplicationGradeByBlockId: Record<string, string | undefined>
  ujatGradeClassTimeBlockIds: string[]
}): Record<string, unknown> | undefined {
  const editorState: Record<string, unknown> = {}

  if (
    args.variant === 'volunteer' ||
    args.variant === 'recruit-volunteer' ||
    args.variant === 'ujat-recruit-volunteer'
  ) {
    editorState.volunteerExceptionScheduleCount = args.volunteerExceptionScheduleCount
  }
  if (args.variant === 'ujat-application-volunteer') {
    editorState.ujatVolunteerApplicationType = args.ujatVolunteerApplicationType
  }
  if (args.variant === 'ujat-application-institution') {
    editorState.ujatGradeApplicationBlockIds = args.ujatGradeApplicationBlockIds
    editorState.ujatApplicationGradeByBlockId = args.ujatApplicationGradeByBlockId
    editorState.ujatGradeClassTimeBlockIds = args.ujatGradeClassTimeBlockIds
  }

  return Object.keys(editorState).length > 0 ? editorState : undefined
}

function readOverlayRecordKeys(value: unknown): string[] {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.keys(value).filter(key => key.trim() !== '')
}

/** overlay에 남은 학년·교시 표 키를 복원한다. 없으면 UUID를 새로 만들지 않도록 null. */
export function ujatApplicationInstitutionBlockIdsFromOverlay(
  overlay: Record<string, unknown> | undefined
): { gradeIds: string[]; classTimeIds: string[] } | null {
  if (overlay == null) return null
  const gradeIds = readOverlayRecordKeys(
    overlay[UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.gradeDetailByBlock]
  )
  const classTimeIds = readOverlayRecordKeys(
    overlay[UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.classTimePeriodsByBlock] ??
      overlay[UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.classTimeCheckedByBlock]
  )
  if (gradeIds.length === 0 && classTimeIds.length === 0) return null
  return {
    gradeIds: gradeIds.length > 0 ? gradeIds : classTimeIds,
    classTimeIds: classTimeIds.length > 0 ? classTimeIds : gradeIds,
  }
}

function readStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const items = value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
  return items.length > 0 ? items : null
}

function readGradeByBlockId(
  value: unknown
): Record<string, string | undefined> | null {
  if (value == null || typeof value !== 'object') return null
  return value as Record<string, string | undefined>
}

export function applyParticipantApplicationEditorState(args: {
  variant: ProgramParticipantApplicationEditorVariant
  editorState?: Record<string, unknown>
  setVolunteerExceptionScheduleCount: (count: number) => void
  setUjatVolunteerApplicationType: (type: 'new' | 'ujat-graduate') => void
  setUjatGradeApplicationBlockIds: (ids: string[]) => void
  setUjatApplicationGradeByBlockId: (
    value: Record<string, string | undefined>
  ) => void
  setUjatGradeClassTimeBlockIds: (ids: string[]) => void
}): void {
  const { editorState, variant } = args
  if (editorState == null) return

  const count = editorState.volunteerExceptionScheduleCount
  if (
    (variant === 'volunteer' ||
      variant === 'recruit-volunteer' ||
      variant === 'ujat-recruit-volunteer') &&
    typeof count === 'number' &&
    Number.isFinite(count)
  ) {
    args.setVolunteerExceptionScheduleCount(Math.max(0, Math.floor(count)))
  }

  const appType = editorState.ujatVolunteerApplicationType
  if (
    variant === 'ujat-application-volunteer' &&
    (appType === 'new' || appType === 'ujat-graduate')
  ) {
    args.setUjatVolunteerApplicationType(appType)
  }

  if (variant === 'ujat-application-institution') {
    const gradeBlockIds = readStringArray(editorState.ujatGradeApplicationBlockIds)
    if (gradeBlockIds != null) {
      args.setUjatGradeApplicationBlockIds(gradeBlockIds)
    }
    const gradeByBlockId = readGradeByBlockId(editorState.ujatApplicationGradeByBlockId)
    if (gradeByBlockId != null) {
      args.setUjatApplicationGradeByBlockId(gradeByBlockId)
    }
    const classTimeBlockIds = readStringArray(editorState.ujatGradeClassTimeBlockIds)
    if (classTimeBlockIds != null) {
      args.setUjatGradeClassTimeBlockIds(classTimeBlockIds)
    }
  }
}
