/**
 * 면접 목록 컴포넌트
 * Phase 4.3.2: 면접 관리
 */

import { Table, Button, Tag, Dropdown } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import {
  MoreOutlined,
  EyeOutlined,
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import type { Interview } from '@/types/interview'
import type { User } from '@/types/user'
import { InterviewStatusBadge } from '@/shared/components/interview-status-badge'
import { mockUsers } from '@/data/mock'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'

interface InterviewListProps {
  data: Interview[]
  loading?: boolean
  onView?: (interview: Interview) => void
  onSchedule?: (interview: Interview) => void
  onApprove?: (interview: Interview) => void
  onReject?: (interview: Interview) => void
  onRowClick?: (interview: Interview) => void
}

export function InterviewList({
  data,
  loading,
  onView,
  onSchedule,
  onApprove,
  onReject,
  onRowClick,
}: InterviewListProps) {
  // 작업 메뉴 아이템 생성
  const getMenuItems = (record: Interview): MenuProps['items'] => {
    const items: MenuProps['items'] = []

    if (onView) {
      items.push({
        key: 'view',
        label: '상세 보기',
        icon: <EyeOutlined />,
        onClick: () => onView(record),
      })
    }

    if (record.status === 'PENDING' && onSchedule) {
      items.push({
        key: 'schedule',
        label: '일정 등록',
        icon: <CalendarOutlined />,
        onClick: () => onSchedule(record),
      })
    }

    if (
      (record.status === 'COMPLETED' || record.status === 'NOT_REQUIRED') &&
      record.interviewResult !== 'FAIL' &&
      onApprove
    ) {
      items.push({
        key: 'approve',
        label: '승인',
        icon: <CheckOutlined />,
        onClick: () => onApprove(record),
      })
    }

    if (onReject) {
      items.push({
        key: 'reject',
        label: '반려',
        icon: <CloseOutlined />,
        danger: true,
        onClick: () => onReject(record),
      })
    }

    return items
  }

  const columns: ColumnsType<Interview> = [
    {
      title: '신청자',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
      render: (userId: string) => {
        const user = mockUsers.find((u: User) => u.id === userId)
        return user?.name || userId
      },
    },
    {
      title: '신청 유형',
      dataIndex: 'userRole',
      key: 'userRole',
      width: 100,
      render: (role: string) => (
        <Tag color={role === 'INSTRUCTOR' ? 'blue' : 'green'}>
          {role === 'INSTRUCTOR' ? '강사' : '봉사자'}
        </Tag>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: Interview['status']) => <InterviewStatusBadge status={status} />,
    },
    {
      title: '참여이력',
      dataIndex: 'participationHistory',
      key: 'participationHistory',
      width: 100,
      align: 'center',
    },
    {
      title: '면접 일정',
      dataIndex: 'scheduledAt',
      key: 'scheduledAt',
      width: 180,
      render: (date: string | undefined) => (date ? new Date(date).toLocaleString('ko-KR') : '-'),
    },
    {
      title: '면접 장소',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (location: string | undefined) => location || '-',
    },
    {
      title: '신청 일자',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '작업',
      key: 'actions',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_: unknown, record: Interview) => {
        const menuItems = getMenuItems(record)

        if (!menuItems || menuItems.length === 0) {
          return null
        }

        return (
          <div onClick={e => e.stopPropagation()}>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} onClick={e => e.stopPropagation()} />
            </Dropdown>
          </div>
        )
      },
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      scroll={{ x: 1200 }}
      onRow={
        onRowClick
          ? record => ({
              onClick: () => onRowClick(record),
              style: { cursor: 'pointer' },
            })
          : undefined
      }
      pagination={{
        ...PAGINATION_CONFIG,
        showTotal: total => `총 ${total}건`,
      }}
    />
  )
}
