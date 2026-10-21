import {
  AchievementSection,
  FALLBACK_IMPACT_TITLE,
  HeroCarousel,
  HomePopupOverlay,
  PartnerMarqueeSection,
  ProgramCarouselSection,
  SocialRail,
  StorySection,
  useHomeMain,
} from '@/features/home'
import { useMediaQuery } from '@/shared/hooks'
import { platformMediaQueries } from '@/shared/lib'
import { ScrollRevealYoutubeVideo } from '@/shared/ui'
import styles from './home-page.module.css'

function TitleLines({ title }: { title: string }) {
  const lines = title
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
  return (
    <>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`}>{line}</span>
      ))}
    </>
  )
}

export function HomePage() {
  const { youtubeUrl, impactTitle } = useHomeMain()
  const videoTitle = impactTitle.trim() || FALLBACK_IMPACT_TITLE
  const isBelowPc = useMediaQuery(platformMediaQueries.belowPc)

  return (
    <div className={styles.page}>
      <HeroCarousel />

      <ProgramCarouselSection />

      {/* YouTube + 스토리: 시안상 동일 패턴 배경 밴드 */}
      <div className={styles.youtubeStoryBand}>
        {isBelowPc ? null : (
          <ScrollRevealYoutubeVideo
            youtubeUrl={youtubeUrl}
            title={<TitleLines title={videoTitle} />}
            titleClassName={styles.youtubeTitle}
            iframeTitle="JA Korea 소개 영상"
            animateOnce
            className={styles.youtubeReveal}
          />
        )}

        <StorySection />
      </div>

      {/* Achievements + 파트너/CTA: 시안상 동일 배경 밴드 (1920×2064) */}
      <div className={styles.achievementsBand}>
        <AchievementSection />
        <PartnerMarqueeSection />
      </div>

      <SocialRail />
      <HomePopupOverlay />
    </div>
  )
}
