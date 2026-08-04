import { useEffect, useMemo, useState } from 'react'
import {
  buildNoticesListPath,
  filterAndSortNotices,
  noticeDetailPath,
  NoticeListItemRow,
  NOTICES_PAGE_SIZE,
  readNoticesListParams,
  useMockNoticesCatalog,
  type NoticesListParams,
} from '@/features/notice'
import { PFDivider, PFPagination, PFSearchInput, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function NoticesPage() {
  const [params, setParams] = useState(readNoticesListParams)
  const notices = useMockNoticesCatalog()

  useEffect(() => {
    const onPopState = () => {
      setParams(readNoticesListParams())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const updateParams = (next: Partial<NoticesListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    const nextPath = buildNoticesListPath(merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
  }

  const filteredNotices = useMemo(
    () => filterAndSortNotices(notices, params),
    [notices, params]
  )

  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / NOTICES_PAGE_SIZE))
  const currentPage = Math.min(params.page, totalPages)
  const pageItems = filteredNotices.slice(
    (currentPage - 1) * NOTICES_PAGE_SIZE,
    currentPage * NOTICES_PAGE_SIZE
  )

  return (
    <section className={styles.page}>
      <div className={styles.pageBackground} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hero}>
          <PFText as="h1" typo="page-title" color="black" className={styles.heroTitle}>
            공지사항
          </PFText>
        </header>

        <div className={styles.toolbar}>
          <PFText as="span" typo="bd-md-md" color="neutral-cool-600" className={styles.count}>
            {`총 ${filteredNotices.length}건`}
          </PFText>
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
              <NoticeListItemRow
                key={item.id}
                item={item}
                onClick={() => window.location.assign(noticeDetailPath(item.id))}
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
