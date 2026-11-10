import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { NotificationSendStatusText } from '@/features/notifications/ui/shared/send-status-text'
import type { ColumnsType } from 'antd/es/table'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { MAIL_SEND_HISTORY_FILTER_FIELDS } from '@/features/notifications/model/mail-send-history/filter-fields'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  applyMailSendHistoryFiltersToSearchParams,
  readMailSendHistoryFiltersFromParams,
} from '@/features/notifications/model/mail-send-history/filter-url'
import type {
  MailSendHistoryPendingFilters,
  MailSendHistoryRow,
} from '@/features/notifications/model/mail-send-history/types'
import { notificationDeliveryDetailView } from '@/features/notifications/api/notification-delivery-detail-cache'
import {
  useMailSendHistoryDetailQuery,
  useMailSendHistoryQuery,
} from '@/features/notifications/hooks/use-mail-send-history-query'
import { DetailModal } from './detail-modal'
import '@/pages/programs/program-list-page.css'
import '@/features/notifications/ui/alimtalk-send-history/page.css'
import './page.css'

/** 시안 6289:93443 — 합계 2168(스크롤 X) */
const COL_W = {
  no: 80,
  requestAt: 200,
  sendAt: 200,
  receiveAt: 200,
  reservedAt: 200,
  subject: 468,
  senderInfo: 200,
  receiverInfo: 200,
  broadcastTiming: 140,
  sendStatus: 140,
  receiveStatus: 140,
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

export function MailSendHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const appliedFilters = useMemo(
    () => readMailSendHistoryFiltersFromParams(searchParams),
    [searchParams]
  )
  const {
    rows,
    totalCount,
    searchParamsKey,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMailSendHistoryQuery(searchParams)
  const displayTotal = totalCount ?? rows.length
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: searchParamsKey,
  })
  const [pendingFilters, setPendingFilters] =
    useState<MailSendHistoryPendingFilters>(appliedFilters)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  const detailQuery = useMailSendHistoryDetailQuery(selectedRowId, Boolean(selectedRowId))
  const detailLoading = Boolean(selectedRowId) && detailQuery.isPending
  const selectedRow = notificationDeliveryDetailView(detailQuery.data, detailQuery.isError)

  useEffect(() => {
    setPendingFilters(appliedFilters)
  }, [appliedFilters])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setSearchParams(
      prev => applyMailSendHistoryFiltersToSearchParams(prev, pendingFilters),
      { replace: true }
    )
  }, [pendingFilters, setSearchParams])

  const columns = useMemo<ColumnsType<MailSendHistoryRow>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL_W.no,
        align: 'center',
        render: (_: unknown, __: MailSendHistoryRow, index: number) =>
          displayTotal === 0 ? '-' : displayTotal - index,
      },
      {
        title: '요청 일시',
        dataIndex: 'requestAt',
        key: 'requestAt',
        width: COL_W.requestAt,
        align: 'center',
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '메일 제목',
        dataIndex: 'subject',
        key: 'subject',
        width: COL_W.subject,
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
        render: (status: string) => <NotificationSendStatusText status={status} />,
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
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '수신 일시',
        dataIndex: 'receivedAt',
        key: 'receivedAt',
        width: COL_W.receiveAt,
        align: 'center',
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '예약 일시',
        dataIndex: 'reservedAt',
        key: 'reservedAt',
        width: COL_W.reservedAt,
        align: 'center',
        render: (value: string, row) => formatReservedAt(value, row.broadcastTiming),
      },
    ],
    [displayTotal]
  )

  return (
    <>
      <FilterTableLayout
        className="mail-send-history-page alimtalk-send-history-page"
        bordered={false}
        filterResponsiveWrap
        mergedAutoFillInlineSearch
        hideExcelDownload
        fields={MAIL_SEND_HISTORY_FILTER_FIELDS}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="메일 발송 조회"
        description={`총 ${displayTotal.toLocaleString()}건`}
        contentLoading={isLoading}
      >
        <CmsDataTable<MailSendHistoryRow>
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
        <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
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
