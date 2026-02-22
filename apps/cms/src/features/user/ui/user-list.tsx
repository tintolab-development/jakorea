/**
 * 사용자 목록 컴포넌트
 * Phase 5.1.2: 사용자 관리 페이지
 * 리뉴얼: No., 회원명, 연락처, 이메일, 회원 유형, 가입일 컬럼 + rowSelection 지원
 */

import { Table, Dropdown, Button } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { User, UserRole } from '@/types/user'
import { getRoleLabel } from '@/shared/ui'
import { formatDate } from '@/shared/utils'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'

interface UserListProps {
  data: Omit<User, 'password'>[]
  loading?: boolean
  onView?: (user: Omit<User, 'password'>) => void
  onEdit?: (user: Omit<User, 'password'>) => void
  onDelete?: (user: Omit<User, 'password'>) => void
  /** 행 선택 시 (일괄 삭제용) */
  selectedRowKeys?: React.Key[]
  onSelectionChange?: (keys: React.Key[]) => void
  /** false면 페이지네이션 비표시 (무한 스크롤 시) */
  pagination?: boolean
}

const ROLE_LABELS: Record<UserRole, string> = {
  INDIVIDUAL: '개인',
  SCHOOL: '학교(교사)',
  INSTRUCTOR: '강사',
  ADMIN: '관리자',
}

export function UserList({
  data,
  loading = false,
  onView,
  onEdit,
  onDelete,
  selectedRowKeys = [],
  onSelectionChange,
  pagination = true,
}: UserListProps) {
  const columns: ColumnsType<Omit<User, 'password'>> = [
    {
      title: 'No.',
      key: 'no',
      width: 64,
      align: 'center',
      render: (_: unknown, __: Omit<User, 'password'>, index: number) => index + 1,
    },
    {
      title: '회원명',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '연락처',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (phone: string | undefined) => phone ?? '-',
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '회원 유형',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: UserRole, record) => ROLE_LABELS[role] ?? getRoleLabel(role, record.adminLevel),
    },
    {
      title: '가입일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => formatDate(new Date(date)),
    },
    {
      title: '작업',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            label: '상세 보기',
            icon: <EyeOutlined />,
            onClick: () => onView?.(record),
          },
          {
            key: 'edit',
            label: '권한 변경',
            icon: <EditOutlined />,
            onClick: () => onEdit?.(record),
          },
          ...(onDelete
            ? [
                {
                  key: 'delete',
                  label: '삭제',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => onDelete(record),
                },
              ]
            : []),
        ]
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
      scroll={{ x: 900 }}
      rowSelection={
        onSelectionChange
          ? {
              selectedRowKeys,
              onChange: keys => onSelectionChange(keys as string[]),
            }
          : undefined
      }
      pagination={
        pagination
          ? {
              ...PAGINATION_CONFIG,
              showTotal: (total: number) => `총 ${total}명`,
            }
          : false
      }
    />
  )
}
