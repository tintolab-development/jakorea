import { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { getLogsApiErrorMessage } from '@/features/logs/api/admin-logs-service'
import { usePersonalInfoAccessHistoryQuery } from '@/features/logs/hooks/use-personal-info-access-history-query'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'
import { LOGS_EMPTY_SEARCH_TEXT } from '@/features/logs/lib/logs-empty-copy'
import { personalInfoAccessHistoryFilterFields } from '@/features/logs/model/personal-info-access-history-filter-fields'
import { personalInfoAccessHistoryTablePageConfig } from '@/features/logs/model/personal-info-access-history-table.config'
import { LogsQueryError } from '@/features/logs/ui/logs-query-error'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  EMPTY_TABLE_PAGE_CONTEXT,
  useTablePage,
} from '@/shared/components/table-system/model/use-table-page'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { EmptyState } from '@/shared/ui'
import type { PersonalInfoAccessLog } from '@/types/personal-info-access-log'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'

const PERSONAL_INFO_ACCESS_TABLE_SCROLL_X = 1120

const TABLE_COL_WIDTH = {
  no: 88,
  targetName: 160,
  accessPurpose: 260,
  accessorName: 150,
  accessedAt: 220,
  ipAddress: 180,
} as const

export default function PersonalInfoAccessHistoryPage() {
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
  } = usePersonalInfoAccessHistoryQuery(searchParams)

  const { pendingFilters, handleFilterChange, applySearch, tableData } = useTablePage(
    personalInfoAccessHistoryTablePageConfig,
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

  const columns = useMemo<ColumnsType<PersonalInfoAccessLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COL_WIDTH.no,
        align: 'center',
        render: (_: unknown, __: PersonalInfoAccessLog, index: number) =>
          totalElements === 0 ? '-' : totalElements - index,
      },
      {
        title: '조회 대상',
        dataIndex: 'targetName',
        key: 'targetName',
        width: TABLE_COL_WIDTH.targetName,
        align: 'center',
        ellipsis: { showTitle: true },
      },
      {
        title: '조회 목적',
        dataIndex: 'accessPurpose',
        key: 'accessPurpose',
        width: TABLE_COL_WIDTH.accessPurpose,
        align: 'center',
        ellipsis: { showTitle: true },
      },
      {
        title: '조회자명',
        dataIndex: 'accessorName',
        key: 'accessorName',
        width: TABLE_COL_WIDTH.accessorName,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '조회 일시',
        dataIndex: 'accessedAt',
        key: 'accessedAt',
        width: TABLE_COL_WIDTH.accessedAt,
        align: 'center',
        render: (iso: string) => dayjs(iso).format('YYYY.MM.DD HH:mm:ss'),
      },
      {
        title: 'IP',
        dataIndex: 'ipAddress',
        key: 'ipAddress',
        width: TABLE_COL_WIDTH.ipAddress,
        align: 'center',
      },
    ],
    [totalElements]
  )

  return (
    <FilterTableLayout
      bordered={false}
      fields={personalInfoAccessHistoryFilterFields}
      filters={{
        accessPurpose: pendingFilters.accessPurpose,
        accessorName: pendingFilters.accessorName,
        dateRange: pendingFilters.dateRange,
      }}
      onFilterChange={handleFilterChange}
      onSearch={applySearch}
      title="개인정보 조회 이력"
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
          message={getLogsApiErrorMessage(error, '개인정보 조회 이력을 불러오지 못했습니다.')}
        />
      ) : (
        <>
          <Table<PersonalInfoAccessLog>
            rowKey="id"
            className="cms-data-table"
            tableLayout="fixed"
            scroll={{ x: PERSONAL_INFO_ACCESS_TABLE_SCROLL_X }}
            columns={columns}
            dataSource={tableData}
            pagination={false}
            locale={{
              emptyText: <EmptyState description={LOGS_EMPTY_SEARCH_TEXT} />,
            }}
          />
          <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
        </>
      )}
    </FilterTableLayout>
  )
}
