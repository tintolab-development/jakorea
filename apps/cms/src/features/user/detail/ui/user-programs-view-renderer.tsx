import type { UserProgramsSectionProps } from './user-programs-section'
import { resolveProgramsView } from './user-programs-view-resolver'
import { EnrollmentTableView } from './user-programs/enrollment-table-view'
import { StudentHistoryView } from './user-programs/student-history-view'
import { SchoolParticipationView } from './user-programs/school-participation-view'
import { LectureHistoryView } from './user-programs/lecture-history-view'
import { VolunteerHistoryView } from './user-programs/volunteer-history-view'

export type RendererProps = UserProgramsSectionProps & {
  showCertificateBulkIssue: boolean
}

export function ProgramsViewRenderer(props: RendererProps) {
  const views = resolveProgramsView({
    hasProgramsChildMenu: props.hasProgramsChildMenu,
    activeProgramsChild: props.activeProgramsChild,
    config: props.programsHistoryConfig,
  })

  return (
    <>
      {views.map(view => {
        switch (view) {
          case 'ENROLLMENT_TABLE':
            return <EnrollmentTableView key={view} {...props} />

          case 'STUDENT_HISTORY':
            return <StudentHistoryView key={view} {...props} />

          case 'SCHOOL_PARTICIPATION':
            return <SchoolParticipationView key={view} {...props} />

          case 'LECTURE_HISTORY':
            return <LectureHistoryView key={view} {...props} />

          case 'VOLUNTEER_HISTORY':
            return <VolunteerHistoryView key={view} {...props} />
          default: {
            const _exhaustive: never = view
            return _exhaustive
          }
        }
      })}
    </>
  )
}
