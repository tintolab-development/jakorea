/**
 * 무한 스크롤 — 사용자가 실제로 아래로 스크롤한 뒤에만 다음 페이지 fetch.
 * 초기 진입 시 센티넬이 보이거나, 레이아웃 `scrollTo(0)` 같은 프로그램 스크롤만으로는 연쇄 호출하지 않음.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const CMS_MAIN_SCROLL_SELECTOR = '.layout-content'

/** 레이아웃 복원·jitter와 구분하는 최소 스크롤 위치 */
export const GATED_INFINITE_SCROLL_MIN_TOP_PX = 16

export interface UseGatedInfiniteScrollOptions {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => unknown
  /** 필터·탭 변경 시 scroll intent 초기화용 키 */
  resetKey: string
  rootMargin?: string
}

export function parseRootMarginPx(rootMargin: string): number {
  const match = rootMargin.trim().match(/^(-?\d+(?:\.\d+)?)px$/)
  return match ? Number(match[1]) : 200
}

export function shouldArmInfiniteScroll(
  scrollTop: number,
  minScrollTop = GATED_INFINITE_SCROLL_MIN_TOP_PX
): boolean {
  return scrollTop >= minScrollTop
}

export function shouldLoadNextInfinitePage(input: {
  armed: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  scrollTop: number
  sentinelTop: number
  rootBottom: number
  marginPx: number
  minScrollTop?: number
}): boolean {
  const minScrollTop = input.minScrollTop ?? GATED_INFINITE_SCROLL_MIN_TOP_PX
  if (!input.armed) return false
  if (!input.hasNextPage || input.isFetchingNextPage) return false
  if (input.scrollTop < minScrollTop) return false
  if (input.sentinelTop > input.rootBottom + input.marginPx) return false
  return true
}

export function useGatedInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  resetKey,
  rootMargin = '200px',
}: UseGatedInfiniteScrollOptions) {
  const [scrollRoot, setScrollRoot] = useState<Element | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const armedRef = useRef(false)
  const hasNextPageRef = useRef(hasNextPage)
  const isFetchingNextPageRef = useRef(isFetchingNextPage)
  const fetchNextPageRef = useRef(fetchNextPage)
  const marginPx = parseRootMarginPx(rootMargin)

  hasNextPageRef.current = hasNextPage
  isFetchingNextPageRef.current = isFetchingNextPage
  fetchNextPageRef.current = fetchNextPage

  useLayoutEffect(() => {
    setScrollRoot(document.querySelector(CMS_MAIN_SCROLL_SELECTOR))
  }, [])

  useEffect(() => {
    armedRef.current = false
  }, [resetKey])

  const tryFetchNextPage = useCallback(() => {
    const root = scrollRoot
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const rootRect = root.getBoundingClientRect()
    const sentinelRect = sentinel.getBoundingClientRect()
    if (
      !shouldLoadNextInfinitePage({
        armed: armedRef.current,
        hasNextPage: hasNextPageRef.current,
        isFetchingNextPage: isFetchingNextPageRef.current,
        scrollTop: root.scrollTop,
        sentinelTop: sentinelRect.top,
        rootBottom: rootRect.bottom,
        marginPx,
      })
    ) {
      return
    }

    void fetchNextPageRef.current()
  }, [marginPx, scrollRoot])

  useEffect(() => {
    const root = scrollRoot
    if (!root) return

    const onScroll = () => {
      if (!shouldArmInfiniteScroll(root.scrollTop)) return
      armedRef.current = true
      tryFetchNextPage()
    }

    root.addEventListener('scroll', onScroll, { passive: true })
    return () => root.removeEventListener('scroll', onScroll)
  }, [scrollRoot, resetKey, tryFetchNextPage])

  return { sentinelRef }
}
