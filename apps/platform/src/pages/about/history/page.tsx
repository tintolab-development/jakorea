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
import { usePublicJaHistoryPage } from '@/features/history/api/hooks'
import styles from './page.module.css'

export function HistoryPage() {
  const { view } = usePublicJaHistoryPage()

  return (
    <div className={styles.page}>
      <HistoryHeroSection hero={view.hero} />
      <div className={styles.darkBand}>
        <OriginSection origin={view.origin} />
        <LearningSection learning={view.learning} />
        <div className={styles.eraTone}>
          <EraPhotosSection eras={view.eras} />
          <ExpansionSection world={view.world} />
        </div>
      </div>
      <div className={styles.lightBand}>
        <PhilosophySection philosophy={view.philosophy} />
        <KoreaSection korea={view.korea} />
        <ThriveSection thrive={view.thrive} />
        <CtaSection cta={view.cta} />
      </div>
    </div>
  )
}
