import { useMemo } from 'react'
import type { Application, UserHistory } from '@/types/domain'
import type { User } from '@/types/user'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import type { UserDetailProgramsChildKey } from '../lib/user-detail-fullpage-helpers'
import { ProgramsViewRenderer } from './user-programs-view-renderer'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { MemberDetailMockDataBanner } from '@/features/user/detail/ui/member-detail-mock-data-banner'

export type EnrollmentMode = 'TABLE' | 'STUDENT_HISTORY' | 'SCHOOL_PARTICIPATION'

export interface UserProgramsHistoryConfig {
  enrollmentSectionTitle: string
  enrollmentEmptyDescription: string
  enrollmentMode: EnrollmentMode
  showLectureHistoryWhenLectureChild: boolean
  useSchoolProgramParticipationSingleView: boolean
}

function memberShowsProgramHistoryCertificateBulkIssue(
  user: Pick<User, 'role' | 'instructorMemberProfile' | 'affiliatedSchoolUserId'>
): boolean {
  /** 학교 회원 상세 — 프로그램 참여 이력(수강 이력)에서는 일괄 발급 미노출 */
  if (user.role === 'SCHOOL') return false
  if (user.role !== 'INSTRUCTOR') return true
  return resolveInstructorMemberProfile(user) !== 'school_teacher'
}

export interface UserProgramsSectionProps {
  /** 일반 교사 등 발급 버튼 제어용 */
  user: Omit<User, 'password'>
  applications: Application[]
  enrollmentTableRows: Application[]
  loading: boolean
  activeProgramsChild: UserDetailProgramsChildKey
  volunteerHistories: UserHistory[]
  volunteerHistoriesLoading: boolean
  hasProgramsChildMenu: boolean
  programsHistoryConfig: UserProgramsHistoryConfig
  onProgressStatusChange: (
    app: Application,
    displayStatus: ProgramEnrollmentDisplayStatus
  ) => void | Promise<void>
  onOpenLectureAttendance: (record: Application) => void
  onOpenAssignment: (record: Application) => void
  onRowClick: (record: Application) => void
}

/** 회원 상세 — 프로그램·봉사 이력 탭 본문 (역할별 분기는 상위 전략에서 주입) */
export function UserProgramsSection(props: UserProgramsSectionProps) {
  const showCertificateBulkIssue = useMemo(
    () => memberShowsProgramHistoryCertificateBulkIssue(props.user),
    [props.user]
  )

  return (
    <div className="user-detail-fullpage-modal__programs">
      {isMembersRemoteEnabled() ? (
        <MemberDetailMockDataBanner message="진행상태 변경·강의보고/출석/과제 모달·수료증 일괄 발급은 API 미제공으로 mock 동작이 유지됩니다." />
      ) : null}
      <ProgramsViewRenderer {...props} showCertificateBulkIssue={showCertificateBulkIssue} />
    </div>
  )
}
