/**
 * 사용자 목록 컴포넌트
 * Phase 5.1.2: 사용자 관리 페이지
 */

import { Table, Tag, Dropdown, Button } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { User, UserRole } from '@/types/user'
import { RoleBadge, getRoleLabel, getProgramRoleLabel } from '@/shared/ui'
import { InterviewStatusBadge } from '@/shared/components/interview-status-badge'
import { formatDate } from '@/shared/utils'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'

interface UserListProps {
  data: Omit<User, 'password'>[]
  loading?: boolean
  onView?: (user: Omit<User, 'password'>) => void
  onEdit?: (user: Omit<User, 'password'>) => void
}

export function UserList({ data, loading = false, onView, onEdit }: UserListProps) {
  const columns: ColumnsType<Omit<User, 'password'>> = [
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      fixed: 'left',
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '권한',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: UserRole, record) => (
        <RoleBadge role={role} adminLevel={record.adminLevel} size="small" variant="tag" />
      ),
    },
    {
      title: '관리자 구분',
      dataIndex: 'adminLevel',
      key: 'adminLevel',
      width: 140,
      render: (adminLevel, record) => {
        if (record.role !== 'ADMIN' || !adminLevel) {
          return <Tag>-</Tag>
        }
        return <Tag>{getRoleLabel('ADMIN', adminLevel)}</Tag>
      },
    },
    {
      title: '프로그램 범위',
      dataIndex: 'programRoles',
      key: 'programRoles',
      width: 140,
      render: (programRoles, record) => {
        if (record.role !== 'ADMIN' || !programRoles) {
          return <Tag>-</Tag>
        }
        // 첫 번째 프로그램 역할 표시
        const firstRole = Object.values(programRoles)[0]
        return firstRole ? <Tag>{getProgramRoleLabel(firstRole as any)}</Tag> : <Tag>-</Tag>
      },
    },
    {
      title: '면접 상태',
      dataIndex: 'interviewStatus',
      key: 'interviewStatus',
      width: 140,
      render: (status, record) => {
        // 강사/개인(참여자)/학교만 면접 상태 표시
        if (
          record.role === 'INSTRUCTOR' ||
          record.role === 'INDIVIDUAL' ||
          record.role === 'SCHOOL'
        ) {
          return status ? <InterviewStatusBadge status={status} /> : <Tag>-</Tag>
        }
        return <Tag>-</Tag>
      },
    },
    {
      title: '참여이력',
      dataIndex: 'participationHistory',
      key: 'participationHistory',
      width: 100,
      align: 'center',
      render: (history, record) => {
        // 강사/개인(참여자)/학교만 참여이력 표시
        if (
          record.role === 'INSTRUCTOR' ||
          record.role === 'INDIVIDUAL' ||
          record.role === 'SCHOOL'
        ) {
          return history ?? 0
        }
        return <span>-</span>
      },
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: '마지막 로그인',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 180,
      render: (date: string | undefined) => (date ? formatDate(new Date(date)) : '-'),
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => formatDate(new Date(date)),
    },
    {
      title: '작업',
      key: 'actions',
      width: 120,
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
      scroll={{ x: 1400 }}
      pagination={{
        ...PAGINATION_CONFIG,
        showTotal: (total) => `총 ${total}명`,
      }}
    />
  )
}

