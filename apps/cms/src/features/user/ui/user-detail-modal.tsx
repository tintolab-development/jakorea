/**
 * 회원 상세 Modal
 * 전체 회원 페이지: 행 클릭 시 팝업 모달로 노출 (Drawer 미사용)
 * 스펙: apps/cms/.cursor/rules/process/member-detail-modal-spec.md
 */

import { useState, useEffect, useCallback } from 'react'
import { Tabs, Table, Empty, Dropdown, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
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
import './user-detail-modal.css'

export interface UserDetailModalProps {
  open: boolean
  user: Omit<User, 'password'> | null
  onClose: () => void
  onEdit?: (user: Omit<User, 'password'>) => void
  onWithdraw?: (user: Omit<User, 'password'>) => void
}

export function UserDetailModal({ open, user, onClose, onEdit, onWithdraw }: UserDetailModalProps) {
  const displayUser = user

  const [applications, setApplications] = useState<Application[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [volunteerHistories, setVolunteerHistories] = useState<UserHistory[]>([])
  const [volunteerHistoriesLoading, setVolunteerHistoriesLoading] = useState(false)
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false)
  const [lectureAttendanceModalOpen, setLectureAttendanceModalOpen] = useState(false)
  const [lectureAttendanceApplication, setLectureAttendanceApplication] = useState<Application | null>(null)
  const [assignmentSubmissionModalOpen, setAssignmentSubmissionModalOpen] = useState(false)
  const [assignmentSubmissionApplication, setAssignmentSubmissionApplication] = useState<Application | null>(null)
  const [programDetailModalOpen, setProgramDetailModalOpen] = useState(false)
  const [selectedApplicationForProgramDetail, setSelectedApplicationForProgramDetail] = useState<Application | null>(null)

  useEffect(() => {
    if (open && displayUser) {
      const loadApplications = async () => {
        setApplicationsLoading(true)
        try {
          let subjectType: Application['subjectType'] | undefined
          if (displayUser.role === 'INSTRUCTOR') subjectType = 'instructor'
          else if (displayUser.role === 'SCHOOL') subjectType = 'school'
          else if (displayUser.role === 'INDIVIDUAL') subjectType = 'student'

          const userApplications = await applicationService.getByUserId(displayUser.id, subjectType)
          setApplications(userApplications)
        } catch (error) {
          console.error('Failed to load applications:', error)
          setApplications([])
        } finally {
          setApplicationsLoading(false)
        }
      }
      loadApplications()
    } else {
      setApplications([])
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
        let subjectType: Application['subjectType'] | undefined
        if (displayUser.role === 'INSTRUCTOR') subjectType = 'instructor'
        else if (displayUser.role === 'SCHOOL') subjectType = 'school'
        else if (displayUser.role === 'INDIVIDUAL') subjectType = 'student'
        const list = await applicationService.getByUserId(displayUser.id, subjectType)
        setApplications(list)
      } catch (e) {
        console.error('Failed to update progress status:', e)
      }
    },
    [displayUser]
  )

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
      title: '프로그램 진행 현황',
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
          ['WAITING_RESULT', 'REJECTED', 'EDUCATION_SCHEDULED', 'EDUCATION_IN_PROGRESS', 'PROGRAM_ENDED'] as const
        ).map(key => ({
          key,
          label: <ProgramEnrollmentStatusBadge status={key} />,
          onClick: () => handleProgressStatusChange(record, key),
        }))
        return (
          <span
            className="user-detail-modal__progress-cell"
            onClick={e => e.stopPropagation()}
          >
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

  const basicInfoContent = (
    <div className="user-detail-modal__basic-tab-content">
      {(onEdit || onWithdraw) && (
        <div className="user-detail-modal__actions-row">
          <span className="user-detail-modal__permission-msg">
            회원 본인 및 관리자만 작성/수정이 가능합니다.
          </span>
          <div className="user-detail-modal__actions-buttons">
            {onWithdraw && (
              <AppButton
                variant="default"
                size="middle"
                onClick={() => setWithdrawConfirmOpen(true)}
                className="user-detail-modal__btn-withdraw"
              >
                탈퇴
              </AppButton>
            )}
            {onEdit && (
              <AppButton
                variant="default"
                size="middle"
                onClick={() => onEdit(displayUser)}
                className="user-detail-modal__btn-edit"
              >
                수정
              </AppButton>
            )}
          </div>
        </div>
      )}
      <div className="user-detail-modal__basic-inner">
        <div className="user-detail-modal__profile-wrap">
          <div className="user-detail-modal__profile-placeholder">
            사진 없음
          </div>
        </div>
        <div className="user-detail-modal__basic-table-wrap">
          <table className="user-detail-modal__basic-table">
            <colgroup>
              <col className="user-detail-modal__basic-table-col-label-left" />
              <col className="user-detail-modal__basic-table-col-name-sub" />
              <col className="user-detail-modal__basic-table-col-input-left" />
              <col className="user-detail-modal__basic-table-col-label-right" />
              <col className="user-detail-modal__basic-table-col-input-right" />
            </colgroup>
            <tbody>
              {/* 1행: 성명(한글) | 값 · 생년월일 | 값 (참여 강사 상세 기본정보 탭 테이블 구조 참고) */}
              <tr>
                <td
                  rowSpan={2}
                  className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--name"
                >
                  <span className="user-detail-modal__basic-table-label">성명</span>
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--name-sub">
                  <span className="user-detail-modal__basic-table-label">한글</span>
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
                  {displayUser!.name}
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
                  <span className="user-detail-modal__basic-table-label">생년월일</span>
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
                  {displayUser!.birthDate
                    ? `${formatDate(new Date(displayUser!.birthDate))} | 만 ${Math.floor((Date.now() - new Date(displayUser!.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}세`
                    : '-'}
                </td>
              </tr>
              {/* 2행: 성명(영문) | 값 · 성별 | 값 */}
              <tr>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--name-sub">
                  <span className="user-detail-modal__basic-table-label">영문</span>
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider user-detail-modal__name-eng">
                  {displayUser!.nameEn ?? '-'}
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
                  <span className="user-detail-modal__basic-table-label">성별</span>
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
                  {displayUser!.gender ?? '-'}
                </td>
              </tr>
              {/* 3행: 연락처 | 값 · 이메일 | 값 */}
              <tr>
                <td
                  colSpan={2}
                  className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
                >
                  <span className="user-detail-modal__basic-table-label">연락처</span>
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
                  {displayUser!.phone ?? '-'}
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
                  <span className="user-detail-modal__basic-table-label">이메일</span>
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
                  {displayUser!.email}
                </td>
              </tr>
              {/* 4행: 주소 | 값 · 소속 | 값 */}
              <tr>
                <td
                  colSpan={2}
                  className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
                >
                  <span className="user-detail-modal__basic-table-label">주소</span>
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
                  {displayUser!.schoolInfo?.address ??
                    displayUser!.detailAddress ??
                    '-'}
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
                  <span className="user-detail-modal__basic-table-label">소속</span>
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
                  {displayUser!.affiliation ??
                    (displayUser!.schoolInfo
                      ? `${displayUser!.schoolInfo.schoolName}${displayUser!.schoolInfo.position ? ` | ${displayUser!.schoolInfo.position}` : ''}`
                      : '-')}
                </td>
              </tr>
              {/* 5행: 연동된 소셜 계정 | 값 · 가입일 | 값 */}
              <tr>
                <td
                  colSpan={2}
                  className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--row-label"
                >
                  <span className="user-detail-modal__basic-table-label">연동된 소셜 계정</span>
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input user-detail-modal__basic-table-cell--before-divider">
                  {displayUser!.socialAccounts?.length ? displayUser!.socialAccounts.join(' | ') : '-'}
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--label user-detail-modal__basic-table-cell--label-right user-detail-modal__basic-table-cell--divider-left">
                  <span className="user-detail-modal__basic-table-label">가입일</span>
                </td>
                <td className="user-detail-modal__basic-table-cell user-detail-modal__basic-table-cell--input">
                  {formatDate(new Date(displayUser!.createdAt))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const tabItems = [
    {
      key: 'basic',
      label: '기본 정보',
      children: basicInfoContent,
    },
    {
      key: 'programs',
      label: `프로그램 수강 이력 (${applications.length})`,
      children: (
        <div className="user-detail-modal__program-tab">
          {applicationsLoading ? (
            <div className="user-detail-modal__loading">로딩 중...</div>
          ) : applications.length > 0 ? (
            <>
              <p className="user-detail-modal__program-tab-summary">
                프로그램 수강 이력 총 {applications.length}건
              </p>
              <Table
                className="user-detail-modal__program-table"
                columns={programHistoryColumns}
                dataSource={applications}
                rowKey="id"
                pagination={false}
                scroll={{ y: 360 }}
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
              <Empty description="프로그램 신청 이력이 없습니다." />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'volunteer',
      label: `봉사 프로그램 참여 이력 (${volunteerHistories.length})`,
      children: (
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
      ),
    },
  ]

  const handleWithdrawConfirm = () => {
    if (displayUser && onWithdraw) {
      onWithdraw(displayUser)
      setWithdrawConfirmOpen(false)
      onClose()
    }
  }

  return (
    <>
      <TealHeaderModal
        open={open}
        onCancel={onClose}
        title="회원 상세 정보"
        size="large"
        width={1400}
        className="teal-header-modal--user-detail"
        footer={
          <AppButton variant="cancel" size="large" onClick={onClose}>
            닫기
          </AppButton>
        }
      >
        <div className="user-detail-modal__body">
          <Tabs defaultActiveKey="basic" items={tabItems} />
        </div>
      </TealHeaderModal>

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
