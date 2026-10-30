import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAREERS_LIST_RETURN_STATE_KEY,
  CAREERS_TAB_ITEMS,
  FallbackImage,
  FeaturedStoryCarousel,
  JobListItemRow,
  TalentApplyForm,
  ThriveSection,
  buildCareersListPath,
  careerPostingDetailPath,
  readCareersListParams,
  rememberCareersListReturnPath,
  usePublicCareerGuide,
  usePublicCareerPostings,
  type CareersListParams,
} from '@/features/careers'
import { useDebouncedValue } from '@/shared/hooks'
import {
  PFDivider,
  PFLoadingSpinner,
  PFPagination,
  PFSearchInput,
  PFTabs,
  PFText,
  PublicContentPageLoading,
  PublicContentPageStatus,
} from '@/shared/ui'
import styles from './page.module.css'

const TAB_ITEMS = CAREERS_TAB_ITEMS.map(item => ({ key: item.key, label: item.label }))
const SEARCH_DEBOUNCE_MS = 500

export function CareersPage() {
  const navigate = useNavigate()
  const [params, setParams] = useState(readCareersListParams)
  const [draftQ, setDraftQ] = useState(() => readCareersListParams().q)
  const debouncedQ = useDebouncedValue(draftQ, SEARCH_DEBOUNCE_MS)
  const activeTab = TAB_ITEMS.some(item => item.key === params.tab) ? params.tab : 'openings'
  const isTalentTab = activeTab === 'talent'
  const postings = usePublicCareerPostings({
    q: params.q,
    page: params.page,
    enabled: !isTalentTab,
  })
  const { view, isPending: isGuidePending } = usePublicCareerGuide()
  const thriveValues = view.thriveValues
  const featuredStories = view.featuredStories
  const hero = view.hero

  useEffect(() => {
    const onPopState = () => {
      const next = readCareersListParams()
      setParams(next)
      setDraftQ(next.q)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    setParams(prev => {
      if (prev.q === debouncedQ) return prev
      const merged: CareersListParams = { ...prev, q: debouncedQ, page: 1 }
      const nextPath = buildCareersListPath(merged)
      const currentPath = `${window.location.pathname}${window.location.search}`
      if (nextPath !== currentPath) {
        window.history.pushState(null, '', nextPath)
      }
      return merged
    })
  }, [debouncedQ])

  if (isGuidePending) {
    return <PublicContentPageLoading label="채용 안내 정보를 불러오는 중" />
  }

  const updateParams = (next: Partial<CareersListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    if (next.q !== undefined) {
      setDraftQ(next.q)
    }
    const nextPath = buildCareersListPath(merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageBackground} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hero}>
          <div className={styles.heroMedia}>
            <FallbackImage
              className={styles.heroImage}
              src={hero.imageUrl}
              fallbackSrc={hero.imageFallbackUrl}
              alt={hero.imageAlt}
              width={740}
              height={790}
            />
          </div>

          <div className={styles.heroCopy}>
            <PFText as="span" typo="hl-lg" color="black" className={styles.heroLabel}>
              {hero.label}
            </PFText>

            <PFText as="h1" typo="page-title-md" color="black" className={styles.heroTitle}>
              {hero.titleLines.map(line => (
                <span key={line} className={styles.heroTitleLine}>
                  {line}
                </span>
              ))}
            </PFText>

            <div className={styles.heroDescription}>
              <PFText as="p" typo="bd-lg-rg" color="black" className={styles.heroKo}>
                {hero.descriptionKo.map(line => (
                  <span key={line} className={styles.heroKoLine}>
                    {line}
                  </span>
                ))}
              </PFText>
              <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.heroEn}>
                {hero.descriptionEn}
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
            typo="page-title-sm"
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
                  {postings.isPending ? null : `총 ${postings.totalCount}건`}
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
                {postings.isPending ? (
                  <PublicContentPageStatus layout="list">
                    <PFLoadingSpinner label="채용 공고를 불러오는 중" />
                  </PublicContentPageStatus>
                ) : postings.jobs.length === 0 ? (
                  <PublicContentPageStatus layout="list">
                    <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
                      검색 결과가 없습니다.
                    </PFText>
                  </PublicContentPageStatus>
                ) : (
                  postings.jobs.map(item => (
                    <JobListItemRow
                      key={item.id}
                      item={item}
                      onClick={() => {
                        const returnPath = `${window.location.pathname}${window.location.search}`
                        rememberCareersListReturnPath(returnPath)
                        navigate(careerPostingDetailPath(item.id), {
                          state: { [CAREERS_LIST_RETURN_STATE_KEY]: returnPath },
                        })
                      }}
                    />
                  ))
                )}
              </div>

              {!postings.isPending && postings.totalCount > 0 ? (
                <div className={styles.pagination}>
                  <PFPagination
                    currentPage={params.page}
                    totalPages={postings.totalPages}
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
