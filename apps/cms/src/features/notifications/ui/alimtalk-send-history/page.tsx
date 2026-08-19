import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Spin, Table } from 'antd'
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
import { useAlimtalkSendHistoryQuery } from '@/features/notifications/hooks/use-alimtalk-send-history-query'
import { DetailModal } from './detail-modal'
import '@/pages/programs/program-list-page.css'
import './page.css'

const COL_W = {
  no: 70,
  requestAt: 200,
  templateName: 436,
  senderInfo: 280,
  receiverInfo: 280,
  broadcastTiming: 100,
  sendStatus: 120,
  receiveStatus: 120,
  sendAt: 200,
  receiveAt: 200,
  reservedAt: 200,
} as const

const TABLE_SCROLL_X = Object.values(COL_W).reduce((sum, width) => sum + width, 0)

export function Page() {
  const [searchParams, setSearchParams] = useSearchParams()
  const appliedFilters = useMemo(() => readSendHistoryFiltersFromParams(searchParams), [searchParams])
  const { data: rows = [], isLoading } = useAlimtalkSendHistoryQuery(searchParams)
  const [pendingFilters, setPendingFilters] = useState<AlimtalkSendHistoryPendingFilters>(appliedFilters)
  const [selectedRow, setSelectedRow] = useState<AlimtalkSendHistoryRow | null>(null)

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
        render: (_: unknown, __: AlimtalkSendHistoryRow, index: number) => rows.length - index,
      },
      {
        title: '요청 일시',
        dataIndex: 'requestAt',
        key: 'requestAt',
        width: COL_W.requestAt,
        align: 'center',
        render: (value: string) => dayjs(value).format('YYYY.MM.DD HH:mm'),
      },
      {
        title: '템플릿명',
        dataIndex: 'templateName',
        key: 'templateName',
        width: COL_W.templateName,
        align: 'center',
        className: 'alimtalk-send-history-page__col-template-name',
        render: (value: string) => (
          <span className="alimtalk-send-history-page__template-name-text">{value}</span>
        ),
      },
      {
        title: '발신자 정보',
        dataIndex: 'senderInfo',
        key: 'senderInfo',
        width: COL_W.senderInfo,
        align: 'center',
      },
      {
        title: '수신자 정보',
        dataIndex: 'receiverInfo',
        key: 'receiverInfo',
        width: COL_W.receiverInfo,
        align: 'center',
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
        title: '발송 일시',
        dataIndex: 'sentAt',
        key: 'sentAt',
        width: COL_W.sendAt,
        align: 'center',
        render: (value: string) => dayjs(value).format('YYYY.MM.DD HH:mm'),
      },
      {
        title: '수신 일시',
        dataIndex: 'receivedAt',
        key: 'receivedAt',
        width: COL_W.receiveAt,
        align: 'center',
        render: (value: string) => dayjs(value).format('YYYY.MM.DD HH:mm'),
      },
      {
        title: '예약 일시',
        dataIndex: 'reservedAt',
        key: 'reservedAt',
        width: COL_W.reservedAt,
        align: 'center',
        render: (value: string) => dayjs(value).format('YYYY.MM.DD HH:mm'),
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
      >
        {isLoading ? (
          <Spin />
        ) : (
          <Table<AlimtalkSendHistoryRow>
            rowKey="id"
            className="cms-data-table alimtalk-send-history-page__table"
            tableLayout="fixed"
            scroll={{ x: TABLE_SCROLL_X }}
            columns={columns}
            dataSource={rows}
            pagination={false}
            onRow={record => ({
              className: 'alimtalk-send-history-page__row',
              onClick: () => setSelectedRow(record),
            })}
          />
        )}
      </FilterTableLayout>
      <DetailModal open={selectedRow != null} row={selectedRow} onClose={() => setSelectedRow(null)} />
    </>
  )
}
