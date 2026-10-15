import { ProgramBackButton } from '@/features/program'
import {
  getImpactStoryIdFromPath,
  IMPACT_STORIES_PATH,
  ImpactStoryAdjacentNav,
  useImpactStoryDetail,
  type ImpactStoryDetailStatus,
} from '@/features/impact-story'
import { RichTextViewer } from '@/shared/rich-text'
import { PFButton, PFCategoryBadge, PFDivider, PFLoadingSpinner, PFText } from '@/shared/ui'
import styles from './page.module.css'
import { useNavigate } from 'react-router-dom'

function formatViewCount(count: number) {
  return count.toLocaleString('ko-KR')
}

function statusMessage(status: ImpactStoryDetailStatus) {
  if (status === 'error') return '임팩트 스토리를 불러오지 못했습니다.'
  return '임팩트 스토리를 찾을 수 없습니다.'
}

export function ImpactStoryDetailPage() {
  const navigate = useNavigate()
  const storyId = getImpactStoryIdFromPath()
  const { data: detail, status, adjacent, refetch } = useImpactStoryDetail(storyId)

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

  if (status !== 'ready' || !detail) {
    return (
      <section className={styles.page}>
        <div className={styles.main}>
          <div className={styles.back}>
            <ProgramBackButton label="이전으로" onClick={handleBackToList} />
          </div>
          <div className={styles.status}>
            {status === 'loading' ? (
              <PFLoadingSpinner centered label="임팩트 스토리를 불러오는 중" />
            ) : (
              <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
                {statusMessage(status)}
              </PFText>
            )}
            {status === 'error' ? (
              <PFButton variant="tertiary" size="large" onClick={refetch}>
                다시 시도
              </PFButton>
            ) : null}
          </div>
        </div>
      </section>
    )
  }

  const body = detail.body?.trim() ?? ''

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
            {body ? (
              <RichTextViewer
                key={detail.id}
                content={body}
                contentFormat={detail.bodyFormat ?? 'html'}
                maxHeight="none"
                className={styles.content}
              />
            ) : (
              detail.blocks
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
                ))
            )}
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
