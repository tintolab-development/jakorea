import { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { getLogsApiErrorMessage } from '@/features/logs/api/admin-logs-service'
import { useMemberLoginHistoryQuery } from '@/features/logs/hooks/use-member-login-history-query'
import { buildMemberLoginHistoryExcelFilename } from '@/features/logs/lib/member-login-excel'
import { memberLoginHistoryFilterFields } from '@/features/logs/model/member-login-history-filter-fields'
import { memberLoginHistoryTablePageConfig } from '@/features/logs/model/member-login-history-table.config'
import { LogsQueryError } from '@/features/logs/ui/logs-query-error'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  EMPTY_TABLE_PAGE_CONTEXT,
  useTablePage,
} from '@/shared/components/table-system/model/use-table-page'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { EmptyState } from '@/shared/ui'
import { exportTableToExcel } from '@/shared/utils/table-export'
import type { MemberLoginLog } from '@/types/member-login-log'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'

const MEMBER_LOGIN_HISTORY_TABLE_SCROLL_X = 1120
const MEMBER_LOGIN_HISTORY_EMPTY_TEXT =
  '검색 결과가 없습니다. 검색 조건을 변경해 주세요.'

const TABLE_COL_WIDTH = {
  no: 88,
  adminName: 160,
  loginId: 320,
  loggedAt: 220,
  ipAddress: 180,
} as const

export default function MemberLoginHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: rows = [], isLoading, isError, error } = useMemberLoginHistoryQuery(searchParams)

  const { pendingFilters, handleFilterChange, applySearch, tableData, displayedCount } = useTablePage(
    memberLoginHistoryTablePageConfig,
    {
      data: rows,
      searchParams,
      setSearchParams,
      context: EMPTY_TABLE_PAGE_CONTEXT,
    }
  )

  const columns = useMemo<ColumnsType<MemberLoginLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COL_WIDTH.no,
        align: 'center',
        render: (_: unknown, __: MemberLoginLog, index: number) =>
          tableData.length === 0 ? '-' : tableData.length - index,
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
    [tableData.length]
  )

  const { exportExcel, isExporting } = useTableExcelExport({
    columns,
    data: tableData,
    filename: buildMemberLoginHistoryExcelFilename(),
    exporter: (exportColumns, data) =>
      exportTableToExcel(exportColumns, data, buildMemberLoginHistoryExcelFilename(), {
        exactFilename: true,
      }),
  })

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
      description={`총 ${displayedCount.toLocaleString()}건`}
      contentLoading={isLoading}
      onExcelDownload={exportExcel}
      excelDownloadLoading={isExporting}
    >
      {isError ? (
        <LogsQueryError
          message={getLogsApiErrorMessage(error, '회원 로그인 이력을 불러오지 못했습니다.')}
        />
      ) : (
        <Table<MemberLoginLog>
          rowKey="id"
          className="cms-data-table"
          tableLayout="fixed"
          scroll={{ x: MEMBER_LOGIN_HISTORY_TABLE_SCROLL_X }}
          columns={columns}
          dataSource={tableData}
          pagination={false}
          locale={{
            emptyText: <EmptyState description={MEMBER_LOGIN_HISTORY_EMPTY_TEXT} />,
          }}
        />
      )}
    </FilterTableLayout>
  )
}
