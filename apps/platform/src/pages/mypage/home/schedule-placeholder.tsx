import { PFText } from '@/shared/ui'
import styles from './schedule-placeholder.module.css'

export function SchedulePlaceholder() {
  return (
    <section className={styles.section} aria-label="프로그램 일정">
      <div className={styles['calendar-slot']} aria-hidden="true" />
      <div className={styles.empty}>
        <PFText as="p" typo="bd-md-md" color="black" className={styles.title}>
          예정된 프로그램 일정이 없어요
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
          프로그램을 신청하면 일정이 여기에 표시돼요
        </PFText>
      </div>
    </section>
  )
}
