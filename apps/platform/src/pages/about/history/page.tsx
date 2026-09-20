import {
  CtaSection,
  EraPhotosSection,
  ExpansionSection,
  HistoryHeroSection,
  KoreaSection,
  LearningSection,
  OriginSection,
  PhilosophySection,
  ThriveSection,
} from '@/features/history'
import styles from './page.module.css'

export function HistoryPage() {
  return (
    <div className={styles.page}>
      <HistoryHeroSection />
      <div className={styles.darkBand}>
        <OriginSection />
        <LearningSection />
        <div className={styles.eraTone}>
          <EraPhotosSection />
          <ExpansionSection />
        </div>
      </div>
      <div className={styles.lightBand}>
        <PhilosophySection />
        <KoreaSection />
        <ThriveSection />
        <CtaSection />
      </div>
    </div>
  )
}
