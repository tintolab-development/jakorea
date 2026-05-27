/**
 * 회원 권한 신청 목록 — 강사·관리자 공통 UI (`FilterTableLayout` / user-list·program-list 스타일 정렬)
 */

import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useRef,
  type Key,
  type MouseEvent,
} from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout, type FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import {
  membersPermissionTablePageConfig,
  type MembersPermissionTableContext,
} from './members-permission-table.config'
import type {
  MemberPermissionApplicationRow,
  MemberPermissionApplicationStatus,
} from '@/types/member-permission-application'
import {
  mockMemberPermissionApplicationsAdmin,
  mockMemberPermissionApplicationsInstructor,
} from '@/data/mock/member-permission-applications'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { UserDetailPermissionRole } from '@/pages/users/user-detail-fullpage-modal'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'
import './members-permission-list.css'
import { CmsButton, ContentModal } from '@/shared/ui'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { usePersonalInfoRevealByRow } from '@/features/user/detail/lib/use-personal-info-reveal'

const MEMBER_CATEGORY_LABEL: Record<MemberPermissionApplicationRow['memberCategory'], string> = {
  SCHOOL: '학교(교사)',
  INDIVIDUAL: '개인',
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

function listTitle(memberType: 'instructor' | 'admin'): string {
  return memberType === 'instructor' ? '강사 권한 신청 목록' : '관리자 권한 신청 목록'
}

function memberPermissionApprovalStatusTextTag(status: MemberPermissionApplicationStatus) {
  const base = 'members-permission-list__approval-status'
  if (status === 'APPROVED') {
    return <span className={`${base} ${base}--approved`}>승인 완료</span>
  }
  if (status === 'REJECTED') {
    return <span className={`${base} ${base}--rejected`}>신청 반려</span>
  }
  return <span className={`${base} ${base}--pending`}>승인 대기</span>
}

export interface MembersPermissionListProps {
  memberType: 'instructor' | 'admin'
  /** 행 클릭 시 회원 상세 풀페이지 모달 오픈 */
  onOpenUserDetail?: (
    userId: string,
    permissionRole: UserDetailPermissionRole
  ) => void | Promise<void>
  /**
   * 강사 탭: 승인 대기 행 선택 후 [신청 승인] — 단건은 이름, 다건은 일괄 승인 모달로 연결
   */
  onInstructorApproveRequest?: (
    ctx:
      | { mode: 'single'; userId: string; displayName: string }
      | { mode: 'bulk'; userIds: string[]; memberCount: number }
  ) => void
  /** 강사 탭: 행 선택 후 [승인 반려] — 승인 대기·승인 완료·신청 반려 모두 재반려 가능 */
  onInstructorRejectRequest?: (
    ctx:
      | { mode: 'single'; userId: string; displayName: string }
      | { mode: 'bulk'; userIds: string[]; memberCount: number }
  ) => void
  /** 관리자 탭: [신청 승인] — 강사 탭과 동일하게 단건·일괄 승인 모달 */
  onAdminApproveRequest?: (
    ctx:
      | { mode: 'single'; userId: string; displayName: string }
      | { mode: 'bulk'; userIds: string[]; memberCount: number }
  ) => void
  /** 관리자 탭: [신청 반려] */
  onAdminRejectRequest?: (
    ctx:
      | { mode: 'single'; userId: string; displayName: string }
      | { mode: 'bulk'; userIds: string[]; memberCount: number }
  ) => void
}

export type MembersPermissionListHandle = {
  applyInstructorPermissionApproved: (userId: string) => void
  applyInstructorPermissionRejected: (userId: string) => void
  applyInstructorPermissionPending: (userId: string) => void
  clearRowSelection: () => void
}

export const MembersPermissionList = forwardRef<
  MembersPermissionListHandle,
  MembersPermissionListProps
>(function MembersPermissionList(
  {
    memberType,
    onOpenUserDetail,
    onInstructorApproveRequest,
    onInstructorRejectRequest,
    onAdminApproveRequest,
    onAdminRejectRequest,
  },
  ref
) {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const [searchParams, setSearchParams] = useSearchParams()

  const tableContext = useMemo<MembersPermissionTableContext>(() => ({ memberType }), [memberType])

  const baseRows = useMemo(
    () =>
      memberType === 'instructor'
        ? [...mockMemberPermissionApplicationsInstructor]
        : [...mockMemberPermissionApplicationsAdmin],
    [memberType]
  )

  const [rows, setRows] = useState<MemberPermissionApplicationRow[]>(baseRows)

  const {
    pendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    displayedCount,
    tableData,
  } = useTablePage(membersPermissionTablePageConfig, {
    data: rows,
    searchParams,
    setSearchParams,
    context: tableContext,
  })

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  /**
   * 체크박스 onChange에서만 갱신. 렌더에서 state→ref 동기화 금지(덮어써서 빈 배열이 되는 레이스 방지).
   * [승인 반려]/[신청 승인] 클릭 시에는 ref를 읽어 최신 선택을 보장한다.
   */
  const selectedRowKeysRef = useRef<Key[]>([])
  const rowsRef = useRef(rows)
  rowsRef.current = rows
  const [bulkApproveBlockedSelectedCount, setBulkApproveBlockedSelectedCount] = useState<
    number | null
  >(null)
  const [bulkRejectBlockedSelectedCount, setBulkRejectBlockedSelectedCount] = useState<
    number | null
  >(null)

  useEffect(() => {
    setRows(baseRows)
    setBulkApproveBlockedSelectedCount(null)
    setBulkRejectBlockedSelectedCount(null)
  }, [baseRows])

  const resolvePermissionListPersonalInfoAccessItem = useCallback((rowId: string) => {
    const target = rowsRef.current.find(row => row.id === rowId)
    return target?.name ?? '회원 권한 신청자'
  }, [])

  const {
    privacyRevealedByRowId,
    handleToggleListPrivacyMask,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoRevealByRow({
    resolveAccessItem: resolvePermissionListPersonalInfoAccessItem,
    resetDeps: [baseRows],
  })

  useImperativeHandle(
    ref,
    () => ({
      applyInstructorPermissionApproved: (userId: string) => {
        setRows(prev =>
          prev.map(r =>
            r.userId === userId && r.approvalStatus === 'PENDING'
              ? { ...r, approvalStatus: 'APPROVED' as const }
              : r
          )
        )
      },
      applyInstructorPermissionRejected: (userId: string) => {
        setRows(prev =>
          prev.map(r => (r.userId === userId ? { ...r, approvalStatus: 'REJECTED' as const } : r))
        )
      },
      applyInstructorPermissionPending: (userId: string) => {
        setRows(prev =>
          prev.map(r => (r.userId === userId ? { ...r, approvalStatus: 'PENDING' as const } : r))
        )
      },
      clearRowSelection: () => {
        selectedRowKeysRef.current = []
        setSelectedRowKeys([])
      },
    }),
    []
  )

  /**
   * 선택 id → 전체 목록(rows)에서 승인 대기 행만 수집 ([신청 승인]용).
   */
  const resolvePendingRowsForKeys = useCallback((keys: string[]) => {
    if (keys.length === 0) return []
    const byId = new Map(rowsRef.current.map(r => [String(r.id), r]))
    const out: MemberPermissionApplicationRow[] = []
    for (const k of keys) {
      const r = byId.get(String(k))
      if (r != null && r.approvalStatus === 'PENDING') out.push(r)
    }
    return out
  }, [])

  /** [승인 반려]: 승인 완료·신청 반려인 경우도 다시 반려 처리 가능 */
  const resolveRejectableRowsForKeys = useCallback((keys: string[]) => {
    if (keys.length === 0) return []
    const byId = new Map(rowsRef.current.map(r => [String(r.id), r]))
    const out: MemberPermissionApplicationRow[] = []
    for (const k of keys) {
      const r = byId.get(String(k))
      if (
        r != null &&
        (r.approvalStatus === 'PENDING' ||
          r.approvalStatus === 'APPROVED' ||
          r.approvalStatus === 'REJECTED')
      ) {
        out.push(r)
      }
    }
    return out
  }, [])

  const selectedKeysSnapshot = useCallback(
    () => [...new Set([...selectedRowKeysRef.current, ...selectedRowKeys].map(k => String(k)))],
    [selectedRowKeys]
  )

  const bulkApprove = useCallback(() => {
    const keys = selectedKeysSnapshot()
    if (!canWrite || keys.length === 0) return

    const pendingRows = resolvePendingRowsForKeys(keys)
    const hasNonPendingInSelection = pendingRows.length !== keys.length
    const isBulkSelection = keys.length >= 2

    if (isBulkSelection && hasNonPendingInSelection) {
      setBulkApproveBlockedSelectedCount(keys.length)
      return
    }

    if (memberType === 'instructor') {
      if (pendingRows.length === 0) {
        return
      }
      /** 승인 대기가 2건 이상이면 일괄 승인 모달(선택에 비대기 행이 섞여 있어도 대기 건만 반영) */
      const useBulkApproveModal = pendingRows.length >= 2
      if (!useBulkApproveModal) {
        const row = pendingRows[0]
        onInstructorApproveRequest?.({
          mode: 'single',
          userId: row.userId,
          displayName: (row.name ?? '').trim() || '회원',
        })
        return
      }
      onInstructorApproveRequest?.({
        mode: 'bulk',
        userIds: pendingRows.map(r => r.userId),
        memberCount: pendingRows.length,
      })
      return
    }

    if (memberType === 'admin') {
      if (pendingRows.length === 0) {
        return
      }
      const useBulkApproveModal = pendingRows.length >= 2
      if (!useBulkApproveModal) {
        const row = pendingRows[0]
        onAdminApproveRequest?.({
          mode: 'single',
          userId: row.userId,
          displayName: (row.name ?? '').trim() || '회원',
        })
        return
      }
      onAdminApproveRequest?.({
        mode: 'bulk',
        userIds: pendingRows.map(r => r.userId),
        memberCount: pendingRows.length,
      })
      return
    }
  }, [
    canWrite,
    memberType,
    onInstructorApproveRequest,
    onAdminApproveRequest,
    resolvePendingRowsForKeys,
    selectedKeysSnapshot,
  ])

  const bulkReject = useCallback(() => {
    const keys = selectedKeysSnapshot()
    if (!canWrite || keys.length === 0) return

    const rejectableRows = resolveRejectableRowsForKeys(keys)
    const pendingRows = rejectableRows.filter(r => r.approvalStatus === 'PENDING')
    const hasNonPendingInSelection = pendingRows.length !== keys.length
    const isBulkSelection = keys.length >= 2

    if (isBulkSelection && hasNonPendingInSelection) {
      setBulkRejectBlockedSelectedCount(keys.length)
      return
    }

    if (memberType === 'instructor') {
      if (pendingRows.length === 0) {
        return
      }
      /** 반려 대상이 2건 이상이면 일괄 반려 모달 — 신청 승인과 동일 기준 */
      const useBulkRejectModal = pendingRows.length >= 2
      if (!useBulkRejectModal) {
        const row = pendingRows[0]
        if (onInstructorRejectRequest == null) {
          return
        }
        onInstructorRejectRequest({
          mode: 'single',
          userId: row.userId,
          displayName: (row.name ?? '').trim() || '회원',
        })
        return
      }
      if (onInstructorRejectRequest == null) {
        return
      }
      onInstructorRejectRequest({
        mode: 'bulk',
        userIds: pendingRows.map(r => r.userId),
        memberCount: pendingRows.length,
      })
      return
    }

    if (memberType === 'admin') {
      if (pendingRows.length === 0) {
        return
      }
      const useBulkRejectModal = pendingRows.length >= 2
      if (!useBulkRejectModal) {
        const row = pendingRows[0]
        if (onAdminRejectRequest == null) {
          return
        }
        onAdminRejectRequest({
          mode: 'single',
          userId: row.userId,
          displayName: (row.name ?? '').trim() || '회원',
        })
        return
      }
      if (onAdminRejectRequest == null) {
        return
      }
      onAdminRejectRequest({
        mode: 'bulk',
        userIds: pendingRows.map(r => r.userId),
        memberCount: pendingRows.length,
      })
      return
    }
  }, [
    canWrite,
    memberType,
    onInstructorRejectRequest,
    onAdminRejectRequest,
    resolveRejectableRowsForKeys,
    selectedKeysSnapshot,
  ])

  const selectedSingleRowId = selectedRowKeys.length === 1 ? String(selectedRowKeys[0]) : null
  const isSelectedRowPrivacyRevealed =
    selectedSingleRowId != null && Boolean(privacyRevealedByRowId[selectedSingleRowId])

  const columns: ColumnsType<MemberPermissionApplicationRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        className: CMS_TABLE_NO_COL_CLASS,
        width: TABLE_COLUMN_WIDTHS.index,
        align: 'center',
        render: (_: unknown, __: MemberPermissionApplicationRow, index: number) =>
          tableData.length - index,
      },
      {
        title: '회원명',
        dataIndex: 'name',
        key: 'name',
        width: TABLE_COLUMN_WIDTHS.name,
        ellipsis: true,
      },
      {
        title: '연락처',
        key: 'phone',
        width: TABLE_COLUMN_WIDTHS.phone,
        render: (_: unknown, r: MemberPermissionApplicationRow) =>
          privacyRevealedByRowId[r.id] ? r.phone?.trim() || '-' : maskedPhone(r.phone),
      },
      {
        title: '이메일',
        key: 'email',
        width: TABLE_COLUMN_WIDTHS.email,
        ellipsis: true,
        render: (_: unknown, r: MemberPermissionApplicationRow) =>
          privacyRevealedByRowId[r.id] ? r.email?.trim() || '-' : maskedEmail(r.email),
      },
      {
        title: '회원 유형',
        dataIndex: 'memberCategory',
        key: 'memberCategory',
        width: 120,
        align: 'center',
        render: (c: MemberPermissionApplicationRow['memberCategory']) => MEMBER_CATEGORY_LABEL[c],
      },
      {
        title: '신청 유형',
        dataIndex: 'applicationTypeLabel',
        key: 'applicationTypeLabel',
        width: 140,
        align: 'center',
        ellipsis: true,
        render: (label: string) => (label?.trim() ? label : '-'),
      },
      {
        title: '권한 승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 120,
        align: 'center',
        onHeaderCell: () => ({
          className: 'members-permission-list__col--approval-status',
        }),
        onCell: () => ({
          className: 'members-permission-list__col--approval-status',
        }),
        render: (_: unknown, record: MemberPermissionApplicationRow) =>
          memberPermissionApprovalStatusTextTag(record.approvalStatus),
      },
      {
        title: '신청일',
        dataIndex: 'appliedAt',
        key: 'appliedAt',
        width: TABLE_COLUMN_WIDTHS.date,
        render: (v: string) => dayjs(v).format('YYYY.MM.DD'),
      },
    ],
    [tableData.length, privacyRevealedByRowId]
  )

  const filterFields = useMemo<FilterFieldConfig[]>(() => {
    const searchField: FilterFieldConfig = {
      key: 'search',
      type: 'search',
      label: '회원명',
      placeholder: '회원명을 입력하세요',
      width: memberType === 'admin' ? '30%' : '20%',
    }
    const roleField: FilterFieldConfig = {
      key: 'role',
      type: 'select',
      label: '회원 유형',
      placeholder: '전체',
      width: '20%',
      options: [
        { label: '전체', value: 'ALL' },
        { label: '개인', value: 'INDIVIDUAL' },
        { label: '학교(교사)', value: 'SCHOOL' },
        { label: '강사', value: 'INSTRUCTOR' },
        { label: '관리자', value: 'ADMIN' },
      ],
    }
    const approvalField: FilterFieldConfig = {
      key: 'approvalStatus',
      type: 'select',
      label: '권한 승인 현황',
      placeholder: '전체',
      width: memberType === 'admin' ? '30%' : '20%',
      options: [
        { label: '전체', value: 'ALL' },
        { label: '승인 대기', value: 'PENDING' },
        { label: '승인 완료', value: 'APPROVED' },
        { label: '신청 반려', value: 'REJECTED' },
      ],
    }
    const dateField: FilterFieldConfig = {
      key: 'createdAtRange',
      type: 'dateRange',
      label: '신청 시기',
      width: '40%',
      defaultValue: null,
    }
    if (memberType === 'admin') {
      return [searchField, approvalField, dateField]
    }
    return [searchField, roleField, approvalField, dateField]
  }, [memberType])

  return (
    <FilterTableLayout
      bordered={false}
      fields={filterFields}
      filters={{
        search: pendingFilters.search,
        role: pendingFilters.role,
        approvalStatus: pendingFilters.approvalStatus,
        createdAtRange: pendingFilters.createdAtRange ?? undefined,
      }}
      onFilterChange={handleFilterChange}
      onSearch={handleSearch}
      title={listTitle(memberType)}
      description={`총 ${displayedCount.toLocaleString()}건`}
      actions={
        <>
          <CmsButton
            variant="delete"
            onClick={bulkReject}
            disabled={!canWrite || selectedRowKeys.length === 0}
          >
            신청 반려
          </CmsButton>
          <CmsButton
            variant="secondary"
            onClick={bulkApprove}
            disabled={!canWrite || selectedRowKeys.length === 0}
          >
            신청 승인
          </CmsButton>
          <PersonalInfoRevealButton
            labelMode="toggle"
            revealed={isSelectedRowPrivacyRevealed}
            cmsVariant={isSelectedRowPrivacyRevealed ? 'default' : 'primary'}
            cmsSize="large"
            width={180}
            disabled={selectedRowKeys.length !== 1}
            onClick={() =>
              handleToggleListPrivacyMask(selectedRowKeys, isSelectedRowPrivacyRevealed)
            }
          />
        </>
      }
    >
      <Table<MemberPermissionApplicationRow>
        rowKey="id"
        className="cms-data-table members-permission-list__table"
        columns={columns}
        dataSource={tableData}
        onRow={record => ({
          onClick: (e: MouseEvent<HTMLElement>) => {
            if ((e.target as HTMLElement).closest('.ant-table-selection-column')) return
            void onOpenUserDetail?.(record.userId, memberType)
          },
          style: { cursor: onOpenUserDetail ? 'pointer' : undefined },
        })}
        rowSelection={
          canWrite
            ? {
                columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                selectedRowKeys,
                onChange: keys => {
                  const next = keys.map(k => String(k))
                  selectedRowKeysRef.current = next
                  setSelectedRowKeys(next)
                },
                preserveSelectedRowKeys: false,
              }
            : undefined
        }
        pagination={false}
      />
      {personalInfoRevealModal}

      {bulkApproveBlockedSelectedCount != null ? (
        <ContentModal
          open
          onCancel={() => setBulkApproveBlockedSelectedCount(null)}
          title="일괄 신청 승인 불가 안내"
          width={480}
          description={`선택한 **${bulkApproveBlockedSelectedCount}**명의 회원 중 승인 완료 혹은 신청 반려 상태인 회원이 있습니다.\n다시 확인 해주세요.`}
          footer={
            <CmsButton
              variant="secondary"
              size="medium"
              type="button"
              onClick={() => setBulkApproveBlockedSelectedCount(null)}
            >
              확인
            </CmsButton>
          }
        >
          {null}
        </ContentModal>
      ) : null}

      {bulkRejectBlockedSelectedCount != null ? (
        <ContentModal
          open
          onCancel={() => setBulkRejectBlockedSelectedCount(null)}
          title="일괄 신청 반려 불가 안내"
          width={480}
          description={`선택한 **${bulkRejectBlockedSelectedCount}**명의 회원 중 승인 완료 혹은 신청 반려 상태인 회원이 있습니다.\n다시 확인 해주세요.`}
          footer={
            <CmsButton
              variant="secondary"
              size="medium"
              type="button"
              onClick={() => setBulkRejectBlockedSelectedCount(null)}
            >
              확인
            </CmsButton>
          }
        >
          {null}
        </ContentModal>
      ) : null}
    </FilterTableLayout>
  )
})

MembersPermissionList.displayName = 'MembersPermissionList'
