import { PFText } from '@/shared/ui'
import {
  BRAND_IDENTITY_DESCRIPTION,
  BRAND_IDENTITY_LEAD,
  BRAND_IDENTITY_TITLE,
  BRAND_SYMBOLS,
} from '../lib/brand-identity-data'
import styles from './brand-identity-section.module.css'

/** 기관소개 — 브랜드 아이덴티티 (정적 document flow, 모션 없음) */
export function BrandIdentitySection() {
  return (
    <section className={styles.section} aria-label={BRAND_IDENTITY_TITLE}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <PFText as="h2" typo="page-title" className={styles.title}>
            {BRAND_IDENTITY_TITLE}
          </PFText>
          <div className={styles.description}>
            <PFText as="p" typo="hl-sm" className={styles.descriptionLead}>
              {BRAND_IDENTITY_LEAD}
            </PFText>
            <PFText as="p" typo="bd-md-rg" className={styles.descriptionText}>
              {BRAND_IDENTITY_DESCRIPTION}
            </PFText>
          </div>
        </header>

        <ul className={styles.symbolList}>
          {BRAND_SYMBOLS.map(symbol => (
            <li key={symbol.id} className={styles.symbolCard}>
              <img
                className={styles.symbolImage}
                src={symbol.src}
                alt={symbol.alt}
                draggable={false}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
