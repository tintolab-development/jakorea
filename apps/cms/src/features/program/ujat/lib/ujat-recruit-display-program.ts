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
import {
  loadUjatRecruitInstitutionTemplateSave,
  loadUjatRecruitVolunteerTemplateSave,
} from '@/features/program/ujat/lib/ujat-recruit-template-local-save'

export type UjatRecruitDisplayKind = 'institution' | 'volunteer'

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
  return {
    ...(loadUjatRecruitVolunteerTemplateSave()?.overlay ?? {}),
    ...pickUjatRecruitVolunteerOverlay(program.ujatRegistrationOverlay ?? {}),
  }
}

/** 모집 탭 전용 — kind가 있으면 해당 overlay만 적용. 공통정보 displayProgram에는 쓰지 않는다. */
export function resolveUjatRecruitDisplayProgram(
  program: Program,
  kind?: UjatRecruitDisplayKind
): Program {
  if (kind === 'institution') {
    return applyUjatRecruitInstitutionOverlayOntoProgram(program, mergedInstitutionOverlay(program))
  }
  if (kind === 'volunteer') {
    return applyUjatRecruitVolunteerOverlayOntoProgram(program, mergedVolunteerOverlay(program))
  }
  return applyUjatRecruitVolunteerTemplateDefaults(
    applyUjatRecruitInstitutionTemplateDefaults(program),
    pickUjatRecruitVolunteerOverlay(program.ujatRegistrationOverlay ?? {})
  )
}

/** 공고용 프로그램명 — 대표명 alias로 비우지 않고 모집 overlay를 우선한다. */
export function resolveUjatRecruitAnnouncementTitle(
  program: Program,
  kind: UjatRecruitDisplayKind
): string {
  const overlay = kind === 'institution' ? mergedInstitutionOverlay(program) : mergedVolunteerOverlay(program)
  const key =
    kind === 'institution'
      ? UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS.publicTitle
      : UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS.publicTitle
  return overlayString(overlay, key) || program.generalCommonInfo?.announcementTitle?.trim() || '-'
}
