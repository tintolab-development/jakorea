import { useState } from 'react'
import {
  CtaSection,
  CorporateDonationInquiryModal,
  FloatingCta,
  HeroSection,
  PartnerSection,
  ProcessSection,
  WhySection,
} from '@/features/corporate-donation'
import { usePublicCorporateSponsorshipView } from '@/features/corporate-donation/api/hooks'
import { PublicContentPageLoading } from '@/shared/ui'
import styles from './page.module.css'

export function CorporateDonationPage() {
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const { isPending } = usePublicCorporateSponsorshipView()

  if (isPending) {
    return <PublicContentPageLoading label="기업 후원 안내 정보를 불러오는 중" />
  }

  return (
    <>
      <section className={styles.page}>
        <HeroSection />
        <WhySection />
        <ProcessSection />
        <CtaSection onInquiryClick={() => setIsInquiryOpen(true)} />
        <PartnerSection />
        <FloatingCta onInquiryClick={() => setIsInquiryOpen(true)} />
      </section>
      <CorporateDonationInquiryModal
        open={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
      />
    </>
  )
}
