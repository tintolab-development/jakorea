/**
 * 정산 관리 > 지급조서 확인 — 프로그램 행 클릭 시 지급 현황 상세 풀페이지 모달
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import {
  DetailModalSidebar,
  type DetailModalSidebarNavItem,
} from '@/shared/ui/detail-modal-sidebar'
import { AppButton } from '@/shared/ui/app-button'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { PaymentOrderLineProcessingStatusBadge } from '@/shared/components/payment-order-line-processing-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import {
  getMockPaymentOrderCalculationStatementFromProgramDetailPage,
  getMockPaymentOrderProgramDetail,
  PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS,
  PAYMENT_ORDER_ADMIN_STATUS_LABELS,
  type PaymentOrderAdminLineProcessingStatus,
  type PaymentOrderAdminProcessingStatus,
  type PaymentOrderAdminProgramDetailInstructorRow,
  type PaymentOrderAdminProgramRow,
  type PaymentOrderProgramCalculationStatement,
} from '@/data/mock/payment-order-admin-list'
import '@/features/program/ui/detail-modal/program-status/program-status-participating-shared.css'
import { PaymentOrderStatusDetailLnbIcon } from './payment-order-status-detail-lnb-icon'
import { PaymentOrderProgramCalculationStatementModal } from './payment-order-program-calculation-statement-modal'
import './payment-order-program-status-detail-fullpage-modal.css'

const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'] as const

const LINE_STATUS_OPTIONS: readonly PaymentOrderAdminLineProcessingStatus[] = [
  'pending',
  'confirmed',
  'correction',
  'rejected',
]

type AppliedLineStatus = 'all' | PaymentOrderAdminLineProcessingStatus

interface DetailAppliedFilters {
  instructorName: string
  institutionName: string
  status: AppliedLineStatus
  dateRange: [Dayjs, Dayjs] | null
}

const defaultDateRange: [Dayjs, Dayjs] = [dayjs('2025-08-01'), dayjs('2026-06-30')]

const lineStatusSelectOptions: { value: AppliedLineStatus; label: string }[] = [
  { value: 'all', label: '전체' },
  ...(
    Object.keys(PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS) as PaymentOrderAdminLineProcessingStatus[]
  ).map(key => ({
    value: key,
    label: PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS[key],
  })),
]

function formatKoreanDateWithWeekday(iso: string): string {
  const x = dayjs(iso)
  return `${x.format('YYYY. MM. DD')}(${KO_DOW[x.day()]})`
}

function formatLectureCell(iso: string, sessionOrdinal: number): string {
  return `${formatKoreanDateWithWeekday(iso)} | ${sessionOrdinal}차시`
}

function matchesDateRange(iso: string, range: [Dayjs, Dayjs] | null): boolean {
  if (!range?.[0] || !range?.[1]) return true
  const d = dayjs(iso)
  return !d.isBefore(range[0], 'day') && !d.isAfter(range[1], 'day')
}

/** 라인 상태로 기본정보의 지급조서 처리 현황(집계) 유도 — 일부 확인 완료 없음, 혼재 시 제출 및 대기 */
function deriveAggregateFromLines(
  statuses: PaymentOrderAdminLineProcessingStatus[]
): PaymentOrderAdminProcessingStatus {
  if (statuses.length === 0) return 'pending'
  if (statuses.some(s => s === 'correction')) return 'correction'
  if (statuses.every(s => s === 'confirmed')) return 'confirmed'
  if (statuses.every(s => s === 'rejected')) return 'rejected'
  if (statuses.every(s => s === 'pending')) return 'pending'
  return 'pending'
}

function filterInstructorDetailRows(
  rows: PaymentOrderAdminProgramDetailInstructorRow[],
  applied: DetailAppliedFilters
): PaymentOrderAdminProgramDetailInstructorRow[] {
  const qInstructor = applied.instructorName.trim()
  const qInstitution = applied.institutionName.trim()
  return rows.filter(row => {
    if (qInstructor && !row.instructorName.includes(qInstructor)) return false
    if (qInstitution && !row.institutionName.includes(qInstitution)) return false
    if (applied.status !== 'all' && row.processingStatus !== applied.status) return false
    if (!matchesDateRange(row.lectureDate, applied.dateRange)) return false
    return true
  })
}

function renderAggregateStatus(status: PaymentOrderAdminProcessingStatus) {
  return (
    <span
      className={`payment-order-admin__status-text payment-order-admin__status-text--${status}`}
    >
      {PAYMENT_ORDER_ADMIN_STATUS_LABELS[status]}
    </span>
  )
}

function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

export interface PaymentOrderProgramStatusDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  programRow: PaymentOrderAdminProgramRow | null
}

export function PaymentOrderProgramStatusDetailFullPageModal({
  open,
  onClose,
  programRow,
}: PaymentOrderProgramStatusDetailFullPageModalProps) {
  const [draftInstructorName, setDraftInstructorName] = useState('')
  const [draftInstitutionName, setDraftInstitutionName] = useState('')
  const [draftStatus, setDraftStatus] = useState<AppliedLineStatus>('all')
  const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs] | null>(defaultDateRange)
  const [applied, setApplied] = useState<DetailAppliedFilters>({
    instructorName: '',
    institutionName: '',
    status: 'all',
    dateRange: defaultDateRange,
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [instructorRowsState, setInstructorRowsState] = useState<
    PaymentOrderAdminProgramDetailInstructorRow[]
  >([])
  const [openStatusRowId, setOpenStatusRowId] = useState<string | null>(null)
  const [calcStatementOpen, setCalcStatementOpen] = useState(false)
  const [calcStatementData, setCalcStatementData] =
    useState<PaymentOrderProgramCalculationStatement | null>(null)

  const detail = useMemo(
    () => (programRow ? getMockPaymentOrderProgramDetail(programRow) : null),
    [programRow]
  )

  useEffect(() => {
    if (open && programRow) {
      setDraftInstructorName('')
      setDraftInstitutionName('')
      setDraftStatus('all')
      setDraftDateRange(defaultDateRange)
      setApplied({
        instructorName: '',
        institutionName: '',
        status: 'all',
        dateRange: defaultDateRange,
      })
      setSelectedRowKeys([])
      const d = getMockPaymentOrderProgramDetail(programRow)
      setInstructorRowsState(d.instructorRows.map(r => ({ ...r })))
      setOpenStatusRowId(null)
      setCalcStatementOpen(false)
      setCalcStatementData(null)
    }
  }, [open, programRow?.no])

  const handleSearch = useCallback(() => {
    setApplied({
      instructorName: draftInstructorName.trim(),
      institutionName: draftInstitutionName.trim(),
      status: draftStatus,
      dateRange: draftDateRange,
    })
  }, [draftDateRange, draftInstitutionName, draftInstructorName, draftStatus])

  const aggregateStatus = useMemo(
    () => deriveAggregateFromLines(instructorRowsState.map(r => r.processingStatus)),
    [instructorRowsState]
  )

  const filteredRows = useMemo(
    () => filterInstructorDetailRows(instructorRowsState, applied),
    [instructorRowsState, applied]
  )

  const sidebarItems = useMemo<DetailModalSidebarNavItem[]>(
    () => [
      {
        key: 'payment-status-detail',
        label: '지급 현황 상세',
        icon: <PaymentOrderStatusDetailLnbIcon className="detail-fullpage-modal__lnb-icon" />,
      },
    ],
    []
  )

  const openCalculationStatement = useCallback(
    (row: PaymentOrderAdminProgramDetailInstructorRow) => {
      if (!programRow || !detail) return
      setCalcStatementData(
        getMockPaymentOrderCalculationStatementFromProgramDetailPage(programRow, detail, row)
      )
      setCalcStatementOpen(true)
    },
    [detail, programRow]
  )

  const columns: ColumnsType<PaymentOrderAdminProgramDetailInstructorRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 64,
        align: 'center',
      },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        ellipsis: { showTitle: true },
        width: 120,
        align: 'center',
      },
      {
        title: '참여 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        ellipsis: { showTitle: true },
        width: 160,
        align: 'center',
      },
      {
        title: '강의 진행 일자',
        key: 'lecture',
        width: 220,
        align: 'center',
        render: (_: unknown, row: PaymentOrderAdminProgramDetailInstructorRow) =>
          formatLectureCell(row.lectureDate, row.sessionOrdinal),
      },
      {
        title: '지급 조서 처리 현황',
        key: 'processingStatus',
        width: 160,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (_: unknown, row: PaymentOrderAdminProgramDetailInstructorRow) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<PaymentOrderAdminLineProcessingStatus>
              status={row.processingStatus}
              statusOptions={LINE_STATUS_OPTIONS}
              renderBadge={s => <PaymentOrderLineProcessingStatusBadge status={s} />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={newStatus => {
                setInstructorRowsState(prev =>
                  prev.map(r => (r.id === row.id ? { ...r, processingStatus: newStatus } : r))
                )
              }}
              isOpen={openStatusRowId === row.id}
              onOpenChange={isOpen => setOpenStatusRowId(isOpen ? row.id : null)}
            />
          </div>
        ),
      },
      {
        title: '정산 예정 금액',
        dataIndex: 'estimatedAmount',
        key: 'estimatedAmount',
        width: 140,
        align: 'center',
        render: (amount: number, row: PaymentOrderAdminProgramDetailInstructorRow) =>
          row.processingStatus === 'rejected' ? '-' : formatWon(amount),
      },
      {
        title: '산출 내역',
        key: 'breakdown',
        width: 196,
        align: 'center',
        render: (_: unknown, row: PaymentOrderAdminProgramDetailInstructorRow) => (
          <AppButton
            variant="default"
            size="small"
            className="payment-order-program-status-detail__detail-btn"
            onClick={e => {
              e.stopPropagation()
              openCalculationStatement(row)
            }}
          >
            상세 보기
          </AppButton>
        ),
      },
    ],
    [openCalculationStatement, openStatusRowId]
  )

  if (!open || !programRow || !detail) {
    return null
  }

  const businessPeriodLabel = `${formatKoreanDateWithWeekday(detail.businessPeriodStart)} ~ ${formatKoreanDateWithWeekday(detail.businessPeriodEnd)}`
  const sessionLabel = `${detail.sessionCompleted} / ${detail.sessionTotal}`

  return (
    <>
      <PaymentOrderProgramCalculationStatementModal
        open={calcStatementOpen}
        onCancel={() => {
          setCalcStatementOpen(false)
          setCalcStatementData(null)
        }}
        data={calcStatementData}
      />
      <DetailFullPageModal
        open={open}
        onClose={() => {
          setCalcStatementOpen(false)
          setCalcStatementData(null)
          onClose()
        }}
        title={`지급 현황 상세_${detail.programName}`}
        className="payment-order-program-status-detail-fullpage-modal"
        sidebar={
          <DetailModalSidebar
            navAriaLabel="지급 현황 상세 메뉴"
            items={sidebarItems}
            activeKey="payment-status-detail"
            activeChildKey=""
            expandedGroupKeys={[]}
            onSelectTop={() => {}}
            onSelectChild={() => {}}
          />
        }
      >
        <div className="payment-order-program-status-detail__root participating-institutions-section">
          <div className="payment-order-program-status-detail__basic-block program-detail-fullpage-modal__info-tab-block">
            <h3 className="program-detail-info-tab__section-title">기본 정보</h3>
            <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
              <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
                <colgroup>
                  <col style={{ width: '200px' }} />
                  <col />
                  <col style={{ width: '200px' }} />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th>프로그램명</th>
                    <td>{detail.programName}</td>
                    <th>사업 운영 기간</th>
                    <td>{businessPeriodLabel}</td>
                  </tr>
                  <tr>
                    <th>프로그램 진행 회차</th>
                    <td>{sessionLabel}</td>
                    <th>지급 조서 처리 현황</th>
                    <td>{renderAggregateStatus(aggregateStatus)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="payment-order-program-status-detail__filters">
            <UnifiedFilterCard
              bordered={false}
              cardStyle={{ marginBottom: 0 }}
              fields={[
                {
                  key: 'instructorName',
                  type: 'search',
                  label: '강사명',
                  placeholder: '강사명을 입력하세요',
                  flex: '1 1 0',
                },
                {
                  key: 'institutionName',
                  type: 'search',
                  label: '참여 기관명',
                  placeholder: '기관명을 입력하세요',
                  flex: '1 1 0',
                },
                {
                  key: 'status',
                  type: 'select',
                  label: '지급조서 처리 현황',
                  placeholder: '전체',
                  options: lineStatusSelectOptions.filter(o => o.value !== 'all'),
                  allowClear: true,
                  flex: '1 1 0',
                },
                {
                  key: 'dateRange',
                  type: 'dateRange',
                  label: '기간',
                  flex: '1 1 0',
                },
              ]}
              filters={{
                instructorName: draftInstructorName,
                institutionName: draftInstitutionName,
                status: draftStatus === 'all' ? undefined : draftStatus,
                dateRange: draftDateRange,
              }}
              onFilterChange={(key, value) => {
                if (key === 'instructorName') {
                  setDraftInstructorName(value as string)
                  return
                }
                if (key === 'institutionName') {
                  setDraftInstitutionName(value as string)
                  return
                }
                if (key === 'status') {
                  setDraftStatus((value ?? 'all') as AppliedLineStatus)
                  return
                }
                if (key === 'dateRange') {
                  setDraftDateRange(value as [Dayjs, Dayjs] | null)
                }
              }}
              onSearch={handleSearch}
            />
          </div>

          <div className="participating-institutions-section__divider payment-order-program-status-detail__section-divider" />

          <div className="payment-order-program-status-detail__below-divider participating-institutions-section__below-divider">
            <div className="participating-institutions-section__table-header">
              <div className="participating-institutions-section__table-heading">
                <span className="participating-institutions-section__table-title">
                  강사 별 정산 목록
                </span>
                <span className="participating-institutions-section__table-description">
                  총 {filteredRows.length}건
                </span>
              </div>
              <div className="participating-institutions-section__table-actions">
                <AppButton
                  variant="cancel"
                  size="filter-wide"
                  disabled={selectedRowKeys.length === 0}
                  onClick={() => message.info('일괄 확인은 추후 연결됩니다.')}
                >
                  일괄 확인
                </AppButton>
                <AppButton
                  variant="primary"
                  size="filter-wide"
                  icon={<DownloadOutlined />}
                  onClick={() => message.info('지급조서 다운로드는 추후 연결됩니다.')}
                >
                  지급조서 다운로드
                </AppButton>
              </div>
            </div>

            <div className="payment-order-program-status-detail__table-wrap participating-institutions-section__table-wrap">
              <Table<PaymentOrderAdminProgramDetailInstructorRow>
                className="cms-data-table cms-data-table--fluid"
                rowKey="id"
                columns={columns}
                dataSource={filteredRows}
                pagination={false}
                rowSelection={{
                  selectedRowKeys,
                  onChange: keys => setSelectedRowKeys(keys),
                }}
              />
            </div>
          </div>
        </div>
      </DetailFullPageModal>
    </>
  )
}
