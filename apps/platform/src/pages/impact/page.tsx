import { useEffect, useState } from 'react'
import {
  FeaturedCarousel,
  NewsletterSection,
  StoryCard,
  buildImpactStoriesListPath,
  getImpactStoryCategoryTabItems,
  readImpactStoriesListParams,
  useFeaturedImpactStories,
  useImpactStoriesList,
  type ImpactStoriesListParams,
} from '@/features/impact-story'
import { useDebouncedValue } from '@/shared/hooks'
import {
  PFEmptyState,
  PFPagination,
  PFLoadingSpinner,
  PFSearchInput,
  PFTabs,
  PFText,
  PublicContentPageStatus,
} from '@/shared/ui'
import styles from './page.module.css'

const CATEGORY_TAB_ITEMS = getImpactStoryCategoryTabItems()
const SEARCH_DEBOUNCE_MS = 500

export function ImpactStoriesPage() {
  const [params, setParams] = useState(readImpactStoriesListParams)
  const [draftQ, setDraftQ] = useState(() => readImpactStoriesListParams().q)
  const debouncedQ = useDebouncedValue(draftQ, SEARCH_DEBOUNCE_MS)
  const list = useImpactStoriesList(params)
  const featuredStories = useFeaturedImpactStories()

  useEffect(() => {
    const onPopState = () => {
      const next = readImpactStoriesListParams()
      setParams(next)
      setDraftQ(next.q)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    setParams(prev => {
      if (prev.q === debouncedQ) return prev
      const merged: ImpactStoriesListParams = { ...prev, q: debouncedQ, page: 1 }
      const nextPath = buildImpactStoriesListPath(merged)
      const currentPath = `${window.location.pathname}${window.location.search}`
      if (nextPath !== currentPath) {
        window.history.pushState(null, '', nextPath)
      }
      return merged
    })
  }, [debouncedQ])

  const updateParams = (next: Partial<ImpactStoriesListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    if (next.q !== undefined) {
      setDraftQ(next.q)
    }
    const nextPath = buildImpactStoriesListPath(merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
  }

  const activeTab = CATEGORY_TAB_ITEMS.some(item => item.key === params.category)
    ? params.category
    : 'all'

  return (
    <section className={styles.page}>
      <div className={styles.pageBackground} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hero}>
          <PFText as="h1" typo="page-title-md" color="black" className={styles.heroTitle}>
            <span className={styles.heroLine}>JA Korea와 함께</span>
            <span className={styles.heroLine}>청소년의 가능성을 넓혀주세요</span>
          </PFText>
        </header>

        <div className={styles.featured}>
          <FeaturedCarousel stories={featuredStories} />
        </div>

        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            <PFTabs
              items={CATEGORY_TAB_ITEMS}
              value={activeTab}
              onChange={category =>
                updateParams({
                  category: category as ImpactStoriesListParams['category'],
                  page: 1,
                })
              }
              variant="category"
              className={styles.categoryTabs}
              ariaLabel="임팩트 카테고리"
            />
          </div>

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

        {list.isPending ? (
          <PublicContentPageStatus layout="list">
            <PFLoadingSpinner label="임팩트 스토리를 불러오는 중" />
          </PublicContentPageStatus>
        ) : list.items.length === 0 && params.q ? (
          <PublicContentPageStatus layout="list">
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              검색 결과가 없습니다.
            </PFText>
          </PublicContentPageStatus>
        ) : list.items.length === 0 ? (
          <PFEmptyState className={styles.emptyState} title="아직 등록된 이야기가 없어요." />
        ) : (
          <div className={styles.grid}>
            {list.items.map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}

        <div className={styles.pagination}>
          <PFPagination
            currentPage={list.currentPage}
            totalPages={list.totalPages}
            onPageChange={page => updateParams({ page })}
          />
        </div>
      </div>

      <NewsletterSection />
    </section>
  )
}
