/**
 * 회원 상세 풀페이지 모달
 * 전체 회원 목록 행 클릭 시 프로그램 상세와 동일한 LNB+메인 레이아웃으로 노출
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Table, Empty, Dropdown, Tag, message } from 'antd'
import type { MenuProps } from 'antd'
import { AccountBookOutlined, BulbOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import {
  DetailModalSidebar,
  type DetailModalSidebarNavItem,
} from '@/shared/ui/detail-modal-sidebar'
import { AppButton } from '@/shared/ui/app-button'
import { ProgramEnrollmentStatusBadge } from '@/shared/components/program-enrollment-status-badge'
import type { ColumnsType } from 'antd/es/table'
import type { User } from '@/types/user'
import type { Application, UserHistory } from '@/types/domain'
import type { ApplicationProgressStatus } from '@/types/application-progress'
import { formatDate } from '@/shared/utils'
import { applicationService } from '@/entities/application/api/application-service'
import { programService } from '@/entities/program/api/program-service'
import {
  getEffectiveEnrollmentDisplayStatus,
  type ProgramEnrollmentDisplayStatus,
} from '@/shared/constants/status'
import { mockUserHistories } from '@/data/mock/mypage'
import dayjs from 'dayjs'
import {
  DeleteGuideModal,
  buildMemberWithdrawMessageLines,
} from '@/features/program/ui/manager-delete-guide-modal'
import { LectureAttendanceModal } from '@/features/program/ui/lecture-attendance-modal'
import { AssignmentSubmissionModal } from '@/features/program/ui/assignment-submission-modal'
import { EnrollmentProgramDetailModal } from './enrollment-program-detail-modal'
import {
  UserBasicInfoSection,
  type UserBasicInfoEntrySource,
} from './user-basic-info-section'
import { UserConsentAgreementSection } from './user-consent-agreement-section'
import { AdminManagedProgramHistory } from './admin-managed-program-history'
import './user-detail-modal.css'
import './user-detail-fullpage-modal.css'

export type UserDetailLnbKey = 'basic' | 'programs' | 'settlement'

/** 프로그램 참여 이력 LNB 하위 (전체·강사 회원) */
export type UserDetailProgramsChildKey = 'enrollment' | 'lecture' | 'volunteer'

function programsHistoryHasChildMenu(role: User['role']): boolean {
  return role === 'INDIVIDUAL' || role === 'INSTRUCTOR'
}

export interface UserDetailFullPageModalProps {
  open: boolean
  user: Omit<User, 'password'> | null
  onClose: () => void
  onEdit?: (user: Omit<User, 'password'>) => void
  onWithdraw?: (user: Omit<User, 'password'>) => void
  /** 기본 정보 테이블 분기 — 미지정 시 URL `userDetailEntry` 또는 회원 역할로 도출 */
  basicInfoEntrySource?: UserBasicInfoEntrySource
}

export function UserDetailFullPageModal({
  open,
  user,
  onClose,
  onEdit,
  onWithdraw,
  basicInfoEntrySource,
}: UserDetailFullPageModalProps) {
  const displayUser = user

  const [activeLnb, setActiveLnb] = useState<UserDetailLnbKey>('basic')
  const [activeProgramsChild, setActiveProgramsChild] =
    useState<UserDetailProgramsChildKey>('enrollment')
  const [applications, setApplications] = useState<Application[]>([])
  /** 강사 회원 — 프로그램 수강 이력(학생 신청) 전용 */
  const [enrollmentApplications, setEnrollmentApplications] = useState<Application[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
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

  useEffect(() => {
    if (!open) setPersonalInfoRevealed(false)
  }, [open])

  useEffect(() => {
    setPersonalInfoRevealed(false)
  }, [displayUser?.id])

  useEffect(() => {
    if (open && displayUser) {
      const loadApplications = async () => {
        setApplicationsLoading(true)
        try {
          if (displayUser.role === 'INSTRUCTOR') {
            const [instructorApps, studentApps] = await Promise.all([
              applicationService.getByUserId(displayUser.id, 'instructor'),
              applicationService.getByUserId(displayUser.id, 'student'),
            ])
            setApplications(instructorApps)
            setEnrollmentApplications(studentApps)
          } else {
            let subjectType: Application['subjectType'] | undefined
            if (displayUser.role === 'SCHOOL') subjectType = 'school'
            else if (displayUser.role === 'INDIVIDUAL') subjectType = 'student'

            const userApplications = await applicationService.getByUserId(
              displayUser.id,
              subjectType
            )
            setApplications(userApplications)
            setEnrollmentApplications([])
          }
        } catch (error) {
          console.error('Failed to load applications:', error)
          setApplications([])
          setEnrollmentApplications([])
        } finally {
          setApplicationsLoading(false)
        }
      }
      loadApplications()
    } else {
      setApplications([])
      setEnrollmentApplications([])
    }
  }, [open, displayUser])

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

  useEffect(() => {
    if (open && displayUser) {
      setActiveLnb('basic')
      setActiveProgramsChild('enrollment')
    }
  }, [open, displayUser?.id])

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
        if (displayUser.role === 'INSTRUCTOR') {
          const [inst, stu] = await Promise.all([
            applicationService.getByUserId(displayUser.id, 'instructor'),
            applicationService.getByUserId(displayUser.id, 'student'),
          ])
          setApplications(inst)
          setEnrollmentApplications(stu)
        } else {
          let subjectType: Application['subjectType'] | undefined
          if (displayUser.role === 'SCHOOL') subjectType = 'school'
          else if (displayUser.role === 'INDIVIDUAL') subjectType = 'student'
          const list = await applicationService.getByUserId(displayUser.id, subjectType)
          setApplications(list)
        }
      } catch (e) {
        console.error('Failed to update progress status:', e)
      }
    },
    [displayUser]
  )

  const userSidebarItems = useMemo<DetailModalSidebarNavItem[]>(() => {
    const role = displayUser?.role
    const programsLabel =
      role === 'ADMIN' ? '담당 프로그램 이력' : '프로그램 참여 이력'
    const programsIcon = (
      <FolderOpenOutlined className="detail-fullpage-modal__lnb-icon" style={{ fontSize: 20 }} />
    )

    const programsItem: DetailModalSidebarNavItem =
      role === 'INDIVIDUAL'
        ? {
            key: 'programs',
            label: programsLabel,
            icon: programsIcon,
            children: [
              { key: 'enrollment', label: '프로그램 수강 이력' },
              { key: 'volunteer', label: '봉사 프로그램 참여 이력' },
            ],
          }
        : role === 'INSTRUCTOR'
          ? {
              key: 'programs',
              label: programsLabel,
              icon: programsIcon,
              children: [
                { key: 'enrollment', label: '프로그램 수강 이력' },
                { key: 'lecture', label: '프로그램 강의 이력' },
                { key: 'volunteer', label: '봉사 프로그램 참여 이력' },
              ],
            }
          : {
              key: 'programs',
              label: programsLabel,
              icon: programsIcon,
            }

    const items: DetailModalSidebarNavItem[] = [
      {
        key: 'basic',
        label: role === 'ADMIN' ? '관리자 상세 정보' : '회원 상세 정보',
        icon: <BulbOutlined className="detail-fullpage-modal__lnb-icon" style={{ fontSize: 20 }} />,
      },
      programsItem,
    ]

    if (role === 'INSTRUCTOR') {
      items.push({
        key: 'settlement',
        label: '정산 현황',
        icon: (
          <AccountBookOutlined
            className="detail-fullpage-modal__lnb-icon"
            style={{ fontSize: 20 }}
          />
        ),
      })
    }

    return items
  }, [displayUser?.role])

  const sidebarExpandedGroupKeys = useMemo(() => {
    if (activeLnb !== 'programs' || !displayUser) return [] as const
    if (!programsHistoryHasChildMenu(displayUser.role)) return [] as const
    return ['programs'] as const
  }, [activeLnb, displayUser])

  const sidebarActiveChildKey =
    activeLnb === 'programs' && displayUser && programsHistoryHasChildMenu(displayUser.role)
      ? activeProgramsChild
      : ''

  const handleSidebarSelectTop = (key: string) => {
    const k = key as UserDetailLnbKey
    if (k === 'programs' && displayUser && programsHistoryHasChildMenu(displayUser.role)) {
      setActiveLnb('programs')
      setActiveProgramsChild('enrollment')
      return
    }
    setActiveLnb(k)
  }

  const handleSidebarSelectChild = (_groupKey: string, childKey: string) => {
    setActiveProgramsChild(childKey as UserDetailProgramsChildKey)
    setActiveLnb('programs')
  }

  if (!open) {
    return null
  }
  if (!displayUser) {
    return null
  }

  const programHistoryColumns: ColumnsType<Application> = [
    {
      title: 'No.',
      key: 'no',
      width: 72,
      align: 'center',
      render: (_: unknown, __: Application, index: number) => index + 1,
    },
    {
      title: '프로그램명',
      dataIndex: 'programId',
      key: 'programId',
      align: 'center',
      render: (programId: string) => {
        const program = programService.getByIdSync(programId)
        return program ? program.title : programId
      },
    },
    {
      title: '모집 신청 현황',
      key: 'progressDisplay',
      align: 'center',
      render: (_: unknown, record: Application) => {
        const program = programService.getByIdSync(record.programId)
        const displayStatus = getEffectiveEnrollmentDisplayStatus(
          record.status,
          record.progressStatus,
          program?.lifecycleStatus
        )
        const menuItems: MenuProps['items'] = (
          [
            'WAITING_RESULT',
            'REJECTED',
            'EDUCATION_SCHEDULED',
            'EDUCATION_IN_PROGRESS',
            'PROGRAM_ENDED',
          ] as const
        ).map(key => ({
          key,
          label: <ProgramEnrollmentStatusBadge status={key} />,
          onClick: () => handleProgressStatusChange(record, key),
        }))
        return (
          <span className="user-detail-modal__progress-cell" onClick={e => e.stopPropagation()}>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <span className="user-detail-modal__progress-dropdown-trigger">
                <ProgramEnrollmentStatusBadge status={displayStatus} />
              </span>
            </Dropdown>
          </span>
        )
      },
    },
    {
      title: '강의 출석 내역',
      dataIndex: 'lectureAttendance',
      key: 'lectureAttendance',
      align: 'center',
      render: (v: string | undefined, record: Application) => (
        <button
          type="button"
          className="user-detail-modal__attendance-link"
          onClick={e => {
            e.stopPropagation()
            setLectureAttendanceApplication(record)
            setLectureAttendanceModalOpen(true)
          }}
        >
          {v ?? '0/0'}
        </button>
      ),
    },
    {
      title: '과제 제출 내역',
      key: 'assignment',
      align: 'center',
      render: (_: unknown, record: Application) => (
        <span className="user-detail-modal__assignment-cell" onClick={e => e.stopPropagation()}>
          <AppButton
            variant="viewDetails"
            size="small"
            disabled={!record.hasAssignmentSubmission}
            onClick={() => {
              setAssignmentSubmissionApplication(record)
              setAssignmentSubmissionModalOpen(true)
            }}
          >
            내역 보기
          </AppButton>
        </span>
      ),
    },
    {
      title: '담당자',
      dataIndex: 'managerName',
      key: 'managerName',
      align: 'center',
      render: (v: string | undefined) => v ?? '-',
    },
  ]

  const volunteerHistoryColumns: ColumnsType<UserHistory> = [
    {
      title: '프로그램명',
      dataIndex: 'programId',
      key: 'programId',
      render: (programId: string) => {
        const program = programService.getByIdSync(programId)
        return program ? program.title : programId
      },
    },
    {
      title: '참여 역할',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserHistory['role']) => {
        const roleLabels: Record<string, string> = {
          INSTRUCTOR: '강사',
          VOLUNTEER: '봉사자',
          PARTICIPANT: '참여자',
        }
        return <Tag color="blue">{roleLabels[role] || role}</Tag>
      },
    },
    {
      title: '완료 상태',
      dataIndex: 'finalStatus',
      key: 'finalStatus',
      render: (status: UserHistory['finalStatus']) => {
        const statusLabels: Record<string, string> = {
          COMPLETED: '완료',
          CONFIRMED: '확정',
          CANCELLED: '취소',
        }
        const statusColors: Record<string, string> = {
          COMPLETED: 'success',
          CONFIRMED: 'success',
          CANCELLED: 'error',
        }
        return <Tag color={statusColors[status]}>{statusLabels[status] || status}</Tag>
      },
    },
    {
      title: '봉사 시간',
      dataIndex: 'volunteerHours',
      key: 'volunteerHours',
      render: (hours?: number) => (hours ? `${hours}시간` : '-'),
    },
    {
      title: '완료일',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => formatDate(new Date(date)),
    },
  ]

  const basicInfoCaption = '*관리자에 의해 등록된 회원입니다.'
  const basicInfoExternalId1365 =
    displayUser.role === 'INDIVIDUAL' || displayUser.role === 'SCHOOL'
      ? {
          maskedLabel: '0915***',
          fullLabel: '0915123456',
          onOpen: () => message.info('1365 바로가기는 추후 연결됩니다.'),
        }
      : undefined

  const basicInfoContent = (
    <div className="user-detail-modal__basic-tab-content user-detail-fullpage-modal__basic">
      <UserBasicInfoSection
        user={displayUser}
        entrySource={basicInfoEntrySource}
        caption={basicInfoCaption}
        externalId1365={basicInfoExternalId1365}
        personalInfoRevealed={personalInfoRevealed}
      />
      <UserConsentAgreementSection />
    </div>
  )

  const role = displayUser.role
  const programsChildMode = programsHistoryHasChildMenu(role)

  const enrollmentTableRows = role === 'INSTRUCTOR' ? enrollmentApplications : applications
  const lectureTableRows = applications

  const enrollmentSectionTitle =
    role === 'ADMIN' ? '담당 프로그램 이력' : '프로그램 수강 이력'

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
            className="user-detail-modal__program-table"
            columns={programHistoryColumns}
            dataSource={rows}
            rowKey="id"
            pagination={false}
            scroll={{ y: 'calc(100vh - 480px)' }}
            size="small"
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
      {renderApplicationTable(enrollmentTableRows, enrollmentSectionTitle, enrollmentEmptyDescription)}
    </section>
  )

  const lectureSection = (
    <section className="user-detail-fullpage-modal__program-section">
      <h3 className="user-detail-fullpage-modal__section-title">
        프로그램 강의 이력 ({lectureTableRows.length})
      </h3>
      {renderApplicationTable(lectureTableRows, '프로그램 강의 이력', '프로그램 강의 이력이 없습니다.')}
    </section>
  )

  const volunteerSection = (
    <section className="user-detail-fullpage-modal__program-section">
      <h3 className="user-detail-fullpage-modal__section-title">
        봉사 프로그램 참여 이력 ({volunteerHistories.length})
      </h3>
      <div>
        {volunteerHistoriesLoading ? (
          <div className="user-detail-modal__loading">로딩 중...</div>
        ) : volunteerHistories.length > 0 ? (
          <Table
            columns={volunteerHistoryColumns}
            dataSource={volunteerHistories}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        ) : (
          <Empty description="참여 이력이 없습니다." />
        )}
      </div>
    </section>
  )

  const programsHistoryContent = programsChildMode ? (
    <div className="user-detail-fullpage-modal__programs">
      {activeProgramsChild === 'enrollment' && enrollmentSection}
      {activeProgramsChild === 'lecture' && role === 'INSTRUCTOR' && lectureSection}
      {activeProgramsChild === 'volunteer' && volunteerSection}
    </div>
  ) : (
    <div className="user-detail-fullpage-modal__programs">
      {enrollmentSection}
      {volunteerSection}
    </div>
  )

  const settlementContent = (
    <div className="user-detail-fullpage-modal__programs user-detail-fullpage-modal__settlement">
      <Empty description="정산 현황은 추후 연결됩니다." />
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
        title={
          displayUser.role === 'ADMIN'
            ? `관리자 상세_${displayUser.name}`
            : `회원 상세_${displayUser.name}`
        }
        className="user-detail-fullpage-modal"
        sidebar={
          <DetailModalSidebar
            navAriaLabel={
              displayUser.role === 'ADMIN' ? '관리자 상세 메뉴' : '회원 상세 메뉴'
            }
            items={userSidebarItems}
            activeKey={activeLnb}
            activeChildKey={sidebarActiveChildKey}
            expandedGroupKeys={sidebarExpandedGroupKeys}
            onSelectTop={handleSidebarSelectTop}
            onSelectChild={handleSidebarSelectChild}
          />
        }
        headerExtra={
          <div className="user-detail-fullpage-modal__header-actions">
            {onWithdraw && (
              <AppButton
                variant="default"
                size="filter"
                onClick={() => setWithdrawConfirmOpen(true)}
                className="user-detail-modal__btn-withdraw"
              >
                회원 탈퇴
              </AppButton>
            )}
            {onEdit && (
              <AppButton
                variant="default"
                size="filter"
                onClick={() => onEdit(displayUser)}
                className="user-detail-modal__btn-edit"
              >
                정보 수정
              </AppButton>
            )}
            <AppButton
              variant={personalInfoRevealed ? 'default' : 'primary'}
              size="filter-wide"
              onClick={() => setPersonalInfoRevealed(v => !v)}
            >
              {personalInfoRevealed ? '개인정보 마스킹' : '개인정보 상세보기'}
            </AppButton>
          </div>
        }
      >
        {activeLnb === 'basic' && basicInfoContent}
        {activeLnb === 'programs' &&
          (displayUser.role === 'ADMIN' ? (
            <div className="user-detail-fullpage-modal__admin-programs">
              <AdminManagedProgramHistory user={displayUser} />
            </div>
          ) : (
            programsHistoryContent
          ))}
        {activeLnb === 'settlement' && settlementContent}
      </DetailFullPageModal>

      {withdrawConfirmOpen && (
        <DeleteGuideModal
          open
          onCancel={() => setWithdrawConfirmOpen(false)}
          onConfirm={handleWithdrawConfirm}
          title="회원 탈퇴 안내"
          lines={buildMemberWithdrawMessageLines(
            displayUser ? { name: displayUser.name, email: displayUser.email } : null
          )}
          confirmText="탈퇴"
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
