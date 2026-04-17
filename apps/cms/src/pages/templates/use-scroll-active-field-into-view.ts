import { type RefObject, useEffect, useRef } from 'react'

/**
 * `activeFieldName` 변경 시 해당 `[data-template-field]` 노드로 스크롤.
 * 레이아웃·페인트 이후에 실행되도록 이중 rAF + 이전 스케줄 취소로 정리합니다.
 */
export function useScrollActiveFieldIntoView(
  containerRef: RefObject<HTMLElement | null>,
  activeFieldName: string | null | undefined
) {
  const rafOuterRef = useRef<number | null>(null)

  useEffect(() => {
    if (activeFieldName == null || activeFieldName === '') return
    const root = containerRef.current
    if (!root) return

    if (rafOuterRef.current !== null) {
      cancelAnimationFrame(rafOuterRef.current)
      rafOuterRef.current = null
    }

    let cancelled = false

    rafOuterRef.current = requestAnimationFrame(() => {
      rafOuterRef.current = null
      if (cancelled) return
      requestAnimationFrame(() => {
        if (cancelled) return
        const el = root.querySelector(`[data-template-field="${CSS.escape(activeFieldName)}"]`)
        if (!(el instanceof HTMLElement)) return
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      })
    })

    return () => {
      cancelled = true
      if (rafOuterRef.current !== null) {
        cancelAnimationFrame(rafOuterRef.current)
        rafOuterRef.current = null
      }
    }
  }, [activeFieldName])
}
