/**
 * 일반 신규 등록 신청 — Overlay 키를 RHF applicationKv 에 둔다.
 * ApplicationFormValues 변환은 Form Version adapter 에서만 한다.
 */
import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import type { RegistrationWizardUiValues } from './registration-wizard-ui-values'
import {
  peekGeneralRegistrationWizardRhf,
  subscribeGeneralRegistrationWizardRhf,
} from './registration-wizard-rhf-api'

export { peekGeneralRegistrationWizardRhf, subscribeGeneralRegistrationWizardRhf }

export const INDIVIDUAL_APPLICATION_FIXED_SCHEDULE_KEY =
  'application.individual.fixedScheduleSelected' as const
export const INSTITUTION_APPLICATION_FIXED_SCHEDULE_KEY =
  'application.institution.fixedScheduleSelected' as const

let projectingApplicationFromWizardRhf = 0

export function beginWizardApplicationRhfProjection(): void {
  projectingApplicationFromWizardRhf += 1
}

export function endWizardApplicationRhfProjection(): void {
  projectingApplicationFromWizardRhf = Math.max(0, projectingApplicationFromWizardRhf - 1)
}

export function isWizardApplicationRhfProjecting(): boolean {
  return projectingApplicationFromWizardRhf > 0
}

export function isInstitutionApplicationOwnedKey(key: string): boolean {
  return key === 'application.institution' || key.startsWith('application.institution.')
}

export function isIndividualApplicationOwnedKey(key: string): boolean {
  return key === 'application.individual' || key.startsWith('application.individual.')
}

export function isInstructorApplicationOwnedKey(key: string): boolean {
  return key === 'application.instructor' || key.startsWith('application.instructor.')
}

export function isVolunteerApplicationOwnedKey(key: string): boolean {
  return key === 'application.volunteer' || key.startsWith('application.volunteer.')
}

export function isWizardApplicationOwnedOverlayKey(key: string): boolean {
  return (
    isInstitutionApplicationOwnedKey(key) ||
    isIndividualApplicationOwnedKey(key) ||
    isInstructorApplicationOwnedKey(key) ||
    isVolunteerApplicationOwnedKey(key)
  )
}

export function pickApplicationOwnedOverlay(
  overlay: Record<string, unknown> | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(overlay ?? {})) {
    if (!isWizardApplicationOwnedOverlayKey(key)) continue
    out[key] = value
  }
  return out
}

export function participantFromWizardUi(
  values: RegistrationWizardUiValues
): ProgramRegistrationParticipantSelection {
  return values.extras.participant
}

export function canonicalizeWizardApplicationKv(
  kv: Record<string, unknown> | undefined,
  participant: ProgramRegistrationParticipantSelection
): Record<string, unknown> {
  const next = { ...(kv ?? {}) }
  if (
    participant.individual &&
    !participant.organization &&
    !Object.prototype.hasOwnProperty.call(next, INDIVIDUAL_APPLICATION_FIXED_SCHEDULE_KEY) &&
    Object.prototype.hasOwnProperty.call(next, INSTITUTION_APPLICATION_FIXED_SCHEDULE_KEY)
  ) {
    next[INDIVIDUAL_APPLICATION_FIXED_SCHEDULE_KEY] =
      next[INSTITUTION_APPLICATION_FIXED_SCHEDULE_KEY]
  }
  if (participant.individual && !participant.organization) {
    delete next[INSTITUTION_APPLICATION_FIXED_SCHEDULE_KEY]
  }
  return next
}

export function selectApplicationKvForParticipant(
  kv: Record<string, unknown> | undefined,
  participant: ProgramRegistrationParticipantSelection
): Record<string, unknown> {
  const canonical = canonicalizeWizardApplicationKv(kv, participant)
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(canonical)) {
    if (isInstitutionApplicationOwnedKey(key) && participant.organization) {
      out[key] = value
      continue
    }
    if (isIndividualApplicationOwnedKey(key) && participant.individual) {
      out[key] = value
      continue
    }
    if (isInstructorApplicationOwnedKey(key) && participant.teacherInstructor) {
      out[key] = value
      continue
    }
    if (isVolunteerApplicationOwnedKey(key) && participant.volunteer) {
      out[key] = value
    }
  }
  return out
}

export function readWizardApplicationKvValue<T>(key: string, defaultValue: T): T {
  const api = peekGeneralRegistrationWizardRhf()
  if (api == null) return defaultValue
  const kv = canonicalizeWizardApplicationKv(
    api.getValues().applicationKv,
    participantFromWizardUi(api.getValues())
  )
  if (!Object.prototype.hasOwnProperty.call(kv, key)) return defaultValue
  return kv[key] as T
}

export function patchWizardApplicationKv(
  partial: Record<string, unknown>,
  options?: { shouldDirty?: boolean }
): boolean {
  const api = peekGeneralRegistrationWizardRhf()
  if (api == null) return false
  const owned = pickApplicationOwnedOverlay(partial)
  if (Object.keys(owned).length === 0) return false
  const participant = participantFromWizardUi(api.getValues())
  const applicationKv = canonicalizeWizardApplicationKv(
    { ...api.getValues().applicationKv, ...owned },
    participant
  )
  api.setPath('applicationKv', applicationKv, { shouldDirty: options?.shouldDirty ?? true })
  return true
}

function keyBelongsToApplicationCatalog(key: string, catalogId: string): boolean {
  if (catalogId === 'application-participant-school' || catalogId.startsWith('application-participant-school')) {
    return isInstitutionApplicationOwnedKey(key)
  }
  if (
    catalogId === 'application-participant-individual' ||
    catalogId.startsWith('application-participant-individual')
  ) {
    return isIndividualApplicationOwnedKey(key)
  }
  if (catalogId === 'application-instructor' || catalogId.startsWith('application-instructor')) {
    return isInstructorApplicationOwnedKey(key)
  }
  if (catalogId === 'application-volunteer' || catalogId.startsWith('application-volunteer')) {
    return isVolunteerApplicationOwnedKey(key)
  }
  return isWizardApplicationOwnedOverlayKey(key)
}

export function mergeWizardApplicationIntoOverlayRecord(
  stored: Record<string, unknown>,
  catalogId?: string | null
): Record<string, unknown> {
  const api = peekGeneralRegistrationWizardRhf()
  if (api == null) return stored
  const participant = participantFromWizardUi(api.getValues())
  const projected = selectApplicationKvForParticipant(api.getValues().applicationKv, participant)
  const merged: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(stored)) {
    const ownedForCatalog =
      isWizardApplicationOwnedOverlayKey(key) &&
      (catalogId == null || catalogId === '' || keyBelongsToApplicationCatalog(key, catalogId))
    if (ownedForCatalog) continue
    merged[key] = value
  }
  for (const [key, value] of Object.entries(projected)) {
    if (catalogId && !keyBelongsToApplicationCatalog(key, catalogId)) continue
    merged[key] = value
  }
  return merged
}
