import { createContext, useContext, type ReactNode } from 'react'
import type { CmsTableEmptyVariant } from './cms-table-empty-copy'
import { resolveCmsTableEmptyVariant } from './cms-table-empty-copy'

const CmsTableEmptyVariantContext = createContext<CmsTableEmptyVariant | null>(null)

export function CmsTableEmptyVariantProvider({
  hasActiveFilters,
  children,
}: {
  /** true면 검색·필터 결과 없음, false면 등록 데이터 없음 */
  hasActiveFilters: boolean
  children: ReactNode
}) {
  return (
    <CmsTableEmptyVariantContext.Provider value={resolveCmsTableEmptyVariant(hasActiveFilters)}>
      {children}
    </CmsTableEmptyVariantContext.Provider>
  )
}

export function useCmsTableEmptyVariantFromContext(): CmsTableEmptyVariant | null {
  return useContext(CmsTableEmptyVariantContext)
}
