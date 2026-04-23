import type { UserDetailProgramsChildKey } from '../lib/user-detail-fullpage-helpers'
import type { UserProgramsHistoryConfig } from './user-programs-section'
import type { ProgramsViewType } from './user-programs/programs-view-type'

export function resolveProgramsView({
  hasProgramsChildMenu,
  activeProgramsChild,
  config,
}: {
  hasProgramsChildMenu: boolean
  activeProgramsChild: UserDetailProgramsChildKey
  config: UserProgramsHistoryConfig
}): ProgramsViewType[] {
  if (hasProgramsChildMenu) {
    if (activeProgramsChild === 'enrollment') {
      switch (config.enrollmentMode) {
        case 'STUDENT_HISTORY':
          return ['STUDENT_HISTORY']
        case 'SCHOOL_PARTICIPATION':
          return ['SCHOOL_PARTICIPATION']
        case 'TABLE':
          return ['ENROLLMENT_TABLE']
      }
    }

    if (activeProgramsChild === 'lecture' && config.showLectureHistoryWhenLectureChild)
      return ['LECTURE_HISTORY']

    if (activeProgramsChild === 'volunteer') return ['VOLUNTEER_HISTORY']

    return []
  }

  if (config.useSchoolProgramParticipationSingleView) return ['SCHOOL_PARTICIPATION']

  return ['ENROLLMENT_TABLE', 'VOLUNTEER_HISTORY']
}
