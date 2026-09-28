import { PFText } from '@/shared/ui'
import type { HistoryPageView } from '../model/view'
import { PreservedLines } from './preserved-lines'
import styles from './history-hero-section.module.css'

type HistoryHeroSectionProps = {
  hero: HistoryPageView['hero']
}

/** JA History 히어로 — 배경 + 오버레이 (모션 없음) */
export function HistoryHeroSection({ hero }: HistoryHeroSectionProps) {
  return (
    <section className={styles.hero} aria-labelledby="history-hero-title">
      <div className={styles.background} aria-hidden="true">
        {hero.image.url ? (
          <img className={styles.photo} src={hero.image.url} alt="" />
        ) : null}
      </div>
      <div className={styles.gradient} aria-hidden="true" />

      <div className={styles.inner}>
        <PFText as="p" typo="hl-lg" color="white" className={styles.eyebrow}>
          <PreservedLines text={hero.eyebrow} />
        </PFText>
        <PFText
          as="h1"
          id="history-hero-title"
          typo="page-title"
          color="white"
          className={styles.title}
        >
          <PreservedLines text={hero.mainText} />
        </PFText>
      </div>
    </section>
  )
}
