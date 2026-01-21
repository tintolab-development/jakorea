/**
 * 매칭 현황 목록 컴포넌트
 * Phase 4.4: 매칭 관리 - 목록 보기 (FR-F03)
 */

import { Table, Tag, Space, Button, Dropdown } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { MoreOutlined, DownloadOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import type { MatchingStatusItem } from '@/entities/matching/api/matching-status-service'

interface MatchingStatusListProps {
  data: MatchingStatusItem[]
  loading?: boolean
  onView?: (item: MatchingStatusItem) => void
  onExport?: () => void
}

const statusConfig: Record<
  MatchingStatusItem['status'],
  { label: string; color: string }
> = {
  PENDING: { label: '대기', color: 'orange' },
  CONFIRMED: { label: '확정', color: 'green' },
  COMPLETED: { label: '완료', color: 'blue' },
}

export function MatchingStatusList({
  data,
  loading = false,
  onView,
  onExport,
}: MatchingStatusListProps) {
  const columns: ColumnsType<MatchingStatusItem> = [
    {
      title: '날짜',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: '학교명',
      dataIndex: 'schoolName',
      key: 'schoolName',
      width: 150,
    },
    {
      title: '프로그램명',
      dataIndex: 'programName',
      key: 'programName',
      width: 200,
    },
    {
      title: '강사',
      key: 'instructors',
      width: 200,
      render: (_: unknown, record: MatchingStatusItem) => (
        <Space direction="vertical" size={4}>
          {record.instructors.map((instructor) => (
            <Space key={instructor.id}>
              <Tag color={instructor.role === 'LEAD' ? 'blue' : 'default'}>
                {instructor.role === 'LEAD' ? '대표' : '보조'}
              </Tag>
              <span>{instructor.name}</span>
            </Space>
          ))}
        </Space>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: MatchingStatusItem['status']) => {
        const config = statusConfig[status]
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: '작업',
      key: 'action',
      fixed: 'right' as const,
      width: 100,
      render: (_: unknown, record: MatchingStatusItem) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            label: '상세 보기',
            onClick: () => onView?.(record),
          },
        ]

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  return (
    <div>
      {onExport && (
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={onExport}
          >
            엑셀 다운로드
          </Button>
        </div>
      )}
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `총 ${total}개`,
        }}
        onRow={(record) => ({
          onClick: () => onView?.(record),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
