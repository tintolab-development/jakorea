import { Fragment } from 'react'
import { PFCategoryBadge, PFText, remoteCopyClassName } from '@/shared/ui'
import { usePublicCorporateSponsorshipView } from '../api/hooks'
import { type WhyCardContent } from '../lib/constants'
import { WHY_CARD_IMAGE_URLS } from '../lib/why-card-images'
import styles from './why-section.module.css'

const WHY_CARD_CONTENT_CLASS = {
  global_expansion: styles.cardContentGlobalExpansion,
  transparent_ops: styles.cardContentTransparentOps,
  verified_impact: styles.cardContentVerifiedImpact,
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
          <img className={styles.image} src={imageUrl} alt="" width={720} height={480} />
        </div>
      </div>
    </article>
  )
}

export function WhySection() {
  const { whyCards, isPending } = usePublicCorporateSponsorshipView()
  const copyClass = remoteCopyClassName(isPending)

  return (
    <section
      className={styles.section}
      aria-label="기업후원 강점"
      aria-busy={isPending || undefined}
    >
      <div className={[styles.content, copyClass].join(' ')}>
        <div className={styles.cardList}>
          {whyCards.map(card => (
            <WhyCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}
