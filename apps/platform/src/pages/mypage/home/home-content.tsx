import type { MypageMemberView, MypageProgramStats, MypageScheduleEvent } from '@/features/mypage'
import { MypageHomeHeader } from './home-header'
import { ProgramStatCards } from './program-stat-cards'
import { ScheduleSection } from './schedule-section'
import styles from './home-content.module.css'

export type MypageHomeContentProps = {
  member: MypageMemberView
  programStats: MypageProgramStats
  programStatsLoading?: boolean
  scheduleEvents: MypageScheduleEvent[]
  scheduleEventsLoading?: boolean
  useMockDemoMonth: boolean
  onViewMonthChange?: (month: Date) => void
}

export function MypageHomeContent({
  member,
  programStats,
  programStatsLoading = false,
  scheduleEvents,
  scheduleEventsLoading = false,
  useMockDemoMonth,
  onViewMonthChange,
}: MypageHomeContentProps) {
  return (
    <div className={styles.page}>
      <MypageHomeHeader
        displayName={member.displayName}
        profile={member.profile}
        affiliationLabel={member.affiliationLabel}
        employmentStatusLabel={member.employmentStatusLabel}
      />
      <div className={styles.stats}>
        <ProgramStatCards stats={programStats} isLoading={programStatsLoading} />
      </div>
      <div className={styles.schedule}>
        <ScheduleSection
          events={scheduleEvents}
          eventsLoading={scheduleEventsLoading}
          profile={member.profile}
          useMockDemoMonth={useMockDemoMonth}
          onViewMonthChange={onViewMonthChange}
        />
      </div>
    </div>
  )
}
