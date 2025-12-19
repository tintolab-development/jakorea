/**
 * 강사 목록 컴포넌트
 * Phase 1.2: 테이블 + 필터
 */

import { Table, Input, Select, Button, Space } from 'antd'
import { useInstructorTable } from '../model/use-instructor-table'
import type { Instructor } from '@/types/domain'

const { Option } = Select

interface InstructorListProps {
  data: Instructor[]
  loading?: boolean
}

export function InstructorList({ data, loading }: InstructorListProps) {
  const { table } = useInstructorTable(data)

  const regions = Array.from(new Set(data.map(i => i.region))).sort()

  return (
    <div>
      <Space style={{ marginBottom: 16 }} size="middle">
        <Input
          placeholder="이름 검색"
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
            title: '이름',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: '연락처',
            dataIndex: 'contactPhone',
            key: 'contactPhone',
          },
          {
            title: '이메일',
            dataIndex: 'contactEmail',
            key: 'contactEmail',
          },
          {
            title: '지역',
            dataIndex: 'region',
            key: 'region',
          },
          {
            title: '전문분야',
            dataIndex: 'specialty',
            key: 'specialty',
            render: (specialties: string[]) => specialties?.join(', ') || '-',
          },
          {
            title: '평점',
            dataIndex: 'rating',
            key: 'rating',
            render: (rating?: number) => (rating ? `${rating.toFixed(1)}/5.0` : '-'),
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

