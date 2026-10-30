import { useEffect, useMemo, useState } from 'react'
import {
  buildResultsListPath,
  filterAndSortResults,
  getResultCategoryTabItems,
  readResultsListParams,
  resultDetailPath,
  ResultListItemRow,
  useProgramResultsList,
  type ResultsListParams,
} from '@/features/result'
import { useDebouncedValue } from '@/shared/hooks'
import {
  PFDivider,
  PFLoadingSpinner,
  PFPagination,
  PFSearchInput,
  PFTabs,
  PFText,
  PublicContentPageStatus,
} from '@/shared/ui'
import styles from './page.module.css'
import { useNavigate } from 'react-router-dom'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 500

const CATEGORY_TAB_ITEMS = getResultCategoryTabItems()

export function ResultsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useState(readResultsListParams)
  const [draftQ, setDraftQ] = useState(() => readResultsListParams().q)
  const debouncedQ = useDebouncedValue(draftQ, SEARCH_DEBOUNCE_MS)
  const remoteList = useProgramResultsList(params)

  useEffect(() => {
    const onPopState = () => {
      const next = readResultsListParams()
      setParams(next)
      setDraftQ(next.q)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    setParams(prev => {
      if (prev.q === debouncedQ) return prev
      const merged: ResultsListParams = { ...prev, q: debouncedQ, page: 1 }
      const nextPath = buildResultsListPath(merged)
      const currentPath = `${window.location.pathname}${window.location.search}`
      if (nextPath !== currentPath) {
        window.history.pushState(null, '', nextPath)
      }
      return merged
    })
  }, [debouncedQ])

  const updateParams = (next: Partial<ResultsListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    if (next.q !== undefined) {
      setDraftQ(next.q)
    }
    const nextPath = buildResultsListPath(merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
  }

  const filteredResults = useMemo(
    () =>
      remoteList.isRemoteEnabled ? remoteList.items : filterAndSortResults([], params),
    [remoteList.isRemoteEnabled, remoteList.items, params]
  )

  const totalPages = remoteList.isRemoteEnabled
    ? remoteList.totalPages
    : Math.max(1, Math.ceil(filteredResults.length / PAGE_SIZE))
  const currentPage = remoteList.isRemoteEnabled
    ? remoteList.currentPage
    : Math.min(params.page, totalPages)
  const pageItems = remoteList.isRemoteEnabled
    ? filteredResults
    : filteredResults.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
              value={draftQ}
              onValueChange={setDraftQ}
              placeholder="제목, 내용으로 검색해 보세요"
            />
          </div>
        </div>

        <PFDivider variant="focus" />

        <div className={styles.list}>
          {remoteList.isPending ? (
            <PublicContentPageStatus layout="list">
              <PFLoadingSpinner label="결과를 불러오는 중" />
            </PublicContentPageStatus>
          ) : remoteList.isError ? (
            <PublicContentPageStatus layout="list">
              <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
                결과를 불러오지 못했어요.
              </PFText>
            </PublicContentPageStatus>
          ) : pageItems.length === 0 ? (
            <PublicContentPageStatus layout="list">
              <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
                {params.q.trim() ? '검색 결과가 없습니다.' : '등록된 결과가 없습니다.'}
              </PFText>
            </PublicContentPageStatus>
          ) : (
            pageItems.map(item => (
              <ResultListItemRow
                key={item.id}
                item={item}
                onClick={() => navigate(resultDetailPath(item.id))}
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
