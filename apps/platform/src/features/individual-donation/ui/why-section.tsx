import { Fragment } from 'react'
import arrowDiagonalBlackUrl from '@/shared/assets/icons/arrow-diagonal-black.svg'
import arrowDiagonalMintUrl from '@/shared/assets/icons/arrow-diagonal-mint.svg'
import { PFButton, PFCategoryBadge, PFText } from '@/shared/ui'
import {
  WHY_CARDS,
  WHY_SECTION_ACTION_BUTTON_LABEL,
  WHY_SECTION_ACTION_DESCRIPTION,
  WHY_SECTION_TITLE,
  type WhyCardContent,
} from '../lib/constants'
import { WHY_CARD_IMAGE_URLS } from '../lib/why-card-images'
import styles from './why-section.module.css'

const WHY_CARD_CONTENT_CLASS = {
  future_capability: styles.cardContentFutureCapability,
  education_access: styles.cardContentEducationAccess,
} as const

function WhyCard({ card }: { card: WhyCardContent }) {
  const imageUrl = WHY_CARD_IMAGE_URLS[card.id]

  return (
    <article className={styles.card}>
      <div className={[styles.cardContent, WHY_CARD_CONTENT_CLASS[card.id]].join(' ')}>
        <div className={styles.cardInfo}>
          <PFCategoryBadge size="large" variant="secondary" className={styles.badge}>
            {card.badge}
          </PFCategoryBadge>
          <div className={styles.cardMessage}>
            <PFText as="h3" typo="hd-md" color="black" className={styles.cardTitle}>
              {card.titleLines.map((line, index) => (
                <Fragment key={line}>
                  {index > 0 ? <br /> : null}
                  {line}
                </Fragment>
              ))}
            </PFText>
            <PFText
              as="p"
              typo="bd-lg-rg"
              color="neutral-cool-700"
              className={styles.cardDescription}
            >
              {card.description}
            </PFText>
          </div>
        </div>
      </div>

      <div className={styles.media}>
        <div className={styles.imageFrame}>
          {imageUrl ? (
            <img className={styles.image} src={imageUrl} alt="" width={720} height={480} />
          ) : (
            <div className={styles.imagePlaceholder} aria-hidden="true" />
          )}
        </div>
      </div>
    </article>
  )
}

export function WhySection() {
  return (
    <section className={styles.section} aria-labelledby="individual-donation-why-title">
      <div className={styles.content}>
        <div className={styles.sectionHeader}>
          <PFText
            as="h2"
            id="individual-donation-why-title"
            typo="page-title-sm"
            color="black"
            className={styles.title}
          >
            {WHY_SECTION_TITLE}
          </PFText>

          <div className={styles.action}>
            <PFText
              as="p"
              typo="bd-md-rg"
              color="neutral-cool-600"
              className={styles.actionDescription}
            >
              {WHY_SECTION_ACTION_DESCRIPTION}
            </PFText>
            {/* TODO: 투명경영 페이지 경로 연결 */}
            <PFButton
              type="button"
              size="xlarge"
              variant="tertiary"
              className={styles.actionButton}
            >
              <span>{WHY_SECTION_ACTION_BUTTON_LABEL}</span>
              <img
                className={[styles.actionIcon, styles.actionIconDefault].join(' ')}
                src={arrowDiagonalBlackUrl}
                alt=""
                aria-hidden="true"
                width={24}
                height={24}
              />
              <img
                className={[styles.actionIcon, styles.actionIconHover].join(' ')}
                src={arrowDiagonalMintUrl}
                alt=""
                aria-hidden="true"
                width={24}
                height={24}
              />
            </PFButton>
          </div>
        </div>

        <div className={styles.cardList}>
          {WHY_CARDS.map(card => (
            <WhyCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}
