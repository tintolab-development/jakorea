import { useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { getDownloadLogs } from '@/entities/download-log/api/download-log-service'
import type { DownloadLog } from '@/types/download-log'
import { fileDownloadHistoryFilterFields } from '@/features/download/model/file-download-history-filter-fields'
import { fileDownloadHistoryTablePageConfig } from '@/features/download/model/file-download-history-table.config'
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
  const [rows, setRows] = useState<DownloadLog[]>([])

  useEffect(() => {
    const load = async () => {
      const result = await getDownloadLogs()
      setRows(result)
    }
    void load()
  }, [])

  const { pendingFilters, handleFilterChange, applySearch, tableData, displayedCount } = useTablePage(
    fileDownloadHistoryTablePageConfig,
    {
      data: rows,
      searchParams,
      setSearchParams,
      context: {},
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
    >
      <Table<DownloadLog>
        rowKey="id"
        className="cms-data-table"
        tableLayout="fixed"
        scroll={{ x: FILE_DOWNLOAD_HISTORY_TABLE_SCROLL_X }}
        columns={columns}
        dataSource={tableData}
        pagination={false}
      />
    </FilterTableLayout>
  )
}
