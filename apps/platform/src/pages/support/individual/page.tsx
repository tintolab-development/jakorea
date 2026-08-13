import { HeroSection, WhySection } from '@/features/individual-donation'
import styles from './page.module.css'

export function IndividualDonationPage() {
  return (
    <section className={styles.page}>
      <HeroSection />
      <WhySection />
    </section>
  )
}
