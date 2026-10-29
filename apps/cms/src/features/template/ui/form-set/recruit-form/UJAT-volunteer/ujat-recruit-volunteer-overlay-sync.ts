import { createScopedOverlayStore } from '@/features/template/ui/form-set/shared/scoped-overlay-store'
import { filterUjatTypedRecruitmentOverlayPatch } from '@/features/program/ujat/lib/ujat-typed-recruitment-overlay-write-block'

const store = createScopedOverlayStore()

export function setUjatRecruitVolunteerOverlayScope(templateCode: string | undefined | null): void {
  store.setScope(templateCode)
}

export function subscribeUjatRecruitVolunteerOverlay(listener: () => void): () => void {
  return store.subscribe(listener)
}
export function getUjatRecruitVolunteerOverlayVersion(): number {
  return store.getVersion()
}
/** UI·활성 스코프 전용. persist/create 스냅샷에는 `collectSelectedRecruitOverlaysForProgram` / `collectOperationalOverlayForCatalogId`를 쓴다. */
export function getUjatRecruitVolunteerOverlayRecord(): Record<string, unknown> {
  return store.getRecord()
}

export function peekUjatRecruitVolunteerOverlayRecord(
  templateCode: string | undefined | null
): Record<string, unknown> {
  return store.peekRecord(templateCode)
}

export function replaceUjatRecruitVolunteerOverlayForScope(
  templateCode: string | undefined | null,
  next: Record<string, unknown>
): void {
  store.replaceFor(templateCode, next)
}

export function resetUjatRecruitVolunteerOverlayForScope(
  templateCode: string | undefined | null
): void {
  store.resetFor(templateCode)
}
export function patchUjatRecruitVolunteerOverlay(partial: Record<string, unknown>): void {
  const allowed = filterUjatTypedRecruitmentOverlayPatch(partial)
  if (allowed == null) return
  store.patch(allowed)
}
export function replaceUjatRecruitVolunteerOverlay(next: Record<string, unknown>): void {
  store.replace(next)
}
export function resetUjatRecruitVolunteerOverlay(): void {
  store.reset()
}
export function resetAllUjatRecruitVolunteerOverlay(): void {
  store.resetAll()
}
export function resetUjatRecruitVolunteerOverlayStoreForTests(): void {
  store.resetAll()
}
