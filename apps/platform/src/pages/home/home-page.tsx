import {
  AchievementSection,
  HeroCarousel,
  HOME_HERO_SLIDES,
  HOME_YOUTUBE_URL,
  PartnerMarqueeSection,
  ProgramCarouselSection,
  SocialRail,
  StorySection,
} from '@/features/home'
import { ScrollRevealYoutubeVideo } from '@/shared/ui'
import styles from './home-page.module.css'

export function HomePage() {
  return (
    <div className={styles.page}>
      <HeroCarousel slides={HOME_HERO_SLIDES} />

      <ProgramCarouselSection />

      {/* YouTube + 스토리: 시안상 동일 패턴 배경 밴드 */}
      <div className={styles.youtubeStoryBand}>
        <ScrollRevealYoutubeVideo
          youtubeUrl={HOME_YOUTUBE_URL}
          title={
            <>
              JA Korea와 함께
              <br />
              청소년의 가능성을 넓혀주세요
            </>
          }
          iframeTitle="JA Korea 소개 영상"
          animateOnce
          className={styles.youtubeReveal}
        />

        <StorySection />
      </div>

      {/* Achievements + 파트너/CTA: 시안상 동일 배경 밴드 (1920×2064) */}
      <div className={styles.achievementsBand}>
        <AchievementSection />
        <PartnerMarqueeSection />
      </div>

      <SocialRail />
    </div>
  )
}
