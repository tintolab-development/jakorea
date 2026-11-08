import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  navigateToAncestorOrReplace,
  navigateToAncestorSearch,
  navigateBackToMatchingEntry,
  type HistoryTarget,
} from '@/shared/lib/history-ancestor-navigation'

// 엔트리 기록은 `app/router`의 `recordRouterHistory(router)`가 담당한다.

/** 브레드크럼 상위·중첩 닫기·모달 닫기 — 지나온 엔트리로 뒤로, 없으면 replace */
export function useNavigateToAncestor() {
  const navigate = useNavigate()
  const toTarget = useCallback(
    (target: HistoryTarget) => navigateToAncestorOrReplace(navigate, target),
    [navigate]
  )
  const toSearch = useCallback(
    (recipe: (current: URLSearchParams) => URLSearchParams) =>
      navigateToAncestorSearch(navigate, recipe),
    [navigate]
  )
  const toMatchingEntry = useCallback(
    (matches: (search: URLSearchParams) => boolean) =>
      navigateBackToMatchingEntry(navigate, matches),
    [navigate]
  )
  return { toTarget, toSearch, toMatchingEntry }
}
