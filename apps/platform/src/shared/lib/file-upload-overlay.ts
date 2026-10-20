let activeCount = 0
const listeners = new Set<() => void>()

function emitFileUploadOverlay() {
  for (const listener of listeners) listener()
}

export function beginFileUploadOverlay() {
  activeCount += 1
  emitFileUploadOverlay()
}

export function endFileUploadOverlay() {
  activeCount = Math.max(0, activeCount - 1)
  emitFileUploadOverlay()
}

export function subscribeFileUploadOverlay(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getFileUploadOverlayActive() {
  return activeCount > 0
}

export function getFileUploadOverlayServerSnapshot() {
  return false
}

/** 병렬 업로드가 모두 끝날 때까지 오버레이를 유지한다. 실패해도 카운터를 내린다. */
export async function withFileUploadOverlay<T>(task: () => Promise<T>): Promise<T> {
  beginFileUploadOverlay()
  try {
    return await task()
  } finally {
    endFileUploadOverlay()
  }
}
