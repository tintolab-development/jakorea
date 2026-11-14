/**
 * 스크롤바가 레이아웃 폭을 차지하는 환경(Windows 기본 등)이면 <html>에 `scrollbar-classic`을 붙인다.
 * macOS 오버레이 스크롤바(폭 0)에서는 붙이지 않아 OS 오버레이 동작을 그대로 둔다.
 * `styles/scrollbar.css`가 이 클래스에서만 `::-webkit-scrollbar` 시안 스타일을 적용한다.
 */

export const SCROLLBAR_CLASSIC_CLASS = 'scrollbar-classic'

export function measureScrollbarWidth(doc: Document = document): number {
  const probe = doc.createElement('div')
  probe.style.cssText =
    'position:absolute;top:-9999px;left:-9999px;width:100px;height:100px;overflow:scroll;visibility:hidden;pointer-events:none;'
  doc.body.appendChild(probe)
  const width = probe.offsetWidth - probe.clientWidth
  probe.remove()
  return width
}

export function installScrollbarModeClass(doc: Document | undefined = globalThis.document): void {
  if (!doc?.documentElement) return
  const apply = () => {
    if (!doc.body) return
    doc.documentElement.classList.toggle(SCROLLBAR_CLASSIC_CLASS, measureScrollbarWidth(doc) > 0)
  }
  if (doc.body) {
    apply()
    return
  }
  doc.addEventListener('DOMContentLoaded', apply, { once: true })
}
