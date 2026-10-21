import type { KeyboardEvent } from 'react'
import type { TextbookContent, TextbookTag } from '../model/types'
import { PFCategoryBadge, PFText } from '@/shared/ui'
import badgeCategoryIconUrl from '../image/icon/badge-category.svg'
import badgeSkillIconUrl from '../image/icon/badge-skill.svg'
import badgeTargetIconUrl from '../image/icon/badge-target.svg'
import searchIconUrl from '../image/icon/search.svg'
import styles from './content-list-item.module.css'

type ContentListItemProps = {
  content: TextbookContent
  onClick: () => void
}

/** Figma Badge_Category Icon — target=school, category=docs, skill=star */
const TAG_ICON_SRC: Record<NonNullable<TextbookTag['icon']>, string> = {
  target: badgeTargetIconUrl,
  category: badgeCategoryIconUrl,
  skill: badgeSkillIconUrl,
}

export function ContentListItem({ content, onClick }: ContentListItemProps) {
  const hasThumbnailImage = Boolean(content.thumbnailUrl?.trim())
  const compositions = content.compositions?.filter(item => item.trim()) ?? []
  const hasComposition = compositions.length > 0
  const listTags: TextbookTag[] =
    content.modalTags.length > 0 ? content.modalTags : content.tags.map(label => ({ label }))

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className={styles.row}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
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

      <div className={styles.content}>
        <div className={styles.info}>
          <PFText as="h2" typo="hl-lg" color="black" className={styles.title}>
            {content.title}
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
            {content.description}
          </PFText>
          {hasComposition ? (
            <div className={styles.composition}>
              <PFText
                as="span"
                typo="bd-sm-rg"
                color="primary-500"
                className={styles.compositionLabel}
              >
                구성
              </PFText>
              <div className={styles.compositionKinds}>
                {compositions.map((item, index) => (
                  <span key={`${item}-${index}`} className={styles.compositionKindSlot}>
                    {index > 0 ? (
                      <span className={styles.compositionSep} aria-hidden="true">
                        {' · '}
                      </span>
                    ) : null}
                    <PFText as="span" typo="bd-sm-sb" color="primary-500">
                      {item}
                    </PFText>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {listTags.length > 0 ? (
          <div className={styles.tags}>
            {listTags.map(tag => (
              <PFCategoryBadge
                key={tag.label}
                size="large"
                variant="secondary"
                iconVariant="secondary"
                icon={
                  tag.icon ? (
                    <img
                      src={TAG_ICON_SRC[tag.icon]}
                      alt=""
                      width={20}
                      height={20}
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

      <div className={styles.aside}>
        <div className={styles.session}>
          <PFText
            as="span"
            typo="bd-sm-rg"
            color="neutral-cool-600"
            className={styles.sessionLabel}
          >
            교육 차시
          </PFText>
          <div className={styles.sessionBody}>
            {content.unitCount > 0 ? (
              <PFText as="span" typo="bd-sm-sb" color="black" className={styles.sessionUnitCount}>
                총 {content.unitCount}단원
              </PFText>
            ) : (
              <PFText as="span" typo="bd-sm-sb" color="black" className={styles.sessionUnitCount}>
                {content.sessionSummary}
              </PFText>
            )}
            {content.unitCount > 0 && content.unitSessionText ? (
              <PFText as="span" typo="bd-sm-rg" color="black" className={styles.sessionDetail}>
                ({content.unitSessionText})
              </PFText>
            ) : null}
          </div>
        </div>
        <span className={styles.searchButton} aria-hidden="true">
          <img className={styles.searchIcon} src={searchIconUrl} alt="" width={24} height={24} />
        </span>
      </div>
    </div>
  )
}
