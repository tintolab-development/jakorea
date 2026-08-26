import { useMemo } from 'react'
import type { Application, UserHistory } from '@/types/domain'
import type { User } from '@/types/user'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import type { UserDetailProgramsChildKey } from '../lib/user-detail-fullpage-helpers'
import type { CertificateIssueReasonValue } from './modal/certificate-bulk-issue-reason-modal'
import { ProgramsViewRenderer } from './user-programs-view-renderer'
import { memberShowsProgramHistoryCertificateBulkIssue } from '../lib/member-program-history-certificate-bulk-issue'

export type EnrollmentMode = 'TABLE' | 'STUDENT_HISTORY' | 'SCHOOL_PARTICIPATION'

export interface UserProgramsHistoryConfig {
  enrollmentSectionTitle: string
  enrollmentEmptyDescription: string
  enrollmentMode: EnrollmentMode
  showLectureHistoryWhenLectureChild: boolean
  useSchoolProgramParticipationSingleView: boolean
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
  onOpenVolunteerProgramDetail: (history: UserHistory) => void
  onBulkDeleteHistory: (rowIds: string[]) => void | Promise<void>
  onStudentCertificateBulkIssue: (
    rowIds: readonly string[],
    reason: CertificateIssueReasonValue,
    reasonLabel: string
  ) => void | Promise<void>
  onVolunteerCertificateBulkIssue: (
    rowIds: readonly string[],
    reason: CertificateIssueReasonValue,
    reasonLabel: string
  ) => void | Promise<void>
  progressStatusReadOnly?: boolean
}

/** 회원 상세 — 프로그램·봉사 이력 탭 본문 (역할별 분기는 상위 전략에서 주입) */
export function UserProgramsSection(props: UserProgramsSectionProps) {
  const showCertificateBulkIssue = useMemo(
    () => memberShowsProgramHistoryCertificateBulkIssue(props.user),
    [props.user]
  )

  return (
    <div className="user-detail-fullpage-modal__programs">
      <ProgramsViewRenderer {...props} showCertificateBulkIssue={showCertificateBulkIssue} />
    </div>
  )
}
