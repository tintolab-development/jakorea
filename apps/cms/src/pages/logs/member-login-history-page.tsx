import { useCallback, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import {
  exportMemberLoginLogs,
  getLogsApiErrorMessage,
} from '@/features/logs/api/admin-logs-service'
import { memberLoginLogsParamsFromSearchParams } from '@/features/logs/api/logs-filter-params'
import { useMemberLoginHistoryQuery } from '@/features/logs/hooks/use-member-login-history-query'
import { useLogsRemoteQueryEnabled } from '@/features/logs/hooks/use-logs-query-scope'
import { memberLoginHistoryFilterFields } from '@/features/logs/model/member-login-history-filter-fields'
import { memberLoginHistoryTablePageConfig } from '@/features/logs/model/member-login-history-table.config'
import { LogsQueryError } from '@/features/logs/ui/logs-query-error'
import {
  FilterTableDescriptionDivider,
  FilterTableLayout,
} from '@/shared/components/filter-table-layout'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  EMPTY_TABLE_PAGE_CONTEXT,
  useTablePage,
} from '@/shared/components/table-system/model/use-table-page'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { useCmsAlert } from '@/shared/ui'
import type { MemberLoginLog } from '@/types/member-login-log'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'

const MEMBER_LOGIN_HISTORY_TABLE_SCROLL_X = 1120

/** 시안: No. 80 고정 · 관리자·아이디·로그인일시·IP 균등 분배(폭 미지정) */
const TABLE_COL_WIDTH = {
  no: 80,
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

  const { pendingFilters, handleFilterChange, applySearch, tableData, hasActiveFilters } =
    useTablePage(memberLoginHistoryTablePageConfig, {
      data: rows,
      searchParams,
      setSearchParams,
      context: EMPTY_TABLE_PAGE_CONTEXT,
    })

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
        title: '관리자',
        dataIndex: 'adminName',
        key: 'adminName',
        align: 'center',
        ellipsis: true,
      },
      {
        title: '아이디',
        dataIndex: 'loginId',
        key: 'loginId',
        align: 'center',
        ellipsis: { showTitle: true },
      },
      {
        title: '로그인일시',
        dataIndex: 'loggedAt',
        key: 'loggedAt',
        align: 'center',
        render: (iso: string) => dayjs(iso).format('YYYY.MM.DD HH:mm:ss'),
      },
      {
        title: 'IP',
        dataIndex: 'ipAddress',
        key: 'ipAddress',
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
        content: getLogsApiErrorMessage(error, '관리자 로그인 이력 다운로드에 실패했습니다.'),
      })
    } finally {
      setIsExporting(false)
    }
  }, [isExporting, remoteEnabled, searchParams, showAlert])

  const descriptionNum = useMemo(() => `총 ${totalElements.toLocaleString()}건`, [totalElements])
  const descriptionText = (
    <span>
      홈페이지 어드민과 사용자 플랫폼의 로그인 이력은{' '}
      <span
        style={{ color: '#0070E7', cursor: 'pointer' }}
        onClick={() => window.open(import.meta.env.VITE_HOMEPAGE_ADMIN_URL, '_blank')}
      >
        홈페이지 어드민
      </span>
      에서 확인 가능합니다.
    </span>
  )

  return (
    <FilterTableLayout
      hasActiveFilters={hasActiveFilters}
      bordered={false}
      fields={memberLoginHistoryFilterFields}
      filters={{
        adminName: pendingFilters.adminName,
        loginId: pendingFilters.loginId,
        dateRange: pendingFilters.dateRange,
      }}
      onFilterChange={handleFilterChange}
      onSearch={applySearch}
      title="CMS 관리자 로그인 이력"
      description={
        <>
          {descriptionNum}
          <FilterTableDescriptionDivider />
          {descriptionText}
        </>
      }
      contentLoading={remoteEnabled && isLoading}
      onExcelDownload={exportExcel}
      excelDownloadLoading={isExporting}
    >
      {!remoteEnabled ? (
        <LogsQueryError message="로그 관리 API를 사용하려면 관리자 로그인이 필요합니다." />
      ) : isError ? (
        <LogsQueryError
          message={getLogsApiErrorMessage(error, '관리자 로그인 이력을 불러오지 못했습니다.')}
        />
      ) : (
        <>
          <CmsDataTable<MemberLoginLog>
            rowKey="id"
            className="cms-data-table"
            tableLayout="fixed"
            scroll={{ x: MEMBER_LOGIN_HISTORY_TABLE_SCROLL_X }}
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
