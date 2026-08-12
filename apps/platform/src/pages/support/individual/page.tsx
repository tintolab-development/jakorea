import { PFButton } from '@/shared/ui'
import styles from './page.module.css'

export function SupportIndividualPage() {
  return (
    <section className={styles.page}>
      <PFButton size="large" variant="primary" type="button">
        후원하기
      </PFButton>
    </section>
  )
}
