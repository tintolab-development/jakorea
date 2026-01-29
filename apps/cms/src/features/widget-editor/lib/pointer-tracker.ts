/**
 * 드래그 중 포인터 X 위치 추적 (RGL이 이벤트를 넘기지 않을 때 대비)
 * onDragStart에서 start(), onDragStop에서 getLastX() 후 stop()
 */

let lastPointerX: number | null = null
let unsubscribe: (() => void) | null = null

function onPointerMove(e: PointerEvent): void {
  lastPointerX = e.clientX
}

export function startPointerTracking(): void {
  if (unsubscribe) return
  lastPointerX = null
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  unsubscribe = () => {
    window.removeEventListener('pointermove', onPointerMove)
    unsubscribe = null
  }
}

export function stopPointerTracking(): void {
  if (unsubscribe) {
    unsubscribe()
  }
  lastPointerX = null
}

/**
 * 마지막으로 기록된 포인터 clientX. 없으면 null.
 */
export function getLastPointerX(): number | null {
  return lastPointerX
}
