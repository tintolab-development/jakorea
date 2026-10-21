import { PFText } from '@/shared/ui'
import { InstructorAvailableSchedulesSection } from './instructor-available-schedules-section'
import { PipeSeparatedInlineText } from './pipe-separated-inline-text'
import styles from './content.module.css'

type EducationApplicationContentProps = {
  selfIntroMotivation?: string
  preferredEducationScheduleLabel?: string
  /** 해석된 희망 일정 줄. 있으면 `preferredEducationScheduleLabel`보다 우선 */
  preferredEducationScheduleLines?: readonly string[]
  /** 봉사현황 등 — 일정 미기재 시에도 「진행 희망 교육 일정」 카드 노출 (`-`) */
  alwaysShowPreferredSchedule?: boolean
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
  preferredEducationScheduleLines,
  alwaysShowPreferredSchedule = false,
  instructorAvailableScheduleLines,
}: EducationApplicationContentProps) {
  const intro = selfIntroMotivation?.trim() ?? ''
  const instructorLines = instructorAvailableScheduleLines ?? []
  const scheduleLines = instructorLines.length > 0
    ? []
    : preferredEducationScheduleLines && preferredEducationScheduleLines.length > 0
      ? [...preferredEducationScheduleLines]
      : resolvePreferredScheduleLines(preferredEducationScheduleLabel)
  const displayScheduleLines =
    alwaysShowPreferredSchedule && scheduleLines.length === 0 ? ['-'] : scheduleLines
  const hasIntro = intro.length > 0
  const hasInstructorSchedule = instructorLines.length > 0
  const hasSchedule = alwaysShowPreferredSchedule || displayScheduleLines.length > 0

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
          {displayScheduleLines.map((line, index) => {
            return (
              <section
                key={`preferred-schedule-${index + 1}`}
                className={styles.scheduleCard}
                aria-label={`진행 희망 교육 일정 ${index + 1}`}
              >
                <PFText as="h2" typo="bd-md-sb" color="black" className={styles.scheduleCardTitle}>
                  진행 희망 교육 일정 {index + 1}
                </PFText>
                <PipeSeparatedInlineText
                  value={line}
                  emphasizeTail
                  className={styles.scheduleValue}
                  partClassName={styles.schedulePart}
                />
              </section>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
