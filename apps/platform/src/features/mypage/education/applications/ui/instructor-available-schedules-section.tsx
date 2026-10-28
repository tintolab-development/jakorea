import { PFText } from '@/shared/ui'
import { PipeSeparatedInlineText } from './pipe-separated-inline-text'
import styles from './content.module.css'

type InstructorAvailableSchedulesSectionProps = {
  lines: readonly string[]
  /** 제출 일정은 있으나 표시 문구를 해석하지 못한 경우 `-` */
  unresolvedPlaceholder?: boolean
  title?: string
}

export function InstructorAvailableSchedulesSection({
  lines,
  unresolvedPlaceholder = false,
  title = '강의 진행 가능일',
}: InstructorAvailableSchedulesSectionProps) {
  const displayLines = lines.length > 0 ? lines : unresolvedPlaceholder ? ['-'] : []
  if (displayLines.length === 0) return null

  return (
    <section className={styles.instructorInfoSection} aria-label="신청 정보">
      <PFText as="h2" typo="hl-sm" color="black" className={styles.instructorInfoTitle}>
        신청 정보
      </PFText>
      <div className={styles.scheduleCard}>
        <PFText as="h3" typo="bd-md-sb" color="black" className={styles.scheduleCardTitle}>
          {title}
        </PFText>
        <div className={styles.instructorScheduleLines}>
          {displayLines.map((line, lineIndex) => (
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
