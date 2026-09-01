import directionsGradientUrl from '@/assets/background_gradient/directions-gradient.png'
import {
  DirectionsInfoSection,
  getMockDirections,
  KakaoMapEmbed,
} from '@/features/directions'
import { useShouldUsePlatformMockData } from '@/shared/hooks'
import { PFText } from '@/shared/ui'
import styles from './page.module.css'

export function DirectionsPage() {
  useShouldUsePlatformMockData()
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
          {info ? <KakaoMapEmbed html={info.kakaoMapHtml} /> : null}
        </div>

        <div className={styles.infoSection}>
          {info ? (
            <DirectionsInfoSection info={info} />
          ) : (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              등록된 정보가 없습니다.
            </PFText>
          )}
        </div>
      </div>
    </section>
  )
}
