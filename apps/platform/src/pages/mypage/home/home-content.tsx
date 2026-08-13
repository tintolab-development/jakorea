import {
  isInstructorMypageProfile,
  type MypageMemberView,
  type MypageProgramStats,
  type MypageScheduleEvent,
} from '@/features/mypage'
import { MypageHomeHeader } from './home-header'
import { ProgramStatCards } from './program-stat-cards'
import { ScheduleSection } from './schedule-section'
import styles from './home-content.module.css'

export type MypageHomeContentProps = {
  member: MypageMemberView
  programStats: MypageProgramStats
  scheduleEvents: MypageScheduleEvent[]
  useMockDemoMonth: boolean
}

export function MypageHomeContent({
  member,
  programStats,
  scheduleEvents,
  useMockDemoMonth,
}: MypageHomeContentProps) {
  return (
    <div className={styles.page}>
      <MypageHomeHeader
        displayName={member.displayName}
        isInstructor={isInstructorMypageProfile(member.profile)}
        affiliationLabel={member.affiliationLabel}
        employmentStatusLabel={member.employmentStatusLabel}
      />
      <div className={styles.stats}>
        <ProgramStatCards stats={programStats} />
      </div>
      <div className={styles.schedule}>
        <ScheduleSection events={scheduleEvents} useMockDemoMonth={useMockDemoMonth} />
      </div>
    </div>
  )
}
