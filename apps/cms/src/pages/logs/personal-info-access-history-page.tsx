import { useMemo } from 'react'
import { Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { getLogsApiErrorMessage } from '@/features/logs/api/admin-logs-service'
import { usePersonalInfoAccessHistoryQuery } from '@/features/logs/hooks/use-personal-info-access-history-query'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'
import { personalInfoAccessHistoryFilterFields } from '@/features/logs/model/personal-info-access-history-filter-fields'
import { personalInfoAccessHistoryTablePageConfig } from '@/features/logs/model/personal-info-access-history-table.config'
import { LogsQueryError } from '@/features/logs/ui/logs-query-error'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  EMPTY_TABLE_PAGE_CONTEXT,
  useTablePage,
} from '@/shared/components/table-system/model/use-table-page'
import type { PersonalInfoAccessLog } from '@/types/personal-info-access-log'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'

const PERSONAL_INFO_ACCESS_TABLE_SCROLL_X = 1120

const TABLE_COL_WIDTH = {
  no: 88,
  accessItem: 260,
  accessPurpose: 260,
  accessorName: 150,
  accessedAt: 220,
  ipAddress: 180,
} as const

export default function PersonalInfoAccessHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const remoteEnabled = useLogsRemoteQueryEnabled()
  const { data: rows = [], isLoading, isError, error } =
    usePersonalInfoAccessHistoryQuery(searchParams)

  const { pendingFilters, handleFilterChange, applySearch, tableData, displayedCount } = useTablePage(
    personalInfoAccessHistoryTablePageConfig,
    {
      data: rows,
      searchParams,
      setSearchParams,
      context: EMPTY_TABLE_PAGE_CONTEXT,
    }
  )

  const columns = useMemo<ColumnsType<PersonalInfoAccessLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COL_WIDTH.no,
        align: 'center',
        render: (_: unknown, __: PersonalInfoAccessLog, index: number) =>
          tableData.length === 0 ? '-' : tableData.length - index,
      },
      {
        title: '조회 항목',
        dataIndex: 'accessItem',
        key: 'accessItem',
        width: TABLE_COL_WIDTH.accessItem,
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
        title: '조회자',
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
    [tableData.length]
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
      description={`총 ${displayedCount.toLocaleString()}건`}
      excelExport={{
        columns,
        data: tableData,
      }}
    >
      {!remoteEnabled ? (
        <LogsQueryError message="로그 관리 API를 사용하려면 관리자 로그인이 필요합니다." />
      ) : isLoading ? (
        <Spin />
      ) : isError ? (
        <LogsQueryError
          message={getLogsApiErrorMessage(error, '개인정보 조회 이력을 불러오지 못했습니다.')}
        />
      ) : (
        <Table<PersonalInfoAccessLog>
          rowKey="id"
          className="cms-data-table"
          tableLayout="fixed"
          scroll={{ x: PERSONAL_INFO_ACCESS_TABLE_SCROLL_X }}
          columns={columns}
          dataSource={tableData}
          pagination={false}
        />
      )}
    </FilterTableLayout>
  )
}
