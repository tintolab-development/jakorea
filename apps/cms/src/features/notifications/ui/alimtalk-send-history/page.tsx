import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { SEND_HISTORY_FILTER_FIELDS } from '@/features/notifications/model/alimtalk-send-history/filter-fields'
import {
  applySendHistoryFiltersToSearchParams,
  readSendHistoryFiltersFromParams,
} from '@/features/notifications/model/alimtalk-send-history/filter-url'
import type {
  AlimtalkSendHistoryPendingFilters,
  AlimtalkSendHistoryRow,
} from '@/features/notifications/model/alimtalk-send-history/types'
import { useAlimtalkSendHistoryDetailQuery, useAlimtalkSendHistoryQuery } from '@/features/notifications/hooks/use-alimtalk-send-history-query'
import { DetailModal } from './detail-modal'
import '@/pages/programs/program-list-page.css'
import './page.css'

/** 시안 기준 고정 폭 — 일시 컬럼은 YYYY.MM.DD HH:mm:ss 표시 폭 확보 */
const COL_W = {
  no: 80,
  requestAt: 180,
  templateName: 280,
  senderInfo: 120,
  receiverInfo: 160,
  broadcastTiming: 100,
  sendStatus: 120,
  receiveStatus: 120,
  sendAt: 180,
  receiveAt: 180,
  reservedAt: 180,
} as const

const TABLE_SCROLL_X = Object.values(COL_W).reduce((sum, width) => sum + width, 0)

const DATETIME_FORMAT = 'YYYY.MM.DD HH:mm:ss'

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format(DATETIME_FORMAT) : '-'
}

function formatReservedAt(value: string | null | undefined, timing: string): string {
  if (timing === '즉시' || !value) return '-'
  return formatDateTime(value)
}

export function Page() {
  const [searchParams, setSearchParams] = useSearchParams()
  const appliedFilters = useMemo(() => readSendHistoryFiltersFromParams(searchParams), [searchParams])
  const { data: rows = [], isLoading } = useAlimtalkSendHistoryQuery(searchParams)
  const [pendingFilters, setPendingFilters] = useState<AlimtalkSendHistoryPendingFilters>(appliedFilters)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  const selectedListRow = useMemo(
    () => rows.find(row => row.id === selectedRowId) ?? null,
    [rows, selectedRowId]
  )
  const detailQuery = useAlimtalkSendHistoryDetailQuery(selectedRowId, Boolean(selectedRowId))
  const selectedRow = detailQuery.data ?? selectedListRow

  useEffect(() => {
    setPendingFilters(appliedFilters)
  }, [appliedFilters])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setSearchParams(prev => applySendHistoryFiltersToSearchParams(prev, pendingFilters), { replace: true })
  }, [pendingFilters, setSearchParams])

  const columns = useMemo<ColumnsType<AlimtalkSendHistoryRow>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL_W.no,
        align: 'center',
        className: 'alimtalk-send-history-page__col-no',
        onHeaderCell: () => ({ className: 'alimtalk-send-history-page__col-no' }),
        render: (_: unknown, __: AlimtalkSendHistoryRow, index: number) => rows.length - index,
      },
      {
        title: '요청일시',
        dataIndex: 'requestAt',
        key: 'requestAt',
        width: COL_W.requestAt,
        align: 'center',
        className: 'alimtalk-send-history-page__col-datetime',
        onHeaderCell: () => ({ className: 'alimtalk-send-history-page__col-datetime' }),
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '템플릿명',
        dataIndex: 'templateName',
        key: 'templateName',
        width: COL_W.templateName,
        align: 'center',
        ellipsis: { showTitle: true },
        className: 'alimtalk-send-history-page__col-template-name',
        onHeaderCell: () => ({ className: 'alimtalk-send-history-page__col-template-name' }),
      },
      {
        title: '발신자 정보',
        dataIndex: 'senderInfo',
        key: 'senderInfo',
        width: COL_W.senderInfo,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '수신자 정보',
        dataIndex: 'receiverInfo',
        key: 'receiverInfo',
        width: COL_W.receiverInfo,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '발송 시점',
        dataIndex: 'broadcastTiming',
        key: 'broadcastTiming',
        width: COL_W.broadcastTiming,
        align: 'center',
      },
      {
        title: '발송 상태',
        dataIndex: 'sendStatus',
        key: 'sendStatus',
        width: COL_W.sendStatus,
        align: 'center',
      },
      {
        title: '수신 상태',
        dataIndex: 'receiveStatus',
        key: 'receiveStatus',
        width: COL_W.receiveStatus,
        align: 'center',
      },
      {
        title: '발송일시',
        dataIndex: 'sentAt',
        key: 'sentAt',
        width: COL_W.sendAt,
        align: 'center',
        className: 'alimtalk-send-history-page__col-datetime',
        onHeaderCell: () => ({ className: 'alimtalk-send-history-page__col-datetime' }),
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '수신일시',
        dataIndex: 'receivedAt',
        key: 'receivedAt',
        width: COL_W.receiveAt,
        align: 'center',
        className: 'alimtalk-send-history-page__col-datetime',
        onHeaderCell: () => ({ className: 'alimtalk-send-history-page__col-datetime' }),
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '예약일시',
        dataIndex: 'reservedAt',
        key: 'reservedAt',
        width: COL_W.reservedAt,
        align: 'center',
        className: 'alimtalk-send-history-page__col-datetime',
        onHeaderCell: () => ({ className: 'alimtalk-send-history-page__col-datetime' }),
        render: (value: string, row) => formatReservedAt(value, row.broadcastTiming),
      },
    ],
    [rows.length]
  )

  return (
    <>
      <FilterTableLayout
        className="alimtalk-send-history-page"
        bordered={false}
        filterResponsiveWrap
        mergedAutoFillInlineSearch
        hideExcelDownload
        fields={SEND_HISTORY_FILTER_FIELDS}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="알림톡 발송 조회"
        description={`총 ${rows.length.toLocaleString()}건`}
        contentLoading={isLoading}
      >
        <Table<AlimtalkSendHistoryRow>
          rowKey="id"
          className="cms-data-table cms-data-table--hoverable alimtalk-send-history-page__table"
          tableLayout="fixed"
          scroll={{ x: TABLE_SCROLL_X }}
          columns={columns}
          dataSource={rows}
          pagination={false}
          onRow={record => ({
            className: 'alimtalk-send-history-page__row',
            onClick: () => setSelectedRowId(record.id),
          })}
        />
      </FilterTableLayout>
      <DetailModal
        open={selectedRowId != null}
        row={selectedRow}
        onClose={() => setSelectedRowId(null)}
      />
    </>
  )
}
