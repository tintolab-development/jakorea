import { Link } from 'react-router-dom'
import { PFCategoryBadge, PFText } from '@/shared/ui'
import type { DonationImpactItem } from '../lib/impact-mock'
import styles from './donation-impact-card.module.css'

export type DonationImpactCardProps = {
  item: DonationImpactItem
  className?: string
}

/** 임팩트 스토리 StoryCard와 동일한 UI 구조 (개인후원 전용, 데이터 결합 없음) */
export function DonationImpactCard({ item, className }: DonationImpactCardProps) {
  return (
    <Link
      to={item.href}
      className={[styles.cardLink, className].filter(Boolean).join(' ')}
    >
      <article className={styles.card}>
        <div
          className={styles.thumbnail}
          style={{ backgroundColor: item.placeholderColor }}
        >
          {item.imageUrl ? (
            <img
              className={styles.image}
              src={item.imageUrl}
              alt=""
              width={461}
              height={256}
            />
          ) : null}
          <div className={styles.badge}>
            <PFCategoryBadge size="large" variant="primary">
              {item.categoryLabel}
            </PFCategoryBadge>
          </div>
        </div>

        <div className={styles.meta}>
          <PFText as="h3" typo="hl-lg" color="black" className={styles.title}>
            {item.title}
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="neutral-cool-600" className={styles.date}>
            {item.dateLabel}
          </PFText>
        </div>
      </article>
    </Link>
  )
}
