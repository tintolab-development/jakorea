/**
 * 모달이 문서 스크롤을 잠글 때 스크롤바 소실로 레이아웃 폭이 바뀌지 않게 한다.
 * 페인트 전에 호출해야 딤이 뜨는 순간 폭이 줄었다 늘지 않는다 (`useLayoutEffect`).
 */

let lockCount = 0
let previousHtmlOverflow = ''
let previousBodyOverflow = ''
let previousHtmlPaddingRight = ''
let previousBodyPaddingRight = ''

function scrollbarGutterIsStable(element: HTMLElement): boolean {
  return getComputedStyle(element).scrollbarGutter.startsWith('stable')
}

export function lockBodyScroll(): () => void {
  if (lockCount === 0) {
    const { body, documentElement } = document
    previousHtmlOverflow = documentElement.style.overflow
    previousBodyOverflow = body.style.overflow
    previousHtmlPaddingRight = documentElement.style.paddingRight
    previousBodyPaddingRight = body.style.paddingRight

    const scrollbarWidth = window.innerWidth - documentElement.clientWidth
    const gutterStable = scrollbarGutterIsStable(documentElement)

    documentElement.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0 && !gutterStable) {
      documentElement.style.paddingRight = `${scrollbarWidth}px`
      body.style.paddingRight = `${scrollbarWidth}px`
    }
  }
  lockCount += 1

  return () => {
    lockCount = Math.max(0, lockCount - 1)
    if (lockCount > 0) return
    document.documentElement.style.overflow = previousHtmlOverflow
    document.body.style.overflow = previousBodyOverflow
    document.documentElement.style.paddingRight = previousHtmlPaddingRight
    document.body.style.paddingRight = previousBodyPaddingRight
  }
}
