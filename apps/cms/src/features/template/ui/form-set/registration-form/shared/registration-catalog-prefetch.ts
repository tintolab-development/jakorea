import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'
import { getProgramRegistrationOverlayRecord } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

const SPONSOR_ALL_SENTINELS = new Set(['__all__', 'all', '전체'])

export type RegistrationCatalogOverlayBasicInfoPrefix =
  | 'generalRegistration.basicInfo'
  | 'economyRegistration.basicInfo'
  | 'ujat.basicInfo'
  | 'trainedTeachersRegistration.basicInfo'

function isMeaningfulId(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false
  if (SPONSOR_ALL_SENTINELS.has(trimmed)) return false
  if (trimmed === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE) return false
  return true
}

function hasMeaningfulIdArray(value: unknown): boolean {
  if (!Array.isArray(value)) return false
  return value.some(entry => isMeaningfulId(entry))
}

const SPONSOR_FIELD_SUFFIXES = [
  'sponsorId',
  'sponsorIds',
  'localSponsorId',
  'localSponsorIds',
] as const

/** 임시저장·이어쓰기 — overlay에 카탈로그 id가 있으면 셀렉트 open 전에도 API를 켠다 */
export function hasSponsorOrDetailedProgramInOverlay(
  prefix: RegistrationCatalogOverlayBasicInfoPrefix
): boolean {
  const overlay = getProgramRegistrationOverlayRecord()
  for (const suffix of SPONSOR_FIELD_SUFFIXES) {
    const value = overlay[`${prefix}.${suffix}`]
    if (isMeaningfulId(value)) return true
    if (hasMeaningfulIdArray(value)) return true
  }
  if (isMeaningfulId(overlay[`${prefix}.detailedProgramId`])) return true
  return false
}
