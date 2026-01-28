/**
 * 강사 신청 목록 컴포넌트
 * Phase 4.3: 강의 신청 관리 (FR-F02)
 */

import { useMemo } from 'react'
import { Table, Tag, Button, Dropdown } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { MoreOutlined, CheckOutlined, CloseOutlined, StopOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import type { InstructorApplicationItem } from '@/entities/instructor-application/api/instructor-application-service'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'

interface InstructorApplicationListProps {
  data: InstructorApplicationItem[]
  loading?: boolean
  onView?: (item: InstructorApplicationItem) => void
  onApprove?: (item: InstructorApplicationItem) => void
  onReject?: (item: InstructorApplicationItem) => void
  onClose?: (item: InstructorApplicationItem) => void
}

const statusConfig: Record<InstructorApplicationItem['status'], { label: string; color: string }> =
  {
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
  // 작업 메뉴 아이템 생성 함수
  const createMenuItems = useMemo(
    () =>
      (record: InstructorApplicationItem): MenuProps['items'] => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            label: '상세 보기',
            onClick: () => onView?.(record),
          },
        ]

        // PENDING 상태일 때만 승인/거절/마감 옵션 추가
        if (record.status === 'PENDING') {
          menuItems.push(
            { type: 'divider' },
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

        return menuItems
      },
    [onView, onApprove, onReject, onClose]
  )

  const columns: ColumnsType<InstructorApplicationItem> = useMemo(
    () => [
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: 150,
        ellipsis: true,
      },
      {
        title: '프로그램명',
        dataIndex: 'programName',
        key: 'programName',
        width: 200,
        ellipsis: true,
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
          const menuItems = createMenuItems(record)

          return (
            <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
              <Dropdown
                menu={{
                  items: menuItems,
                  onClick: e => {
                    e.domEvent.stopPropagation()
                  },
                }}
                trigger={['click']}
                getPopupContainer={() => document.body}
                placement="bottomRight"
                overlayStyle={{ zIndex: 1050 }}
              >
                <Button type="text" icon={<MoreOutlined />} onClick={e => e.stopPropagation()} />
              </Dropdown>
            </div>
          )
        },
      },
    ],
    [createMenuItems]
  )

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="id"
      loading={loading}
      scroll={{ x: 'max-content' }}
      pagination={{
        ...PAGINATION_CONFIG,
        showTotal: total => `총 ${total}개`,
      }}
      onRow={record => ({
        onClick: () => onView?.(record),
        style: { cursor: 'pointer' },
      })}
    />
  )
}
