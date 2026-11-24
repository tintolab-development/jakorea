import { getAuthGeneration } from '@/features/auth/lib/auth-generation'

/** Only locally selected images may be reused. Persisted server images always reauthorize. */
const localUploads = new Map<number, Blob>()
const objectUrls = new Set<string>()
const MAX_LOCAL_BYTES = 64 * 1024 * 1024
const MAX_LOCAL_FILES = 16
let localBytes = 0
let epoch = 0
let observedAuthGeneration = getAuthGeneration()

export function clearProgramThumbnailPreviewCache(): void {
  epoch += 1
  observedAuthGeneration = getAuthGeneration()
  localUploads.clear()
  localBytes = 0
  for (const url of objectUrls) URL.revokeObjectURL(url)
  objectUrls.clear()
}

function synchronizeAuthGeneration(): void {
  if (observedAuthGeneration !== getAuthGeneration()) clearProgramThumbnailPreviewCache()
}

export function captureProgramThumbnailPreviewSession(): number {
  synchronizeAuthGeneration()
  return epoch
}

export function isProgramThumbnailPreviewSessionCurrent(session: number): boolean {
  return captureProgramThumbnailPreviewSession() === session
}

export function isPreviewableImageBlob(blob: Blob): boolean {
  return blob.size > 0 && blob.type.toLowerCase().startsWith('image/')
}

export function forgetProgramThumbnailPreviewBlob(fileObjectId: number | null | undefined): void {
  synchronizeAuthGeneration()
  if (fileObjectId == null) return
  const old = localUploads.get(fileObjectId)
  if (old) localBytes -= old.size
  localUploads.delete(fileObjectId)
}

export function rememberProgramThumbnailPreviewBlob(
  fileObjectId: number,
  blob: Blob,
  session: number
): void {
  if (!isProgramThumbnailPreviewSessionCurrent(session) ||
      !Number.isSafeInteger(fileObjectId) || fileObjectId < 1 || !isPreviewableImageBlob(blob)) return
  forgetProgramThumbnailPreviewBlob(fileObjectId)
  if (blob.size > MAX_LOCAL_BYTES) return
  while (localUploads.size >= MAX_LOCAL_FILES || localBytes + blob.size > MAX_LOCAL_BYTES) {
    const oldest = localUploads.keys().next().value
    if (oldest === undefined) break
    forgetProgramThumbnailPreviewBlob(oldest)
  }
  localUploads.set(fileObjectId, blob)
  localBytes += blob.size
}

export function readLocalProgramThumbnailPreviewBlob(fileObjectId: number): Blob | undefined {
  synchronizeAuthGeneration()
  return localUploads.get(fileObjectId)
}

export function createProgramThumbnailPreviewUrl(
  blob: Blob,
  session = captureProgramThumbnailPreviewSession()
): string {
  if (!isProgramThumbnailPreviewSessionCurrent(session)) {
    throw new Error('미리보기 인증 세션이 변경되었습니다.')
  }
  const url = URL.createObjectURL(blob)
  objectUrls.add(url)
  return url
}

export function releaseProgramThumbnailPreviewUrl(url: string | null | undefined): void {
  if (!url?.startsWith('blob:')) return
  objectUrls.delete(url)
  URL.revokeObjectURL(url)
}
