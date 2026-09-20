import { Fragment } from 'react'
import { PFText } from '@/shared/ui'
import {
  HISTORY_HERO_EYEBROW,
  HISTORY_HERO_TITLE_LINES,
} from '../lib/constants'
import { HISTORY_HERO_IMAGE_URL } from '../lib/hero-image'
import styles from './history-hero-section.module.css'

/** JA History 히어로 — 정적 배경 + 오버레이 (모션 없음) */
export function HistoryHeroSection() {
  return (
    <section className={styles.hero} aria-labelledby="history-hero-title">
      <div
        className={styles.background}
        style={{ backgroundImage: `url(${HISTORY_HERO_IMAGE_URL})` }}
        aria-hidden="true"
      />
      <div className={styles.tint} aria-hidden="true" />
      <div className={styles.gradient} aria-hidden="true" />

      <div className={styles.inner}>
        <PFText as="p" typo="hl-lg" color="white" className={styles.eyebrow}>
          {HISTORY_HERO_EYEBROW}
        </PFText>
        <PFText
          as="h1"
          id="history-hero-title"
          typo="page-title"
          color="white"
          className={styles.title}
        >
          {HISTORY_HERO_TITLE_LINES.map((line, index) => (
            <Fragment key={line}>
              {index > 0 ? <br /> : null}
              {line}
            </Fragment>
          ))}
        </PFText>
      </div>
    </section>
  )
}
