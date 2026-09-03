import {
  IntroductionScroll,
  AchievementSection,
  BrandIdentitySection,
} from '@/features/introduction'
import styles from './page.module.css'

export function IntroductionPage() {
  return (
    <div className={styles.page}>
      <IntroductionScroll />
      <AchievementSection />
      <BrandIdentitySection />
    </div>
  )
}
