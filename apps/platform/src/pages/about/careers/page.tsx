import { useEffect, useMemo, useState } from 'react'
import {
  CAREERS_HERO,
  CAREERS_PAGE_SIZE,
  CAREERS_TAB_ITEMS,
  FeaturedStoryCarousel,
  JobListItemRow,
  TalentApplyForm,
  ThriveSection,
  buildCareersListPath,
  filterCareerJobs,
  getFeaturedStories,
  getMockCareerJobs,
  getThriveValues,
  readCareersListParams,
  type CareersListParams,
} from '@/features/careers'
import { PFDivider, PFPagination, PFSearchInput, PFTabs, PFText } from '@/shared/ui'
import styles from './page.module.css'

const TAB_ITEMS = CAREERS_TAB_ITEMS.map(item => ({ key: item.key, label: item.label }))

export function CareersPage() {
  const [params, setParams] = useState(readCareersListParams)
  const jobs = getMockCareerJobs()
  const thriveValues = getThriveValues()
  const featuredStories = getFeaturedStories()

  useEffect(() => {
    const onPopState = () => {
      setParams(readCareersListParams())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const updateParams = (next: Partial<CareersListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    const nextPath = buildCareersListPath(merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
  }

  const filteredJobs = useMemo(() => filterCareerJobs(jobs, params), [jobs, params])

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / CAREERS_PAGE_SIZE))
  const currentPage = Math.min(params.page, totalPages)
  const pageItems = filteredJobs.slice(
    (currentPage - 1) * CAREERS_PAGE_SIZE,
    currentPage * CAREERS_PAGE_SIZE
  )

  const activeTab = TAB_ITEMS.some(item => item.key === params.tab) ? params.tab : 'openings'
  const isTalentTab = activeTab === 'talent'

  return (
    <section className={styles.page}>
      <div className={styles.pageBackground} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hero}>
          <div className={styles.heroMedia}>
            <img
              className={styles.heroImage}
              src={CAREERS_HERO.imageUrl}
              alt={CAREERS_HERO.imageAlt}
              width={740}
              height={790}
            />
          </div>

          <div className={styles.heroCopy}>
            <PFText as="span" typo="hl-lg" color="black" className={styles.heroLabel}>
              {CAREERS_HERO.label}
            </PFText>

            <PFText as="h1" typo="page-title" color="black" className={styles.heroTitle}>
              {CAREERS_HERO.titleLines.map(line => (
                <span key={line} className={styles.heroTitleLine}>
                  {line}
                </span>
              ))}
            </PFText>

            <div className={styles.heroDescription}>
              <PFText as="p" typo="bd-lg-rg" color="black" className={styles.heroKo}>
                {CAREERS_HERO.descriptionKo.map(line => (
                  <span key={line} className={styles.heroKoLine}>
                    {line}
                  </span>
                ))}
              </PFText>
              <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.heroEn}>
                {CAREERS_HERO.descriptionEn}
              </PFText>
            </div>
          </div>
        </header>

        <div className={styles.thrive}>
          <ThriveSection values={thriveValues} />
        </div>
      </div>

      <div className={styles.featuredBleed}>
        <div className={styles.featuredInner}>
          <FeaturedStoryCarousel stories={featuredStories} />
        </div>
      </div>

      <div className={styles.content}>
        <section className={styles.join} aria-labelledby="careers-join-title">
          <PFText
            as="h2"
            id="careers-join-title"
            typo="page-title-md"
            color="black"
            className={styles.joinTitle}
          >
            함께하기
          </PFText>

          <div className={styles.joinTabs}>
            <PFTabs
              items={TAB_ITEMS}
              value={activeTab}
              onChange={tab =>
                updateParams({
                  tab: tab as CareersListParams['tab'],
                  page: 1,
                })
              }
              variant="category"
              className={styles.tabs}
              ariaLabel="채용 공고 구분"
            />
          </div>

          {isTalentTab ? (
            <div className={styles.talentForm}>
              <TalentApplyForm />
            </div>
          ) : (
            <>
              <div className={styles.toolbar}>
                <PFText as="span" typo="hd-sm" color="black" className={styles.count}>
                  {`총 ${filteredJobs.length}건`}
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

              <div className={styles.divider}>
                <PFDivider />
              </div>

              <div className={styles.list}>
                {pageItems.length === 0 ? (
                  <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
                    검색 결과가 없습니다.
                  </PFText>
                ) : (
                  pageItems.map(item => <JobListItemRow key={item.id} item={item} />)
                )}
              </div>

              {pageItems.length > 0 ? (
                <div className={styles.pagination}>
                  <PFPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={page => updateParams({ page })}
                  />
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </section>
  )
}
