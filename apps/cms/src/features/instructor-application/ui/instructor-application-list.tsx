/**
 * 강사 신청 목록 컴포넌트
 * Phase 4.3: 강의 신청 관리 (FR-F02)
 */

import { Table, Tag, Button, Dropdown } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { MoreOutlined, CheckOutlined, CloseOutlined, StopOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import type { InstructorApplicationItem } from '@/entities/instructor-application/api/instructor-application-service'

interface InstructorApplicationListProps {
  data: InstructorApplicationItem[]
  loading?: boolean
  onView?: (item: InstructorApplicationItem) => void
  onApprove?: (item: InstructorApplicationItem) => void
  onReject?: (item: InstructorApplicationItem) => void
  onClose?: (item: InstructorApplicationItem) => void
}

const statusConfig: Record<
  InstructorApplicationItem['status'],
  { label: string; color: string }
> = {
  PENDING: { label: '대기', color: 'orange' },
  APPROVED: { label: '승인', color: 'green' },
  REJECTED: { label: '거절', color: 'red' },
  CLOSED: { label: '마감', color: 'default' },
}

export function InstructorApplicationList({
  data,
  loading = false,
  onView,
  onApprove,
  onReject,
  onClose,
}: InstructorApplicationListProps) {
  const columns: ColumnsType<InstructorApplicationItem> = [
    {
      title: '강사명',
      dataIndex: 'instructorName',
      key: 'instructorName',
      width: 150,
    },
    {
      title: '프로그램명',
      dataIndex: 'programName',
      key: 'programName',
      width: 200,
    },
    {
      title: '신청일',
      dataIndex: 'appliedAt',
      key: 'appliedAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: InstructorApplicationItem['status']) => {
        const config = statusConfig[status]
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: '작업',
      key: 'action',
      fixed: 'right' as const,
      width: 100,
      render: (_: unknown, record: InstructorApplicationItem) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            label: '상세 보기',
            onClick: () => onView?.(record),
          },
          { type: 'divider' },
        ]

        if (record.status === 'PENDING') {
          menuItems.push(
            {
              key: 'approve',
              label: '승인',
              icon: <CheckOutlined />,
              onClick: () => onApprove?.(record),
            },
            {
              key: 'reject',
              label: '거절',
              icon: <CloseOutlined />,
              danger: true,
              onClick: () => onReject?.(record),
            },
            {
              key: 'close',
              label: '마감',
              icon: <StopOutlined />,
              onClick: () => onClose?.(record),
            }
          )
        }

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  return (
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
  )
}
