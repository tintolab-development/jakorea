/**
 * 사용자 목록 컴포넌트
 * 회원 유형(`listKind`)별 컬럼 구성 — `member-list-kinds`와 동기화
 */

import { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import '@/features/program/ui/program-list.css'
import './admin-permission-tag.css'
import type { User, UserRole } from '@/types/user'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  getAdminPermissionVariant,
} from '@/features/user/lib/admin-permission-display'
import { getRoleLabel } from '@/shared/ui'
import { formatDate } from '@/shared/utils'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { type MemberListKind, DEFAULT_MEMBER_LIST_KIND } from '@/shared/config/member-list-kinds'

type Row = Omit<User, 'password'>

interface UserListProps {
  data: Row[]
  loading?: boolean
  onView?: (user: Row) => void
  onEdit?: (user: Row) => void
  onDelete?: (user: Row) => void
  selectedRowKeys?: React.Key[]
  onSelectionChange?: (keys: React.Key[]) => void
  pagination?: boolean
  /** URL `kind`와 동일 — 컬럼 세트 결정 */
  listKind?: MemberListKind
}

const ROLE_LABELS: Record<UserRole, string> = {
  INDIVIDUAL: '개인',
  SCHOOL: '학교(교사)',
  INSTRUCTOR: '강사',
  ADMIN: '관리자',
}

function maskedPhone(phone: string | undefined): string {
  const t = phone?.trim()
  if (!t) return '-'
  return MASKING_POLICY.phone(t)
}

function maskedEmail(email: string | undefined): string {
  const t = email?.trim()
  if (!t) return '-'
  return MASKING_POLICY.email(t)
}

function displayMetric(n: number | undefined | null) {
  if (n === undefined || n === null) return '-'
  return String(n)
}

function instructorTypeLabel(record: Row): string {
  const fromApi = record.listMetrics?.instructorTypeLabel
  if (fromApi) return fromApi
  if (record.instructorInfo?.isBusinessIncome === true) return '사업소득'
  if (record.instructorInfo?.isBusinessIncome === false) return '기타소득'
  return '-'
}

function adminProgramCountDisplay(record: Row): string {
  const explicit = record.listMetrics?.managedProgramCount
  if (explicit !== undefined && explicit !== null) return String(explicit)
  return String(record.programRoles ? Object.keys(record.programRoles).length : 0)
}

function columnsForKind(kind: MemberListKind): ColumnsType<Row> {
  const noCol: ColumnsType<Row>[0] = {
    title: 'No.',
    key: 'no',
    align: 'center',
    render: (_: unknown, __: Row, index: number) => index + 1,
  }

  if (kind === 'institutions') {
    return [
      noCol,
      {
        title: '기관명',
        key: 'institutionName',
        ellipsis: true,
        align: 'center',
        render: (_: unknown, r: Row) => r.schoolInfo?.schoolName?.trim() || r.name || '-',
      },
      {
        title: '기관 소재지',
        key: 'address',
        ellipsis: true,
        align: 'center',
        render: (_: unknown, r: Row) => r.schoolInfo?.address?.trim() || '-',
      },
      {
        title: '프로그램 수강 횟수',
        key: 'programCount',
        align: 'center',
        render: (_: unknown, r: Row) =>
          displayMetric(r.listMetrics?.institutionProgramAttendanceCount),
      },
      {
        title: '등록된 교사 수',
        key: 'teacherCount',
        align: 'center',
        render: (_: unknown, r: Row) =>
          displayMetric(r.listMetrics?.institutionRegisteredTeacherCount),
      },
      {
        title: '등록일',
        dataIndex: 'createdAt',
        key: 'createdAt',
        align: 'center',
        render: (d: string) => formatDate(new Date(d)),
      },
    ]
  }

  if (kind === 'instructors') {
    return [
      noCol,
      {
        title: '강사명',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        align: 'center',
      },
      {
        title: '연락처',
        dataIndex: 'phone',
        key: 'phone',
        align: 'center',
        render: (phone: string | undefined) => maskedPhone(phone),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        ellipsis: true,
        align: 'center',
        render: (email: string | undefined) => maskedEmail(email),
      },
      {
        title: '강사 유형',
        key: 'instructorType',
        align: 'center',
        render: (_: unknown, r: Row) => instructorTypeLabel(r),
      },
      {
        title: 'JA 평가 등급',
        key: 'jaGrade',
        align: 'center',
        render: (_: unknown, r: Row) => r.listMetrics?.jaEvaluationGrade?.trim() || '-',
      },
      {
        title: '정산현황',
        key: 'settlement',
        align: 'center',
        render: (_: unknown, r: Row) => r.listMetrics?.settlementStatusLabel?.trim() || '-',
      },
      {
        title: '가입일',
        dataIndex: 'createdAt',
        key: 'createdAt',
        align: 'center',
        render: (d: string) => formatDate(new Date(d)),
      },
    ]
  }

  if (kind === 'admins') {
    return [
      noCol,
      {
        title: '관리자명',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        align: 'center',
      },
      {
        title: '연락처',
        dataIndex: 'phone',
        key: 'phone',
        align: 'center',
        render: (phone: string | undefined) => maskedPhone(phone),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        ellipsis: true,
        align: 'center',
        render: (email: string | undefined) => maskedEmail(email),
      },
      {
        title: '권한 유형',
        key: 'permission',
        align: 'center',
        render: (_: unknown, r: Row) => {
          const v = getAdminPermissionVariant(r)
          return (
            <span className={`user-list-admin-perm-tag user-list-admin-perm-tag--${v}`}>
              {ADMIN_PERMISSION_TAG_LABEL[v]}
            </span>
          )
        },
      },
      {
        title: '담당 프로그램 수',
        key: 'programCount',
        align: 'center',
        render: (_: unknown, r: Row) => adminProgramCountDisplay(r) + '개',
      },
      {
        title: '가입일',
        dataIndex: 'createdAt',
        key: 'createdAt',
        align: 'center',
        render: (d: string) => formatDate(new Date(d)),
      },
    ]
  }

  return [
    noCol,
    {
      title: '회원명',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      align: 'center',
    },
    {
      title: '연락처',
      dataIndex: 'phone',
      key: 'phone',
      align: 'center',
      render: (phone: string | undefined) => maskedPhone(phone),
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
      align: 'center',
      render: (email: string | undefined) => maskedEmail(email),
    },
    {
      title: '회원 유형',
      dataIndex: 'role',
      key: 'role',
      align: 'center',
      render: (role: UserRole, record: Row) =>
        ROLE_LABELS[role] ?? getRoleLabel(role, record.adminLevel),
    },
    {
      title: '가입일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
      render: (d: string) => formatDate(new Date(d)),
    },
  ]
}

export function UserList({
  data,
  loading = false,
  onView,
  selectedRowKeys = [],
  onSelectionChange,
  pagination = true,
  listKind = DEFAULT_MEMBER_LIST_KIND,
}: UserListProps) {
  const columns = useMemo(() => columnsForKind(listKind), [listKind])

  return (
    <div className="program-list-table-wrapper">
      <Table
        className={`cms-data-table`}
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
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
