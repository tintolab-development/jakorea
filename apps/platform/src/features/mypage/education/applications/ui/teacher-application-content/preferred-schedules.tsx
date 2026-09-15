import type { EducationTeacherPreferredSchedule } from '../../model/types'
import { PFText } from '@/shared/ui'
import { splitPipeSeparatedParts } from './split-pipe-parts'
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
        {schedules.map(schedule => {
          const parts = splitPipeSeparatedParts(schedule.value)
          return (
            <div key={schedule.id} className={styles.scheduleCard}>
              <PFText as="h3" typo="bd-md-sb" color="black" className={styles.scheduleLabel}>
                {schedule.label}
              </PFText>
              <div className={styles.scheduleValue}>
                {parts.map((part, index) => (
                  <span key={`${schedule.id}-${index}`} className={styles.schedulePartWrap}>
                    {index > 0 ? (
                      <span className={styles.schedulePartDivider} aria-hidden="true" />
                    ) : null}
                    <PFText
                      as="span"
                      typo={index === 0 ? 'bd-md-md' : 'bd-md-bd'}
                      color="black"
                      className={styles.schedulePart}
                    >
                      {part}
                    </PFText>
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
