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

      <AchievementSection />

      <PartnerMarqueeSection />

      <SocialRail />
    </div>
  )
}
