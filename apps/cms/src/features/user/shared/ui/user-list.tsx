/**
 * 사용자 목록 컴포넌트
 * 회원 유형(`listKind`)별 컬럼 구성 — `member-list-kinds`와 동기화
 */

import { useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import '@/features/program/ui/program-list.css'
import './admin-permission-tag.css'
import './user-list.css'
import type { User, UserRole } from '@/types/user'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  type AdminPermissionTagVariant,
  getAdminPermissionVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import { getRoleLabel } from '@/shared/ui'
import { formatDate } from '@/shared/utils'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { type MemberListKind, DEFAULT_MEMBER_LIST_KIND } from '@/shared/config/member-list-kinds'
import { getInstructorTypeDisplayLabel } from '@/entities/user/lib/matches-instructor-list-filters'
import { ManagedProgramCountDisplay } from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_160_HEADER_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { AppStatusBadge } from '@/shared/components/app-status-badge'

type Row = Omit<User, 'password'>

interface UserListProps {
  data: Row[]
  loading?: boolean
  onView?: (user: Row) => void
  onDelete?: (user: Row) => void
  selectedRowKeys?: React.Key[]
  onSelectionChange?: (keys: React.Key[]) => void
  pagination?: boolean
  /** URL `kind`와 동일 — 컬럼 세트 결정 */
  listKind?: MemberListKind
  onAdminPermissionChange?: (ctx: {
    userId: string
    nextPermission: AdminPermissionTagVariant
  }) => Promise<void> | void
  adminPermissionChangeLoadingUserId?: string | null
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
  const label = getInstructorTypeDisplayLabel(record)
  return label || '-'
}

function settlementStatusTextClass(statusLabel?: string): string {
  const normalized = statusLabel?.trim()
  switch (normalized) {
    case '확인 대기 중':
      return 'user-list__settlement-status user-list__settlement-status--awaiting-confirmation'
    case '일부 지급 완료':
      return 'user-list__settlement-status user-list__settlement-status--partially-confirmed'
    case '지급조서 확인 완료':
      return 'user-list__settlement-status user-list__settlement-status--payment-statement-verified'
    case '계좌 지급 완료':
      return 'user-list__settlement-status user-list__settlement-status--account-paid'
    case '해당 없음':
      return 'user-list__settlement-status user-list__settlement-status--none'
    case '신청 반려':
      return 'user-list__settlement-status user-list__settlement-status--application-rejected'
    case '지급 정정 요청':
      return 'user-list__settlement-status user-list__settlement-status--payment-correction-requested'
    default:
      return 'user-list__settlement-status'
  }
}

const ADMIN_PERMISSION_OPTIONS: { value: AdminPermissionTagVariant; label: string }[] = [
  { value: 'manager', label: ADMIN_PERMISSION_TAG_LABEL.manager },
  { value: 'partner', label: ADMIN_PERMISSION_TAG_LABEL.partner },
  { value: 'viewer', label: ADMIN_PERMISSION_TAG_LABEL.viewer },
]

function AdminPermissionDropdownCell({
  record,
  onChange,
  loading,
  isOpen,
  onOpenChange,
}: {
  record: Row
  onChange?: (ctx: {
    userId: string
    nextPermission: AdminPermissionTagVariant
  }) => Promise<void> | void
  loading?: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const current = getAdminPermissionVariant(record)
  const renderBadge = (variant: AdminPermissionTagVariant) => (
    <AppStatusBadge
      label={ADMIN_PERMISSION_TAG_LABEL[variant]}
      className={`user-list-admin-perm-badge user-list-admin-perm-badge--${variant}`}
    />
  )

  return (
    <StatusDropdownCell<AdminPermissionTagVariant>
      status={current}
      statusOptions={ADMIN_PERMISSION_OPTIONS.map(option => option.value)}
      renderBadge={renderBadge}
      isItemDisabled={(cur, option) => cur === option}
      onChange={
        onChange
          ? async next => {
              if (next === current) return
              await onChange({ userId: record.id, nextPermission: next })
            }
          : undefined
      }
      isUpdating={loading}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      tagLayout="tag160"
      emptyPlaceholder="-"
    />
  )
}

function columnsForKind(
  kind: MemberListKind,
  options?: {
    onAdminPermissionChange?: (ctx: {
      userId: string
      nextPermission: AdminPermissionTagVariant
    }) => Promise<void> | void
    adminPermissionChangeLoadingUserId?: string | null
    openAdminPermissionDropdownUserId?: string | null
    setOpenAdminPermissionDropdownUserId?: (id: string | null) => void
  }
): ColumnsType<Row> {
  const noCol: ColumnsType<Row>[0] = {
    title: 'No.',
    key: 'no',
    width: 80,
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
        width: 200,
        render: (_: unknown, r: Row) =>
          displayMetric(r.listMetrics?.institutionProgramAttendanceCount),
      },
      {
        title: '등록된 교사 수',
        key: 'teacherCount',
        align: 'center',
        width: 200,
        render: (_: unknown, r: Row) =>
          displayMetric(r.listMetrics?.institutionRegisteredTeacherCount) + '명',
      },
      {
        title: '등록일',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 200,
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
        render: (_: unknown, r: Row) => {
          const statusLabel = r.listMetrics?.settlementStatusLabel?.trim()
          return (
            <span className={settlementStatusTextClass(statusLabel)}>{statusLabel || '-'}</span>
          )
        },
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
        width: 200,
        align: 'center',
        onHeaderCell: () => ({ className: STATUS_DROPDOWN_CELL_TAG_160_HEADER_CLASSNAME }),
        onCell: () => ({
          className: `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME}`,
        }),
        render: (_: unknown, r: Row) => {
          return (
            <AdminPermissionDropdownCell
              record={r}
              onChange={options?.onAdminPermissionChange}
              loading={options?.adminPermissionChangeLoadingUserId === r.id}
              isOpen={options?.openAdminPermissionDropdownUserId === r.id}
              onOpenChange={open =>
                options?.setOpenAdminPermissionDropdownUserId?.(open ? r.id : null)
              }
            />
          )
        },
      },
      {
        title: '담당 프로그램 수',
        key: 'programCount',
        align: 'center',
        ellipsis: true,
        render: (_: unknown, r: Row) => <ManagedProgramCountDisplay user={r} />,
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
  onAdminPermissionChange,
  adminPermissionChangeLoadingUserId,
}: UserListProps) {
  const [openAdminPermissionDropdownUserId, setOpenAdminPermissionDropdownUserId] = useState<
    string | null
  >(null)
  const columns = useMemo(
    () =>
      columnsForKind(listKind, {
        onAdminPermissionChange,
        adminPermissionChangeLoadingUserId,
        openAdminPermissionDropdownUserId,
        setOpenAdminPermissionDropdownUserId,
      }),
    [
      listKind,
      onAdminPermissionChange,
      adminPermissionChangeLoadingUserId,
      openAdminPermissionDropdownUserId,
    ]
  )

  return (
    <Table
      className={`cms-data-table`}
      columns={columns}
      dataSource={data}
      loading={loading}
      scroll={{ x: 'max-content' }}
      rowKey="id"
      onRow={
        onView
          ? record => ({
              onClick: (e: React.MouseEvent<HTMLElement>) => {
                if ((e.target as HTMLElement).closest('.ant-table-selection-column')) return
                if ((e.target as HTMLElement).closest('.status-dropdown-cell__status-trigger'))
                  return
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
  )
}
