import { ProgramBackButton } from '@/features/program'
import {
  getAdjacentImpactStories,
  getImpactStoryIdFromPath,
  IMPACT_STORIES_PATH,
  ImpactStoryAdjacentNav,
  useMockImpactStoryDetail,
} from '@/features/impact-story'
import { PFButton, PFCategoryBadge, PFDivider, PFText } from '@/shared/ui'
import styles from './page.module.css'
import { useNavigate } from 'react-router-dom'

function formatViewCount(count: number) {
  return count.toLocaleString('ko-KR')
}

export function ImpactStoryDetailPage() {
  const navigate = useNavigate()
  const storyId = getImpactStoryIdFromPath()
  const detail = useMockImpactStoryDetail(storyId)

  const handleBackToList = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    navigate(IMPACT_STORIES_PATH)
  }

  const handleGoToList = () => {
    navigate(IMPACT_STORIES_PATH)
  }

  if (!detail) {
    return (
      <section className={styles.page}>
        <div className={styles.back}>
          <ProgramBackButton label="이전으로" onClick={handleBackToList} />
        </div>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          임팩트 스토리를 찾을 수 없습니다.
        </PFText>
      </section>
    )
  }

  const adjacent = getAdjacentImpactStories(detail.id)

  return (
    <section className={styles.page}>
      <div className={styles.main}>
        <div className={styles.back}>
          <ProgramBackButton label="이전으로" onClick={handleBackToList} />
        </div>

        <div className={styles.layout}>
          <header className={styles.header}>
            <div className={styles.headerLead}>
              <PFCategoryBadge size="small" variant="secondary">
                {detail.categoryLabel}
              </PFCategoryBadge>

              <PFText as="h1" typo="hd-lg" color="black" className={styles.title}>
                {detail.title}
              </PFText>

              <div className={styles.meta}>
                <PFText as="span" typo="bd-lg-rg" color="neutral-cool-500">
                  {detail.publishedAtDetailLabel}
                </PFText>
                <span className={styles.viewCount}>
                  <PFText as="span" typo="bd-lg-rg" color="black">
                    조회
                  </PFText>
                  <PFText as="span" typo="bd-lg-rg" color="black">
                    {formatViewCount(detail.viewCount)}
                  </PFText>
                </span>
              </div>
            </div>
          </header>

          <PFDivider variant="focus" />

          <div className={styles.body}>
            {detail.blocks
              .filter(block => block.type === 'image')
              .map((block, index) => (
                <div
                  key={`image-${index}`}
                  className={styles.imagePlaceholder}
                  style={{
                    height: block.heightPx != null ? `${block.heightPx}px` : undefined,
                    aspectRatio:
                      block.heightPx != null ? undefined : (block.aspectRatio ?? '16 / 9'),
                    backgroundColor: detail.placeholderColor,
                  }}
                  aria-hidden="true"
                />
              ))}
          </div>

          <div className={styles.footerNav}>
            <ImpactStoryAdjacentNav previous={adjacent.previous} next={adjacent.next} />

            <div className={styles.listAction}>
              <PFButton
                variant="tertiary"
                size="xlarge"
                width={240}
                className={styles.listButton}
                onClick={handleGoToList}
              >
                목록으로
              </PFButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
