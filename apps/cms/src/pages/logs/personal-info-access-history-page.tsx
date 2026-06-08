import { useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  EMPTY_TABLE_PAGE_CONTEXT,
  useTablePage,
} from '@/shared/components/table-system/model/use-table-page'
import type { PersonalInfoAccessLog } from '@/types/personal-info-access-log'
import { getPersonalInfoAccessLogs } from '@/entities/personal-info-access-log/api/personal-info-access-log-service'
import { personalInfoAccessHistoryFilterFields } from '@/features/logs/model/personal-info-access-history-filter-fields'
import { personalInfoAccessHistoryTablePageConfig } from '@/features/logs/model/personal-info-access-history-table.config'
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
  const [rows, setRows] = useState<PersonalInfoAccessLog[]>([])

  useEffect(() => {
    const load = async () => {
      const result = await getPersonalInfoAccessLogs()
      setRows(result)
    }
    void load()
  }, [])

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
      <Table<PersonalInfoAccessLog>
        rowKey="id"
        className="cms-data-table"
        tableLayout="fixed"
        scroll={{ x: PERSONAL_INFO_ACCESS_TABLE_SCROLL_X }}
        columns={columns}
        dataSource={tableData}
        pagination={false}
      />
    </FilterTableLayout>
  )
}
