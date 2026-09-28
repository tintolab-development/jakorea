import type { Program } from '@/types/domain'
import {
  applyUjatRecruitInstitutionOverlayOntoProgram,
  applyUjatRecruitInstitutionTemplateDefaults,
  pickUjatRecruitInstitutionOverlay,
  UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import {
  applyUjatRecruitVolunteerOverlayOntoProgram,
  applyUjatRecruitVolunteerTemplateDefaults,
  pickUjatRecruitVolunteerOverlay,
  UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import { loadUjatRecruitInstitutionTemplateSave } from '@/features/program/ujat/lib/ujat-recruit-template-local-save'
import {
  blankUjatVolunteerRecruitProgramFields,
  buildUjatRecruitVolunteerHalfOverlayFromDetailEditValues,
  resolveVolunteerOverlayForHalf,
  restoreUjatVolunteerRecruitProgramColumns,
  snapshotVolunteerHalfFromLegacy,
  ujatVolunteerHalfOverlayKey,
  type UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'

export type UjatRecruitDisplayKind = 'institution' | 'volunteer' | 'volunteer_h1' | 'volunteer_h2'

export function volunteerHalfFromRecruitDisplayKind(
  kind: UjatRecruitDisplayKind
): UjatVolunteerRecruitHalf | null {
  if (kind === 'volunteer_h1') return 'h1'
  if (kind === 'volunteer_h2') return 'h2'
  return null
}

export function ujatRecruitDisplayKindFromVolunteerHalf(
  half: UjatVolunteerRecruitHalf
): UjatRecruitDisplayKind {
  return half === 'h2' ? 'volunteer_h2' : 'volunteer_h1'
}

function overlayString(overlay: Record<string, unknown>, key: string): string | undefined {
  const value = overlay[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function mergedInstitutionOverlay(program: Program): Record<string, unknown> {
  return {
    ...(loadUjatRecruitInstitutionTemplateSave()?.overlay ?? {}),
    ...pickUjatRecruitInstitutionOverlay(program.ujatRegistrationOverlay ?? {}),
  }
}

function mergedVolunteerOverlay(program: Program): Record<string, unknown> {
  return pickUjatRecruitVolunteerOverlay(program.ujatRegistrationOverlay ?? {})
}

/** 모집 탭 전용 — kind가 있으면 해당 overlay만 적용. 공통정보 displayProgram에는 쓰지 않는다. */
export function resolveUjatRecruitDisplayProgram(
  program: Program,
  kind?: UjatRecruitDisplayKind
): Program {
  if (kind === 'institution') {
    return applyUjatRecruitInstitutionOverlayOntoProgram(program, mergedInstitutionOverlay(program))
  }
  if (kind === 'volunteer' || kind === 'volunteer_h1' || kind === 'volunteer_h2') {
    const half = volunteerHalfFromRecruitDisplayKind(kind)
    const overlay = mergedVolunteerOverlay(program)
    if (half == null) {
      return applyUjatRecruitVolunteerOverlayOntoProgram(program, overlay)
    }
    return applyUjatRecruitVolunteerOverlayOntoProgram(
      blankUjatVolunteerRecruitProgramFields(program),
      resolveVolunteerOverlayForHalf(overlay, half)
    )
  }
  return applyUjatRecruitVolunteerTemplateDefaults(
    applyUjatRecruitInstitutionTemplateDefaults(program),
    pickUjatRecruitVolunteerOverlay(program.ujatRegistrationOverlay ?? {})
  )
}

/** 공고용 프로그램명 — 모집 유형 overlay만. 공통정보·다른 탭과 공유하지 않는다. */
export function resolveUjatRecruitAnnouncementTitle(
  program: Program,
  kind: UjatRecruitDisplayKind
): string {
  if (kind === 'institution') {
    return overlayString(mergedInstitutionOverlay(program), UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS.publicTitle) || '-'
  }
  const overlay = mergedVolunteerOverlay(program)
  const half = volunteerHalfFromRecruitDisplayKind(kind)
  if (half) {
    const halfTitle = overlayString(overlay, ujatVolunteerHalfOverlayKey(half, 'publicTitle'))
    if (halfTitle) return halfTitle
    const other: UjatVolunteerRecruitHalf = half === 'h1' ? 'h2' : 'h1'
    const otherTitle = overlayString(overlay, ujatVolunteerHalfOverlayKey(other, 'publicTitle'))
    if (otherTitle) return '-'
  }
  return overlayString(overlay, UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS.publicTitle) || '-'
}

export function ujatRecruitPublicTitleOverlayKey(kind: UjatRecruitDisplayKind): string {
  if (kind === 'institution') return UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS.publicTitle
  const half = volunteerHalfFromRecruitDisplayKind(kind)
  if (half) return ujatVolunteerHalfOverlayKey(half, 'publicTitle')
  return UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS.publicTitle
}

/** 모집 저장 — 해당 유형/반기 overlay만 갱신. 공통정보 announcementTitle은 유지 */
export function applyUjatRecruitAnnouncementTitleToDraft(args: {
  draft: Program
  existing: Program
  title: string | undefined
  kind: UjatRecruitDisplayKind
  values?: ProgramDetailEditFormValues
}): Program {
  const half = volunteerHalfFromRecruitDisplayKind(args.kind)
  const existingOverlay = args.existing.ujatRegistrationOverlay ?? {}
  const halfOverlay =
    half && args.values
      ? buildUjatRecruitVolunteerHalfOverlayFromDetailEditValues(args.values, half)
      : { [ujatRecruitPublicTitleOverlayKey(args.kind)]: args.title?.trim() ?? '' }
  const otherHalf: UjatVolunteerRecruitHalf | null =
    half === 'h1' ? 'h2' : half === 'h2' ? 'h1' : null
  const otherSnapshot =
    otherHalf != null ? snapshotVolunteerHalfFromLegacy(existingOverlay, otherHalf) : {}
  const next: Program = {
    ...args.draft,
    ujatRegistrationOverlay: {
      ...existingOverlay,
      ...(args.draft.ujatRegistrationOverlay ?? {}),
      ...otherSnapshot,
      ...halfOverlay,
    },
    generalCommonInfo: {
      ...args.draft.generalCommonInfo,
      announcementTitle: args.existing.generalCommonInfo?.announcementTitle,
    },
  }
  return half ? restoreUjatVolunteerRecruitProgramColumns(next, args.existing, half) : next
}
