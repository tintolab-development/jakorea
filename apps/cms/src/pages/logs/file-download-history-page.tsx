import { useCallback, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { fileDownloadHistoryFilterFields } from '@/features/download/model/file-download-history-filter-fields'
import { fileDownloadHistoryTablePageConfig } from '@/features/download/model/file-download-history-table.config'
import {
  exportFileDownloadLogs,
  getLogsApiErrorMessage,
} from '@/features/logs/api/admin-logs-service'
import { fileDownloadLogsParamsFromSearchParams } from '@/features/logs/api/logs-filter-params'
import { useFileDownloadHistoryQuery } from '@/features/logs/hooks/use-file-download-history-query'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'
import { LogsQueryError } from '@/features/logs/ui/logs-query-error'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  EMPTY_TABLE_PAGE_CONTEXT,
  useTablePage,
} from '@/shared/components/table-system/model/use-table-page'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { useCmsAlert } from '@/shared/ui'
import type { DownloadLog } from '@/types/download-log'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'

const FILE_DOWNLOAD_HISTORY_TABLE_SCROLL_X = 1200

/** 시안: 다운로드 파일명은 남는 폭 · 사용자 180 · 다운로드일시·IP 300 */
const TABLE_COL_WIDTH = {
  no: 80,
  userName: 180,
  downloadedAt: 300,
  ipAddress: 300,
} as const

export default function FileDownloadHistoryPage() {
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
  } = useFileDownloadHistoryQuery(searchParams)

  const { pendingFilters, handleFilterChange, applySearch, tableData,
    hasActiveFilters,
  } = useTablePage(
    fileDownloadHistoryTablePageConfig,
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

  const columns = useMemo<ColumnsType<DownloadLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COL_WIDTH.no,
        align: 'center',
        render: (_: unknown, __: DownloadLog, index: number) =>
          totalElements === 0 ? '-' : totalElements - index,
      },
      {
        title: '다운로드 파일명',
        dataIndex: 'fileName',
        key: 'fileName',
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
        title: '다운로드일시',
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
    [totalElements]
  )

  // 엑셀: 화면에 불러온 페이지가 아니라 조회 조건 전체 — 서버 export (다른 로그 3종과 같은 방식)
  const { showAlert } = useCmsAlert()
  const [isExporting, setIsExporting] = useState(false)
  const exportExcel = useCallback(async () => {
    if (!remoteEnabled || isExporting) return
    setIsExporting(true)
    try {
      await exportFileDownloadLogs(fileDownloadLogsParamsFromSearchParams(searchParams))
    } catch (error) {
      showAlert({
        title: '안내',
        content: getLogsApiErrorMessage(error, '파일 다운로드 이력 다운로드에 실패했습니다.'),
      })
    } finally {
      setIsExporting(false)
    }
  }, [isExporting, remoteEnabled, searchParams, showAlert])

  return (
    <FilterTableLayout
      hasActiveFilters={hasActiveFilters}
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
      description={`총 ${totalElements.toLocaleString()}건`}
      contentLoading={remoteEnabled && isLoading}
      onExcelDownload={exportExcel}
      excelDownloadLoading={isExporting}
    >
      {!remoteEnabled ? (
        <LogsQueryError message="로그 관리 API를 사용하려면 관리자 로그인이 필요합니다." />
      ) : isError ? (
        <LogsQueryError
          message={getLogsApiErrorMessage(error, '파일 다운로드 이력을 불러오지 못했습니다.')}
        />
      ) : (
        <>
          <CmsDataTable<DownloadLog>
            rowKey="id"
            className="cms-data-table"
            tableLayout="fixed"
            scroll={{ x: FILE_DOWNLOAD_HISTORY_TABLE_SCROLL_X }}
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
