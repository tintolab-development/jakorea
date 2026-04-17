/**
 * 공지 카테고리 목록 — mock 저장소와 React 상태 동기화
 * 다른 페이지에서도 동일 훅으로 필터·폼과 목록 소스를 맞출 수 있음
 */

import { useCallback, useMemo, useState } from 'react'
import {
  listNoticeCategoryRows,
  replaceNoticeCategoryRows,
} from '@/features/posts/api/admin-notice-category-mock-store'
import type { NoticeCategoryRow } from '@/features/posts/model/admin-notice-management.types'

export type UseAdminNoticeCategoriesResult = {
  categoryRows: NoticeCategoryRow[]
  /** 필터·테이블 context용 라벨 배열 */
  allowedCategoryLabels: readonly string[]
  /** 필터 유효성 검사용 */
  allowedCategorySet: ReadonlySet<string>
  /** 저장소 반영 + 로컬 state 갱신 */
  replaceCategories: (next: NoticeCategoryRow[]) => void
}

export function useAdminNoticeCategories(): UseAdminNoticeCategoriesResult {
  const [categoryRows, setCategoryRows] = useState<NoticeCategoryRow[]>(() =>
    listNoticeCategoryRows()
  )

  const replaceCategories = useCallback((next: NoticeCategoryRow[]) => {
    replaceNoticeCategoryRows(next)
    setCategoryRows(listNoticeCategoryRows())
  }, [])

  const allowedCategoryLabels = useMemo(
    () => categoryRows.map(r => r.name),
    [categoryRows]
  )

  const allowedCategorySet = useMemo(
    () => new Set(allowedCategoryLabels),
    [allowedCategoryLabels]
  )

  return {
    categoryRows,
    allowedCategoryLabels,
    allowedCategorySet,
    replaceCategories,
  }
}
