/**
 * 사용자 목록 컴포넌트
 * Phase 5.1.2: 사용자 관리 페이지
 * 스펙: apps/cms/.cursor/rules/process/member-list-table-spec.md
 * 테이블 컬럼: [선택], No., 회원명, 연락처, 이메일, 회원 유형, 가입일 (작업 컬럼 없음, 행 클릭 시 상세)
 */

import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import '@/features/program/ui/program-list.css'
import './user-list-table.css'
import type { User, UserRole } from '@/types/user'
import { getRoleLabel } from '@/shared/ui'
import { formatDate } from '@/shared/utils'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'

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
  selectedRowKeys = [],
  onSelectionChange,
  pagination = true,
}: UserListProps) {
  const columns: ColumnsType<Omit<User, 'password'>> = [
    {
      title: 'No.',
      key: 'no',
      width: '7%',
      align: 'center',
      render: (_: unknown, __: Omit<User, 'password'>, index: number) => index + 1,
    },
    {
      title: '회원명',
      dataIndex: 'name',
      key: 'name',
      width: '15%',
      align: 'center',
    },
    {
      title: '연락처',
      dataIndex: 'phone',
      key: 'phone',
      width: '17%',
      align: 'center',
      render: (phone: string | undefined) => phone ?? '-',
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
      width: '27%',
      align: 'center',
    },
    {
      title: '회원 유형',
      dataIndex: 'role',
      key: 'role',
      width: '17%',
      align: 'center',
      render: (role: UserRole, record) => ROLE_LABELS[role] ?? getRoleLabel(role, record.adminLevel),
    },
    {
      title: '가입일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '17%',
      align: 'center',
      render: (date: string) => formatDate(new Date(date)),
    },
  ]

  return (
    <div className="program-list-table-wrapper program-list-table-wrapper--scroll-x">
      <Table
        className="user-list-table"
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        tableLayout="fixed"
        scroll={{ x: 2000, y: 'calc(100vh - 320px)' }}
        onRow={
          onView
            ? record => ({
                onClick: (e: React.MouseEvent<HTMLElement>) => {
                  if ((e.target as HTMLElement).closest('.ant-table-selection-column')) return
                  onView(record)
                },
                style: { cursor: 'pointer' },
              })
            : undefined
        }
        rowSelection={
          onSelectionChange
            ? {
                columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
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
    </div>
  )
}
