import type { TextbookContent, TextbookTag } from '../model/types'
import { PFCategoryBadge, PFModal, PFText } from '@/shared/ui'
import badgeCategoryIconUrl from '../image/icon/badge-category.svg'
import badgeSkillIconUrl from '../image/icon/badge-skill.svg'
import badgeTargetIconUrl from '../image/icon/badge-target.svg'
import styles from './detail-modal.module.css'

type DetailModalProps = {
  open: boolean
  content: TextbookContent | null
  onClose: () => void
}

const TAG_ICON_SRC: Record<NonNullable<TextbookTag['icon']>, string> = {
  target: badgeTargetIconUrl,
  category: badgeCategoryIconUrl,
  skill: badgeSkillIconUrl,
}

export function DetailModal({ open, content, onClose }: DetailModalProps) {
  if (!content) return null

  const hasThumbnailImage = Boolean(content.thumbnailUrl?.trim())

  return (
    <PFModal
      open={open}
      onClose={onClose}
      title="교육 콘텐츠 안내"
      size="lg"
    >
      <div className={styles.body}>
        <div className={styles.summary}>
          <div
            className={[
              styles.thumbnailWrap,
              hasThumbnailImage ? styles.thumbnailWrapHasImage : styles.thumbnailWrapNoImage,
            ].join(' ')}
          >
            {hasThumbnailImage ? (
              <img className={styles.thumbnail} src={content.thumbnailUrl} alt="" />
            ) : null}
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
                    size="large"
                    iconVariant="secondary"
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
            <PFText as="dt" typo="bd-sm-rg" color="neutral-cool-600" className={styles.detailLabel}>
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

          <div className={styles.detailRow}>
            <PFText as="dt" typo="bd-sm-rg" color="neutral-cool-600" className={styles.detailLabel}>
              단원 소개
            </PFText>
            <dd className={styles.detailValue}>
              <ul className={styles.units}>
                {content.units.map(unit => (
                  <li key={`${unit.unitLabel ?? ''}-${unit.title}`} className={styles.unit}>
                    <p className={styles.unitHeading}>
                      {unit.unitLabel ? (
                        <>
                          <span className={`typo-bd-sm-rg ${styles.unitLabel}`}>
                            {unit.unitLabel}
                          </span>{' '}
                        </>
                      ) : null}
                      <span className={`typo-bd-sm-sb ${styles.unitTitle}`}>{unit.title}</span>
                    </p>
                    <PFText
                      as="p"
                      typo="bd-md-rg"
                      color="black"
                      className={styles.unitDescription}
                    >
                      {unit.description}
                    </PFText>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </PFModal>
  )
}
