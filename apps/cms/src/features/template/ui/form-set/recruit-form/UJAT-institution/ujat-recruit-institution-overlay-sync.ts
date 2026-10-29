import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'
import { filterUjatTypedRecruitmentOverlayPatch } from '@/features/program/ujat/lib/ujat-typed-recruitment-overlay-write-block'

/**
 * UJAT 학교 모집 폼 템플릿 편집기·미리보기가 각각 마운트될 때 로컬 state가 갈라지지 않도록 공유한다.
 */
const store = createScopedOverlayStore()

export function setUjatRecruitInstitutionOverlayScope(
  templateCode: string | undefined | null
): void {
  store.setScope(templateCode)
}

export function subscribeUjatRecruitInstitutionOverlay(listener: () => void): () => void {
  return store.subscribe(listener)
}
export function getUjatRecruitInstitutionOverlayVersion(): number {
  return store.getVersion()
}
/** UI·활성 스코프 전용. persist/create 스냅샷에는 `collectSelectedRecruitOverlaysForProgram` / `collectOperationalOverlayForCatalogId`를 쓴다. */
export function getUjatRecruitInstitutionOverlayRecord(): Record<string, unknown> {
  return store.getRecord()
}

export function peekUjatRecruitInstitutionOverlayRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  return store.peekRecord(templateCode)
}

export function replaceUjatRecruitInstitutionOverlayForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  store.replaceFor(templateCode, next)
}

export function resetUjatRecruitInstitutionOverlayForScope(
  templateCode: string | undefined | null
): void {
  store.resetFor(templateCode)
}
export function patchUjatRecruitInstitutionOverlay(partial: Record<string, unknown>): void {
  const allowed = filterUjatTypedRecruitmentOverlayPatch(partial)
  if (allowed == null) return
  store.patch(allowed)
}
export function replaceUjatRecruitInstitutionOverlay(next: Record<string, unknown>): void {
  store.replace(next)
}
export function resetUjatRecruitInstitutionOverlay(): void {
  store.reset()
}
export function resetAllUjatRecruitInstitutionOverlay(): void {
  store.resetAll()
}
export function resetUjatRecruitInstitutionOverlayStoreForTests(): void {
  store.resetAll()
}
