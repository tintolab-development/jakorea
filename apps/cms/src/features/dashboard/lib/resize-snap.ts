/** 리사이즈 핸들 스냅 트리거 최소 드래그 거리 (px) */
export const RESIZE_THRESHOLD_PX = 20

/**
 * 제스처 시작 colSpan과 순 이동량으로 12(50%) / 24(100%) 목표를 계산한다.
 * pointermove 중 커밋하지 않고, pointerup에서 한 번만 적용한다.
 */
export function resolveResizeSnap(
  startColSpan: 12 | 24,
  deltaX: number,
  thresholdPx = RESIZE_THRESHOLD_PX
): 12 | 24 {
  if (deltaX > thresholdPx) return 24
  if (deltaX < -thresholdPx) return 12
  return startColSpan
}
