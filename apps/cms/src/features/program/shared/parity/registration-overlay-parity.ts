import type { Program } from '@/types/domain'
import { listVisibleOperationalFormSpecs } from '@/features/program/general/lib/operational-form-bindings'
import { collectOperationalOverlayForCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import { getProgramRegistrationOverlayRecord } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { flattenForParity } from './flatten'

/** 시드 후 registration + recruit catalog overlay를 키 단위로 조회 */
export function buildOperationalOverlayLookupAfterSeed(program: Program): Record<string, unknown> {
  const out: Record<string, unknown> = { ...getProgramRegistrationOverlayRecord() }
  for (const spec of listVisibleOperationalFormSpecs(program)) {
    const collected = collectOperationalOverlayForCatalogId(spec.templateCode)
    if (collected) Object.assign(out, collected)
  }
  return out
}

/** GET에 실려 온 persisted overlay 키만 strict gate에 포함 (시드가 program에서 파생하는 키는 제외) */
export function flattenPersistedRegistrationOverlaySlice(
  program: Program,
  storeOverlay?: Record<string, unknown>
): ReturnType<typeof flattenForParity> {
  const persisted = program.registrationOverlay ?? {}
  const keys = Object.keys(persisted)
  const slice: Record<string, unknown> = {}
  for (const key of keys) {
    slice[key] = storeOverlay ? storeOverlay[key] : persisted[key]
  }
  return flattenForParity({ registrationOverlay: slice })
}
