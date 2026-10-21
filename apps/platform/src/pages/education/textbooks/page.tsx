import { useEffect, useMemo, useState } from 'react'
import {
  buildTextbooksListPath,
  buildThemeSections,
  DetailModal,
  ContentListItem,
  readTextbookDetailIdFromLocation,
  readTextbooksListParams,
  TEXTBOOK_CATEGORY_TAB_ITEMS,
  ThemeSection,
  TextbookSort,
  usePublicTextbookDetail,
  usePublicTextbookDirectory,
  usePublicTextbookList,
  type TextbookCategoryFilter,
  type TextbookSortKey,
  type TextbooksListParams,
} from '@/features/textbook'
import { PFButton, PFLoadingSpinner, PFPagination, PFTabs, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function TextbooksPage() {
  const [params, setParams] = useState(readTextbooksListParams)
  const [selectedId, setSelectedId] = useState<string | null>(readTextbookDetailIdFromLocation)
  const directory = usePublicTextbookDirectory()
  const list = usePublicTextbookList(params)
  const themeSections = useMemo(() => buildThemeSections(directory.items), [directory.items])
  const selectedBase = useMemo(() => {
    if (!selectedId) return null
    return (
      list.items.find(item => item.id === selectedId) ??
      directory.items.find(item => item.id === selectedId) ??
      null
    )
  }, [directory.items, list.items, selectedId])
  const { content: selectedContent, isPending: isDetailPending } = usePublicTextbookDetail(
    selectedId,
    selectedBase
  )

  useEffect(() => {
    const syncedPath = buildTextbooksListPath(params, {
      detailId: readTextbookDetailIdFromLocation(),
    })
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (syncedPath !== currentPath) {
      window.history.replaceState(null, '', syncedPath)
    }

    const onPopState = () => {
      setParams(readTextbooksListParams())
      setSelectedId(readTextbookDetailIdFromLocation())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
    // 마운트 시 URL ↔ 기본값 동기화 + popstate만 구독 (id 포함)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, [])

  const syncPath = (
    nextParams: TextbooksListParams,
    detailId: string | null,
    mode: 'push' | 'replace'
  ) => {
    const nextPath = buildTextbooksListPath(nextParams, { detailId })
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath === currentPath) return
    if (mode === 'replace') {
      window.history.replaceState(null, '', nextPath)
    } else {
      window.history.pushState(null, '', nextPath)
    }
  }

  const updateParams = (next: Partial<TextbooksListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    syncPath(merged, selectedId, 'push')
  }

  const openDetail = (contentId: string) => {
    setSelectedId(contentId)
    syncPath(params, contentId, 'push')
  }

  const closeDetail = () => {
    setSelectedId(null)
    syncPath(params, null, 'push')
  }

  const activeTab = TEXTBOOK_CATEGORY_TAB_ITEMS.some(item => item.key === params.category)
    ? params.category
    : 'all'

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

        {directory.isPending ? (
          <PFLoadingSpinner centered label="교육 콘텐츠를 불러오는 중" />
        ) : directory.isError ? (
          <div className={styles.status}>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              교육 콘텐츠를 불러오지 못했습니다.
            </PFText>
            <PFButton variant="tertiary" size="large" onClick={directory.refetch}>
              다시 시도
            </PFButton>
          </div>
        ) : (
          <div className={styles.directory}>
            {themeSections.map(section => (
              <ThemeSection key={section.key} section={section} onRowClick={openDetail} />
            ))}
          </div>
        )}

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
              {list.isPending || list.isError ? null : `총 ${list.totalCount}개`}
            </PFText>
            <TextbookSort
              value={params.sort}
              onChange={sort => updateParams({ sort: sort as TextbookSortKey, page: 1 })}
              className={styles.sort}
            />
          </div>

          {list.isPending ? (
            <PFLoadingSpinner centered label="교육 콘텐츠를 불러오는 중" />
          ) : list.isError ? (
            <div className={styles.status}>
              <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
                교육 콘텐츠를 불러오지 못했습니다.
              </PFText>
              <PFButton variant="tertiary" size="large" onClick={list.refetch}>
                다시 시도
              </PFButton>
            </div>
          ) : (
            <>
              <div className={styles.list}>
                {list.items.length === 0 ? (
                  <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
                    검색 결과가 없습니다.
                  </PFText>
                ) : (
                  list.items.map(item => (
                    <ContentListItem
                      key={item.id}
                      content={item}
                      onClick={() => openDetail(item.id)}
                    />
                  ))
                )}
              </div>

              {list.totalCount > 0 ? (
                <div className={styles.pagination}>
                  <PFPagination
                    currentPage={params.page}
                    totalPages={list.totalPages}
                    onPageChange={page => updateParams({ page })}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <DetailModal
        open={selectedId != null}
        content={selectedContent}
        loading={Boolean(selectedId) && isDetailPending && selectedContent == null}
        onClose={closeDetail}
      />
    </section>
  )
}
