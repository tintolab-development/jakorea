import { useMemo } from 'react'
import { Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { fileDownloadHistoryFilterFields } from '@/features/download/model/file-download-history-filter-fields'
import { fileDownloadHistoryTablePageConfig } from '@/features/download/model/file-download-history-table.config'
import { getLogsApiErrorMessage } from '@/features/logs/api/admin-logs-service'
import { useFileDownloadHistoryQuery } from '@/features/logs/hooks/use-file-download-history-query'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'
import { LogsQueryError } from '@/features/logs/ui/logs-query-error'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  EMPTY_TABLE_PAGE_CONTEXT,
  useTablePage,
} from '@/shared/components/table-system/model/use-table-page'
import type { DownloadLog } from '@/types/download-log'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'

const FILE_DOWNLOAD_HISTORY_TABLE_SCROLL_X = 1120

const TABLE_COL_WIDTH = {
  no: 88,
  fileName: 420,
  userName: 150,
  downloadedAt: 220,
  ipAddress: 180,
} as const

export default function FileDownloadHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const remoteEnabled = useLogsRemoteQueryEnabled()
  const { data: rows = [], isLoading, isError, error } = useFileDownloadHistoryQuery(searchParams)

  const { pendingFilters, handleFilterChange, applySearch, tableData, displayedCount } = useTablePage(
    fileDownloadHistoryTablePageConfig,
    {
      data: rows,
      searchParams,
      setSearchParams,
      context: EMPTY_TABLE_PAGE_CONTEXT,
    }
  )

  const columns = useMemo<ColumnsType<DownloadLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COL_WIDTH.no,
        align: 'center',
        render: (_: unknown, __: DownloadLog, index: number) =>
          tableData.length === 0 ? '-' : tableData.length - index,
      },
      {
        title: '다운로드 파일명',
        dataIndex: 'fileName',
        key: 'fileName',
        width: TABLE_COL_WIDTH.fileName,
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
        title: '다운로드 일시',
        dataIndex: 'downloadedAt',
        key: 'downloadedAt',
        width: TABLE_COL_WIDTH.downloadedAt,
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
      fields={fileDownloadHistoryFilterFields}
      filters={{
        fileName: pendingFilters.fileName,
        userName: pendingFilters.userName,
        dateRange: pendingFilters.dateRange,
      }}
      onFilterChange={handleFilterChange}
      onSearch={applySearch}
      title="파일 다운로드 이력"
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
          message={getLogsApiErrorMessage(error, '파일 다운로드 이력을 불러오지 못했습니다.')}
        />
      ) : (
        <Table<DownloadLog>
          rowKey="id"
          className="cms-data-table"
          tableLayout="fixed"
          scroll={{ x: FILE_DOWNLOAD_HISTORY_TABLE_SCROLL_X }}
          columns={columns}
          dataSource={tableData}
          pagination={false}
        />
      )}
    </FilterTableLayout>
  )
}
