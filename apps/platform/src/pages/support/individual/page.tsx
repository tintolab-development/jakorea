import { CtaSection, HeroSection, ImpactSection, WhySection } from '@/features/individual-donation'
import styles from './page.module.css'

export function IndividualDonationPage() {
  return (
    <section className={styles.page}>
      <HeroSection />
      <WhySection />
      <CtaSection />
      <ImpactSection />
    </section>
  )
}
