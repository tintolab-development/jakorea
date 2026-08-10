import directionsGradientUrl from '@/assets/background_gradient/directions-gradient.png'
import {
  DirectionsInfoSection,
  getMockDirections,
  KakaoMapEmbed,
} from '@/features/directions'
import { PFText } from '@/shared/ui'
import styles from './page.module.css'

export function DirectionsPage() {
  const info = getMockDirections()

  return (
    <section className={styles.page}>
      <div
        className={styles.pageBackground}
        style={{ backgroundImage: `url(${directionsGradientUrl})` }}
        aria-hidden="true"
      />

      <div className={styles.content}>
        <header className={styles.hero}>
          <PFText as="h1" typo="page-title" color="black" className={styles.title}>
            오시는 길
          </PFText>
        </header>

        <div className={styles.mapSection}>
          <KakaoMapEmbed html={info.kakaoMapHtml} />
        </div>

        <div className={styles.infoSection}>
          <DirectionsInfoSection info={info} />
        </div>
      </div>
    </section>
  )
}
