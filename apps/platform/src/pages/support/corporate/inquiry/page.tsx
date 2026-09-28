import { CorporateDonationInquiryForm } from '@/features/corporate-donation'
import { PFText } from '@/shared/ui'
import styles from './page.module.css'

export function CorporateDonationInquiryPage() {
  return (
    <section className={styles.page} aria-labelledby="corporate-donation-inquiry-title">
      <div className={styles.inner}>
        <PFText
          as="h1"
          id="corporate-donation-inquiry-title"
          typo="page-title-sm"
          color="black"
          className={styles.title}
        >
          기업후원 문의
        </PFText>
        <CorporateDonationInquiryForm />
      </div>
    </section>
  )
}
