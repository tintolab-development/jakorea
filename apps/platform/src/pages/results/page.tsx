import { useEffect, useMemo, useState } from 'react'
import {
  buildResultsListPath,
  filterAndSortResults,
  getResultCategoryTabItems,
  readResultsListParams,
  resultDetailPath,
  ResultListItemRow,
  useMockResultsCatalog,
  type ResultsListParams,
} from '@/features/result'
import { PFDivider, PFPagination, PFSearchInput, PFTabs, PFText } from '@/shared/ui'
import styles from './page.module.css'

const PAGE_SIZE = 10

const CATEGORY_TAB_ITEMS = getResultCategoryTabItems()

export function ResultsPage() {
  const [params, setParams] = useState(readResultsListParams)
  const results = useMockResultsCatalog()

  useEffect(() => {
    const onPopState = () => {
      setParams(readResultsListParams())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const updateParams = (next: Partial<ResultsListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    const nextPath = buildResultsListPath(merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
  }

  const filteredResults = useMemo(
    () => filterAndSortResults(results, params),
    [results, params]
  )

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / PAGE_SIZE))
  const currentPage = Math.min(params.page, totalPages)
  const pageItems = filteredResults.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const activeTab =
    CATEGORY_TAB_ITEMS.some(item => item.key === params.category) ? params.category : 'all'

  return (
    <section className={styles.page}>
      <div className={styles.pageBackground} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hero}>
          <PFText as="h1" typo="page-title-md" color="black" className={styles.heroTitle}>
            <span className={styles.heroLine}>신청한 프로그램의</span>
            <span className={styles.heroLine}>합격 결과를 확인해 보세요</span>
          </PFText>
        </header>

        <div className={styles.tabs}>
          <PFTabs
            items={CATEGORY_TAB_ITEMS}
            value={activeTab}
            onChange={category => updateParams({ category, page: 1 })}
            variant="category"
            ariaLabel="결과 카테고리"
          />
        </div>

        <div className={styles.toolbar}>
          <div className={styles.search}>
            <PFSearchInput
              className={styles.searchField}
              variant="outlined"
              value={params.q}
              onValueChange={q => updateParams({ q, page: 1 })}
              placeholder="제목, 내용으로 검색해 보세요"
            />
          </div>
        </div>

        <PFDivider />

        <div className={styles.list}>
          {pageItems.length === 0 ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
              검색 결과가 없습니다.
            </PFText>
          ) : (
            pageItems.map(item => (
              <ResultListItemRow
                key={item.id}
                item={item}
                onClick={() => window.location.assign(resultDetailPath(item.id))}
              />
            ))
          )}
        </div>

        <div className={styles.pagination}>
          <PFPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={page => updateParams({ page })}
          />
        </div>
      </div>
    </section>
  )
}
