import { PFText } from '@/shared/ui'
import { splitPipeSeparatedParts } from './teacher-application-content/split-pipe-parts'
import { InstructorAvailableSchedulesSection } from './instructor-available-schedules-section'
import styles from './content.module.css'

type EducationApplicationContentProps = {
  selfIntroMotivation?: string
  preferredEducationScheduleLabel?: string
  /** 강사 프로그램 신청 — `강의 진행 가능일` (성범죄 등 다른 신청 정보는 제외) */
  instructorAvailableScheduleLines?: readonly string[]
}

function resolvePreferredScheduleLines(label: string | undefined): string[] {
  const trimmed = label?.trim() ?? ''
  if (!trimmed) return []
  return trimmed
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

export function EducationApplicationContent({
  selfIntroMotivation,
  preferredEducationScheduleLabel,
  instructorAvailableScheduleLines,
}: EducationApplicationContentProps) {
  const intro = selfIntroMotivation?.trim() ?? ''
  const instructorLines = instructorAvailableScheduleLines ?? []
  const scheduleLines = instructorLines.length > 0
    ? []
    : resolvePreferredScheduleLines(preferredEducationScheduleLabel)
  const hasIntro = intro.length > 0
  const hasInstructorSchedule = instructorLines.length > 0
  const hasSchedule = scheduleLines.length > 0

  if (!hasIntro && !hasSchedule && !hasInstructorSchedule) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
        신청 내용이 없습니다.
      </PFText>
    )
  }

  return (
    <div className={styles.root}>
      {hasIntro ? (
        <section className={styles.intro}>
          <PFText as="h2" typo="bd-sm-rg" color="neutral-cool-600" className={styles.introTitle}>
            자기소개 및 지원동기
          </PFText>
          <PFText as="p" typo="bd-md-md" color="black" className={styles.introBody}>
            {intro}
          </PFText>
        </section>
      ) : null}

      {hasInstructorSchedule ? (
        <InstructorAvailableSchedulesSection lines={instructorLines} />
      ) : null}

      {hasSchedule ? (
        <div className={styles.scheduleList}>
          {scheduleLines.map((line, index) => {
            const parts = splitPipeSeparatedParts(line)
            return (
              <section
                key={`preferred-schedule-${index + 1}`}
                className={styles.scheduleCard}
                aria-label={`진행 희망 교육 일정 ${index + 1}`}
              >
                <PFText as="h2" typo="bd-md-sb" color="black" className={styles.scheduleCardTitle}>
                  진행 희망 교육 일정 {index + 1}
                </PFText>
                <div className={styles.scheduleValue}>
                  {parts.map((part, partIndex) => (
                    <span key={partIndex} className={styles.schedulePartWrap}>
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
              </section>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
