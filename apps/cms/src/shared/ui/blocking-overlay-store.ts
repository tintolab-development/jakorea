type Listener = () => void

let depth = 0
const listeners = new Set<Listener>()

function emit(): void {
  listeners.forEach(listener => listener())
}

export function subscribeBlockingOverlay(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function isBlockingOverlayActive(): boolean {
  return depth > 0
}

/** 중첩 작업이 모두 끝날 때까지 오버레이를 유지한다. 반환 함수는 한 번만 감소한다. */
export function beginBlockingOverlay(): () => void {
  depth += 1
  emit()
  let ended = false
  return () => {
    if (ended) return
    ended = true
    depth = Math.max(0, depth - 1)
    emit()
  }
}
