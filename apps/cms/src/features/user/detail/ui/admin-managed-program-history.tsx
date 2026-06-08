/**
 * 관리자 회원 상세 — 담당 프로그램 이력 (필터 + 테이블)
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Key,
  type MouseEvent,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program, TargetLevel } from '@/types/domain'
import type { User } from '@/types/user'
import { programService } from '@/entities/program/api/program-service'
import { mockPrograms } from '@/data/mock'
import {
  getEnrollmentDisplayStatusFromProgramLifecycle,
  getProgramLifecycleLabel,
  isProgramHistoryDeleteBlockedByDisplayStatus,
} from '@/shared/constants/status'
import { StatusBadge } from '@/shared/components/status-badge'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { adminManagedProgramTablePageConfig } from './admin-managed-program-table.config'
import type { FilterFieldConfig } from '@/shared/ui/unified-filter-card'
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

function yearOfProgram(p: Program): number {
  return new Date(p.startDate).getFullYear()
}

function participantTypeKey(p: Program): 'school' | 'volunteer' | 'individual' {
  const ls = p.lifecycleStatus
  if (ls === 'recruiting_volunteers' || ls === 'volunteer_recruitment_planned') {
    return 'volunteer'
  }
  if (p.category === 'school') return 'school'
  return 'individual'
}

function participantTypeLabel(p: Program): string {
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

function recruitmentCountDisplay(p: Program): string {
  const cap = p.rounds[0]?.capacity ?? 30
  const n = p.approvedStudentCount ?? 0
  return `${n} / ${cap}`
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
}

export function AdminManagedProgramHistory({ user }: AdminManagedProgramHistoryProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const sourcePrograms = useMemo(() => resolveManagedPrograms(user), [user])

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

  const handleDeleteConfirm = useCallback((): void => {
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
    setLocalPrograms(prev => prev.filter(p => !idSet.has(p.id)))
    setSelectedRowKeys([])
    setDeleteModalOpen(false)
  }, [selectedPrograms, selectedRowKeys])

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
        render: (_: unknown, p: Program) => `${yearOfProgram(p)}년`,
      },
      {
        title: '프로그램 진행 현황',
        key: 'lifecycle',
        width: 180,
        minWidth: 180,
        align: 'center',
        render: (_: unknown, p: Program) => (
          <StatusBadge
            domain="programEnrollment"
            status={getEnrollmentDisplayStatusFromProgramLifecycle(p.lifecycleStatus)}
            variant="text"
          />
        ),
      },
      {
        title: '참여자 모집 인원',
        key: 'recruitment',
        width: 130,
        align: 'center',
        render: (_: unknown, p: Program) => recruitmentCountDisplay(p),
      },
      {
        title: '참여자 유형',
        key: 'ptype',
        width: 120,
        align: 'center',
        render: (_: unknown, p: Program) => participantTypeLabel(p),
      },
      {
        title: '교육 대상',
        key: 'target',
        width: 120,
        align: 'center',
        render: (_: unknown, p: Program) => targetLevelLabel(p),
      },
    ],
    []
  )

  const adminManagedProgramTableOnRow = useCallback(
    (_record: Program) => ({
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
        window.alert('준비 중입니다.')
      },
      style: { cursor: 'pointer' as const },
    }),
    []
  )

  return (
    <>
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
        <ProgramHistoryDeleteBlockedModal
          open
          onClose={() => setDeleteBlockedModalOpen(false)}
        />
      ) : null}
    </>
  )
}
