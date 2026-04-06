/**
 * 회원 상세 풀페이지 모달
 * 전체 회원 목록 행 클릭 시 프로그램 상세와 동일한 LNB+메인 레이아웃으로 노출
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Table, Empty, message, Space } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailModalSidebar } from '@/shared/ui/detail-modal-sidebar'
import type { Application, UserHistory } from '@/types/domain'
import type { ApplicationProgressStatus } from '@/types/application-progress'
import { applicationService } from '@/entities/application/api/application-service'
import { mockUserHistories } from '@/data/mock/mypage'
import dayjs from 'dayjs'
import {
  DeleteGuideModal,
  buildMemberWithdrawMessageLines,
  buildSchoolDeleteMessageLines,
} from '@/features/program/ui/manager-delete-guide-modal'
import { LectureAttendanceModal } from '@/features/program/ui/lecture-attendance-modal'
import { AssignmentSubmissionModal } from '@/features/program/ui/assignment-submission-modal'
import { EnrollmentProgramDetailModal } from './enrollment-program-detail-modal'
import { UserBasicInfoSection, type UserBasicInfoEntrySource } from './user-basic-info-section'
import {
  UserConsentAgreementSection,
  resolveUserConsentAgreementPreset,
} from './user-consent-agreement-section'
import { InstructorResumeDetailForms } from './instructor-resume-detail-forms'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import {
  maskedUserForInstructorDetail,
  userToApplicantInstructorRow,
} from '@/features/user/lib/user-to-applicant-instructor-row'
import { InstructorPaymentTab } from './instructor-payment-tab'
import { AdminManagedProgramHistory } from './admin-managed-program-history'
import { MemberProgramLectureHistory } from './member-program-lecture-history'
import { SchoolAffiliatedTeachersSection } from './school-affiliated-teachers-section'
import {
  programsHistoryHasChildMenu,
  clampProgramsChildForUser,
  instructorDetailLnbClickShowsPrepareMessage,
  userDetailModalTitle,
  userDetailSidebarNavAriaLabel,
  type UserDetailLnbKey,
  type UserDetailProgramsChildKey,
} from './user-detail-fullpage-helpers'
import { buildUserDetailSidebarItems } from './user-detail-fullpage-sidebar-items'
import { useUserDetailApplications } from './use-user-detail-applications'
import { useUserDetailUrlSync } from './use-user-detail-url-sync'
import {
  UserDetailFullPageHeaderActions,
  type UserDetailPermissionRole,
} from './user-detail-fullpage-header-actions'
import { createProgramHistoryColumns } from './user-detail-program-history-columns'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { User } from '@/types/user'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import './user-detail-modal.css'
import './user-detail-fullpage-modal.css'

export type { UserDetailLnbKey, UserDetailProgramsChildKey } from './user-detail-fullpage-helpers'
export type { UserDetailPermissionRole } from './user-detail-fullpage-header-actions'

/** 회원 목록·풀페이지 공통 URL — 새로고침 시 하위 탭 유지 */
export const USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY = 'programsChild' as const

export type UserDetailFullPageModalMode = 'default' | 'permission'

export interface UserDetailFullPageModalProps {
  open: boolean
  user: Omit<User, 'password'> | null
  onClose: () => void
  onEdit?: (user: Omit<User, 'password'>) => void
  onWithdraw?: (user: Omit<User, 'password'>) => void
  /** 기본 정보 테이블 분기 — 미지정 시 URL `userDetailEntry` 또는 회원 역할로 도출 */
  basicInfoEntrySource?: UserBasicInfoEntrySource
  /** `permission`: 권한 승인 목록 진입 — LNB 단일 탭(신청 정보), 헤더 권한 승인 액션 */
  mode?: UserDetailFullPageModalMode
  /** mode=permission — 강사/관리자 권한 승인 큐 맥락 */
  permissionRole?: UserDetailPermissionRole
  onPermissionApprove?: (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => void
  onPermissionReject?: (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => void
  /** 소속 교사 행의 `linkedUserId`로 다른 회원 상세로 전환 (회원 목록 등에서 연동) */
  onNavigateToLinkedUser?: (userId: string) => void
}

export function UserDetailFullPageModal({
  open,
  user,
  onClose,
  onEdit,
  onWithdraw,
  basicInfoEntrySource,
  mode = 'default',
  permissionRole,
  onPermissionApprove,
  onPermissionReject,
  onNavigateToLinkedUser,
}: UserDetailFullPageModalProps) {
  const displayUser = user
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeLnb, setActiveLnb] = useState<UserDetailLnbKey>('detail-info')
  const [activeProgramsChild, setActiveProgramsChild] =
    useState<UserDetailProgramsChildKey>('enrollment')
  const { applications, enrollmentApplications, applicationsLoading, refetchApplications } =
    useUserDetailApplications(open, displayUser)

  const [volunteerHistories, setVolunteerHistories] = useState<UserHistory[]>([])
  const [volunteerHistoriesLoading, setVolunteerHistoriesLoading] = useState(false)
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false)
  const [lectureAttendanceModalOpen, setLectureAttendanceModalOpen] = useState(false)
  const [lectureAttendanceApplication, setLectureAttendanceApplication] =
    useState<Application | null>(null)
  const [assignmentSubmissionModalOpen, setAssignmentSubmissionModalOpen] = useState(false)
  const [assignmentSubmissionApplication, setAssignmentSubmissionApplication] =
    useState<Application | null>(null)
  const [programDetailModalOpen, setProgramDetailModalOpen] = useState(false)
  const [selectedApplicationForProgramDetail, setSelectedApplicationForProgramDetail] =
    useState<Application | null>(null)
  const [personalInfoRevealed, setPersonalInfoRevealed] = useState(false)

  useUserDetailUrlSync({
    open,
    displayUser,
    mode,
    searchParams,
    setSearchParams,
    setActiveLnb,
    setActiveProgramsChild,
    programsChildQueryKey: USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY,
  })

  useEffect(() => {
    if (!open) setPersonalInfoRevealed(false)
  }, [open])

  useEffect(() => {
    setPersonalInfoRevealed(false)
  }, [displayUser?.id])

  useEffect(() => {
    if (open && displayUser) {
      setVolunteerHistoriesLoading(true)
      try {
        const histories = mockUserHistories.filter(
          h => h.userId === displayUser.id && h.finalStatus !== 'CANCELLED'
        )
        histories.sort((a, b) => dayjs(b.completedAt).diff(dayjs(a.completedAt)))
        setVolunteerHistories(histories)
      } catch (error) {
        console.error('Failed to load user histories:', error)
        setVolunteerHistories([])
      } finally {
        setVolunteerHistoriesLoading(false)
      }
    } else {
      setVolunteerHistories([])
    }
  }, [open, displayUser])

  const handleProgressStatusChange = useCallback(
    async (app: Application, displayStatus: ProgramEnrollmentDisplayStatus) => {
      if (!displayUser) return
      try {
        if (displayStatus === 'REJECTED') {
          await applicationService.updateStatus(app.id, 'rejected')
        } else if (displayStatus === 'WAITING_RESULT') {
          await applicationService.updateStatus(app.id, 'submitted')
        } else {
          const progressMap: Record<
            Exclude<ProgramEnrollmentDisplayStatus, 'REJECTED' | 'WAITING_RESULT'>,
            ApplicationProgressStatus
          > = {
            EDUCATION_SCHEDULED: 'RECEIVED',
            EDUCATION_IN_PROGRESS: 'IN_PROGRESS',
            PROGRAM_ENDED: 'REPORT_SUBMITTED',
          }
          await applicationService.update(app.id, {
            status: 'approved',
            progressStatus: progressMap[displayStatus],
          })
        }
        await refetchApplications()
      } catch (e) {
        console.error('Failed to update progress status:', e)
      }
    },
    [displayUser, refetchApplications]
  )

  const userSidebarItems = useMemo(
    () => buildUserDetailSidebarItems(displayUser ?? undefined, mode),
    [displayUser, mode]
  )

  const sidebarExpandedGroupKeys = useMemo(() => {
    if (!displayUser || !programsHistoryHasChildMenu(displayUser)) return [] as const
    if (displayUser.role === 'INSTRUCTOR') {
      const p = resolveInstructorMemberProfile(displayUser)
      if (p === 'instructor_only') {
        if (activeLnb === 'payment-status') return [] as const
        return ['history'] as const
      }
    }
    if (activeLnb !== 'history') return [] as const
    return ['history'] as const
  }, [activeLnb, displayUser])

  const sidebarActiveChildKey =
    activeLnb === 'history' && displayUser && programsHistoryHasChildMenu(displayUser)
      ? activeProgramsChild
      : ''

  const handleSidebarSelectTop = (key: string) => {
    if (mode === 'permission') {
      setActiveLnb('detail-info')
      return
    }
    if (!displayUser) return
    const k = key as UserDetailLnbKey

    if (k === 'payment-status') {
      if (instructorDetailLnbClickShowsPrepareMessage(displayUser, k, 'payment-top')) {
        window.alert('준비 중입니다.')
        return
      }
    }

    if (k === 'history' && programsHistoryHasChildMenu(displayUser)) {
      if (instructorDetailLnbClickShowsPrepareMessage(displayUser, k, 'history-top')) {
        window.alert('준비 중입니다.')
        return
      }
      setActiveLnb('history')
      setActiveProgramsChild('enrollment')
    } else {
      setActiveLnb(k)
    }

    setSearchParams(
      prev => {
        const nextParams = new URLSearchParams(prev)
        if (displayUser?.id) nextParams.set('id', displayUser.id)
        nextParams.set('lnb', k)
        if (k === 'history' && programsHistoryHasChildMenu(displayUser)) {
          nextParams.set(USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY, 'enrollment')
        } else {
          nextParams.delete(USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY)
        }
        return nextParams
      },
      { replace: true }
    )
  }

  const handleSidebarSelectChild = (_groupKey: string, childKey: string) => {
    if (mode === 'permission') return
    if (!displayUser) return
    const child = clampProgramsChildForUser(displayUser, childKey as UserDetailProgramsChildKey)
    if (instructorDetailLnbClickShowsPrepareMessage(displayUser, 'history', 'history-child', child)) {
      window.alert('준비 중입니다.')
      return
    }
    setActiveProgramsChild(child)
    setActiveLnb('history')
    setSearchParams(
      prev => {
        const nextParams = new URLSearchParams(prev)
        if (displayUser?.id) nextParams.set('id', displayUser.id)
        nextParams.set('lnb', 'history')
        nextParams.set(USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY, child)
        return nextParams
      },
      { replace: true }
    )
  }

  const openLectureAttendance = useCallback((record: Application) => {
    setLectureAttendanceApplication(record)
    setLectureAttendanceModalOpen(true)
  }, [])

  const openAssignmentSubmission = useCallback((record: Application) => {
    setAssignmentSubmissionApplication(record)
    setAssignmentSubmissionModalOpen(true)
  }, [])

  const programHistoryColumns = useMemo(
    () =>
      createProgramHistoryColumns({
        onProgressStatusChange: handleProgressStatusChange,
        onOpenLectureAttendance: openLectureAttendance,
        onOpenAssignmentSubmission: openAssignmentSubmission,
      }),
    [handleProgressStatusChange, openLectureAttendance, openAssignmentSubmission]
  )

  const instructorResumeApplicantRow = useMemo((): ApplicantInstructorRow | null => {
    if (!displayUser || displayUser.role !== 'INSTRUCTOR') return null
    const profile = resolveInstructorMemberProfile(displayUser)
    if (profile !== 'instructor_dual' && profile !== 'instructor_only') return null
    const src = personalInfoRevealed ? displayUser : maskedUserForInstructorDetail(displayUser)
    return userToApplicantInstructorRow(src)
  }, [displayUser, personalInfoRevealed])

  if (!open) {
    return null
  }
  if (!displayUser) {
    return null
  }

  const basicInfoExternalId1365 =
    displayUser.role === 'INDIVIDUAL' || displayUser.role === 'SCHOOL'
      ? {
          maskedLabel: '0915***',
          fullLabel: '0915123456',
          onOpen: () => message.info('1365 바로가기는 추후 연결됩니다.'),
        }
      : undefined

  const role = displayUser.role

  const basicInfoContent = (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <div className="user-detail-modal__basic-tab-content user-detail-fullpage-modal__basic">
        <UserBasicInfoSection
          user={displayUser}
          entrySource={basicInfoEntrySource}
          caption={displayUser.role === 'ADMIN' ? '*관리자에 의해 등록된 회원입니다.' : undefined}
          externalId1365={basicInfoExternalId1365}
          personalInfoRevealed={personalInfoRevealed}
        />
        {role !== 'SCHOOL' ? (
          <UserConsentAgreementSection preset={resolveUserConsentAgreementPreset(displayUser)} />
        ) : null}
        {instructorResumeApplicantRow ? (
          <InstructorResumeDetailForms instructor={instructorResumeApplicantRow} />
        ) : null}
      </div>
      {role === 'SCHOOL' ? (
        <SchoolAffiliatedTeachersSection
          rows={displayUser.schoolInfo?.affiliatedTeachers ?? []}
          onLinkedUserClick={onNavigateToLinkedUser}
        />
      ) : null}
    </Space>
  )

  const programsChildMode = displayUser ? programsHistoryHasChildMenu(displayUser) : false

  const enrollmentTableRows = role === 'INSTRUCTOR' ? enrollmentApplications : applications

  const enrollmentSectionTitle = role === 'ADMIN' ? '담당 프로그램 이력' : '프로그램 수강 이력'

  const renderApplicationTable = (
    rows: Application[],
    summaryLabel: string,
    emptyDescription: string
  ) => (
    <div className="user-detail-modal__program-tab">
      {applicationsLoading ? (
        <div className="user-detail-modal__loading">로딩 중...</div>
      ) : rows.length > 0 ? (
        <>
          <p className="user-detail-modal__program-tab-summary">
            {summaryLabel} 총 {rows.length}건
          </p>
          <Table
            className="cms-data-table"
            columns={programHistoryColumns}
            dataSource={rows}
            rowKey="id"
            pagination={false}
            onRow={record => ({
              onClick: e => {
                const target = e.target as HTMLElement
                if (
                  target.closest('.user-detail-modal__progress-cell') ||
                  target.closest('.user-detail-modal__attendance-link') ||
                  target.closest('.user-detail-modal__assignment-cell')
                )
                  return
                setSelectedApplicationForProgramDetail(record)
                setProgramDetailModalOpen(true)
              },
              style: { cursor: 'pointer' },
            })}
          />
        </>
      ) : (
        <div className="user-detail-modal__program-tab-empty">
          <Empty description={emptyDescription} />
        </div>
      )}
    </div>
  )

  const enrollmentEmptyDescription =
    role === 'INSTRUCTOR' ? '프로그램 수강 이력이 없습니다.' : '프로그램 신청 이력이 없습니다.'

  const enrollmentSection = (
    <section className="user-detail-fullpage-modal__program-section">
      <h3 className="user-detail-fullpage-modal__section-title">
        {enrollmentSectionTitle} ({enrollmentTableRows.length})
      </h3>
      {renderApplicationTable(
        enrollmentTableRows,
        enrollmentSectionTitle,
        enrollmentEmptyDescription
      )}
    </section>
  )

  const volunteerProgramHistory = (
    <MemberProgramLectureHistory
      mode="volunteerProgram"
      volunteerHistories={volunteerHistories}
      loading={volunteerHistoriesLoading}
      onVolunteerRowClick={() => {
        message.info('봉사 프로그램 상세는 추후 연결됩니다.')
      }}
      onVolunteerCertificateDownload={() => {
        window.alert('준비 중입니다.')
      }}
    />
  )

  const programsHistoryContent = programsChildMode ? (
    <div className="user-detail-fullpage-modal__programs">
      {activeProgramsChild === 'enrollment' &&
        (role === 'INDIVIDUAL' ? (
          <MemberProgramLectureHistory
            mode="studentEnrollment"
            applications={applications}
            loading={applicationsLoading}
            onOpenAttendance={record => {
              setLectureAttendanceApplication(record)
              setLectureAttendanceModalOpen(true)
            }}
            onOpenAssignment={record => {
              setAssignmentSubmissionApplication(record)
              setAssignmentSubmissionModalOpen(true)
            }}
            onDownloadCertificate={() => {
              window.alert('준비 중입니다.')
            }}
          />
        ) : (
          enrollmentSection
        ))}
      {activeProgramsChild === 'lecture' && role === 'INSTRUCTOR' && (
        <MemberProgramLectureHistory applications={applications} loading={applicationsLoading} />
      )}
      {activeProgramsChild === 'volunteer' && volunteerProgramHistory}
    </div>
  ) : (
    <div className="user-detail-fullpage-modal__programs">
      {role === 'SCHOOL' ? (
        <MemberProgramLectureHistory
          mode="schoolProgramParticipation"
          applications={applications}
          loading={applicationsLoading}
          onBulkDelete={() => {
            message.info('이력 삭제는 추후 연결됩니다.')
          }}
        />
      ) : role === 'INSTRUCTOR' ? (
        <>
          {enrollmentSection}
          <MemberProgramLectureHistory applications={applications} loading={applicationsLoading} />
          {volunteerProgramHistory}
        </>
      ) : (
        <>
          {enrollmentSection}
          {volunteerProgramHistory}
        </>
      )}
    </div>
  )

  const settlementContent =
    displayUser.role === 'INSTRUCTOR' ? (
      <div className="user-detail-fullpage-modal__programs user-detail-fullpage-modal__settlement">
        <InstructorPaymentTab instructorUserId={displayUser.id} instructorName={displayUser.name} />
      </div>
    ) : (
      <div className="user-detail-fullpage-modal__programs user-detail-fullpage-modal__settlement">
        <Empty description="정산 현황은 강사 회원에서만 제공됩니다." />
      </div>
    )

  const handleWithdrawConfirm = () => {
    if (displayUser && onWithdraw) {
      onWithdraw(displayUser)
      setWithdrawConfirmOpen(false)
      onClose()
    }
  }

  return (
    <>
      <DetailFullPageModal
        open={open}
        onClose={onClose}
        title={userDetailModalTitle(displayUser)}
        className="user-detail-fullpage-modal"
        sidebar={
          <DetailModalSidebar
            navAriaLabel={userDetailSidebarNavAriaLabel(mode, displayUser)}
            items={userSidebarItems}
            activeKey={activeLnb}
            activeChildKey={sidebarActiveChildKey}
            expandedGroupKeys={sidebarExpandedGroupKeys}
            onSelectTop={handleSidebarSelectTop}
            onSelectChild={handleSidebarSelectChild}
          />
        }
        headerExtra={
          <UserDetailFullPageHeaderActions
            mode={mode}
            permissionRole={permissionRole}
            displayUser={displayUser}
            activeLnb={activeLnb}
            activeProgramsChild={activeProgramsChild}
            personalInfoRevealed={personalInfoRevealed}
            setPersonalInfoRevealed={setPersonalInfoRevealed}
            onPermissionApprove={onPermissionApprove}
            onPermissionReject={onPermissionReject}
            onWithdraw={onWithdraw}
            onEdit={onEdit}
            onOpenWithdrawConfirm={() => setWithdrawConfirmOpen(true)}
          />
        }
      >
        {activeLnb === 'detail-info' && basicInfoContent}
        {activeLnb === 'history' &&
          (displayUser.role === 'ADMIN' ? (
            <div className="user-detail-fullpage-modal__admin-programs">
              <AdminManagedProgramHistory user={displayUser} />
            </div>
          ) : (
            programsHistoryContent
          ))}
        {activeLnb === 'payment-status' && settlementContent}
      </DetailFullPageModal>

      {withdrawConfirmOpen && (
        <DeleteGuideModal
          open
          onCancel={() => setWithdrawConfirmOpen(false)}
          onConfirm={handleWithdrawConfirm}
          title={displayUser.role === 'SCHOOL' ? '학교 삭제 안내' : '회원 탈퇴 안내'}
          lines={
            displayUser.role === 'SCHOOL'
              ? buildSchoolDeleteMessageLines(
                  displayUser ? { name: displayUser.name, email: displayUser.email } : null
                )
              : buildMemberWithdrawMessageLines(
                  displayUser ? { name: displayUser.name, email: displayUser.email } : null
                )
          }
          confirmText={displayUser.role === 'SCHOOL' ? '삭제' : '탈퇴'}
          confirmVariant="danger"
        />
      )}

      <LectureAttendanceModal
        open={lectureAttendanceModalOpen}
        onCancel={() => {
          setLectureAttendanceModalOpen(false)
          setLectureAttendanceApplication(null)
        }}
        application={lectureAttendanceApplication ?? undefined}
        userName={displayUser?.name ?? ''}
      />
      <AssignmentSubmissionModal
        open={assignmentSubmissionModalOpen}
        onCancel={() => {
          setAssignmentSubmissionModalOpen(false)
          setAssignmentSubmissionApplication(null)
        }}
        application={assignmentSubmissionApplication ?? undefined}
        userName={displayUser?.name ?? ''}
      />
      <EnrollmentProgramDetailModal
        open={programDetailModalOpen}
        onCancel={() => {
          setProgramDetailModalOpen(false)
          setSelectedApplicationForProgramDetail(null)
        }}
        application={selectedApplicationForProgramDetail}
      />
    </>
  )
}
