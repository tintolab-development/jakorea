import { useCallback, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { exportMemberLoginLogs, getLogsApiErrorMessage } from '@/features/logs/api/admin-logs-service'
import { memberLoginLogsParamsFromSearchParams } from '@/features/logs/api/logs-filter-params'
import { useMemberLoginHistoryQuery } from '@/features/logs/hooks/use-member-login-history-query'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'
import { LOGS_EMPTY_SEARCH_TEXT } from '@/features/logs/lib/logs-empty-copy'
import { memberLoginHistoryFilterFields } from '@/features/logs/model/member-login-history-filter-fields'
import { memberLoginHistoryTablePageConfig } from '@/features/logs/model/member-login-history-table.config'
import { LogsQueryError } from '@/features/logs/ui/logs-query-error'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  EMPTY_TABLE_PAGE_CONTEXT,
  useTablePage,
} from '@/shared/components/table-system/model/use-table-page'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { EmptyState, useCmsAlert } from '@/shared/ui'
import type { MemberLoginLog } from '@/types/member-login-log'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'

const MEMBER_LOGIN_HISTORY_TABLE_SCROLL_X = 1120

const TABLE_COL_WIDTH = {
  no: 80,
  adminName: 160,
  loginId: 320,
  loggedAt: 220,
  ipAddress: 180,
} as const

export default function MemberLoginHistoryPage() {
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
  } = useMemberLoginHistoryQuery(searchParams)

  const { pendingFilters, handleFilterChange, applySearch, tableData } = useTablePage(
    memberLoginHistoryTablePageConfig,
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

  const columns = useMemo<ColumnsType<MemberLoginLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COL_WIDTH.no,
        align: 'center',
        render: (_: unknown, __: MemberLoginLog, index: number) =>
          totalElements === 0 ? '-' : totalElements - index,
      },
      {
        title: '관리자명',
        dataIndex: 'adminName',
        key: 'adminName',
        width: TABLE_COL_WIDTH.adminName,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '아이디',
        dataIndex: 'loginId',
        key: 'loginId',
        width: TABLE_COL_WIDTH.loginId,
        align: 'center',
        ellipsis: { showTitle: true },
      },
      {
        title: '로그인 일시',
        dataIndex: 'loggedAt',
        key: 'loggedAt',
        width: TABLE_COL_WIDTH.loggedAt,
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

  const { showAlert } = useCmsAlert()
  const [isExporting, setIsExporting] = useState(false)
  const exportExcel = useCallback(async () => {
    if (!remoteEnabled || isExporting) return
    setIsExporting(true)
    try {
      await exportMemberLoginLogs(memberLoginLogsParamsFromSearchParams(searchParams))
    } catch (error) {
      showAlert({
        title: '안내',
        content: getLogsApiErrorMessage(error, '회원 로그인 이력 다운로드에 실패했습니다.'),
      })
    } finally {
      setIsExporting(false)
    }
  }, [isExporting, remoteEnabled, searchParams, showAlert])

  return (
    <FilterTableLayout
      bordered={false}
      fields={memberLoginHistoryFilterFields}
      filters={{
        adminName: pendingFilters.adminName,
        loginId: pendingFilters.loginId,
        dateRange: pendingFilters.dateRange,
      }}
      onFilterChange={handleFilterChange}
      onSearch={applySearch}
      title="회원 로그인 이력"
      description={`총 ${totalElements.toLocaleString()}건`}
      contentLoading={remoteEnabled && isLoading}
      onExcelDownload={exportExcel}
      excelDownloadLoading={isExporting}
    >
      {!remoteEnabled ? (
        <LogsQueryError message="로그 관리 API를 사용하려면 관리자 로그인이 필요합니다." />
      ) : isError ? (
        <LogsQueryError
          message={getLogsApiErrorMessage(error, '회원 로그인 이력을 불러오지 못했습니다.')}
        />
      ) : (
        <>
          <Table<MemberLoginLog>
            rowKey="id"
            className="cms-data-table"
            tableLayout="fixed"
            scroll={{ x: MEMBER_LOGIN_HISTORY_TABLE_SCROLL_X }}
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
