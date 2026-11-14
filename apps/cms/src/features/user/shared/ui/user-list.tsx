/**
 * 사용자 목록 컴포넌트
 * 회원 유형(`listKind`)별 컬럼 구성 — `member-list-kinds`와 동기화
 */

import { useMemo, useState, type CSSProperties } from 'react'
import { useContainerFitTableScrollX } from '@/shared/lib/resolve-table-min-scroll-x'
import type { ColumnsType } from 'antd/es/table'
import '@/features/program/general/ui/program-list.css'
import type { User } from '@/types/user'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  type AdminPermissionTagVariant,
  getAdminPermissionVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import { formatDateDot } from '@/shared/utils'
import {
  formatSchoolRegionLabel,
  getAllMemberListRoleTypeLabel,
  getMemberSignupTypeLabel,
} from '@/features/user/shared/lib/member-list-display'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { type MemberListKind, DEFAULT_MEMBER_LIST_KIND } from '@/shared/config/member-list-kinds'
import { formatAdminManagedProgramCountForList } from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import { formatJaEvaluationGradeCellDisplay } from '@/features/program/general/lib/ja-evaluation-grade-display'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import { resolveInstructorSettlementUiStatusFromListLabel } from '@/shared/constants/instructor-settlement-status'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { getAdminListPermissionTag } from '@/shared/lib/status-tag-specs'
import { guardAdminAction } from '@/shared/lib/admin-role-policy'
import { getSessionAdminRoleCode } from '@/shared/lib/session-admin-role'

type Row = Omit<User, 'password'>

/** 전체 회원 목록(Figma 1142:84965) 이메일 열 폭 */
const ALL_MEMBER_LIST_EMAIL_COLUMN_WIDTH = 300

/** 강사·관리자 회원 목록 시안 고정 열 폭 — 나머지 열은 남은 폭 균등 */
const MEMBER_LIST_FIXED_COLUMN_WIDTH = {
  instructorName: 200,
  jaGrade: 160,
  settlement: 200,
  adminName: 200,
  adminPermission: 170,
  adminProgramCount: 200,
} as const

/** 전체·학교·강사·관리자 회원 목록 시안 — 선택 열 60 (cms-data-table 룰: 화면별 `--table-selection-column-width`) */
const COMPACT_SELECTION_COLUMN_WIDTH = 60

/** 학교(교사) 목록 시안 — 기관명·소재지·수강 횟수·교사 수·등록일 5열 모두 279 */
const INSTITUTION_LIST_COLUMN_WIDTH = 279

function resolveListSelectionColumnWidth(kind: MemberListKind): number {
  return kind === 'instructors' || kind === 'admins' || kind === 'all' || kind === 'institutions'
    ? COMPACT_SELECTION_COLUMN_WIDTH
    : TABLE_COLUMN_WIDTHS.checkbox
}

interface UserListProps {
  data: Row[]
  loading?: boolean
  onView?: (user: Row) => void
  onDelete?: (user: Row) => void
  selectedRowKeys?: React.Key[]
  onSelectionChange?: (keys: React.Key[], rows: Row[]) => void
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

function displayPhone(phone: string | undefined, maskInList: boolean): string {
  const t = phone?.trim()
  if (!t) return '-'
  return maskInList ? MASKING_POLICY.phone(t) : t
}

function displayEmail(email: string | undefined, maskInList: boolean): string {
  const t = email?.trim()
  if (!t) return '-'
  return maskInList ? MASKING_POLICY.email(t) : t
}

function displayMetric(n: number | undefined | null) {
  if (n === undefined || n === null) return '-'
  return String(n)
}

/** 학교 목록 「프로그램 수강 횟수」 — 시안: `N회`, 0·미집계는 `-` */
function displayProgramAttendanceCount(n: number | undefined | null) {
  if (n === undefined || n === null || n === 0) return '-'
  return `${n}회`
}

function renderInstructorSettlementStatusCell(labelRaw?: string) {
  const label = labelRaw?.trim()
  if (!label || label === '-') return '-'

  const status = resolveInstructorSettlementUiStatusFromListLabel(label)
  if (status) {
    return <InstructorSettlementStatusText status={status} label={label} />
  }

  return <span>{label}</span>
}

const ADMIN_PERMISSION_OPTIONS: { value: AdminPermissionTagVariant; label: string }[] = [
  { value: 'manager', label: ADMIN_PERMISSION_TAG_LABEL.manager },
  { value: 'accounting', label: ADMIN_PERMISSION_TAG_LABEL.accounting },
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

  return (
    <StatusDropdownCell<AdminPermissionTagVariant>
      status={current}
      statusOptions={ADMIN_PERMISSION_OPTIONS.map(option => option.value)}
      getTag={getAdminListPermissionTag}
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
      emptyPlaceholder="-"
    />
  )
}

function createNoColumn(reverseFromTotal?: number): ColumnsType<Row>[0] {
  return {
    title: 'No.',
    key: 'no',
    width: TABLE_COLUMN_WIDTHS.index,
    align: 'center',
    className: CMS_TABLE_NO_COL_CLASS,
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
  /** 목록 개인정보는 서버가 마스킹해 준다(`members/all` 포함). 전체 목록은 서버 값을 그대로 쓰고, 그 외는 원문이 섞여 와도 가리는 안전장치 */
  const maskListPii = kind !== 'all'

  if (kind === 'institutions') {
    return [
      noCol,
      {
        title: '기관명',
        key: 'institutionName',
        width: INSTITUTION_LIST_COLUMN_WIDTH,
        ellipsis: true,
        align: 'center',
        render: (_: unknown, r: Row) => r.schoolInfo?.schoolName?.trim() || r.name || '-',
      },
      {
        title: '기관 소재지',
        key: 'address',
        width: INSTITUTION_LIST_COLUMN_WIDTH,
        ellipsis: true,
        align: 'center',
        /** 시안: 시·도 + 시·군·구만 */
        render: (_: unknown, r: Row) => formatSchoolRegionLabel(r.schoolInfo),
      },
      {
        title: '프로그램 수강 횟수',
        key: 'programCount',
        align: 'center',
        width: INSTITUTION_LIST_COLUMN_WIDTH,
        render: (_: unknown, r: Row) =>
          displayProgramAttendanceCount(r.listMetrics?.institutionProgramAttendanceCount),
      },
      {
        title: '등록된 교사 수',
        key: 'teacherCount',
        align: 'center',
        width: INSTITUTION_LIST_COLUMN_WIDTH,
        render: (_: unknown, r: Row) =>
          displayMetric(r.listMetrics?.institutionRegisteredTeacherCount) + '명',
      },
      {
        title: '등록일',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: INSTITUTION_LIST_COLUMN_WIDTH,
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
        width: MEMBER_LIST_FIXED_COLUMN_WIDTH.instructorName,
        ellipsis: true,
        align: 'center',
      },
      {
        title: '연락처',
        dataIndex: 'phone',
        key: 'phone',
        align: 'center',
        render: (phone: string | undefined) => displayPhone(phone, maskListPii),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        ellipsis: true,
        align: 'center',
        render: (email: string | undefined) => displayEmail(email, maskListPii),
      },
      {
        title: 'JA 평가 등급',
        key: 'jaGrade',
        width: MEMBER_LIST_FIXED_COLUMN_WIDTH.jaGrade,
        align: 'center',
        render: (_: unknown, r: Row) =>
          formatJaEvaluationGradeCellDisplay(r.listMetrics?.jaEvaluationGrade),
      },
      {
        title: '정산 현황',
        key: 'settlement',
        width: MEMBER_LIST_FIXED_COLUMN_WIDTH.settlement,
        align: 'center',
        render: (_: unknown, r: Row) =>
          renderInstructorSettlementStatusCell(r.listMetrics?.settlementStatusLabel),
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
        width: MEMBER_LIST_FIXED_COLUMN_WIDTH.adminName,
        ellipsis: true,
        align: 'center',
      },
      {
        title: '연락처',
        dataIndex: 'phone',
        key: 'phone',
        align: 'center',
        render: (phone: string | undefined) => displayPhone(phone, maskListPii),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        ellipsis: true,
        align: 'center',
        render: (email: string | undefined) => displayEmail(email, maskListPii),
      },
      {
        title: '권한 유형',
        key: 'permission',
        width: MEMBER_LIST_FIXED_COLUMN_WIDTH.adminPermission,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (_: unknown, r: Row) => {
          return (
            <AdminPermissionDropdownCell
              record={r}
              onChange={options?.onAdminPermissionChange}
              loading={options?.adminPermissionChangeLoadingUserId === r.id}
              isOpen={options?.openAdminPermissionDropdownUserId === r.id}
              onOpenChange={open => {
                // 권한 설정 V1.2: 관리자 권한 유형 변경(관리자 수정)은 Master 전용.
                // 드롭다운은 노출하되 Master가 아니면 열지 않고 접근 불가 안내를 띄운다.
                if (open && !guardAdminAction({ roleCode: getSessionAdminRoleCode(), action: 'adminAccountManage' })) return
                options?.setOpenAdminPermissionDropdownUserId?.(open ? r.id : null)
              }}
            />
          )
        },
      },
      {
        title: '담당 프로그램 수',
        key: 'programCount',
        width: MEMBER_LIST_FIXED_COLUMN_WIDTH.adminProgramCount,
        align: 'center',
        ellipsis: true,
        render: (_: unknown, r: Row) => formatAdminManagedProgramCountForList(r),
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
      render: (phone: string | undefined) => displayPhone(phone, maskListPii),
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
      /** 전체 회원 목록 시안 — 이메일 열만 300 고정, 나머지 열은 남은 폭 균등 */
      width: ALL_MEMBER_LIST_EMAIL_COLUMN_WIDTH,
      ellipsis: true,
      align: 'center',
      render: (email: string | undefined) => displayEmail(email, maskListPii),
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

/**
 * 회원 목록 엑셀 — 탭별 화면 테이블 열 구성 그대로 (회원 유형·가입 유형·권한 유형·정산 현황·기관 소재지 등).
 * 셀 값은 화면 render 와 같아 목록 개인정보 마스킹이 그대로 유지된다.
 */
export function buildUserListExcelColumns(
  kind: MemberListKind,
  totalCount?: number
): ColumnsType<Row> {
  return columnsForKind(kind, { totalCount })
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

  const selectionColumnWidth = resolveListSelectionColumnWidth(listKind)
  const { tableWrapRef, tableScrollX } = useContainerFitTableScrollX(
    columns as ColumnsType<unknown>,
    {
      includeSelection: onSelectionChange != null,
      selectionWidth: selectionColumnWidth,
    }
  )

  return (
    <div
      ref={tableWrapRef}
      className="cms-data-table-fit-scroll-wrap"
      style={
        selectionColumnWidth !== TABLE_COLUMN_WIDTHS.checkbox
          ? ({
              '--table-selection-column-width': `${selectionColumnWidth}px`,
            } as CSSProperties)
          : undefined
      }
    >
      <CmsDataTable
        className="cms-data-table cms-data-table--fit-scroll user-list-table"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={tableScrollX != null ? { x: tableScrollX } : undefined}
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
                columnWidth: selectionColumnWidth,
                selectedRowKeys,
                preserveSelectedRowKeys: true,
                onChange: (keys, rows) => onSelectionChange(keys, rows),
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
