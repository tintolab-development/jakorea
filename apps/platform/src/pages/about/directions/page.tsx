import directionsGradientUrl from '@/assets/background_gradient/directions-gradient.png'
import {
  DirectionsInfoSection,
  KakaoMapEmbed,
  usePublicDirections,
} from '@/features/directions'
import { PFButton, PFLoadingSpinner, PFText, PublicContentPageStatus } from '@/shared/ui'
import styles from './page.module.css'

export function DirectionsPage() {
  const { info, isPending, isError, refetch } = usePublicDirections()

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

        {isPending ? (
          <PublicContentPageStatus layout="list">
            <PFLoadingSpinner label="오시는 길 정보를 불러오는 중" />
          </PublicContentPageStatus>
        ) : isError ? (
          <PublicContentPageStatus layout="list">
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              오시는 길 정보를 불러오지 못했습니다.
            </PFText>
            <PFButton variant="tertiary" size="large" onClick={refetch}>
              다시 시도
            </PFButton>
          </PublicContentPageStatus>
        ) : (
          <>
            <div className={styles.mapSection}>
              {info?.kakaoMapHtml.trim() ? <KakaoMapEmbed html={info.kakaoMapHtml} /> : null}
            </div>

            <div className={styles.infoSection}>
              {info ? (
                <DirectionsInfoSection info={info} />
              ) : (
                <PublicContentPageStatus layout="list">
                  <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
                    등록된 정보가 없습니다.
                  </PFText>
                </PublicContentPageStatus>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
