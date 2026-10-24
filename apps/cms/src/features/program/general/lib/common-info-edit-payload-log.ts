/**
 * 일반 프로그램 공통정보 「정보 수정」 — 디버깅 로그.
 * Overlay 재구성 덤프와 Independent PATCH 를 분리한다. 제품 Mutation 을 발생시키지 않는다.
 */
import type { ZodIssue } from 'zod'
import type { Program } from '@/types/domain'
import { mapGeneralProgramToUpdateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import { applyGeneralRegistrationOverlayToProgram } from '@/features/program/general/lib/registration-overlay-to-program'
import {
  describeIncompleteGeneralProgramDetailEditRequiredFields,
  extrasFromGeneralProgram,
  getGeneralRegistrationDetailEditExtras,
  readGeneralRegistrationOverlayForSave,
  resyncGeneralRegistrationOverlayFromProgram,
} from '@/features/program/general/lib/registration-overlay-sync'
import { isPreEducationCurriculumSession } from '@/features/program/general/lib/schedule-detail-form'
import type { GeneralProgramCommonInfoEditFormValues } from '@/features/program/general/model/common-info-edit-schema'
import type { GeneralCommonInfoRhfValidationResult } from '@/features/program/general/lib/overlay-phase1/common-info-rhf-validation'

function isDevPayloadLogEnabled(): boolean {
  try {
    return import.meta.env?.DEV === true
  } catch {
    return process.env.NODE_ENV !== 'production'
  }
}

function parseServiceDetailJson(raw: string | undefined): unknown {
  if (typeof raw !== 'string' || !raw.trim()) return raw
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function summarizeRhfCurriculum(values: GeneralProgramCommonInfoEditFormValues) {
  const sessions = values.curriculumSessions ?? []
  return {
    total: sessions.length,
    preEducation: sessions.filter(session => isPreEducationCurriculumSession(session)).length,
    regular: sessions.filter(session => !isPreEducationCurriculumSession(session)).length,
    labels: sessions.map(session => session.sessionLabel),
  }
}

function summarizePatchCurriculum(patch: Partial<Program>) {
  const sessions = patch.generalCommonInfo?.curriculumSessions
  if (!Array.isArray(sessions)) {
    return { omitted: !Object.prototype.hasOwnProperty.call(patch.generalCommonInfo ?? {}, 'curriculumSessions') }
  }
  return {
    omitted: false,
    count: sessions.length,
    labels: sessions.map(session => session.sessionLabel),
    titles: sessions.map(session => session.title),
  }
}

/** Overlay 재구성 덤프. Independent PATCH 가 아니다. */
export function logGeneralProgramCommonInfoEditCurrentPayload(
  program: Program,
  reason: 'enter' | 'save' = 'enter'
): void {
  if (!isDevPayloadLogEnabled()) return
  const extras =
    reason === 'save'
      ? (getGeneralRegistrationDetailEditExtras() ?? extrasFromGeneralProgram(program))
      : extrasFromGeneralProgram(program)
  const overlay = readGeneralRegistrationOverlayForSave()
  const applied = applyGeneralRegistrationOverlayToProgram(program, overlay, extras)
  const withType: Program = {
    ...applied,
    generalProgramEducationStructure: extras.programType,
    generalProgramSessionRound: extras.sessionRoundType,
    registrationOverlay: overlay,
  }
  const syncedOverlay = resyncGeneralRegistrationOverlayFromProgram(withType, overlay)
  const withOverlay: Program = {
    ...withType,
    registrationOverlay: syncedOverlay,
  }
  const request = mapGeneralProgramToUpdateRequest(withOverlay, {
    registrationOverlay: withOverlay.registrationOverlay,
    generalCommonInfo: withOverlay.generalCommonInfo,
    generalProgramEducationStructure: extras.programType,
    generalProgramSessionRound: extras.sessionRoundType,
  })
  console.info('[general common-info overlay debug — not Independent PATCH]', {
    reason,
    programId: program.id,
    extras,
    overlayIncompleteReason: describeIncompleteGeneralProgramDetailEditRequiredFields(
      overlay,
      extras
    ),
    overlay,
    overlayReconstructedPayload: {
      ...request,
      serviceDetailJson: parseServiceDetailJson(request.serviceDetailJson ?? undefined),
    },
  })
}

export function logGeneralProgramCommonInfoIndependentSave(args: {
  programId: string
  values: GeneralProgramCommonInfoEditFormValues
  rhfValidation: GeneralCommonInfoRhfValidationResult
  patch: Partial<Program>
}): void {
  if (!isDevPayloadLogEnabled()) return
  const issues: readonly ZodIssue[] = args.rhfValidation.ok ? [] : args.rhfValidation.issues
  console.info('[general common-info Independent save]', {
    programId: args.programId,
    rhfCurriculum: summarizeRhfCurriculum(args.values),
    rhfValidationOk: args.rhfValidation.ok,
    rhfValidationMessage: args.rhfValidation.ok ? null : args.rhfValidation.message,
    rhfValidationKeys: args.rhfValidation.ok ? [] : args.rhfValidation.keys,
    rhfIssuePaths: issues.map(issue => issue.path.join('.')),
    independentPatchCurriculumSessions: summarizePatchCurriculum(args.patch),
  })
}
