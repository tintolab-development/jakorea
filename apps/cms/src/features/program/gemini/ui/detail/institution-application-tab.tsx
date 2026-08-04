import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components'
import { FilterTableLayout, type FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { createInstitutionAddressRegionFilterField } from '@/shared/config/institution-address-region-filter-field'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH, useCmsAlert } from '@/shared/ui'
import { DeleteGuideModal } from '@/shared/ui/delete-guide-modal'
import { shouldUseGeminiVisitingTrainingRemoteApi } from '../../api/visiting-training/capabilities'
import { useGeminiOrganizationApplicationsQuery } from '../../api/visiting-training/hooks'
import {
  approveGeminiOrganizationApplications,
  rejectGeminiOrganizationApplications,
} from '../../api/visiting-training/service'
import {
  getGeminiInstitutionApplicationRows,
  patchGeminiInstitutionApplicationApprovalStatus,
  type GeminiInstitutionApplicationRow,
  type GeminiInstitutionApprovalStatus,
} from '../../model/recruitment/institution-application-mock'
import {
  GEMINI_INSTITUTION_APPROVAL_STATUS_OPTIONS,
  GeminiInstitutionApprovalStatusBadge,
} from './gemini-institution-approval-status-badge'
import { GeminiInstitutionPreferredLectureScheduleCell } from './gemini-institution-preferred-lecture-schedule-cell'
import './institution-application-tab.css'

type PendingFilters = {
  institutionName: string
  institutionSido: string
  institutionSigungu: string
  approvalStatus: GeminiInstitutionApprovalStatus | 'ALL'
  teacherName: string
}

const FILTER_FIELDS: FilterFieldConfig[] = [
  {
    key: 'institutionName',
    type: 'search',
    label: '신청 기관명',
    placeholder: '기관명을 입력하세요',
    width: '25%',
  },
  createInstitutionAddressRegionFilterField(),
  {
    key: 'approvalStatus',
    type: 'select',
    label: '승인 현황',
    placeholder: '전체',
    width: '25%',
    options: [
      { label: '전체', value: 'ALL' },
      { label: '승인', value: 'APPROVED' },
      { label: '승인 대기', value: 'PENDING' },
      { label: '신청 반려', value: 'REJECTED' },
    ],
  },
  {
    key: 'teacherName',
    type: 'search',
    label: '담당 교사명',
    placeholder: '교사명을 입력하세요',
    width: '25%',
  },
]

const INITIAL_PENDING_FILTERS: PendingFilters = {
  institutionName: '',
  institutionSido: '',
  institutionSigungu: '',
  approvalStatus: 'ALL',
  teacherName: '',
}

const TABLE_SCROLL_X =
  TABLE_COLUMN_WIDTHS.checkbox + 72 + 150 + 170 + 150 + 420 + 100 + 120 + 48

function toRegionText(row: GeminiInstitutionApplicationRow): string {
  return `${row.institutionSido} ${row.institutionSigungu}`.trim()
}

function filterRows(rows: GeminiInstitutionApplicationRow[], filters: PendingFilters) {
  const institutionNameQ = filters.institutionName.trim().toLowerCase()
  const teacherNameQ = filters.teacherName.trim().toLowerCase()

  return rows.filter(row => {
    if (institutionNameQ && !row.institutionName.toLowerCase().includes(institutionNameQ)) {
      return false
    }
    if (filters.institutionSido && row.institutionSido !== filters.institutionSido) {
      return false
    }
    if (filters.institutionSigungu && row.institutionSigungu !== filters.institutionSigungu) {
      return false
    }
    if (filters.approvalStatus !== 'ALL' && row.approvalStatus !== filters.approvalStatus) {
      return false
    }
    if (teacherNameQ && !row.teacherName.toLowerCase().includes(teacherNameQ)) {
      return false
    }
    return true
  })
}

function buildBulkRejectMessageLines(count: number): string[] {
  if (count <= 0) return []
  return [
    `선택한 ${count}건의 기관 신청을 반려하시겠습니까?`,
    '반려 시 해당 기관들의 승인 현황이 [신청 반려]로 변경됩니다.',
    '정말로 반려하시겠습니까?',
  ]
}

function buildBulkApproveMessageLines(count: number): string[] {
  if (count <= 0) return []
  return [
    `선택한 ${count}건의 기관 신청을 승인하시겠습니까?`,
    '승인 시 해당 기관들의 승인 현황이 [승인]으로 변경됩니다.',
    '정말로 승인하시겠습니까?',
  ]
}

export function GeminiInstitutionApplicationTab({
  recruitmentId,
}: {
  recruitmentId?: string
}) {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  const remoteQuery = useGeminiOrganizationApplicationsQuery(
    recruitmentId,
    remoteEnabled && Boolean(recruitmentId)
  )
  const [rows, setRows] = useState(() => getGeminiInstitutionApplicationRows())
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [openApprovalDropdownId, setOpenApprovalDropdownId] = useState<string | null>(null)
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false)
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false)

  useEffect(() => {
    if (remoteEnabled && remoteQuery.data) {
      setRows(remoteQuery.data)
      return
    }
    if (!remoteEnabled) {
      setRows(getGeminiInstitutionApplicationRows())
    }
  }, [remoteEnabled, remoteQuery.data])

  const filteredRows = useMemo(() => filterRows(rows, appliedFilters), [rows, appliedFilters])

  const selectedRows = useMemo(
    () => rows.filter(row => selectedRowKeys.includes(row.id)),
    [rows, selectedRowKeys]
  )

  const rejectDisabled = useMemo(
    () =>
      selectedRows.length === 0 ||
      selectedRows.some(row => row.approvalStatus === 'REJECTED'),
    [selectedRows]
  )

  const approveDisabled = useMemo(
    () =>
      selectedRows.length === 0 ||
      selectedRows.some(row => row.approvalStatus === 'APPROVED'),
    [selectedRows]
  )

  const refreshRows = useCallback(() => {
    if (remoteEnabled) {
      void remoteQuery.refetch()
      return
    }
    setRows([...getGeminiInstitutionApplicationRows()])
  }, [remoteEnabled, remoteQuery])

  const showRemoteMutationUnavailable = useCallback(() => {
    showAlert({
      title: '안내',
      content:
        '기관 신청 승인/반려 처리에 실패했습니다.\n잠시 후 다시 시도해 주세요.',
    })
  }, [showAlert])

  const showNoSelectionAlert = useCallback(() => {
    showAlert({
      title: '항목 선택 안내',
      content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
    })
  }, [showAlert])

  const handleBulkReject = useCallback(() => {
    if (!canWrite) return
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    if (rejectDisabled) return
    setBulkRejectOpen(true)
  }, [canWrite, rejectDisabled, selectedRowKeys.length, showNoSelectionAlert])

  const handleBulkApprove = useCallback(() => {
    if (!canWrite) return
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    if (approveDisabled) return
    setBulkApproveOpen(true)
  }, [approveDisabled, canWrite, selectedRowKeys.length, showNoSelectionAlert])

  const confirmBulkReject = useCallback(async () => {
    const ids = selectedRows
      .filter(row => row.approvalStatus !== 'REJECTED')
      .map(row => row.id)
    if (ids.length === 0) return
    try {
      if (remoteEnabled) {
        await rejectGeminiOrganizationApplications(ids)
      } else {
        patchGeminiInstitutionApplicationApprovalStatus(ids, 'REJECTED')
      }
      refreshRows()
      setSelectedRowKeys([])
      setBulkRejectOpen(false)
    } catch {
      showRemoteMutationUnavailable()
      setBulkRejectOpen(false)
    }
  }, [refreshRows, remoteEnabled, selectedRows, showRemoteMutationUnavailable])

  const confirmBulkApprove = useCallback(async () => {
    const ids = selectedRows
      .filter(row => row.approvalStatus !== 'APPROVED')
      .map(row => row.id)
    if (ids.length === 0) return
    try {
      if (remoteEnabled) {
        await approveGeminiOrganizationApplications(ids)
      } else {
        patchGeminiInstitutionApplicationApprovalStatus(ids, 'APPROVED')
      }
      refreshRows()
      setSelectedRowKeys([])
      setBulkApproveOpen(false)
    } catch {
      showRemoteMutationUnavailable()
      setBulkApproveOpen(false)
    }
  }, [refreshRows, remoteEnabled, selectedRows, showRemoteMutationUnavailable])

  const handleApprovalStatusChange = useCallback(
    async (rowId: string, next: GeminiInstitutionApprovalStatus) => {
      if (!canWrite) return
      try {
        if (remoteEnabled) {
          if (next === 'APPROVED') {
            await approveGeminiOrganizationApplications([rowId])
          } else if (next === 'REJECTED') {
            await rejectGeminiOrganizationApplications([rowId])
          } else {
            showAlert({
              title: '안내',
              content: '원격 API에서는 승인 대기로 되돌릴 수 없습니다.',
            })
            setOpenApprovalDropdownId(null)
            return
          }
        } else {
          patchGeminiInstitutionApplicationApprovalStatus([rowId], next)
        }
        refreshRows()
        setOpenApprovalDropdownId(null)
      } catch {
        showRemoteMutationUnavailable()
        setOpenApprovalDropdownId(null)
      }
    },
    [canWrite, refreshRows, remoteEnabled, showAlert, showRemoteMutationUnavailable]
  )

  const columns = useMemo<ColumnsType<GeminiInstitutionApplicationRow>>(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 72,
        align: 'center',
      },
      {
        title: '신청 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: 150,
        align: 'center',
      },
      {
        title: '기관 소재지',
        key: 'region',
        width: 170,
        align: 'center',
        render: (_: unknown, row) => toRegionText(row),
      },
      {
        title: '승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 150,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (status: GeminiInstitutionApprovalStatus, record) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<GeminiInstitutionApprovalStatus>
              status={status}
              statusOptions={GEMINI_INSTITUTION_APPROVAL_STATUS_OPTIONS}
              renderBadge={s => <GeminiInstitutionApprovalStatusBadge status={s} />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={
                canWrite ? next => handleApprovalStatusChange(record.id, next) : undefined
              }
              isOpen={openApprovalDropdownId === record.id}
              onOpenChange={open => setOpenApprovalDropdownId(open ? record.id : null)}
            />
          </div>
        ),
      },
      {
        title: '강의 진행 희망 교육 날짜 및 시간',
        dataIndex: 'preferredLectureSchedule',
        key: 'preferredLectureSchedule',
        width: 420,
        align: 'center',
        onCell: () => ({ className: 'gemini-institution-application-tab__schedule-cell' }),
        render: (value: string) => (
          <GeminiInstitutionPreferredLectureScheduleCell value={value} />
        ),
      },
      {
        title: '수강 인원',
        dataIndex: 'studentCount',
        key: 'studentCount',
        width: 100,
        align: 'center',
        render: (count: number) => `${count}명`,
      },
      {
        title: '담당 교사명',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: 120,
        align: 'center',
      },
    ],
    [canWrite, handleApprovalStatusChange, openApprovalDropdownId]
  )

  const rejectTargetCount = selectedRows.filter(row => row.approvalStatus !== 'REJECTED').length
  const approveTargetCount = selectedRows.filter(row => row.approvalStatus !== 'APPROVED').length

  return (
    <>
      <FilterTableLayout
        bordered={false}
        fields={FILTER_FIELDS}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          if (key === 'institutionSido') {
            setPendingFilters(prev => ({
              ...prev,
              institutionSido: value == null ? '' : String(value),
              institutionSigungu: '',
            }))
            return
          }
          if (key === 'institutionSigungu') {
            setPendingFilters(prev => ({
              ...prev,
              institutionSigungu: value == null ? '' : String(value),
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
        onSearch={() => {
          setAppliedFilters(pendingFilters)
          setSelectedRowKeys([])
        }}
        title="기관 신청 목록"
        description={`총 ${filteredRows.length.toLocaleString()}건`}
        actions={
          canWrite ? (
            <>
              <CmsButton
                variant="delete"
                size="large"
                className="cms-button--action"
                width={CMS_ACTION_BUTTON_WIDTH}
                disabled={rejectDisabled}
                onClick={handleBulkReject}
              >
                선택 반려
              </CmsButton>
              <CmsButton
                variant="secondary"
                size="large"
                className="cms-button--action"
                width={CMS_ACTION_BUTTON_WIDTH}
                disabled={approveDisabled}
                onClick={handleBulkApprove}
              >
                선택 승인
              </CmsButton>
            </>
          ) : null
        }
        excelExport={{
          columns,
          data: filteredRows,
        }}
      >
        <Table<GeminiInstitutionApplicationRow>
          rowKey="id"
          className="cms-data-table"
          tableLayout="fixed"
          scroll={{ x: TABLE_SCROLL_X }}
          columns={columns}
          dataSource={filteredRows}
          loading={remoteEnabled && remoteQuery.isFetching}
          pagination={false}
          rowSelection={
            canWrite
              ? {
                  columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                  selectedRowKeys,
                  onChange: keys => setSelectedRowKeys(keys),
                  preserveSelectedRowKeys: false,
                }
              : undefined
          }
        />
      </FilterTableLayout>

      <DeleteGuideModal
        open={bulkRejectOpen}
        title="선택 반려"
        lines={buildBulkRejectMessageLines(rejectTargetCount)}
        onCancel={() => setBulkRejectOpen(false)}
        onConfirm={confirmBulkReject}
      />
      <DeleteGuideModal
        open={bulkApproveOpen}
        title="선택 승인"
        lines={buildBulkApproveMessageLines(approveTargetCount)}
        onCancel={() => setBulkApproveOpen(false)}
        onConfirm={confirmBulkApprove}
      />
    </>
  )
}
