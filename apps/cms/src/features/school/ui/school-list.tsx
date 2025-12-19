/**
 * 학교 목록 컴포넌트
 * Phase 1.4: 테이블 + 필터
 */

import { Table, Input, Select, Button, Space, Tag } from 'antd'
import { useSchoolTable } from '../model/use-school-table'
import type { School } from '@/types/domain'

const { Option } = Select

interface SchoolListProps {
  data: School[]
  loading?: boolean
}

export function SchoolList({ data, loading }: SchoolListProps) {
  const { table } = useSchoolTable(data)

  const regions = Array.from(new Set(data.map(s => s.region))).sort()

  return (
    <div>
      <Space style={{ marginBottom: 16 }} size="middle">
        <Input
          placeholder="학교명 검색"
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={e => table.getColumn('name')?.setFilterValue(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          placeholder="지역 선택"
          value={(table.getColumn('region')?.getFilterValue() as string) || undefined}
          onChange={value => table.getColumn('region')?.setFilterValue(value || null)}
          allowClear
          style={{ width: 150 }}
        >
          {regions.map(region => (
            <Option key={region} value={region}>
              {region}
            </Option>
          ))}
        </Select>
        <Button onClick={() => table.resetColumnFilters()}>필터 초기화</Button>
      </Space>

      <Table
        dataSource={table.getRowModel().rows.map(row => row.original)}
        columns={[
          {
            title: '학교명',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
              <Tag color="cyan" style={{ fontSize: 14, padding: '4px 12px' }}>
                {text}
              </Tag>
            ),
          },
          {
            title: '지역',
            dataIndex: 'region',
            key: 'region',
          },
          {
            title: '주소',
            dataIndex: 'address',
            key: 'address',
            render: (text?: string) => text || '-',
          },
          {
            title: '담당자',
            dataIndex: 'contactPerson',
            key: 'contactPerson',
          },
          {
            title: '연락처',
            dataIndex: 'contactPhone',
            key: 'contactPhone',
            render: (text?: string) => text || '-',
          },
          {
            title: '이메일',
            dataIndex: 'contactEmail',
            key: 'contactEmail',
            render: (text?: string) => text || '-',
          },
        ]}
        rowKey="id"
        loading={loading}
        pagination={{
          current: table.getState().pagination.pageIndex + 1,
          pageSize: table.getState().pagination.pageSize,
          total: table.getFilteredRowModel().rows.length,
          showSizeChanger: true,
          showTotal: (total) => `총 ${total}개`,
          onChange: (page, pageSize) => {
            table.setPageIndex(page - 1)
            table.setPageSize(pageSize)
          },
        }}
      />
    </div>
  )
}

