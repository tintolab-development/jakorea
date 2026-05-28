import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Key } from 'react'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { DeleteGuideModal } from '@/shared/ui/delete-guide-modal'
import {
  buildGeminiInstructorApproveMessageLines,
  buildGeminiInstructorChangeMessageLines,
} from '../../lib/approved/instructor-approve-messages'
import { GEMINI_INSTRUCTOR_APPLICATION_FILTER_FIELDS } from '../../model/approved/instructor-application-filter-fields'
import {
  applyGeminiInstructorAssignment,
  resetGeminiInstructorAssignmentToPending,
} from '../../model/approved/instructor-application-assignment'
import { getGeminiInstructorApplicationRows } from '../../model/approved/instructor-application-mock'
import type {
  GeminiInstructorApplicationApprovalStatus,
  GeminiInstructorApplicationRow,
} from '../../model/approved/instructor-application-types'
import './detail-instructor-application-tab.css'

type PendingFilters = {
  instructorName: string
  homeSido: string
  homeSigungu: string
  experienceYears: string
  grade: string
  approvalStatus: GeminiInstructorApplicationApprovalStatus | 'ALL'
}

const APPROVAL_STATUS_LABEL: Record<GeminiInstructorApplicationApprovalStatus, string> = {
  PENDING: '승인 대기',
  APPROVED: '승인 완료',
  REJECTED: '신청 반려',
}

const INITIAL_PENDING_FILTERS: PendingFilters = {
  instructorName: '',
  homeSido: '',
  homeSigungu: '',
  experienceYears: 'ALL',
  grade: 'ALL',
  approvalStatus: 'ALL',
}

const COL = {
  no: 72,
  instructorName: 120,
  homeRegion: 170,
  experience: 120,
  grade: 120,
  contact: 140,
  email: 180,
  monthlyAssignment: 130,
  approvalStatus: 140,
} as const

const TABLE_SCROLL_X =
  TABLE_COLUMN_WIDTHS.checkbox +
  COL.no +
  COL.instructorName +
  COL.homeRegion +
  COL.experience +
  COL.grade +
  COL.contact +
  COL.email +
  COL.monthlyAssignment +
  COL.approvalStatus +
  48

function approvalStatusText(status: GeminiInstructorApplicationApprovalStatus) {
  const base = 'gemini-approved-instructor-application-tab__approval'
  const modifier =
    status === 'PENDING'
      ? `${base}--pending`
      : status === 'APPROVED'
        ? `${base}--approved`
        : `${base}--rejected`
  return <span className={`${base} ${modifier}`}>{APPROVAL_STATUS_LABEL[status]}</span>
}

function toHomeRegionText(row: GeminiInstructorApplicationRow): string {
  return `${row.homeSido} ${row.homeSigungu}`.trim()
}

function matchesExperienceYears(rowYears: number, filter: string): boolean {
  if (filter === 'ALL') return true
  if (filter === '6+') return rowYears >= 6
  const parsed = Number(filter)
  return !Number.isNaN(parsed) && rowYears === parsed
}

function filterRows(rows: GeminiInstructorApplicationRow[], filters: PendingFilters) {
  const nameQ = filters.instructorName.trim().toLowerCase()

  return rows.filter(row => {
    if (nameQ && !row.instructorName.toLowerCase().includes(nameQ)) {
      return false
    }
    if (filters.homeSido && row.homeSido !== filters.homeSido) {
      return false
    }
    if (filters.homeSigungu && row.homeSigungu !== filters.homeSigungu) {
      return false
    }
    if (!matchesExperienceYears(row.experienceYears, filters.experienceYears)) {
      return false
    }
    if (filters.grade !== 'ALL' && row.grade !== filters.grade) {
      return false
    }
    if (filters.approvalStatus !== 'ALL' && row.approvalStatus !== filters.approvalStatus) {
      return false
    }
    return true
  })
}

export function GeminiApprovedTrainingDetailInstructorApplicationTab({
  approvedTrainingId,
}: {
  approvedTrainingId: string
}) {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [rows, setRows] = useState(() => getGeminiInstructorApplicationRows(approvedTrainingId))
  const [confirmModal, setConfirmModal] = useState<
    { mode: 'approve'; target: GeminiInstructorApplicationRow } | { mode: 'change' } | null
  >(null)

  useEffect(() => {
    setRows(getGeminiInstructorApplicationRows(approvedTrainingId))
    setSelectedRowKeys([])
    setPendingFilters(INITIAL_PENDING_FILTERS)
    setAppliedFilters(INITIAL_PENDING_FILTERS)
  }, [approvedTrainingId])

  const filteredRows = useMemo(() => filterRows(rows, appliedFilters), [rows, appliedFilters])

  const approveButtonLabel = useMemo(() => {
    if (selectedRowKeys.length !== 1) return '선택 승인'
    const selected = rows.find(row => row.id === String(selectedRowKeys[0]))
    return selected?.approvalStatus === 'APPROVED' ? '강사 변경' : '선택 승인'
  }, [rows, selectedRowKeys])

  const showNoSelectionAlert = useCallback(() => {
    showAlert({
      title: '항목 선택 안내',
      content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
    })
  }, [showAlert])

  const handleBulkApprove = useCallback(() => {
    if (!canWrite) return
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    if (selectedRowKeys.length > 1) {
      showAlert({
        title: '배정 안내',
        content: '프로그램에는 강사 1명만 배정할 수 있습니다.\n한 명만 선택한 뒤 다시 시도해 주세요.',
      })
      return
    }
    const assigneeId = String(selectedRowKeys[0])
    const target = rows.find(row => row.id === assigneeId)
    if (!target) return
    if (target.approvalStatus === 'APPROVED') {
      setConfirmModal({ mode: 'change' })
      return
    }
    if (target.approvalStatus !== 'PENDING') {
      showAlert({
        title: '안내',
        content:
          '신청 반려된 강사는 선택 승인할 수 없습니다.\n승인 대기 상태의 강사를 선택해 주세요.',
      })
      return
    }
    setConfirmModal({ mode: 'approve', target })
  }, [canWrite, rows, selectedRowKeys, showAlert, showNoSelectionAlert])

  const handleConfirmModalOk = useCallback(() => {
    if (!confirmModal) return
    if (confirmModal.mode === 'approve') {
      setRows(prev => applyGeminiInstructorAssignment(prev, confirmModal.target.id))
      // TODO: 강사 배정 승인 API 연동
    } else {
      setRows(prev => resetGeminiInstructorAssignmentToPending(prev))
      // TODO: 강사 변경(전원 승인 대기) API 연동
    }
    setSelectedRowKeys([])
    setConfirmModal(null)
  }, [confirmModal])

  const columns = useMemo<ColumnsType<GeminiInstructorApplicationRow>>(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: COL.no,
        align: 'center',
      },
      {
        title: '신청 강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: COL.instructorName,
        align: 'center',
      },
      {
        title: '자택 주소지',
        key: 'homeRegion',
        width: COL.homeRegion,
        align: 'center',
        render: (_: unknown, row) => toHomeRegionText(row),
      },
      {
        title: 'JA 강의 경력',
        dataIndex: 'experienceYears',
        key: 'experienceYears',
        width: COL.experience,
        align: 'center',
        render: (years: number) => `${years}년`,
      },
      {
        title: 'JA 평가 등급',
        dataIndex: 'grade',
        key: 'grade',
        width: COL.grade,
        align: 'center',
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: COL.contact,
        align: 'center',
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: COL.email,
        align: 'center',
      },
      {
        title: '배정횟수(월별)',
        dataIndex: 'monthlyAssignmentCount',
        key: 'monthlyAssignmentCount',
        width: COL.monthlyAssignment,
        align: 'center',
      },
      {
        title: '프로그램 승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: COL.approvalStatus,
        align: 'center',
        render: (status: GeminiInstructorApplicationApprovalStatus) => approvalStatusText(status),
      },
    ],
    []
  )

  return (
    <>
    <FilterTableLayout
      bordered={false}
      fields={GEMINI_INSTRUCTOR_APPLICATION_FILTER_FIELDS}
      filters={pendingFilters}
      onFilterChange={(key, value) => {
        if (key === 'homeSido') {
          setPendingFilters(prev => ({
            ...prev,
            homeSido: value == null ? '' : String(value),
            homeSigungu: '',
          }))
          return
        }
        if (key === 'homeSigungu') {
          setPendingFilters(prev => ({
            ...prev,
            homeSigungu: value == null ? '' : String(value),
          }))
          return
        }
        if (key === 'experienceYears') {
          setPendingFilters(prev => ({
            ...prev,
            experienceYears: value == null ? 'ALL' : String(value),
          }))
          return
        }
        if (key === 'grade') {
          setPendingFilters(prev => ({
            ...prev,
            grade: value == null ? 'ALL' : String(value),
          }))
          return
        }
        if (key === 'approvalStatus') {
          setPendingFilters(prev => ({
            ...prev,
            approvalStatus: (value == null
              ? 'ALL'
              : String(value)) as PendingFilters['approvalStatus'],
          }))
          return
        }
        setPendingFilters(prev => ({
          ...prev,
          [key]: value == null ? '' : String(value),
        }))
      }}
      onSearch={() => setAppliedFilters(pendingFilters)}
      title="교육 신청 강사 목록"
      description={`총 ${filteredRows.length.toLocaleString()}건`}
      actions={
        canWrite ? (
          <CmsButton variant="secondary" size="medium" onClick={handleBulkApprove}>
            {approveButtonLabel}
          </CmsButton>
        ) : null
      }
    >
      <Table<GeminiInstructorApplicationRow>
        rowKey="id"
        className="cms-data-table"
        tableLayout="fixed"
        scroll={{ x: TABLE_SCROLL_X }}
        columns={columns}
        dataSource={filteredRows}
        pagination={false}
        rowSelection={
          canWrite
            ? {
                columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys.map(k => String(k))),
                preserveSelectedRowKeys: false,
              }
            : undefined
        }
      />
    </FilterTableLayout>

    <DeleteGuideModal
      open={confirmModal != null}
      onCancel={() => setConfirmModal(null)}
      onConfirm={handleConfirmModalOk}
      title={confirmModal?.mode === 'change' ? '강사 변경' : '강사 승인'}
      lines={
        confirmModal?.mode === 'change'
          ? buildGeminiInstructorChangeMessageLines()
          : confirmModal?.mode === 'approve'
            ? buildGeminiInstructorApproveMessageLines(confirmModal.target.instructorName)
            : []
      }
      confirmText={confirmModal?.mode === 'change' ? '변경' : '승인'}
      confirmVariant="primary"
      zIndex={2600}
    />
    </>
  )
}
