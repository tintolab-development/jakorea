/**
 * 관리자 회원 상세 — 담당 프로그램 이력 (필터 + 테이블)
 */

import { useCallback, useEffect, useMemo, useState, type Key, type MouseEvent } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Table, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program, TargetLevel } from '@/types/domain'
import type { User } from '@/types/user'
import { programService } from '@/entities/program/api/program-service'
import { mockPrograms } from '@/data/mock'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { useMemberAdminProgramsQuery } from '@/features/user/api/hooks/use-member-detail-subresource-queries'
import {
  deleteAdminAccountProgramRoleRemote,
  deleteMemberAdminProgramRemote,
} from '@/features/user/api/members-api-client'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { MemberDetailMockDataBanner } from '@/features/user/detail/ui/member-detail-mock-data-banner'
import { handleError } from '@/shared/utils/error-handler'
import { useQueryClient } from '@tanstack/react-query'
import {
  getEnrollmentDisplayStatusFromProgramLifecycle,
  getProgramLifecycleLabel,
  isProgramHistoryDeleteBlockedByDisplayStatus,
} from '@/shared/constants/status'
import { StatusBadge } from '@/shared/components/status-badge'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { adminManagedProgramTablePageConfig } from './admin-managed-program-table.config'
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import {
  CmsButton,
  DeleteGuideModal,
  ProgramHistoryDeleteBlockedModal,
  buildProgramProgressHistoryDeleteGuide,
} from '@/shared/ui'
import { buildProgressYearSelectOptions } from '@/shared/utils'
import { navigateToProgramAdminDetail } from '@/features/program/general/lib/navigate-to-program-admin-detail'
import '@/features/program/general/ui/program-list.css'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'

type AdminUser = Omit<User, 'password'>

const ALL = ''

const TARGET_LEVEL_OPTIONS: { label: string; value: string }[] = [
  { label: '전체', value: ALL },
  { label: '초등학생', value: 'elementary' },
  { label: '중학생', value: 'middle' },
  { label: '고등학생', value: 'high' },
]

const PARTICIPANT_OPTIONS: { label: string; value: string }[] = [
  { label: '전체', value: ALL },
  { label: '학교/기관', value: 'school' },
  { label: '봉사자', value: 'volunteer' },
  { label: '개인 학습자', value: 'individual' },
]

function yearOfProgram(p: Program): string {
  const year = new Date(p.startDate).getFullYear()
  return Number.isFinite(year) ? `${year}년` : '-'
}

function participantTypeKey(p: Program): 'school' | 'volunteer' | 'individual' {
  const ls = p.lifecycleStatus
  if (ls === 'recruiting_volunteers' || ls === 'volunteer_recruitment_planned') {
    return 'volunteer'
  }
  if (p.category === 'school') return 'school'
  return 'individual'
}

function participantTypeLabel(p: Program, remote: boolean): string {
  if (remote && !p.description?.trim()) {
    const ls = p.lifecycleStatus
    if (ls === 'recruiting_volunteers' || ls === 'volunteer_recruitment_planned') {
      return '봉사자'
    }
    return '-'
  }
  const k = participantTypeKey(p)
  if (k === 'school') return '학교/기관'
  if (k === 'volunteer') return '봉사자'
  return '개인 학습자'
}

function targetLevelLabel(p: Program): string {
  const map: Record<TargetLevel, string> = {
    elementary: '초등학생',
    middle: '중학생',
    high: '고등학생',
    university: '대학생',
    adult: '성인',
  }
  if (!p.targetLevel) return '-'
  return map[p.targetLevel] ?? '-'
}

export function recruitmentCountDisplay(p: Program, remote: boolean): string {
  const cap = p.rounds[0]?.capacity ?? 0
  const n = p.approvedStudentCount
  if (remote && cap === 0 && (n == null || n === 0)) return '-'
  const approved = n ?? 0
  if (remote && cap === 0) return `${approved}`
  return `${approved} / ${cap || 30}`
}

function resolveManagedPrograms(user: AdminUser): Program[] {
  const keys = user.programRoles ? Object.keys(user.programRoles) : []
  const fromRoles = keys
    .map(id => programService.getByIdSync(id))
    .filter((p): p is Program => Boolean(p))
  if (fromRoles.length > 0) return fromRoles
  return mockPrograms.slice(0, 5)
}

export interface AdminManagedProgramHistoryProps {
  user: AdminUser
  /** 프로그램 상세로 이탈하기 직전 — 회원 상세 URL sync 억제 */
  onBeforeNavigateToProgramDetail?: () => void
}

export function AdminManagedProgramHistory({
  user,
  onBeforeNavigateToProgramDetail,
}: AdminManagedProgramHistoryProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const membersRemote = isMembersRemoteEnabled()
  const adminAccountId = user.adminAccountId
  const memberId = user.memberId
  const canFetchRemote =
    adminAccountId != null && adminAccountId > 0
      ? true
      : memberId != null && memberId > 0

  const { data: remotePrograms = [], isLoading: remoteProgramsLoading } =
    useMemberAdminProgramsQuery({ memberId, adminAccountId }, membersRemote && canFetchRemote)

  const sourcePrograms = useMemo(() => {
    if (membersRemote) return remotePrograms
    return resolveManagedPrograms(user)
  }, [membersRemote, remotePrograms, user])

  const [localPrograms, setLocalPrograms] = useState<Program[]>(() => sourcePrograms)
  useEffect(() => {
    setLocalPrograms([...sourcePrograms])
  }, [sourcePrograms])

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteBlockedModalOpen, setDeleteBlockedModalOpen] = useState(false)

  const yearOptions = useMemo(() => buildProgressYearSelectOptions(ALL), [])

  const lifecycleOptions = useMemo(() => {
    const set = new Set<string>()
    sourcePrograms.forEach(p => {
      if (p.lifecycleStatus) set.add(p.lifecycleStatus)
    })
    const ordered = [
      'planned',
      'recruiting_students',
      'education_in_progress',
      'matching_completed',
      'education_completed',
    ] as const
    const opts: { label: string; value: string }[] = [{ label: '전체', value: ALL }]
    ordered.forEach(k => {
      if (set.has(k)) opts.push({ label: getProgramLifecycleLabel(k), value: k })
    })
    set.forEach(k => {
      if (!opts.some(o => o.value === k))
        opts.push({ label: getProgramLifecycleLabel(k), value: k })
    })
    return opts
  }, [sourcePrograms])

  const filterFields = useMemo((): FilterFieldConfig[] => {
    const colWidth = '20%'
    return [
      {
        key: 'title',
        type: 'search',
        label: '프로그램명',
        placeholder: '프로그램명을 입력하세요',
        width: colWidth,
      },
      {
        key: 'year',
        type: 'select',
        label: '진행년도',
        placeholder: '전체',
        options: yearOptions,
        width: colWidth,
      },
      {
        key: 'lifecycle',
        type: 'select',
        label: '프로그램 진행 현황',
        placeholder: '전체',
        options: lifecycleOptions,
        width: colWidth,
      },
      {
        key: 'participantType',
        type: 'select',
        label: '참여자 유형',
        placeholder: '전체',
        options: PARTICIPANT_OPTIONS,
        width: colWidth,
      },
      {
        key: 'targetLevel',
        type: 'select',
        label: '교육 대상',
        placeholder: '전체',
        options: TARGET_LEVEL_OPTIONS,
        width: colWidth,
      },
    ]
  }, [yearOptions, lifecycleOptions])

  const tableContext = useMemo(() => ({}) as const, [])

  const {
    pendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    displayedCount,
    tableData,
  } = useTablePage(adminManagedProgramTablePageConfig, {
    data: localPrograms,
    searchParams,
    setSearchParams,
    context: tableContext,
    disableUrlSync: true,
  })

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const selectedPrograms = useMemo(() => {
    const keySet = new Set(selectedRowKeys.map(k => String(k)))
    return tableData.filter(p => keySet.has(p.id))
  }, [tableData, selectedRowKeys])

  const deleteGuide = useMemo(() => {
    return buildProgramProgressHistoryDeleteGuide(
      selectedPrograms.map(p => (p.title?.trim() ? p.title.trim() : '(제목 없음)'))
    )
  }, [selectedPrograms])

  const handleOpenDeleteModal = useCallback((): void => {
    if (selectedRowKeys.length === 0) return
    setDeleteModalOpen(true)
  }, [selectedRowKeys.length])

  const handleDeleteCancel = useCallback((): void => {
    setDeleteModalOpen(false)
  }, [])

  const handleDeleteConfirm = useCallback(async (): Promise<void> => {
    const hasInProgress = selectedPrograms.some(p =>
      isProgramHistoryDeleteBlockedByDisplayStatus(
        getEnrollmentDisplayStatusFromProgramLifecycle(p.lifecycleStatus)
      )
    )
    if (hasInProgress) {
      setDeleteModalOpen(false)
      setDeleteBlockedModalOpen(true)
      return
    }

    const idSet = new Set(selectedRowKeys.map(k => String(k)))

    if (membersRemote && canFetchRemote) {
      try {
        for (const program of selectedPrograms) {
          const programId = Number(program.id)
          if (!Number.isFinite(programId)) {
            throw new Error(`프로그램 ID를 해석할 수 없습니다: ${program.id}`)
          }
          if (adminAccountId != null && adminAccountId > 0) {
            await deleteAdminAccountProgramRoleRemote(adminAccountId, programId)
          } else if (memberId != null) {
            await deleteMemberAdminProgramRemote(memberId, programId)
          }
        }
        if (adminAccountId != null && adminAccountId > 0) {
          await queryClient.invalidateQueries({
            queryKey: memberQueryKeys.adminAccountPrograms(adminAccountId),
          })
        } else if (memberId != null) {
          await queryClient.invalidateQueries({
            queryKey: memberQueryKeys.adminPrograms(memberId),
          })
        }
      } catch (error) {
        handleError(error, {
          defaultMessage: getMemberApiErrorMessage(
            error,
            '담당 프로그램 이력 삭제에 실패했습니다.'
          ),
        })
        setDeleteModalOpen(false)
        return
      }
    } else {
      setLocalPrograms(prev => prev.filter(p => !idSet.has(p.id)))
    }

    setSelectedRowKeys([])
    setDeleteModalOpen(false)
  }, [
    selectedPrograms,
    selectedRowKeys,
    membersRemote,
    canFetchRemote,
    adminAccountId,
    memberId,
    queryClient,
  ])

  const columns: ColumnsType<Program> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: 56,
        align: 'center',
        render: (_: unknown, __: Program, index: number) => index + 1,
      },
      {
        title: '프로그램명',
        dataIndex: 'title',
        key: 'title',
        width: 260,
        ellipsis: true,
        align: 'center',
        render: (t: string) => t,
      },
      {
        title: '진행년도',
        key: 'year',
        align: 'center',
        render: (_: unknown, p: Program) => yearOfProgram(p),
      },
      {
        title: '프로그램 진행 현황',
        key: 'lifecycle',
        width: 180,
        minWidth: 180,
        align: 'center',
        render: (_: unknown, p: Program) =>
          p.lifecycleStatus ? (
            <StatusBadge
              domain="programEnrollment"
              status={getEnrollmentDisplayStatusFromProgramLifecycle(p.lifecycleStatus)}
              variant="text"
            />
          ) : (
            '-'
          ),
      },
      {
        title: '참여자 모집 인원',
        key: 'recruitment',
        width: 130,
        align: 'center',
        render: (_: unknown, p: Program) => recruitmentCountDisplay(p, membersRemote),
      },
      {
        title: '참여자 유형',
        key: 'ptype',
        width: 120,
        align: 'center',
        render: (_: unknown, p: Program) => participantTypeLabel(p, membersRemote),
      },
      {
        title: '교육 대상',
        key: 'target',
        width: 120,
        align: 'center',
        render: (_: unknown, p: Program) => targetLevelLabel(p),
      },
    ],
    [membersRemote]
  )

  const adminManagedProgramTableOnRow = useCallback(
    (record: Program) => ({
      onClick: (e: MouseEvent<HTMLElement>) => {
        const el = e.target as HTMLElement
        if (
          el.closest('.ant-table-selection-column') ||
          el.closest('.ant-checkbox-wrapper') ||
          el.closest('button') ||
          el.closest('a')
        ) {
          return
        }
        const programId = record.id?.trim()
        if (!programId) return
        navigateToProgramAdminDetail(navigate, programId, {
          onBeforeNavigate: onBeforeNavigateToProgramDetail,
          queryClient,
        })
      },
      style: { cursor: 'pointer' as const },
    }),
    [navigate, onBeforeNavigateToProgramDetail, queryClient]
  )

  return (
    <>
      {membersRemote && !canFetchRemote ? (
        <MemberDetailMockDataBanner message="adminAccountId 또는 memberId가 없어 담당 프로그램 이력 API를 호출할 수 없습니다." />
      ) : null}
      <FilterTableLayout
        bordered={false}
        fields={filterFields}
        filters={{
          title: pendingFilters.title,
          year: pendingFilters.year || undefined,
          lifecycle: pendingFilters.lifecycle || undefined,
          participantType: pendingFilters.participantType || undefined,
          targetLevel: pendingFilters.targetLevel || undefined,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="프로그램 담당 이력"
        description={`총 ${displayedCount}건`}
        actions={
          <CmsButton
            variant="delete"
            disabled={selectedRowKeys.length === 0}
            onClick={handleOpenDeleteModal}
          >
            이력 삭제
          </CmsButton>
        }
        excelExport={{
          columns,
          data: tableData,
        }}
      >
        <Spin spinning={membersRemote && remoteProgramsLoading}>
          <Table<Program>
            rowSelection={{
              columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
            }}
            dataSource={tableData}
            columns={columns}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            pagination={false}
            className="cms-data-table cms-data-table--fluid"
            onRow={adminManagedProgramTableOnRow}
          />
        </Spin>
      </FilterTableLayout>
      {deleteModalOpen && deleteGuide && (
        <DeleteGuideModal
          open
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title={deleteGuide.title}
          lines={deleteGuide.lines}
          confirmText="삭제"
          confirmVariant="delete"
          requiredConfirmInput={DELETE_GUIDE_TYPED_CONFIRM_VALUE}
          confirmInputPlaceholder={DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER}
        />
      )}
      {deleteBlockedModalOpen ? (
        <ProgramHistoryDeleteBlockedModal open onClose={() => setDeleteBlockedModalOpen(false)} />
      ) : null}
    </>
  )
}
