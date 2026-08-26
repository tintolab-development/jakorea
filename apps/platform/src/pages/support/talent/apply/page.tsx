import {
  TalentDonationApplyForm,
  TALENT_APPLY_PAGE_TITLE,
} from '@/features/talent-donation'
import { PFText } from '@/shared/ui'
import styles from './page.module.css'

export function TalentDonationApplyPage() {
  return (
    <section className={styles.page} aria-labelledby="talent-donation-apply-title">
      <div className={styles.inner}>
        <PFText
          as="h1"
          id="talent-donation-apply-title"
          typo="page-title-sm"
          color="black"
          className={styles.title}
        >
          {TALENT_APPLY_PAGE_TITLE}
        </PFText>
        <TalentDonationApplyForm />
      </div>
    </section>
  )
}
