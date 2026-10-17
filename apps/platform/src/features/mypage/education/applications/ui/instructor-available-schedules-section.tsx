import { PFText } from '@/shared/ui'
import { splitPipeSeparatedParts } from './teacher-application-content/split-pipe-parts'
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
          {lines.map((line, lineIndex) => {
            const parts = splitPipeSeparatedParts(line)
            return (
              <div key={`instructor-schedule-line-${lineIndex}`} className={styles.scheduleValue}>
                {parts.map((part, partIndex) => (
                  <span
                    key={`instructor-schedule-line-${lineIndex}-part-${partIndex}`}
                    className={styles.schedulePartWrap}
                  >
                    {partIndex > 0 ? (
                      <span className={styles.schedulePartDivider} aria-hidden="true" />
                    ) : null}
                    <PFText
                      as="span"
                      typo={partIndex === 0 ? 'bd-md-md' : 'bd-md-bd'}
                      color="black"
                      className={styles.schedulePart}
                    >
                      {part}
                    </PFText>
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
