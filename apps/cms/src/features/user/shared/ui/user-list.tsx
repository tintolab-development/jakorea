/**
 * 사용자 목록 컴포넌트
 * 회원 유형(`listKind`)별 컬럼 구성 — `member-list-kinds`와 동기화
 */

import { useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import '@/features/program/general/ui/program-list.css'
import './admin-permission-tag.css'
import './user-list.css'
import type { User } from '@/types/user'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  type AdminPermissionTagVariant,
  getAdminPermissionVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import { formatDateDot } from '@/shared/utils'
import {
  getAllMemberListRoleTypeLabel,
  getMemberSignupTypeLabel,
} from '@/features/user/shared/lib/member-list-display'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { type MemberListKind, DEFAULT_MEMBER_LIST_KIND } from '@/shared/config/member-list-kinds'
import { ManagedProgramCountDisplay } from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import { formatJaEvaluationGradeCellDisplay } from '@/features/program/general/lib/ja-evaluation-grade-display'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS,
  INSTRUCTOR_SETTLEMENT_STATUS_ORDER,
  type InstructorSettlementUiStatus,
} from '@/shared/constants/instructor-settlement-status'
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
  /** 회원 목록 — 가입일 내림차순 기준 No. 역순 (맨 아래 = 1) */
  totalCount?: number
  /** URL `kind`와 동일 — 컬럼 세트 결정 */
  listKind?: MemberListKind
  onAdminPermissionChange?: (ctx: {
    userId: string
    nextPermission: AdminPermissionTagVariant
  }) => Promise<void> | void
  adminPermissionChangeLoadingUserId?: string | null
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

function resolveSettlementUiStatus(
  statusLabel?: string
): InstructorSettlementUiStatus | null {
  const normalized = statusLabel?.trim()
  if (!normalized || normalized === '-') return null
  for (const status of INSTRUCTOR_SETTLEMENT_STATUS_ORDER) {
    if (INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status] === normalized) return status
  }
  // 구 mock·라벨 호환
  if (normalized === '확인 진행중') return 'partial_confirmation'
  return null
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

function createNoColumn(reverseFromTotal?: number): ColumnsType<Row>[0] {
  return {
    title: 'No.',
    key: 'no',
    width: 80,
    align: 'center',
    render: (_: unknown, __: Row, index: number) => {
      if (reverseFromTotal != null && reverseFromTotal > 0) {
        return reverseFromTotal - index
      }
      return index + 1
    },
  }
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
    totalCount?: number
  }
): ColumnsType<Row> {
  const noCol = createNoColumn(options?.totalCount)

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
        render: (_: unknown, r: Row) => {
          const parts = [
            r.schoolInfo?.address?.trim(),
            r.schoolInfo?.addressDetail?.trim(),
          ].filter(Boolean)
          return parts.length > 0 ? parts.join(' ') : '-'
        },
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
        render: (d: string) => formatDateDot(d),
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
        title: 'JA 평가 등급',
        key: 'jaGrade',
        align: 'center',
        render: (_: unknown, r: Row) =>
          formatJaEvaluationGradeCellDisplay(r.listMetrics?.jaEvaluationGrade),
      },
      {
        title: '정산 현황',
        key: 'settlement',
        align: 'center',
        render: (_: unknown, r: Row) => {
          const status = resolveSettlementUiStatus(r.listMetrics?.settlementStatusLabel)
          if (!status) return '-'
          return <InstructorSettlementStatusText status={status} />
        },
      },
      {
        title: '가입일',
        dataIndex: 'createdAt',
        key: 'createdAt',
        align: 'center',
        render: (d: string) => formatDateDot(d),
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
        render: (d: string) => formatDateDot(d),
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
      key: 'role',
      align: 'center',
      render: (_: unknown, record: Row) => getAllMemberListRoleTypeLabel(record),
    },
    {
      title: '가입 유형',
      key: 'signupType',
      align: 'center',
      render: (_: unknown, record: Row) => getMemberSignupTypeLabel(record),
    },
    {
      title: '가입일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
      render: (d: string) => formatDateDot(d),
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
  totalCount,
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
        totalCount,
      }),
    [
      listKind,
      totalCount,
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
