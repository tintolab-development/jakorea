import {
  CtaSection,
  FloatingCta,
  HeroSection,
  ImpactSection,
  WhySection,
} from '@/features/individual-donation'
import { usePublicPersonalSponsorshipView } from '@/features/individual-donation/api/hooks'
import { PublicContentPageLoading } from '@/shared/ui'
import styles from './page.module.css'

export function IndividualDonationPage() {
  const { isPending } = usePublicPersonalSponsorshipView()

  if (isPending) {
    return <PublicContentPageLoading label="후원 안내 정보를 불러오는 중" />
  }

  return (
    <section className={styles.page}>
      <HeroSection />
      <WhySection />
      <CtaSection />
      <ImpactSection />
      <FloatingCta />
    </section>
  )
}
