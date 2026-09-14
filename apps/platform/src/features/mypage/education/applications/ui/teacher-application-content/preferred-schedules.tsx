import type { EducationTeacherPreferredSchedule } from '../../model/types'
import { PFText } from '@/shared/ui'
import styles from './teacher-application-content.module.css'

type PreferredSchedulesProps = {
  schedules: EducationTeacherPreferredSchedule[]
}

export function PreferredSchedules({ schedules }: PreferredSchedulesProps) {
  if (schedules.length === 0) return null

  return (
    <section className={styles.sectionAfterDivider} aria-label="신청 정보">
      <PFText as="h2" typo="hl-sm" color="black" className={styles.sectionTitle}>
        신청 정보
      </PFText>
      <div className={styles.scheduleList}>
        {schedules.map(schedule => (
          <div key={schedule.id} className={styles.scheduleCard}>
            <PFText as="h3" typo="bd-md-sb" color="black" className={styles.scheduleLabel}>
              {schedule.label}
            </PFText>
            <PFText as="p" typo="bd-md-md" color="black" className={styles.scheduleValue}>
              {schedule.value}
            </PFText>
          </div>
        ))}
      </div>
    </section>
  )
}
