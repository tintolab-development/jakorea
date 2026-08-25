import { CtaSection, HeroSection, MethodSection } from '@/features/talent-donation'
import styles from './page.module.css'

export function TalentDonationPage() {
  return (
    <section className={styles.page}>
      <HeroSection />
      <MethodSection />
      <CtaSection />
    </section>
  )
}
