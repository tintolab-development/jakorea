/**
 * 회원 상세 풀페이지 모달
 * 전체 회원 목록 행 클릭 시 프로그램 상세와 동일한 LNB+메인 레이아웃으로 노출
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { Table, Empty, Dropdown, message, Space } from 'antd'
import type { MenuProps } from 'antd'
import { AccountBookOutlined, BulbOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
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
import { lectureAttendanceHasAtLeastOne } from '@/shared/utils'
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
  buildSchoolDeleteMessageLines,
} from '@/features/program/ui/manager-delete-guide-modal'
import { LectureAttendanceModal } from '@/features/program/ui/lecture-attendance-modal'
import { AssignmentSubmissionModal } from '@/features/program/ui/assignment-submission-modal'
import { EnrollmentProgramDetailModal } from './enrollment-program-detail-modal'
import { UserBasicInfoSection, type UserBasicInfoEntrySource } from './user-basic-info-section'
import { UserConsentAgreementSection } from './user-consent-agreement-section'
import { InstructorBasicInfo } from './instructor-basic-info'
import { InstructorPaymentTab } from './instructor-payment-tab'
import { AdminManagedProgramHistory } from './admin-managed-program-history'
import { MemberProgramLectureHistory } from './member-program-lecture-history'
import { SchoolAffiliatedTeachersSection } from './school-affiliated-teachers-section'
import './user-detail-modal.css'
import './user-detail-fullpage-modal.css'

export type UserDetailLnbKey = 'detail-info' | 'history' | 'payment-status'

/** 프로그램 참여 이력 LNB 하위 (전체·강사 회원) */
export type UserDetailProgramsChildKey = 'enrollment' | 'lecture' | 'volunteer'

/** 회원 목록·풀페이지 공통 URL — 새로고침 시 하위 탭 유지 */
export const USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY = 'programsChild' as const

function programsHistoryHasChildMenu(role: User['role']): boolean {
  return role === 'INDIVIDUAL' || role === 'INSTRUCTOR'
}

function parseProgramsChildParam(raw: string | null): UserDetailProgramsChildKey | null {
  if (raw === 'enrollment' || raw === 'lecture' || raw === 'volunteer') return raw
  return null
}

function clampProgramsChildForRole(
  role: User['role'],
  child: UserDetailProgramsChildKey
): UserDetailProgramsChildKey {
  if (role === 'INDIVIDUAL') {
    if (child === 'lecture') return 'enrollment'
    return child
  }
  if (role === 'INSTRUCTOR') return child
  return 'enrollment'
}

export type UserDetailFullPageModalMode = 'default' | 'permission'

export type UserDetailPermissionRole = 'instructor' | 'admin'

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

function userDetailModalTitle(displayName: string, role: User['role']): string {
  switch (role) {
    case 'ADMIN':
      return `관리자 상세_${displayName}`
    case 'INSTRUCTOR':
      return `강사 상세_${displayName}`
    case 'SCHOOL':
      return `학교 상세_${displayName}`
    default:
      return `회원 상세_${displayName}`
  }
}

function userDetailSidebarNavAriaLabel(
  mode: UserDetailFullPageModalMode,
  role: User['role']
): string {
  if (mode === 'permission') return '신청 정보 메뉴'
  switch (role) {
    case 'ADMIN':
      return '관리자 상세 메뉴'
    case 'INSTRUCTOR':
      return '강사 상세 메뉴'
    case 'SCHOOL':
      return '학교 상세 메뉴'
    default:
      return '회원 상세 메뉴'
  }
}

function renderUserDetailHeaderExtra(params: {
  mode: UserDetailFullPageModalMode
  permissionRole: UserDetailPermissionRole | undefined
  displayUser: Omit<User, 'password'>
  activeLnb: UserDetailLnbKey
  activeProgramsChild: UserDetailProgramsChildKey
  personalInfoRevealed: boolean
  setPersonalInfoRevealed: Dispatch<SetStateAction<boolean>>
  onPermissionApprove: UserDetailFullPageModalProps['onPermissionApprove']
  onPermissionReject: UserDetailFullPageModalProps['onPermissionReject']
  onWithdraw: UserDetailFullPageModalProps['onWithdraw']
  onEdit: UserDetailFullPageModalProps['onEdit']
  onOpenWithdrawConfirm: () => void
}): ReactNode {
  const {
    mode,
    permissionRole,
    displayUser,
    activeLnb,
    activeProgramsChild,
    personalInfoRevealed,
    setPersonalInfoRevealed,
    onPermissionApprove,
    onPermissionReject,
    onWithdraw,
    onEdit,
    onOpenWithdrawConfirm,
  } = params

  if (mode === 'permission' && permissionRole) {
    return (
      <div className="user-detail-fullpage-modal__header-actions">
        <AppButton
          variant="danger"
          size="filter"
          dangerFillOnHover
          onClick={() => {
            onPermissionReject?.({ userId: displayUser.id, permissionRole })
          }}
          className="user-detail-modal__btn-withdraw"
        >
          신청 반려
        </AppButton>
        <AppButton
          variant="cancel"
          size="filter"
          onClick={() => {
            onPermissionApprove?.({ userId: displayUser.id, permissionRole })
          }}
          className="user-detail-modal__btn-edit"
        >
          신청 승인
        </AppButton>
        <AppButton
          variant={personalInfoRevealed ? 'default' : 'primary'}
          size="filter-wide"
          onClick={() => setPersonalInfoRevealed(v => !v)}
        >
          {personalInfoRevealed ? '개인정보 마스킹' : '개인정보 상세보기'}
        </AppButton>
      </div>
    )
  }

  if (activeLnb === 'payment-status') return null

  if (activeLnb === 'history' && activeProgramsChild === 'volunteer') {
    return null
  }

  if (
    displayUser.role === 'INDIVIDUAL' &&
    activeLnb === 'history' &&
    activeProgramsChild === 'enrollment'
  ) {
    return null
  }

  if (
    displayUser.role === 'INSTRUCTOR' &&
    activeLnb === 'history' &&
    activeProgramsChild === 'lecture'
  ) {
    return null
  }

  if (displayUser.role === 'ADMIN' && activeLnb === 'history') {
    return null
  }

  if (displayUser.role === 'SCHOOL') {
    if (!onWithdraw) return null
    return (
      <div className="user-detail-fullpage-modal__header-actions">
        <AppButton
          variant="danger"
          size="filter"
          dangerFillOnHover
          onClick={onOpenWithdrawConfirm}
          className="user-detail-modal__btn-withdraw"
        >
          학교 삭제
        </AppButton>
      </div>
    )
  }

  return (
    <div className="user-detail-fullpage-modal__header-actions">
      {onWithdraw ? (
        <AppButton
          variant="default"
          size="filter"
          onClick={onOpenWithdrawConfirm}
          className="user-detail-modal__btn-withdraw"
        >
          회원 탈퇴
        </AppButton>
      ) : null}
      {onEdit ? (
        <AppButton
          variant="default"
          size="filter"
          onClick={() => onEdit(displayUser)}
          className="user-detail-modal__btn-edit"
        >
          정보 수정
        </AppButton>
      ) : null}
      <AppButton
        variant={personalInfoRevealed ? 'default' : 'primary'}
        size="filter-wide"
        onClick={() => setPersonalInfoRevealed(v => !v)}
      >
        {personalInfoRevealed ? '개인정보 마스킹' : '개인정보 상세보기'}
      </AppButton>
    </div>
  )
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
  /** open=false일 때 false로 리셋. 닫기 직전 틱에만 의미 있는 값으로 쓴다. */
  const detailUrlSyncSeenOpenRef = useRef(false)

  const [activeLnb, setActiveLnb] = useState<UserDetailLnbKey>('detail-info')
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
          } else if (displayUser.role === 'INDIVIDUAL') {
            const studentApps = await applicationService.getByUserId(displayUser.id, 'student')
            setApplications(studentApps)
            setEnrollmentApplications([])
          } else {
            let subjectType: Application['subjectType'] | undefined
            if (displayUser.role === 'SCHOOL') subjectType = 'school'

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

  /**
   * URL(`id`, `lnb`, `programsChild`) ↔ 사이드바
   * - 목록에서 열 때 부모가 `id`를 넣기 전/후 틱에 `useSearchParams`에 `id`가 없을 수 있음 → 열림 직후 한 번만 id 보강.
   * - 부모가 닫기 위해 `id`를 지우면 searchParams가 먼저 갱신되고, 이 effect는 아직 `open===true`인 틱에 돌 수 있음.
   *   이때 `id`를 다시 넣으면 URL이 복구되어 모달이 닫히지 않는다 → **이미 열린 상태에서 id만 비었으면** 보강하지 않는다.
   */
  useEffect(() => {
    if (!open || !displayUser) {
      detailUrlSyncSeenOpenRef.current = false
      return
    }

    const transitionedIntoOpen = !detailUrlSyncSeenOpenRef.current
    detailUrlSyncSeenOpenRef.current = true

    if (mode === 'permission') {
      setActiveLnb('detail-info')
      setActiveProgramsChild('enrollment')
      return
    }

    const urlId = searchParams.get('id')?.trim()
    if (!urlId && displayUser.id) {
      if (!transitionedIntoOpen) {
        return
      }
    }

    const sp = new URLSearchParams(searchParams)
    if (displayUser.id) {
      sp.set('id', displayUser.id)
    }

    const rawLnb = sp.get('lnb')
    const isInstructor = displayUser.role === 'INSTRUCTOR'
    const hasChildMenu = programsHistoryHasChildMenu(displayUser.role)

    const nextLnb: UserDetailLnbKey =
      rawLnb === 'history'
        ? 'history'
        : rawLnb === 'payment-status' && isInstructor
          ? 'payment-status'
          : 'detail-info'

    let nextChild: UserDetailProgramsChildKey = 'enrollment'
    if (nextLnb === 'history' && hasChildMenu) {
      const parsed = parseProgramsChildParam(sp.get(USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY))
      nextChild = parsed ? clampProgramsChildForRole(displayUser.role, parsed) : 'enrollment'
    }

    setActiveLnb(nextLnb)
    setActiveProgramsChild(nextChild)

    const nextParams = new URLSearchParams(sp)
    let urlDirty = false

    if ((sp.get('lnb') ?? '') !== nextLnb) {
      nextParams.set('lnb', nextLnb)
      urlDirty = true
    }

    if (nextLnb === 'history' && hasChildMenu) {
      const cur = sp.get(USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY)
      if (cur !== nextChild) {
        nextParams.set(USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY, nextChild)
        urlDirty = true
      }
    } else if (sp.has(USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY)) {
      nextParams.delete(USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY)
      urlDirty = true
    }

    if (displayUser.id && searchParams.get('id') !== displayUser.id) {
      urlDirty = true
    }

    if (urlDirty) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [open, displayUser?.id, displayUser?.role, mode, searchParams, setSearchParams])

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
        } else if (displayUser.role === 'INDIVIDUAL') {
          const stu = await applicationService.getByUserId(displayUser.id, 'student')
          setApplications(stu)
        } else {
          let subjectType: Application['subjectType'] | undefined
          if (displayUser.role === 'SCHOOL') subjectType = 'school'
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

    if (mode === 'permission') {
      return [
        {
          key: 'detail-info',
          label: '신청 정보',
          icon: (
            <BulbOutlined className="detail-fullpage-modal__lnb-icon" style={{ fontSize: 20 }} />
          ),
        },
      ]
    }

    const programsLabel = role === 'ADMIN' ? '담당 프로그램 이력' : '프로그램 참여 이력'
    const programsIcon = (
      <FolderOpenOutlined className="detail-fullpage-modal__lnb-icon" style={{ fontSize: 20 }} />
    )

    const programsItem: DetailModalSidebarNavItem =
      role === 'INDIVIDUAL'
        ? {
            key: 'history',
            label: programsLabel,
            icon: programsIcon,
            children: [
              { key: 'enrollment', label: '프로그램 수강 이력' },
              { key: 'volunteer', label: '봉사 프로그램 참여 이력' },
            ],
          }
        : role === 'INSTRUCTOR'
          ? {
              key: 'history',
              label: programsLabel,
              icon: programsIcon,
              children: [
                { key: 'enrollment', label: '프로그램 수강 이력' },
                { key: 'lecture', label: '프로그램 강의 이력' },
                { key: 'volunteer', label: '봉사 프로그램 참여 이력' },
              ],
            }
          : {
              key: 'history',
              label: programsLabel,
              icon: programsIcon,
            }

    const items: DetailModalSidebarNavItem[] = [
      {
        key: 'detail-info',
        label:
          role === 'ADMIN'
            ? '관리자 상세 정보'
            : role === 'INSTRUCTOR'
              ? '강사 상세 정보'
              : role === 'SCHOOL'
                ? '학교 상세 정보'
                : '회원 상세 정보',
        icon: <BulbOutlined className="detail-fullpage-modal__lnb-icon" style={{ fontSize: 20 }} />,
      },
      programsItem,
    ]

    if (role === 'INSTRUCTOR') {
      items.push({
        key: 'payment-status',
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
  }, [displayUser?.role, mode])

  const sidebarExpandedGroupKeys = useMemo(() => {
    if (activeLnb !== 'history' || !displayUser) return [] as const
    if (!programsHistoryHasChildMenu(displayUser.role)) return [] as const
    return ['history'] as const
  }, [activeLnb, displayUser])

  const sidebarActiveChildKey =
    activeLnb === 'history' && displayUser && programsHistoryHasChildMenu(displayUser.role)
      ? activeProgramsChild
      : ''

  const handleSidebarSelectTop = (key: string) => {
    if (mode === 'permission') {
      setActiveLnb('detail-info')
      return
    }
    const k = key as UserDetailLnbKey
    if (k === 'history' && displayUser && programsHistoryHasChildMenu(displayUser.role)) {
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
        if (k === 'history' && displayUser && programsHistoryHasChildMenu(displayUser.role)) {
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
    const child = childKey as UserDetailProgramsChildKey
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
      render: (v: string | undefined, record: Application) => {
        const label = v ?? '0/0'
        if (!lectureAttendanceHasAtLeastOne(v)) {
          return label
        }
        return (
          <button
            type="button"
            className="user-detail-modal__attendance-link"
            onClick={e => {
              e.stopPropagation()
              setLectureAttendanceApplication(record)
              setLectureAttendanceModalOpen(true)
            }}
          >
            {label}
          </button>
        )
      },
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

  const basicInfoExternalId1365 =
    displayUser.role === 'INDIVIDUAL' || displayUser.role === 'SCHOOL'
      ? {
          maskedLabel: '0915***',
          fullLabel: '0915123456',
          onOpen: () => message.info('1365 바로가기는 추후 연결됩니다.'),
        }
      : undefined

  const role = displayUser.role
  const basicInfoContent =
    role === 'INSTRUCTOR' ? (
      <div className="user-detail-modal__basic-tab-content user-detail-fullpage-modal__basic">
        <InstructorBasicInfo user={displayUser} personalInfoRevealed={personalInfoRevealed} />
      </div>
    ) : (
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <div className="user-detail-modal__basic-tab-content user-detail-fullpage-modal__basic">
          <UserBasicInfoSection
            user={displayUser}
            entrySource={basicInfoEntrySource}
            externalId1365={basicInfoExternalId1365}
            personalInfoRevealed={personalInfoRevealed}
          />
          {role !== 'SCHOOL' ? <UserConsentAgreementSection /> : null}
        </div>
        {role === 'SCHOOL' ? (
          <SchoolAffiliatedTeachersSection
            rows={displayUser.schoolInfo?.affiliatedTeachers ?? []}
            onLinkedUserClick={onNavigateToLinkedUser}
          />
        ) : null}
      </Space>
    )

  const programsChildMode = programsHistoryHasChildMenu(role)

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
        message.info('수료증·확인서 다운로드는 추후 연결됩니다.')
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
              message.info('수료증 다운로드는 추후 연결됩니다.')
            }}
          />
        ) : (
          enrollmentSection
        ))}
      {activeProgramsChild === 'lecture' && role === 'INSTRUCTOR' && (
        <MemberProgramLectureHistory
          applications={applications}
          loading={applicationsLoading}
        />
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
        title={userDetailModalTitle(displayUser.name, displayUser.role)}
        className="user-detail-fullpage-modal"
        sidebar={
          <DetailModalSidebar
            navAriaLabel={userDetailSidebarNavAriaLabel(mode, displayUser.role)}
            items={userSidebarItems}
            activeKey={activeLnb}
            activeChildKey={sidebarActiveChildKey}
            expandedGroupKeys={sidebarExpandedGroupKeys}
            onSelectTop={handleSidebarSelectTop}
            onSelectChild={handleSidebarSelectChild}
          />
        }
        headerExtra={renderUserDetailHeaderExtra({
          mode,
          permissionRole,
          displayUser,
          activeLnb,
          activeProgramsChild,
          personalInfoRevealed,
          setPersonalInfoRevealed,
          onPermissionApprove,
          onPermissionReject,
          onWithdraw,
          onEdit,
          onOpenWithdrawConfirm: () => setWithdrawConfirmOpen(true),
        })}
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
