import { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { bugIssueHistoryFilterFields } from '@/features/download/model/bug-issue-history-filter-fields'
import { bugIssueHistoryTablePageConfig } from '@/features/download/model/bug-issue-history-table.config'
import { getLogsApiErrorMessage } from '@/features/logs/api/admin-logs-service'
import { useBugIssueHistoryQuery } from '@/features/logs/hooks/use-bug-issue-history-query'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'
import { LogsQueryError } from '@/features/logs/ui/logs-query-error'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  EMPTY_TABLE_PAGE_CONTEXT,
  useTablePage,
} from '@/shared/components/table-system/model/use-table-page'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import type { BugIssueLog } from '@/types/bug-issue-log'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'

const BUG_ISSUE_HISTORY_TABLE_SCROLL_X = 1100

const TABLE_COL_WIDTH = {
  no: 88,
  screenName: 230,
  errorMessage: 400,
  userName: 150,
  occurredAt: 220,
} as const

export default function BugIssueHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const remoteEnabled = useLogsRemoteQueryEnabled()
  const {
    rows,
    totalElements,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useBugIssueHistoryQuery(searchParams)

  const { pendingFilters, handleFilterChange, applySearch, tableData } = useTablePage(
    bugIssueHistoryTablePageConfig,
    {
      data: rows,
      searchParams,
      setSearchParams,
      context: EMPTY_TABLE_PAGE_CONTEXT,
    }
  )

  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: searchParamsKey,
  })

  const columns = useMemo<ColumnsType<BugIssueLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COL_WIDTH.no,
        align: 'center',
        render: (_: unknown, __: BugIssueLog, index: number) =>
          totalElements === 0 ? '-' : totalElements - index,
      },
      {
        title: '화면명',
        dataIndex: 'screenName',
        key: 'screenName',
        width: TABLE_COL_WIDTH.screenName,
        align: 'center',
        ellipsis: { showTitle: true },
      },
      {
        title: '에러 메시지',
        dataIndex: 'errorMessage',
        key: 'errorMessage',
        width: TABLE_COL_WIDTH.errorMessage,
        align: 'center',
        ellipsis: { showTitle: true },
      },
      {
        title: '사용자',
        dataIndex: 'userName',
        key: 'userName',
        width: TABLE_COL_WIDTH.userName,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '발생 일시',
        dataIndex: 'occurredAt',
        key: 'occurredAt',
        width: TABLE_COL_WIDTH.occurredAt,
        align: 'center',
        render: (iso: string) => dayjs(iso).format('YYYY.MM.DD HH:mm'),
      },
    ],
    [totalElements]
  )

  return (
    <FilterTableLayout
      bordered={false}
      fields={bugIssueHistoryFilterFields}
      filters={{
        userName: pendingFilters.userName,
        dateRange: pendingFilters.dateRange,
      }}
      onFilterChange={handleFilterChange}
      onSearch={applySearch}
      title="버그/이슈 이력"
      description={`총 ${totalElements.toLocaleString()}건`}
      contentLoading={remoteEnabled && isLoading}
      excelExport={{
        columns,
        data: tableData,
      }}
    >
      {!remoteEnabled ? (
        <LogsQueryError message="로그 관리 API를 사용하려면 관리자 로그인이 필요합니다." />
      ) : isError ? (
        <LogsQueryError
          message={getLogsApiErrorMessage(error, '버그/이슈 이력을 불러오지 못했습니다.')}
        />
      ) : (
        <>
          <Table<BugIssueLog>
            rowKey="id"
            className="cms-data-table"
            tableLayout="fixed"
            scroll={{ x: BUG_ISSUE_HISTORY_TABLE_SCROLL_X }}
            columns={columns}
            dataSource={tableData}
            pagination={false}
          />
          <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
        </>
      )}
    </FilterTableLayout>
  )
}
