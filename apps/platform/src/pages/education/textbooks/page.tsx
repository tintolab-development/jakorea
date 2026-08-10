import { useEffect, useMemo, useState } from 'react'
import {
  buildTextbooksListPath,
  DetailModal,
  filterAndSortTextbooks,
  getMockTextbookById,
  ContentListItem,
  readTextbooksListParams,
  TEXTBOOK_CATEGORY_TAB_ITEMS,
  TEXTBOOKS_PAGE_SIZE,
  ThemeSection,
  TextbookSort,
  useMockTextbookCatalog,
  useMockThemeSections,
  type TextbookCategoryFilter,
  type TextbookSortKey,
  type TextbooksListParams,
} from '@/features/textbook'
import { PFPagination, PFTabs, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function TextbooksPage() {
  const [params, setParams] = useState(readTextbooksListParams)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const contents = useMockTextbookCatalog()
  const themeSections = useMockThemeSections()

  useEffect(() => {
    const syncedPath = buildTextbooksListPath(params)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (syncedPath !== currentPath) {
      window.history.replaceState(null, '', syncedPath)
    }

    const onPopState = () => {
      setParams(readTextbooksListParams())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
    // 마운트 시 URL ↔ 기본값(category=all, sort=latest) 동기화 + popstate만 구독
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, [])

  const updateParams = (next: Partial<TextbooksListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    const nextPath = buildTextbooksListPath(merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
  }

  const filteredContents = useMemo(
    () => filterAndSortTextbooks(contents, params),
    [contents, params]
  )

  const totalPages = Math.max(1, Math.ceil(filteredContents.length / TEXTBOOKS_PAGE_SIZE))
  const currentPage = Math.min(params.page, totalPages)
  const pageItems = filteredContents.slice(
    (currentPage - 1) * TEXTBOOKS_PAGE_SIZE,
    currentPage * TEXTBOOKS_PAGE_SIZE
  )

  const activeTab = TEXTBOOK_CATEGORY_TAB_ITEMS.some(item => item.key === params.category)
    ? params.category
    : 'all'

  const selectedContent = selectedId ? (getMockTextbookById(selectedId) ?? null) : null

  const openDetail = (contentId: string) => {
    setSelectedId(contentId)
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageBackground} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hero}>
          <PFText as="span" typo="hl-lg" color="primary-700" className={styles.heroLabel}>
            교육 콘텐츠
          </PFText>
          <PFText as="h1" typo="page-title-md" color="black" className={styles.heroTitle}>
            JA Korea는 다양한 교육 콘텐츠로 청소년의 배움과 성장을 돕습니다.
          </PFText>
        </header>

        <div className={styles.directory}>
          {themeSections.map(section => (
            <ThemeSection key={section.key} section={section} onRowClick={openDetail} />
          ))}
        </div>

        <div className={styles.catalog}>
          <div className={styles.tabs}>
            <PFTabs
              items={TEXTBOOK_CATEGORY_TAB_ITEMS}
              value={activeTab}
              onChange={category =>
                updateParams({ category: category as TextbookCategoryFilter, page: 1 })
              }
              variant="pill"
              ariaLabel="교재 카테고리"
            />
          </div>

          <div className={styles.toolbar}>
            <PFText as="p" typo="hd-sm" color="black" className={styles.count}>
              총 {filteredContents.length}개
            </PFText>
            <TextbookSort
              value={params.sort}
              onChange={sort => updateParams({ sort: sort as TextbookSortKey, page: 1 })}
              className={styles.sort}
            />
          </div>

          <div className={styles.list}>
            {pageItems.length === 0 ? (
              <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
                검색 결과가 없습니다.
              </PFText>
            ) : (
              pageItems.map(item => (
                <ContentListItem
                  key={item.id}
                  content={item}
                  onClick={() => openDetail(item.id)}
                />
              ))
            )}
          </div>

          {filteredContents.length > 0 ? (
            <div className={styles.pagination}>
              <PFPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={page => updateParams({ page })}
              />
            </div>
          ) : null}
        </div>
      </div>

      <DetailModal
        open={selectedId != null && selectedContent != null}
        content={selectedContent}
        onClose={() => setSelectedId(null)}
      />
    </section>
  )
}
