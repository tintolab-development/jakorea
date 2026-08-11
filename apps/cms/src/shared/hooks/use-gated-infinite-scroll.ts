/**
 * 무한 스크롤 — 사용자가 스크롤한 뒤, 스크롤 컨테이너 하단 근처일 때만 다음 페이지 fetch.
 * 초기 진입 시 센티넬이 보여도 연쇄 호출하지 않음.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const CMS_MAIN_SCROLL_SELECTOR = '.layout-content'

export interface UseGatedInfiniteScrollOptions {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => unknown
  /** 필터·탭 변경 시 scroll intent 초기화용 키 */
  resetKey: string
  rootMargin?: string
}

function parseRootMarginPx(rootMargin: string): number {
  const match = rootMargin.trim().match(/^(-?\d+(?:\.\d+)?)px$/)
  return match ? Number(match[1]) : 200
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
    if (!armedRef.current) return
    if (!hasNextPageRef.current || isFetchingNextPageRef.current) return

    const root = scrollRoot
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const rootRect = root.getBoundingClientRect()
    const sentinelRect = sentinel.getBoundingClientRect()
    if (sentinelRect.top > rootRect.bottom + marginPx) return

    void fetchNextPageRef.current()
  }, [marginPx, scrollRoot])

  useEffect(() => {
    const root = scrollRoot
    if (!root) return

    const onScroll = () => {
      armedRef.current = true
      tryFetchNextPage()
    }

    root.addEventListener('scroll', onScroll, { passive: true })
    return () => root.removeEventListener('scroll', onScroll)
  }, [scrollRoot, resetKey, tryFetchNextPage])

  return { sentinelRef }
}
