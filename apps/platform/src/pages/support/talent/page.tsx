import { CtaSection, FloatingCta, HeroSection, MethodSection } from '@/features/talent-donation'
import { usePublicTalentSponsorshipView } from '@/features/talent-donation/api/hooks'
import { PublicContentPageLoading } from '@/shared/ui'
import styles from './page.module.css'

export function TalentDonationPage() {
  const { isPending } = usePublicTalentSponsorshipView()

  if (isPending) {
    return <PublicContentPageLoading label="재능기부 안내 정보를 불러오는 중" />
  }

  return (
    <section className={styles.page}>
      <HeroSection />
      <MethodSection />
      <CtaSection />
      <FloatingCta />
    </section>
  )
}
