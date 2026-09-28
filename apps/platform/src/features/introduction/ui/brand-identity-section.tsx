import { PFText } from '@/shared/ui'
import { BRAND_SYMBOLS } from '../lib/brand-identity-data'
import type { IntroductionBiContent } from '../model/types'
import styles from './brand-identity-section.module.css'

/** 기관소개 — 브랜드 아이덴티티 (정적 document flow, 모션 없음) */
export function BrandIdentitySection({ bi }: { bi: IntroductionBiContent }) {
  const title = bi.title || '브랜드 아이덴티티'

  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <PFText as="h2" typo="page-title" className={styles.title}>
            {title}
          </PFText>
          <div className={styles.description}>
            {bi.lead ? (
              <PFText as="p" typo="hl-sm" className={styles.descriptionLead}>
                {bi.lead}
              </PFText>
            ) : null}
            {bi.description ? (
              <PFText as="p" typo="bd-md-rg" className={styles.descriptionText}>
                {bi.description}
              </PFText>
            ) : null}
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
