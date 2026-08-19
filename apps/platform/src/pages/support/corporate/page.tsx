import { HeroSection, ProcessSection, WhySection } from '@/features/corporate-donation'
import styles from './page.module.css'

export function CorporateDonationPage() {
  return (
    <section className={styles.page}>
      <HeroSection />
      <WhySection />
      <ProcessSection />
    </section>
  )
}
