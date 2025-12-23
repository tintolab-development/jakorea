/**
 * 스폰서 목록 컴포넌트
 * Phase 1.3: 테이블 + 필터
 */

import { Table, Input, Button, Space, Tag } from 'antd'
import { useSponsorTable } from '../model/use-sponsor-table'
import type { Sponsor } from '@/types/domain'
import { domainColorsHex } from '@/shared/constants/colors'

interface SponsorListProps {
  data: Sponsor[]
  loading?: boolean
}

export function SponsorList({ data, loading }: SponsorListProps) {
  const { table } = useSponsorTable(data)

  return (
    <div>
      <Space style={{ marginBottom: 16 }} size="middle">
        <Input
          placeholder="스폰서명 검색"
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={e => table.getColumn('name')?.setFilterValue(e.target.value)}
          style={{ width: 200 }}
        />
        <Button onClick={() => table.resetColumnFilters()}>필터 초기화</Button>
      </Space>

      <Table
        dataSource={table.getRowModel().rows.map(row => row.original)}
        columns={[
          {
            title: '스폰서명',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
              <Tag color={domainColorsHex.sponsor.primary}>{text}</Tag>
            ),
          },
          {
            title: '설명',
            dataIndex: 'description',
            key: 'description',
            render: (text?: string) => text || '-',
          },
          {
            title: '연락처',
            dataIndex: 'contactInfo',
            key: 'contactInfo',
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




