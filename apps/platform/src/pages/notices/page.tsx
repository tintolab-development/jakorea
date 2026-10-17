import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buildNoticesListPath,
  noticeDetailPath,
  NoticeListItemRow,
  NOTICES_LIST_RETURN_STATE_KEY,
  readNoticesListParams,
  rememberNoticesListReturnPath,
  useNoticesList,
  type NoticesListParams,
} from '@/features/notice'
import { useDebouncedValue } from '@/shared/hooks'
import { PFDivider, PFLoadingSpinner, PFPagination, PFSearchInput, PFText } from '@/shared/ui'
import styles from './page.module.css'

const SEARCH_DEBOUNCE_MS = 500

export function NoticesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useState(readNoticesListParams)
  const [draftQ, setDraftQ] = useState(() => readNoticesListParams().q)
  const debouncedQ = useDebouncedValue(draftQ, SEARCH_DEBOUNCE_MS)
  const list = useNoticesList(params)

  useEffect(() => {
    rememberNoticesListReturnPath()
    const onPopState = () => {
      const next = readNoticesListParams()
      setParams(next)
      setDraftQ(next.q)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    setParams(prev => {
      if (prev.q === debouncedQ) return prev
      const merged: NoticesListParams = { ...prev, q: debouncedQ, page: 1 }
      const nextPath = buildNoticesListPath(merged)
      const currentPath = `${window.location.pathname}${window.location.search}`
      if (nextPath !== currentPath) {
        window.history.pushState(null, '', nextPath)
      }
      rememberNoticesListReturnPath(nextPath)
      return merged
    })
  }, [debouncedQ])

  const updateParams = (next: Partial<NoticesListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    if (next.q !== undefined) {
      setDraftQ(next.q)
    }
    const nextPath = buildNoticesListPath(merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
    rememberNoticesListReturnPath(nextPath)
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageBackground} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hero}>
          <PFText as="h1" typo="page-title-md" color="black" className={styles.heroTitle}>
            공지사항
          </PFText>
        </header>

        <div className={styles.toolbar}>
          <PFText as="span" typo="hd-sm" color="black" className={styles.count}>
            {`총 ${list.totalCount}건`}
          </PFText>
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

        <div className={styles.divider}>
          <PFDivider />
        </div>

        <div className={styles.list}>
          {list.isPending ? (
            <PFLoadingSpinner centered label="공지사항을 불러오는 중" />
          ) : list.items.length === 0 ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
              검색 결과가 없습니다.
            </PFText>
          ) : (
            list.items.map(item => (
              <NoticeListItemRow
                key={item.id}
                item={item}
                onClick={() => {
                  const returnPath = `${window.location.pathname}${window.location.search}`
                  rememberNoticesListReturnPath(returnPath)
                  navigate(noticeDetailPath(item.id), {
                    state: { [NOTICES_LIST_RETURN_STATE_KEY]: returnPath },
                  })
                }}
              />
            ))
          )}
        </div>

        <div className={styles.pagination}>
          <PFPagination
            currentPage={list.currentPage}
            totalPages={list.totalPages}
            onPageChange={page => updateParams({ page })}
          />
        </div>
      </div>
    </section>
  )
}
