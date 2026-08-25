import { useState, useMemo, useCallback } from 'react'
import { Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CalendarOutlined,
  UnorderedListOutlined,
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { Button } from 'antd'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { TableFilterGroup, type FilterFieldConfig } from '@/shared/components/table-filter-group'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { CmsButton } from '@/shared/ui/cms-button'
import { ExcelButton } from '@/shared/ui/excel-button'
import {
  INSTRUCTOR_SETTLEMENT_FILTER_STATUS_OPTIONS,
  getInstructorSettlementStatusLabel,
  isInstructorSettlementEligibleForPaymentStatementIssue,
} from '@/shared/constants/instructor-settlement-status'
import type { InstructorSettlementListRow } from '@/features/user/detail/model/instructor-settlement-types'
import {
  filterRowsByMonth,
  summarizeSettlementRows,
  rowsToCalendarEvents,
} from '@/features/user/detail/lib/instructor-settlement-list-utils'
import { useMemberInstructorSettlementsQuery } from '@/features/user/api/instructor-member-settlements-remote'
import { mapSettlementsToInstructorMemberRows } from '@/features/user/api/map-settlement-to-instructor-member-row'
import {
  isMemberInstructorSettlementsRemoteEnabled,
} from '@/features/user/api/member-remote-capabilities'
import {
  bulkDownloadPaymentStatementsRemote,
  downloadPaymentStatementRemote,
  fetchAllPaymentStatementsRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import { downloadFromBulkEndpoint } from '@/features/user/api/download-bulk-endpoint'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import { InstructorInvoiceModal } from './modal/instructor-invoice-modal'
import { InstructorPaymentStatementBlockedModal } from './modal/instructor-payment-statement-blocked-modal'
import {
  InstructorSettlementCalendarView,
  type SettlementCalendarEvent,
} from './instructor-settlement-calendar'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-list.css'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import '@/shared/components/filter-table-layout.css'
import './instructor-payment-tab.css'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'

const SETTLEMENT_STATUS_OPTIONS = INSTRUCTOR_SETTLEMENT_FILTER_STATUS_OPTIONS.map(option => ({
  label: option.label,
  value: option.value,
}))

const FILTER_FIELDS: FilterFieldConfig[] = [
  {
    key: 'programName',
    type: 'search',
    label: '프로그램명',
    placeholder: '프로그램명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'institutionName',
    type: 'search',
    label: '참여 기관명',
    placeholder: '기관명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'settlementStatus',
    type: 'select',
    label: '정산 현황',
    placeholder: '전체',
    options: SETTLEMENT_STATUS_OPTIONS,
    allowClear: true,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
]

export interface InstructorPaymentTabProps {
  instructorUserId: string
  instructorName: string
  instructorMemberId?: number
}

export function InstructorPaymentTab({
  instructorUserId: _instructorUserId,
  instructorName: _instructorName,
  instructorMemberId,
}: InstructorPaymentTabProps) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const settlementsRemote = isMemberInstructorSettlementsRemoteEnabled()

  const [pendingFilters, setPendingFilters] = useState<Record<string, unknown>>({
    programName: '',
    institutionName: '',
    settlementStatus: 'all',
  })
  const [appliedFilters, setAppliedFilters] = useState(pendingFilters)
  const [currentMonth, setCurrentMonth] = useState(() => dayjs().startOf('month'))
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(() => dayjs())
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [invoiceData, setInvoiceData] = useState<InstructorSettlementListRow | null>(null)
  const [bulkDownloadLoading, setBulkDownloadLoading] = useState(false)
  const [paymentStatementBlockedModal, setPaymentStatementBlockedModal] = useState<{
    open: boolean
    variant: 'single' | 'multi'
    selectedCount: number
  }>({ open: false, variant: 'single', selectedCount: 0 })

  const { data: remoteSettlementItems = [], isLoading: settlementsLoading } =
    useMemberInstructorSettlementsQuery(instructorMemberId, settlementsRemote)

  const { data: statementIdBySettlementId = new Map<number, number>() } = useQuery({
    queryKey: ['instructor-settlement-statement-join', instructorMemberId],
    enabled: settlementsRemote && instructorMemberId != null,
    queryFn: async () => {
      const statements = await fetchAllPaymentStatementsRemote()
      const map = new Map<number, number>()
      for (const statement of statements) {
        if (statement.settlementId != null && statement.statementId != null) {
          map.set(statement.settlementId, statement.statementId)
        }
      }
      return map
    },
  })

  const baseRows = useMemo(() => {
    if (!settlementsRemote || instructorMemberId == null) return []
    return mapSettlementsToInstructorMemberRows(remoteSettlementItems, statementIdBySettlementId)
  }, [
    settlementsRemote,
    instructorMemberId,
    remoteSettlementItems,
    statementIdBySettlementId,
  ])

  const monthRows = useMemo(
    () => filterRowsByMonth(baseRows, currentMonth),
    [baseRows, currentMonth]
  )

  const filteredRows = useMemo(() => {
    const programName = String(appliedFilters.programName ?? '')
      .trim()
      .toLowerCase()
    const institutionName = String(appliedFilters.institutionName ?? '')
      .trim()
      .toLowerCase()
    const status = appliedFilters.settlementStatus as string | undefined
    return monthRows.filter(r => {
      if (programName && !r.programName.toLowerCase().includes(programName)) return false
      if (institutionName && !r.institutionName.toLowerCase().includes(institutionName))
        return false
      if (status && status !== 'all' && r.status !== status) return false
      return true
    })
  }, [monthRows, appliedFilters])

  const summary = useMemo(
    () => summarizeSettlementRows(filteredRows, { allRowsForTotal: baseRows }),
    [filteredRows, baseRows]
  )

  const calendarEvents: SettlementCalendarEvent[] = useMemo(
    () => rowsToCalendarEvents(filteredRows),
    [filteredRows]
  )

  const invalidateSettlements = useCallback(async () => {
    if (instructorMemberId == null) return
    await queryClient.invalidateQueries({
      queryKey: memberQueryKeys.instructorSettlements(instructorMemberId),
    })
  }, [instructorMemberId, queryClient])

  const openInvoice = useCallback((row: InstructorSettlementListRow) => {
    if (row.status === 'none') return
    setInvoiceData(row)
    setInvoiceOpen(true)
  }, [])

  const handleBulkDownload = useCallback(async () => {
    if (!settlementsRemote) return
    const selected = baseRows.filter(row => selectedRowKeys.includes(row.id))
    if (selected.length === 0) {
      showAlert({ title: '안내', content: '지급조서를 발급할 정산 건을 선택해 주세요.' })
      return
    }

    const ineligible = selected.filter(
      row => !isInstructorSettlementEligibleForPaymentStatementIssue(row.status)
    )
    if (ineligible.length > 0) {
      setPaymentStatementBlockedModal({
        open: true,
        variant: selected.length === 1 ? 'single' : 'multi',
        selectedCount: selected.length,
      })
      return
    }

    setBulkDownloadLoading(true)
    try {
      const settlementIds = selected.map(row => row.settlementId)
      try {
        const response = await bulkDownloadPaymentStatementsRemote({ settlementIds })
        if (response.downloadEndpoint) {
          await downloadFromBulkEndpoint(response.downloadEndpoint, '지급조서_일괄')
          return
        }
      } catch {
        // bulk-download 미구현 시 단건 download fallback
      }

      for (const settlementId of settlementIds) {
        const doc = await downloadPaymentStatementRemote(settlementId)
        if (doc.downloadUrl) {
          await downloadFromBulkEndpoint(doc.downloadUrl, `지급조서_${settlementId}`, 'pdf')
        }
      }
    } catch (error) {
      showAlert({
        title: '안내',
        content: getSettlementApiErrorMessage(error, '지급조서 일괄 발급에 실패했습니다.'),
      })
    } finally {
      setBulkDownloadLoading(false)
    }
  }, [baseRows, selectedRowKeys, settlementsRemote, showAlert])

  const columns: ColumnsType<InstructorSettlementListRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', align: 'center' },
      { title: '프로그램명', dataIndex: 'programName', key: 'programName' },
      { title: '참여 기관명', dataIndex: 'institutionName', key: 'institutionName' },
      {
        title: '교육 진행 일자',
        dataIndex: 'lectureDateDisplay',
        key: 'lectureDateDisplay',
        minWidth: 250,
      },
      {
        title: '정산 현황',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        minWidth: 180,
        render: (status: InstructorSettlementListRow['status']) => (
          <div className="instructor-payment-tab__settlement-status-cell">
            <InstructorSettlementStatusText status={status} />
          </div>
        ),
      },
      {
        title: '정산 신청 금액',
        dataIndex: 'scheduledAmount',
        key: 'scheduledAmount',
        align: 'center',
        render: (v: number) => `${v.toLocaleString()}원`,
      },
      {
        title: '산출 내역',
        key: 'detail',
        align: 'center',
        render: (_: unknown, record) => (
          <div className="instructor-payment-tab__detail-action-cell">
            <CmsButton
              variant="default"
              size="medium"
              disabled={record.status === 'none'}
              onClick={() => openInvoice(record)}
            >
              상세 보기
            </CmsButton>
          </div>
        ),
      },
    ],
    [openInvoice]
  )

  const excelExportColumns: ColumnsType<InstructorSettlementListRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no' },
      { title: '프로그램명', dataIndex: 'programName', key: 'programName' },
      { title: '참여 기관명', dataIndex: 'institutionName', key: 'institutionName' },
      { title: '교육 진행 일자', dataIndex: 'lectureDateDisplay', key: 'lectureDateDisplay' },
      {
        title: '정산 현황',
        key: 'status',
        render: (_: unknown, row) => getInstructorSettlementStatusLabel(row.status),
      },
      {
        title: '정산 신청 금액',
        key: 'scheduledAmount',
        render: (_: unknown, row) => `${row.scheduledAmount.toLocaleString()}원`,
      },
    ],
    []
  )

  const excelFilename = useMemo(() => {
    const name = (_instructorName.trim() || '강사').replace(/[\\/:*?"<>|]/g, '')
    return `정산현황_${name}_${currentMonth.format('YYYY-MM')}`
  }, [_instructorName, currentMonth])

  const { exportExcel, isExporting: excelExporting } = useTableExcelExport({
    columns: excelExportColumns,
    data: filteredRows,
    filename: excelFilename,
  })

  const handleSearch = () => {
    setAppliedFilters({ ...pendingFilters })
  }

  return (
    <div
      className={[
        'instructor-payment-tab',
        viewMode === 'calendar' ? 'instructor-payment-tab--calendar-fill' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Spin spinning={settlementsLoading || bulkDownloadLoading || excelExporting}>
        <TableFilterGroup
          fields={FILTER_FIELDS}
          filters={pendingFilters}
          onFilterChange={(key, value) =>
            setPendingFilters(prev => ({
              ...prev,
              [key]: value,
            }))
          }
          onSearch={handleSearch}
          bordered={false}
          cardStyle={{
            padding: 0,
            marginBottom: 0,
            background: 'transparent',
          }}
        />

        <div className="filter-table-layout__divider" role="separator" aria-hidden />

        <div className="instructor-payment-tab__toolbar">
          <div className="instructor-payment-tab__month-nav">
            <span className="instructor-payment-tab__month-label">
              {currentMonth.format('YYYY. MM')}
            </span>
            <div className="calendar-nav">
              <Button type="text" size="small" icon={<LeftOutlined />} className="calendar-nav-btn" onClick={() => setCurrentMonth(prev => prev.subtract(1, 'month'))} />
              <Button type="text" size="small" icon={<RightOutlined />} className="calendar-nav-btn" onClick={() => setCurrentMonth(prev => prev.add(1, 'month'))} />
            </div>
          </div>
          <div className="instructor-payment-tab__toolbar-actions">
            {viewMode === 'list' ? (
              <CmsButton
                variant="secondary"
                size="large"
                width="auto"
                style={{ minWidth: 180 }}
                icon={<CalendarOutlined />}
                onClick={() => {
                  const today = dayjs()
                  setCurrentMonth(today.startOf('month'))
                  setCalendarSelectedDate(today)
                  setViewMode('calendar')
                }}
              >
                캘린더 뷰로 보기
              </CmsButton>
            ) : (
              <CmsButton
                variant="secondary"
                size="large"
                width="auto"
                style={{ minWidth: 180 }}
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode('list')}
              >
                리스트 뷰로 보기
              </CmsButton>
            )}
            <CmsButton
              variant="primary"
              size="large"
              width="auto"
              style={{ minWidth: 180 }}
              icon={<DownloadOutlined />}
              loading={bulkDownloadLoading}
              onClick={() => void handleBulkDownload()}
            >
              지급조서 발급
            </CmsButton>
            <ExcelButton
              loading={excelExporting}
              disabled={settlementsLoading}
              onClick={() => void exportExcel()}
            />
          </div>
        </div>

        <div className="instructor-payment-tab__summary-row">
          <div className="instructor-payment-tab__summary-card">
            <span className="instructor-payment-tab__summary-label">총 정산 완료금</span>
            <span className="instructor-payment-tab__summary-value">
              {summary.totalCompleted.toLocaleString()} <span style={{ fontSize: 18 }}>원</span>
            </span>
          </div>
          <div className="instructor-payment-tab__summary-card">
            <span className="instructor-payment-tab__summary-label">
              {currentMonth.format('M')}월 정산 완료금
            </span>
            <span className="instructor-payment-tab__summary-value">
              {summary.monthCompleted.toLocaleString()} <span style={{ fontSize: 18 }}>원</span>
            </span>
          </div>
          <div className="instructor-payment-tab__summary-card">
            <span className="instructor-payment-tab__summary-label">
              {currentMonth.format('M')}월 정산 예정금
            </span>
            <span className="instructor-payment-tab__summary-value instructor-payment-tab__summary-value--mint">
              {summary.scheduled.toLocaleString()} <span style={{ fontSize: 18 }}>원</span>
            </span>
          </div>
        </div>

        <div className="instructor-payment-tab__content">
          {viewMode === 'list' ? (
            <Table<InstructorSettlementListRow>
              rowKey="id"
              columns={columns}
              dataSource={filteredRows}
              pagination={false}
              scroll={{ x: 'max-content' }}
              className="cms-data-table cms-data-table--fluid"
              rowSelection={{
                columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys),
              }}
            />
          ) : (
            <div className="instructor-payment-tab__calendar-view-container instructor-payment-tab__calendar-view-container--no-inner-scroll">
              <InstructorSettlementCalendarView
                events={calendarEvents}
                currentMonth={currentMonth}
                onDisplayMonthChange={setCurrentMonth}
                selectedDate={calendarSelectedDate}
                onSelectedDateChange={setCalendarSelectedDate}
                selectedRowKeys={selectedRowKeys}
                onSelectionChange={setSelectedRowKeys}
                onSettlementClick={openInvoice}
              />
            </div>
          )}
        </div>

        <InstructorInvoiceModal
          open={invoiceOpen}
          onClose={() => {
            setInvoiceOpen(false)
            setInvoiceData(null)
          }}
          row={invoiceData}
          instructorNameKo={invoiceData?.instructorName?.trim() || _instructorName.trim() || '강사'}
          onSettlementUpdated={() => void invalidateSettlements()}
        />

        <InstructorPaymentStatementBlockedModal
          open={paymentStatementBlockedModal.open}
          onClose={() => setPaymentStatementBlockedModal(prev => ({ ...prev, open: false }))}
          variant={paymentStatementBlockedModal.variant}
          selectedCount={paymentStatementBlockedModal.selectedCount}
        />
      </Spin>
    </div>
  )
}
