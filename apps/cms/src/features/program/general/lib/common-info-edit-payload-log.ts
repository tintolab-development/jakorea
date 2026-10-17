/**
 * 일반 프로그램 공통정보 「정보 수정」 — 현상태 기준 persist payload 콘솔 덤프.
 */
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

function parseServiceDetailJson(raw: string | undefined): unknown {
  if (typeof raw !== 'string' || !raw.trim()) return raw
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

export function logGeneralProgramCommonInfoEditCurrentPayload(
  program: Program,
  reason: 'enter' | 'save' = 'enter'
): void {
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
  console.info('[general common-info 정보 수정] current payload', {
    reason,
    programId: program.id,
    extras,
    incompleteReason: describeIncompleteGeneralProgramDetailEditRequiredFields(overlay, extras),
    overlay,
    payload: {
      ...request,
      serviceDetailJson: parseServiceDetailJson(request.serviceDetailJson ?? undefined),
    },
  })
}
