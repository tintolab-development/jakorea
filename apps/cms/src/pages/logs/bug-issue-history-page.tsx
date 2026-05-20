import { useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { getBugIssueLogs } from '@/entities/download-log/api/bug-issue-log-service'
import { bugIssueHistoryFilterFields } from '@/features/download/model/bug-issue-history-filter-fields'
import { bugIssueHistoryTablePageConfig } from '@/features/download/model/bug-issue-history-table.config'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
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
  const [rows, setRows] = useState<BugIssueLog[]>([])

  useEffect(() => {
    const load = async () => {
      const result = await getBugIssueLogs()
      setRows(result)
    }
    void load()
  }, [])

  const { pendingFilters, handleFilterChange, applySearch, tableData, displayedCount } = useTablePage(
    bugIssueHistoryTablePageConfig,
    {
      data: rows,
      searchParams,
      setSearchParams,
      context: {},
    }
  )

  const columns = useMemo<ColumnsType<BugIssueLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COL_WIDTH.no,
        align: 'center',
        render: (_: unknown, __: BugIssueLog, index: number) =>
          tableData.length === 0 ? '-' : tableData.length - index,
      },
      {
        title: '발생 화면',
        dataIndex: 'screenName',
        key: 'screenName',
        width: TABLE_COL_WIDTH.screenName,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '에러 메세지',
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
        title: '발생일시',
        dataIndex: 'occurredAt',
        key: 'occurredAt',
        width: TABLE_COL_WIDTH.occurredAt,
        align: 'center',
        render: (iso: string) => dayjs(iso).format('YYYY.MM.DD HH:mm:ss'),
      },
    ],
    [tableData.length]
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
      description={`총 ${displayedCount.toLocaleString()}건`}
    >
      <Table<BugIssueLog>
        rowKey="id"
        className="cms-data-table"
        rowHoverable={false}
        tableLayout="fixed"
        scroll={{ x: BUG_ISSUE_HISTORY_TABLE_SCROLL_X }}
        columns={columns}
        dataSource={tableData}
        pagination={false}
      />
    </FilterTableLayout>
  )
}
