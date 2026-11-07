import { useCallback, useMemo, useState, type Key } from 'react'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { FilterTableLayout, type FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { createInstitutionAddressRegionFilterField } from '@/shared/config/institution-address-region-filter-field'
import {
  FilterTableToolbarButton,
  useCmsAlert,
} from '@/shared/ui'
import { isAwaitingFirstQueryData } from '@/shared/lib/is-awaiting-first-query-data'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import {
  toOrganizationApproveNotifyTiming,
  toTimedBulkNotifyTiming,
} from '@/features/program/general/lib/application-decision-notify-timing'
import { ProgramApplicationRejectModal } from '@/features/program/shared/ui/detail-modal/components/program-application-reject-modal'
import { shouldUseGeminiVisitingTrainingRemoteApi } from '../../api/visiting-training/capabilities'
import { useGeminiOrganizationApplicationsQuery } from '../../api/visiting-training/hooks'
import { formatGeminiOrganizationApplicationDecisionError } from '../../api/visiting-training/organization-application-approve'
import {
  approveGeminiOrganizationApplications,
  rejectGeminiOrganizationApplications,
} from '../../api/visiting-training/service'
import {
  patchGeminiInstitutionApplicationApprovalStatus,
  type GeminiInstitutionApplicationRow,
  type GeminiInstitutionApprovalStatus,
} from '../../model/recruitment/institution-application-types'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import { GeminiInstitutionApprovalStatusBadge } from './gemini-institution-approval-status-badge'
import { GeminiInstitutionApproveModal } from './institution-approve-modal'
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
    placeholder: '기관명을 입력해 주세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  createInstitutionAddressRegionFilterField(),
  {
    key: 'approvalStatus',
    type: 'select',
    label: '승인 현황',
    placeholder: '전체',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
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
    placeholder: '교사명을 입력해 주세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
]

const INITIAL_PENDING_FILTERS: PendingFilters = {
  institutionName: '',
  institutionSido: '',
  institutionSigungu: '',
  approvalStatus: 'ALL',
  teacherName: '',
}

const COL = {
  no: TABLE_COLUMN_WIDTHS.index,
  institutionName: 303,
  region: 303,
  approvalStatus: 160,
  schedule: 400,
  studentCount: 120,
  teacherName: 120,
} as const

const TABLE_SCROLL_X =
  TABLE_COLUMN_WIDTHS.checkbox +
  COL.no +
  COL.institutionName +
  COL.region +
  COL.approvalStatus +
  COL.schedule +
  COL.studentCount +
  COL.teacherName +
  48

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

function resolveDecisionSubjectName(row: GeminiInstitutionApplicationRow | undefined): string {
  const institution = row?.institutionName.trim()
  if (institution && institution !== '-') return institution
  const teacher = row?.teacherName.trim()
  if (teacher && teacher !== '-') return teacher
  return '기관'
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

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'gemini-institution-applications',
    'Gemini 찾아가는 연수 · 기관 신청'
  )
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PendingFilters>(INITIAL_PENDING_FILTERS)
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false)
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false)
  const [decisionSubmitting, setDecisionSubmitting] = useState(false)
  const queryFilters = useMemo(
    () => ({
      institutionName: appliedFilters.institutionName || undefined,
      institutionSido: appliedFilters.institutionSido || undefined,
      institutionSigungu: appliedFilters.institutionSigungu || undefined,
      approvalStatus:
        appliedFilters.approvalStatus !== 'ALL'
          ? appliedFilters.approvalStatus
          : undefined,
      teacherName: appliedFilters.teacherName || undefined,
    }),
    [appliedFilters]
  )
  const remoteQuery = useGeminiOrganizationApplicationsQuery(
    recruitmentId,
    queryFilters,
    remoteEnabled && Boolean(recruitmentId)
  )
  const rows = useMemo(
    () => remoteQuery.data?.pages.flatMap(page => page.rows) ?? [],
    [remoteQuery.data]
  )
  const hasNextPage = remoteEnabled ? (remoteQuery.hasNextPage ?? false) : false
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage: remoteQuery.isFetchingNextPage,
    fetchNextPage: remoteQuery.fetchNextPage,
    resetKey: `${recruitmentId ?? ''}:${JSON.stringify(queryFilters)}`,
  })

  const filteredRows = useMemo(() => filterRows(rows, appliedFilters), [rows, appliedFilters])
  const awaitingRemoteRows = remoteEnabled && isAwaitingFirstQueryData(remoteQuery)

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

  /** REJECTED 포함 승인 가능. 서버가 반려 취소 후 APPROVED. 선행 cancel-rejection 없음. APPROVED 재승인 금지. */
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
  }, [remoteEnabled, remoteQuery])

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

  const confirmBulkReject = useCallback(
    async (payload: PermissionModalPayload) => {
      const ids = selectedRows
        .filter(row => row.approvalStatus !== 'REJECTED')
        .map(row => row.id)
      if (ids.length === 0) return
      const reason = payload.reason.trim()
      if (reason.length < 2) return
      const notify = toTimedBulkNotifyTiming(payload.notifyTiming, payload.manualNotifyAt)
      setDecisionSubmitting(true)
      try {
        if (remoteEnabled) {
          await rejectGeminiOrganizationApplications(ids, {
            reason,
            timing: notify?.timing,
            scheduledAt: notify?.scheduledAt,
          })
        } else {
          patchGeminiInstitutionApplicationApprovalStatus(ids, 'REJECTED')
        }
        refreshRows()
        setSelectedRowKeys([])
        setBulkRejectOpen(false)
      } catch (error) {
        showAlert({
          title: '안내',
          content:
            formatGeminiOrganizationApplicationDecisionError(error) ??
            '기관 신청 승인/반려 처리에 실패했습니다.\n잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setDecisionSubmitting(false)
      }
    },
    [refreshRows, remoteEnabled, selectedRows, showAlert]
  )

  const confirmBulkApprove = useCallback(
    async (payload: PermissionModalPayload) => {
      const ids = selectedRows
        .filter(row => row.approvalStatus !== 'APPROVED')
        .map(row => row.id)
      if (ids.length === 0) return
      const notify = toOrganizationApproveNotifyTiming(
        payload.notifyTiming,
        payload.manualNotifyAt
      )
      setDecisionSubmitting(true)
      try {
        if (remoteEnabled) {
          await approveGeminiOrganizationApplications(ids, {
            timing: notify.timing,
            scheduledAt: notify.scheduledAt,
          })
        } else {
          patchGeminiInstitutionApplicationApprovalStatus(ids, 'APPROVED')
        }
        refreshRows()
        setSelectedRowKeys([])
        setBulkApproveOpen(false)
      } catch (error) {
        showAlert({
          title: '안내',
          content:
            formatGeminiOrganizationApplicationDecisionError(error) ??
            '기관 신청 승인/반려 처리에 실패했습니다.\n잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setDecisionSubmitting(false)
      }
    },
    [refreshRows, remoteEnabled, selectedRows, showAlert]
  )

  const columns = useMemo<ColumnsType<GeminiInstitutionApplicationRow>>(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: COL.no,
        align: 'center',
      },
      {
        title: '신청 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: COL.institutionName,
        align: 'center',
      },
      {
        title: '기관 소재지',
        key: 'region',
        width: COL.region,
        align: 'center',
        render: (_: unknown, row) => toRegionText(row),
      },
      {
        title: '승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: COL.approvalStatus,
        align: 'center',
        render: (status: GeminiInstitutionApprovalStatus) => (
          <GeminiInstitutionApprovalStatusBadge status={status} />
        ),
      },
      {
        title: '강의 진행 희망 교육 날짜 및 시간',
        dataIndex: 'preferredLectureSchedule',
        key: 'preferredLectureSchedule',
        width: COL.schedule,
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
        width: COL.studentCount,
        align: 'center',
        render: (count: number) => `${count}명`,
      },
      {
        title: '담당 교사명',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: COL.teacherName,
        align: 'center',
      },
    ],
    []
  )

  const rejectTargets = selectedRows.filter(row => row.approvalStatus !== 'REJECTED')
  const approveTargets = selectedRows.filter(row => row.approvalStatus !== 'APPROVED')
  const rejectTargetCount = rejectTargets.length
  const approveTargetCount = approveTargets.length
  const rejectSubjectName = resolveDecisionSubjectName(rejectTargets[0])
  const approveSubjectName = resolveDecisionSubjectName(approveTargets[0])

  return (
    <>
      {awaitingRemoteRows ? (
        <div className="detail-fullpage-modal__loading" role="status" aria-label="상세 불러오는 중">
          <Spin size="large" />
        </div>
      ) : (
      <FilterTableLayout
        className="gemini-institution-application-tab"
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
        title="참여 기관 신청 목록"
        description={`총 ${(remoteQuery.data?.pages[0]?.totalElements ?? filteredRows.length).toLocaleString()}건`}
        excelExport={{
          columns,
          data: filteredRows,
          selectedRowKeys: canWrite ? selectedRowKeys : undefined,
          getRowKey: row => row.id,
        }}
        actions={
          canWrite ? (
            <div className="program-application-list-toolbar">
              <FilterTableToolbarButton
                variant="delete"
                disabled={rejectDisabled}
                onClick={handleBulkReject} >
                선택 반려
              </FilterTableToolbarButton>
              <FilterTableToolbarButton
                variant="secondary"
                disabled={approveDisabled}
                onClick={handleBulkApprove} >
                선택 승인
              </FilterTableToolbarButton>
            </div>
          ) : null
        }
      >
        <CmsDataTable<GeminiInstitutionApplicationRow>
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
                  onChange: keys => setSelectedRowKeys(keys),
                  preserveSelectedRowKeys: false,
                }
              : undefined
          }
        />
        {remoteQuery.isFetchingNextPage ? (
          <Spin size="small" aria-label="다음 기관 신청 불러오는 중" />
        ) : null}
        <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
      </FilterTableLayout>
      )}

      <ProgramApplicationRejectModal
        open={bulkRejectOpen}
        audience="institution"
        variant={rejectTargetCount > 1 ? 'bulk' : 'single'}
        subjectName={rejectSubjectName}
        selectionCount={rejectTargetCount}
        confirmLoading={decisionSubmitting}
        notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.timedBulk}
        notifyTimingOptions="two"
        onCancel={() => {
          if (decisionSubmitting) return
          setBulkRejectOpen(false)
        }}
        onConfirm={payload => {
          void confirmBulkReject(payload)
        }}
      />
      <GeminiInstitutionApproveModal
        open={bulkApproveOpen}
        subjectName={approveSubjectName}
        selectionCount={approveTargetCount}
        preferredScheduleBlocks={approveTargets[0]?.preferredScheduleBlocks}
        confirmLoading={decisionSubmitting}
        onCancel={() => {
          if (decisionSubmitting) return
          setBulkApproveOpen(false)
        }}
        onConfirm={payload => {
          void confirmBulkApprove(payload)
        }}
      />
    </>
  )
}
