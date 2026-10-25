import type { TextbookContent, TextbookTag } from '../model/types'
import { FallbackImage } from '@/features/careers'
import { RichTextViewer } from '@/shared/rich-text'
import { PFCategoryBadge, PFLoadingSpinner, PFModal, PFText } from '@/shared/ui'
import defaultTextbookThumbnailUrl from '@/shared/assets/illustration/illust-book.svg'
import badgeCategoryIconUrl from '../image/icon/badge-category.svg'
import badgeSkillIconUrl from '../image/icon/badge-skill.svg'
import badgeTargetIconUrl from '../image/icon/badge-target.svg'
import { hasTextbookUnitIntroduction, visibleTextbookUnits } from '../lib/detail-display'
import styles from './detail-modal.module.css'

type DetailModalProps = {
  open: boolean
  content: TextbookContent | null
  /** 딥링크 등 상세 로딩 중 — 동일 모달 인스턴스 유지 */
  loading?: boolean
  onClose: () => void
}

const TAG_ICON_SRC: Record<NonNullable<TextbookTag['icon']>, string> = {
  target: badgeTargetIconUrl,
  category: badgeCategoryIconUrl,
  skill: badgeSkillIconUrl,
}

export function DetailModal({ open, content, loading = false, onClose }: DetailModalProps) {
  const unitItems = content ? visibleTextbookUnits(content.units) : []
  const hasUnitIntroduction = content ? hasTextbookUnitIntroduction(content) : false

  return (
    <PFModal open={open} onClose={onClose} title="교육 콘텐츠 안내" size="lg">
      {loading && !content ? (
        <div className={styles.loading}>
          <PFLoadingSpinner centered label="교육 콘텐츠를 불러오는 중" />
        </div>
      ) : content ? (
        <div className={styles.body}>
          <div className={styles.summary}>
            <div
              className={[
                styles.thumbnailWrap,
                content.thumbnailUrl?.trim()
                  ? styles.thumbnailWrapHasImage
                  : styles.thumbnailWrapNoImage,
              ].join(' ')}
            >
              <FallbackImage
                className={styles.thumbnail}
                src={content.thumbnailUrl?.trim() || defaultTextbookThumbnailUrl}
                fallbackSrc={defaultTextbookThumbnailUrl}
                alt=""
              />
            </div>

            <div className={styles.summaryContent}>
              <div className={styles.summaryCopy}>
                <PFText as="h3" typo="hl-lg" color="black" className={styles.contentTitle}>
                  {content.title}
                </PFText>
                <PFText
                  as="p"
                  typo="bd-md-rg"
                  color="neutral-cool-600"
                  className={styles.contentDescription}
                >
                  {content.description}
                </PFText>
              </div>
              {content.modalTags.length > 0 ? (
                <div className={styles.tags}>
                  {content.modalTags.map(tag => (
                    <PFCategoryBadge
                      key={tag.label}
                      size="small"
                      iconVariant="primary"
                      icon={
                        tag.icon ? (
                          <img
                            src={TAG_ICON_SRC[tag.icon]}
                            alt=""
                            width={16}
                            height={14}
                            aria-hidden="true"
                          />
                        ) : undefined
                      }
                    >
                      {tag.label}
                    </PFCategoryBadge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <dl className={styles.details}>
            <div className={styles.detailRow}>
              <PFText
                as="dt"
                typo="bd-sm-rg"
                color="neutral-cool-600"
                className={styles.detailLabel}
              >
                교육 차시
              </PFText>
              <dd className={styles.detailValue}>
                {content.unitCount > 0 ? (
                  <>
                    <PFText as="span" typo="bd-sm-sb" color="black">
                      총 {content.unitCount}단원
                    </PFText>
                    {content.unitSessionText ? (
                      <PFText as="span" typo="bd-sm-rg" color="black">
                        {' '}
                        ({content.unitSessionText})
                      </PFText>
                    ) : null}
                  </>
                ) : (
                  <PFText as="span" typo="bd-sm-sb" color="black">
                    {content.sessionSummary}
                  </PFText>
                )}
              </dd>
            </div>

            {hasUnitIntroduction ? (
              <div className={styles.detailRow}>
                <PFText
                  as="dt"
                  typo="bd-sm-rg"
                  color="neutral-cool-600"
                  className={styles.detailLabel}
                >
                  단원 소개
                </PFText>
                <dd className={styles.detailValue}>
                  {content.unitIntroHtml?.trim() ? (
                    <RichTextViewer
                      className={styles.unitIntro}
                      content={content.unitIntroHtml}
                      contentFormat="html"
                      maxHeight="none"
                    />
                  ) : (
                    <ul className={styles.units}>
                      {unitItems.map(unit => (
                        <li key={`${unit.unitLabel ?? ''}-${unit.title}`} className={styles.unit}>
                          <p className={styles.unitHeading}>
                            {unit.unitLabel ? (
                              <>
                                <span className={`typo-bd-sm-rg ${styles.unitLabel}`}>
                                  {unit.unitLabel}
                                </span>{' '}
                              </>
                            ) : null}
                            <span className={`typo-bd-sm-sb ${styles.unitTitle}`}>
                              {unit.title}
                            </span>
                          </p>
                          {unit.description.trim() ? (
                            <PFText
                              as="p"
                              typo="bd-md-rg"
                              color="black"
                              className={styles.unitDescription}
                            >
                              {unit.description}
                            </PFText>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : (
        <div className={styles.loading}>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            교육 콘텐츠를 불러오지 못했습니다.
          </PFText>
        </div>
      )}
    </PFModal>
  )
}
