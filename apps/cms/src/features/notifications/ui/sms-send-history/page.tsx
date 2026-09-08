import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { SMS_SEND_HISTORY_FILTER_FIELDS } from '@/features/notifications/model/sms-send-history/filter-fields'
import {
  applySmsSendHistoryFiltersToSearchParams,
  readSmsSendHistoryFiltersFromParams,
} from '@/features/notifications/model/sms-send-history/filter-url'
import type {
  SmsSendHistoryPendingFilters,
  SmsSendHistoryRow,
} from '@/features/notifications/model/sms-send-history/types'
import {
  useSmsSendHistoryDetailQuery,
  useSmsSendHistoryQuery,
} from '@/features/notifications/hooks/use-sms-send-history-query'
import { DetailModal } from './detail-modal'
import '@/pages/programs/program-list-page.css'
import '@/features/notifications/ui/alimtalk-send-history/page.css'
import './page.css'

const COL_W = {
  no: 80,
  requestAt: 180,
  content: 280,
  senderInfo: 160,
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

export function SmsSendHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const appliedFilters = useMemo(
    () => readSmsSendHistoryFiltersFromParams(searchParams),
    [searchParams]
  )
  const { data: rows = [], isLoading } = useSmsSendHistoryQuery(searchParams)
  const [pendingFilters, setPendingFilters] =
    useState<SmsSendHistoryPendingFilters>(appliedFilters)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  const selectedListRow = useMemo(
    () => rows.find(row => row.id === selectedRowId) ?? null,
    [rows, selectedRowId]
  )
  const detailQuery = useSmsSendHistoryDetailQuery(selectedRowId, Boolean(selectedRowId))
  const detailLoading = Boolean(selectedRowId) && detailQuery.isLoading && !detailQuery.data
  const selectedRow = detailQuery.data ?? (detailLoading ? null : selectedListRow)

  useEffect(() => {
    setPendingFilters(appliedFilters)
  }, [appliedFilters])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setSearchParams(
      prev => applySmsSendHistoryFiltersToSearchParams(prev, pendingFilters),
      { replace: true }
    )
  }, [pendingFilters, setSearchParams])

  const columns = useMemo<ColumnsType<SmsSendHistoryRow>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL_W.no,
        align: 'center',
        render: (_: unknown, __: SmsSendHistoryRow, index: number) => rows.length - index,
      },
      {
        title: '요청일시',
        dataIndex: 'requestAt',
        key: 'requestAt',
        width: COL_W.requestAt,
        align: 'center',
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '문자 내용',
        dataIndex: 'content',
        key: 'content',
        width: COL_W.content,
        align: 'center',
        ellipsis: { showTitle: true },
        render: (value: string) => value?.trim() || '-',
      },
      {
        title: '발신자 정보',
        dataIndex: 'senderInfo',
        key: 'senderInfo',
        width: COL_W.senderInfo,
        align: 'center',
        ellipsis: true,
        render: (value: string) => value?.trim() || '-',
      },
      {
        title: '수신자 정보',
        dataIndex: 'receiverInfo',
        key: 'receiverInfo',
        width: COL_W.receiverInfo,
        align: 'center',
        ellipsis: true,
        render: (value: string) => value?.trim() || '-',
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
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '수신일시',
        dataIndex: 'receivedAt',
        key: 'receivedAt',
        width: COL_W.receiveAt,
        align: 'center',
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '예약일시',
        dataIndex: 'reservedAt',
        key: 'reservedAt',
        width: COL_W.reservedAt,
        align: 'center',
        render: (value: string, row) => formatReservedAt(value, row.broadcastTiming),
      },
    ],
    [rows.length]
  )

  return (
    <>
      <FilterTableLayout
        className="sms-send-history-page alimtalk-send-history-page"
        bordered={false}
        filterResponsiveWrap
        mergedAutoFillInlineSearch
        hideExcelDownload
        fields={SMS_SEND_HISTORY_FILTER_FIELDS}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="문자 발송 조회"
        description={`총 ${rows.length.toLocaleString()}건`}
        contentLoading={isLoading}
      >
        <Table<SmsSendHistoryRow>
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
        loading={detailLoading}
        onClose={() => setSelectedRowId(null)}
      />
    </>
  )
}
