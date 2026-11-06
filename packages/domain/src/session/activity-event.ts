export type ActivityEventLike = {
  type?: string
  isTrusted?: boolean
  target?: EventTarget | null
}

const WARNING_ROOT_ATTR = 'data-session-warning-root'

export function isTrustedUserActivityEvent(event: ActivityEventLike): boolean {
  if (event.isTrusted !== true) return false
  const type = event.type ?? ''
  return type === 'pointerdown' || type === 'keydown' || type === 'touchstart' || type === 'wheel'
}

export function shouldIgnoreActivityTarget(target: EventTarget | null | undefined): boolean {
  if (target == null || !(target instanceof Element)) return false
  return target.closest(`[${WARNING_ROOT_ATTR}]`) != null
}
