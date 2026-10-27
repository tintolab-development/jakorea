import { useState } from 'react'
import {
  CtaSection,
  CorporateDonationInquiryModal,
  HeroSection,
  PartnerSection,
  ProcessSection,
  WhySection,
} from '@/features/corporate-donation'
import styles from './page.module.css'

export function CorporateDonationPage() {
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)

  return (
    <>
      <section className={styles.page}>
        <HeroSection />
        <WhySection />
        <ProcessSection />
        <CtaSection onInquiryClick={() => setIsInquiryOpen(true)} />
        <PartnerSection />
      </section>
      <CorporateDonationInquiryModal
        open={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
      />
    </>
  )
}
