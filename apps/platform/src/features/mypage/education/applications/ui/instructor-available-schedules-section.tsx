import { PFText } from '@/shared/ui'
import { PipeSeparatedInlineText } from './pipe-separated-inline-text'
import styles from './content.module.css'

type InstructorAvailableSchedulesSectionProps = {
  lines: readonly string[]
}

export function InstructorAvailableSchedulesSection({
  lines,
}: InstructorAvailableSchedulesSectionProps) {
  if (lines.length === 0) return null

  return (
    <section className={styles.scheduleList} aria-label="강의 진행 가능일">
      <div className={styles.scheduleCard}>
        <PFText as="h2" typo="bd-md-sb" color="black" className={styles.scheduleCardTitle}>
          강의 진행 가능일
        </PFText>
        <div className={styles.instructorScheduleLines}>
          {lines.map((line, lineIndex) => (
            <PipeSeparatedInlineText
              key={`instructor-schedule-line-${lineIndex}`}
              value={line}
              emphasizeTail
              className={styles.scheduleValue}
              partClassName={styles.schedulePart}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
