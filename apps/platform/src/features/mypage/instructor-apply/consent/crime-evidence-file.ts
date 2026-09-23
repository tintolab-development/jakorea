const STORAGE_KEY = 'platform.instructor-apply.crime-evidence-file-id'

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function loadCrimeEvidenceFileObjectId(): number | null {
  if (!canUseSessionStorage()) return null
  const raw = window.sessionStorage.getItem(STORAGE_KEY)?.trim() ?? ''
  if (!/^\d+$/.test(raw)) return null
  const id = Number(raw)
  return id > 0 ? id : null
}

export function saveCrimeEvidenceFileObjectId(fileObjectId: number | null): void {
  if (!canUseSessionStorage()) return
  if (fileObjectId == null) {
    window.sessionStorage.removeItem(STORAGE_KEY)
    return
  }
  window.sessionStorage.setItem(STORAGE_KEY, String(fileObjectId))
}
