import { useCallback, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import {
  exportPersonalInfoAccessLogs,
  getLogsApiErrorMessage,
} from '@/features/logs/api/admin-logs-service'
import { personalInfoAccessLogsParamsFromSearchParams } from '@/features/logs/api/logs-filter-params'
import { usePersonalInfoAccessHistoryQuery } from '@/features/logs/hooks/use-personal-info-access-history-query'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'
import { personalInfoAccessHistoryFilterFields } from '@/features/logs/model/personal-info-access-history-filter-fields'
import { personalInfoAccessHistoryTablePageConfig } from '@/features/logs/model/personal-info-access-history-table.config'
import { LogsQueryError } from '@/features/logs/ui/logs-query-error'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  EMPTY_TABLE_PAGE_CONTEXT,
  useTablePage,
} from '@/shared/components/table-system/model/use-table-page'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { useCmsAlert } from '@/shared/ui'
import type { PersonalInfoAccessLog } from '@/types/personal-info-access-log'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'

const PERSONAL_INFO_ACCESS_TABLE_SCROLL_X = 1280

/** 시안: 조회 목적은 남는 폭 · 조회 대상자·조회자 180 · 조회일시·IP 300 */
const TABLE_COL_WIDTH = {
  no: 80,
  targetName: 180,
  accessorName: 180,
  accessedAt: 300,
  ipAddress: 300,
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

  const { pendingFilters, handleFilterChange, applySearch, tableData,
    hasActiveFilters,
  } = useTablePage(
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
        title: '조회 대상자',
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
        title: '조회일시',
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

  const { showAlert } = useCmsAlert()
  const [isExporting, setIsExporting] = useState(false)
  const exportExcel = useCallback(async () => {
    if (!remoteEnabled || isExporting) return
    setIsExporting(true)
    try {
      await exportPersonalInfoAccessLogs(
        personalInfoAccessLogsParamsFromSearchParams(searchParams)
      )
    } catch (error) {
      showAlert({
        title: '안내',
        content: getLogsApiErrorMessage(error, '개인정보 조회 이력 다운로드에 실패했습니다.'),
      })
    } finally {
      setIsExporting(false)
    }
  }, [isExporting, remoteEnabled, searchParams, showAlert])

  return (
    <FilterTableLayout
      hasActiveFilters={hasActiveFilters}
      bordered={false}
      fields={personalInfoAccessHistoryFilterFields}
      filters={{
        targetName: pendingFilters.targetName,
        accessPurpose: pendingFilters.accessPurpose,
        accessorName: pendingFilters.accessorName,
        dateRange: pendingFilters.dateRange,
      }}
      onFilterChange={handleFilterChange}
      onSearch={applySearch}
      title="개인정보 조회 이력"
      description={`총 ${totalElements.toLocaleString()}건`}
      contentLoading={remoteEnabled && isLoading}
      onExcelDownload={exportExcel}
      excelDownloadLoading={isExporting}
    >
      {!remoteEnabled ? (
        <LogsQueryError message="로그 관리 API를 사용하려면 관리자 로그인이 필요합니다." />
      ) : isError ? (
        <LogsQueryError
          message={getLogsApiErrorMessage(error, '개인정보 조회 이력을 불러오지 못했습니다.')}
        />
      ) : (
        <>
          <CmsDataTable<PersonalInfoAccessLog>
            rowKey="id"
            className="cms-data-table"
            tableLayout="fixed"
            scroll={{ x: PERSONAL_INFO_ACCESS_TABLE_SCROLL_X }}
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
