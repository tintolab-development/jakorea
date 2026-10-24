/**
 * 일반 신규 등록 모집 — Overlay 키를 RHF recruitmentKv 에 둔다.
 * RecruitmentFormValues 변환은 CREATE/검증 adapter 에서만 한다.
 * 미디어 키는 RHF에 넣지 않는다.
 */
import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import type { RegistrationWizardUiValues } from './registration-wizard-ui-values'
import {
  peekGeneralRegistrationWizardRhf,
  subscribeGeneralRegistrationWizardRhf,
} from './registration-wizard-rhf-api'

export { peekGeneralRegistrationWizardRhf, subscribeGeneralRegistrationWizardRhf }

let projectingRecruitmentFromWizardRhf = 0

export function beginWizardRecruitmentRhfProjection(): void {
  projectingRecruitmentFromWizardRhf += 1
}

export function endWizardRecruitmentRhfProjection(): void {
  projectingRecruitmentFromWizardRhf = Math.max(0, projectingRecruitmentFromWizardRhf - 1)
}

export function isWizardRecruitmentRhfProjecting(): boolean {
  return projectingRecruitmentFromWizardRhf > 0
}

const MEDIA_KEY_SUFFIXES = [
  'thumbFileObjectId',
  'thumbObjectUrl',
  'thumbFileName',
  'thumbContentUrl',
  'attachmentFileNames',
  'attachmentFileObjectIds',
  'keyVisualImage',
] as const

export function isRecruitMediaOverlayKey(key: string): boolean {
  return MEDIA_KEY_SUFFIXES.some(suffix => key === suffix || key.endsWith(`.${suffix}`))
}

function isEphemeralBlobUrl(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('blob:')
}

export function isInstitutionRecruitOwnedKey(key: string): boolean {
  if (isRecruitMediaOverlayKey(key)) return false
  if (key.startsWith('recruit.detailInfo')) return true
  if (!key.startsWith('recruit.')) return false
  if (key.startsWith('recruit.individual')) return false
  if (key.startsWith('recruit.instructor')) return false
  if (key.startsWith('recruit.volunteer')) return false
  return true
}

export function isGeneralRecruitOwnedKey(key: string): boolean {
  if (isRecruitMediaOverlayKey(key)) return false
  if (key.startsWith('recruit.individual')) return true
  if (key.startsWith('recruit.instructor')) return true
  if (key.startsWith('recruit.volunteer')) return true
  if (key.startsWith('recruitInstructor.detailInfo')) return true
  if (key.startsWith('recruitVolunteer')) return true
  if (key.startsWith('recruit.detailInfo')) return true
  return false
}

export function isWizardRecruitOwnedOverlayKey(key: string): boolean {
  return isInstitutionRecruitOwnedKey(key) || isGeneralRecruitOwnedKey(key)
}

export function pickRecruitOwnedOverlay(
  overlay: Record<string, unknown> | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(overlay ?? {})) {
    if (!isWizardRecruitOwnedOverlayKey(key)) continue
    if (isEphemeralBlobUrl(value)) continue
    out[key] = value
  }
  return out
}

export function pickRecruitMediaPersistOverlay(
  overlay: Record<string, unknown> | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(overlay ?? {})) {
    if (!isRecruitMediaOverlayKey(key)) continue
    if (isEphemeralBlobUrl(value)) continue
    if (key.endsWith('.thumbObjectUrl') || key.endsWith('.keyVisualImage')) continue
    out[key] = value
  }
  return out
}

export function selectRecruitmentKvForParticipant(
  kv: Record<string, unknown> | undefined,
  participant: ProgramRegistrationParticipantSelection
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(kv ?? {})) {
    if (isInstitutionRecruitOwnedKey(key) && participant.organization) {
      out[key] = value
      continue
    }
    if (key.startsWith('recruit.individual') && participant.individual) {
      out[key] = value
      continue
    }
    if (
      (key.startsWith('recruit.instructor') || key.startsWith('recruitInstructor.detailInfo')) &&
      participant.teacherInstructor
    ) {
      out[key] = value
      continue
    }
    if (
      (key.startsWith('recruit.volunteer') || key.startsWith('recruitVolunteer')) &&
      participant.volunteer
    ) {
      out[key] = value
      continue
    }
    if (key.startsWith('recruit.detailInfo') && (participant.organization || participant.individual)) {
      out[key] = value
    }
  }
  return out
}

export function participantFromWizardUi(
  values: RegistrationWizardUiValues
): ProgramRegistrationParticipantSelection {
  return values.extras.participant
}

export function writeRecruitmentKvPartial(
  values: RegistrationWizardUiValues,
  partial: Record<string, unknown>
): RegistrationWizardUiValues {
  const recruitmentKv = { ...values.recruitmentKv }
  for (const [key, value] of Object.entries(partial)) {
    if (!isWizardRecruitOwnedOverlayKey(key)) continue
    recruitmentKv[key] = value
  }
  return { ...values, recruitmentKv }
}

export function readWizardRecruitmentKvValue<T>(key: string, defaultValue: T): T {
  const api = peekGeneralRegistrationWizardRhf()
  if (api == null) return defaultValue
  const kv = api.getValues().recruitmentKv
  if (!Object.prototype.hasOwnProperty.call(kv, key)) return defaultValue
  return kv[key] as T
}

export function patchWizardRecruitmentKv(
  partial: Record<string, unknown>,
  options?: { shouldDirty?: boolean }
): boolean {
  const api = peekGeneralRegistrationWizardRhf()
  if (api == null) return false
  const owned = pickRecruitOwnedOverlay(partial)
  if (Object.keys(owned).length === 0) return false
  const recruitmentKv = { ...api.getValues().recruitmentKv, ...owned }
  api.setPath('recruitmentKv', recruitmentKv, { shouldDirty: options?.shouldDirty ?? true })
  return true
}

function keyBelongsToRecruitCatalog(key: string, catalogId: string): boolean {
  if (catalogId === 'recruitment-participant-school') {
    return isInstitutionRecruitOwnedKey(key)
  }
  if (catalogId === 'recruitment-participant-individual') {
    return key.startsWith('recruit.individual') || key.startsWith('recruit.detailInfo')
  }
  if (catalogId === 'recruitment-instructor') {
    return key.startsWith('recruit.instructor') || key.startsWith('recruitInstructor.detailInfo')
  }
  if (catalogId === 'recruitment-volunteer') {
    return key.startsWith('recruit.volunteer') || key.startsWith('recruitVolunteer')
  }
  return isWizardRecruitOwnedOverlayKey(key)
}

export function mergeWizardRecruitmentIntoOverlayRecord(
  stored: Record<string, unknown>,
  catalogId?: string | null
): Record<string, unknown> {
  const api = peekGeneralRegistrationWizardRhf()
  if (api == null) return stored
  const participant = participantFromWizardUi(api.getValues())
  const projected = selectRecruitmentKvForParticipant(api.getValues().recruitmentKv, participant)
  const merged: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(stored)) {
    const ownedForCatalog =
      isWizardRecruitOwnedOverlayKey(key) &&
      (catalogId == null || catalogId === '' || keyBelongsToRecruitCatalog(key, catalogId))
    if (ownedForCatalog) continue
    merged[key] = value
  }
  for (const [key, value] of Object.entries(projected)) {
    if (isRecruitMediaOverlayKey(key)) continue
    if (catalogId && !keyBelongsToRecruitCatalog(key, catalogId)) continue
    merged[key] = value
  }
  return merged
}
