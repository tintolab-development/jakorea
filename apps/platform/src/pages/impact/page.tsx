import { useEffect, useMemo, useState } from 'react'
import {
  FeaturedCarousel,
  NewsletterSection,
  StoryCard,
  buildImpactStoriesListPath,
  filterImpactStories,
  getFeaturedImpactStories,
  getImpactStoryCategoryTabItems,
  IMPACT_STORIES_PAGE_SIZE,
  readImpactStoriesListParams,
  useMockImpactStories,
  type ImpactStoriesListParams,
} from '@/features/impact-story'
import { PFPagination, PFSearchInput, PFTabs, PFText } from '@/shared/ui'
import styles from './page.module.css'

const CATEGORY_TAB_ITEMS = getImpactStoryCategoryTabItems()

export function ImpactStoriesPage() {
  const [params, setParams] = useState(readImpactStoriesListParams)
  const stories = useMockImpactStories()
  const featuredStories = getFeaturedImpactStories()

  useEffect(() => {
    const onPopState = () => {
      setParams(readImpactStoriesListParams())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const updateParams = (next: Partial<ImpactStoriesListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    const nextPath = buildImpactStoriesListPath(merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
  }

  const filteredStories = useMemo(
    () => filterImpactStories(stories, params),
    [stories, params]
  )

  const totalPages = Math.max(1, Math.ceil(filteredStories.length / IMPACT_STORIES_PAGE_SIZE))
  const currentPage = Math.min(params.page, totalPages)
  const pageItems = filteredStories.slice(
    (currentPage - 1) * IMPACT_STORIES_PAGE_SIZE,
    currentPage * IMPACT_STORIES_PAGE_SIZE
  )

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
              value={params.q}
              onValueChange={q => updateParams({ q, page: 1 })}
              placeholder="제목, 내용으로 검색해 보세요"
            />
          </div>
        </div>

        {pageItems.length === 0 ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
            검색 결과가 없습니다.
          </PFText>
        ) : (
          <div className={styles.grid}>
            {pageItems.map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}

        <div className={styles.pagination}>
          <PFPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={page => updateParams({ page })}
          />
        </div>
      </div>

      <NewsletterSection />
    </section>
  )
}
