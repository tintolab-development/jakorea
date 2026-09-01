import { PFText } from '@/shared/ui'
import styles from './content.module.css'

type EducationApplicationContentProps = {
  selfIntroMotivation?: string
  preferredEducationScheduleLabel?: string
}

export function EducationApplicationContent({
  selfIntroMotivation,
  preferredEducationScheduleLabel,
}: EducationApplicationContentProps) {
  const intro = selfIntroMotivation?.trim() ?? ''
  const schedule = preferredEducationScheduleLabel?.trim() ?? ''
  const hasIntro = intro.length > 0
  const hasSchedule = schedule.length > 0

  if (!hasIntro && !hasSchedule) {
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

      {hasSchedule ? (
        <section className={styles.schedule}>
          <PFText as="h2" typo="bd-md-sb" color="black">
            진행 희망 교육 일정
          </PFText>
          <PFText as="p" typo="bd-md-md" color="black" className={styles.scheduleValue}>
            {schedule}
          </PFText>
        </section>
      ) : null}
    </div>
  )
}
