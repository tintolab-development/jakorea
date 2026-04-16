/**
 * 회원 권한 신청 목록 — 강사·관리자 공통 UI (`FilterTableLayout` / user-list·program-list 스타일 정렬)
 */

import { useMemo, useState, useEffect, useCallback, type Key, type MouseEvent } from 'react'
import { Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import {
  membersPermissionTablePageConfig,
  type MembersPermissionTableContext,
} from './members-permission-table.config'
import type { MemberPermissionApplicationRow } from '@/types/member-permission-application'
import {
  mockMemberPermissionApplicationsAdmin,
  mockMemberPermissionApplicationsInstructor,
} from '@/data/mock/member-permission-applications'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { UserDetailPermissionRole } from '@/pages/users/user-detail-fullpage-modal'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/ui/program-list.css'
import './members-permission-list.css'
import { CmsButton } from '@/shared/ui'
import { UserPersonalInfoRevealConfirmModal } from '@/features/user/detail/ui/user-personal-info-reveal-confirm-modal'

const MEMBER_CATEGORY_LABEL: Record<MemberPermissionApplicationRow['memberCategory'], string> = {
  SCHOOL: '학교(교사)',
  INDIVIDUAL: '개인',
  INSTRUCTOR: '강사',
  ADMIN: '관리자',
}

const APPROVAL_STATUS_LABEL: Record<MemberPermissionApplicationRow['approvalStatus'], string> = {
  PENDING: '승인 대기',
  APPROVED: '승인 완료',
  REJECTED: '신청 반려',
}

const APPROVAL_STATUS_CLASS: Record<MemberPermissionApplicationRow['approvalStatus'], string> = {
  PENDING: 'members-permission-list__approval-status--pending',
  APPROVED: 'members-permission-list__approval-status--approved',
  REJECTED: 'members-permission-list__approval-status--rejected',
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

export interface MembersPermissionListProps {
  memberType: 'instructor' | 'admin'
  /** 행 클릭 시 회원 상세 풀페이지 모달 오픈 */
  onOpenUserDetail?: (
    userId: string,
    permissionRole: UserDetailPermissionRole
  ) => void | Promise<void>
}

export function MembersPermissionList({
  memberType,
  onOpenUserDetail,
}: MembersPermissionListProps) {
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
  /** 목록 내 연락처·이메일 마스킹 해제 여부 (행 id) */
  const [privacyRevealedByRowId, setPrivacyRevealedByRowId] = useState<Record<string, boolean>>({})
  const [personalInfoRevealConfirmTargetId, setPersonalInfoRevealConfirmTargetId] = useState<string | null>(
    null
  )
  useEffect(() => {
    setRows(baseRows)
    setPrivacyRevealedByRowId({})
    setPersonalInfoRevealConfirmTargetId(null)
  }, [baseRows])

  const selectedKeySet = useMemo(
    () => new Set(selectedRowKeys.map(k => String(k))),
    [selectedRowKeys]
  )

  const selectedPendingRows = useMemo(
    () => tableData.filter(r => selectedKeySet.has(String(r.id)) && r.approvalStatus === 'PENDING'),
    [tableData, selectedKeySet]
  )

  const notReady = () => {
    window.alert('준비 중입니다.')
    return
  }

  const bulkApprove = useCallback(() => {
    notReady()
    if (!canWrite || selectedRowKeys.length === 0) return
    if (selectedPendingRows.length === 0) {
      message.warning('승인 대기 상태인 신청만 승인할 수 있습니다.')
      return
    }
    setRows(prev =>
      prev.map(r =>
        selectedPendingRows.some(s => s.id === r.id)
          ? { ...r, approvalStatus: 'APPROVED' as const }
          : r
      )
    )
    message.success(`신청 ${selectedPendingRows.length}건을 승인했습니다.`)
    setSelectedRowKeys([])
  }, [canWrite, selectedRowKeys.length, selectedPendingRows])

  const bulkReject = useCallback(() => {
    notReady()
    if (!canWrite || selectedRowKeys.length === 0) return
    if (selectedPendingRows.length === 0) {
      message.warning('승인 대기 상태인 신청만 반려할 수 있습니다.')
      return
    }
    setRows(prev =>
      prev.map(r =>
        selectedPendingRows.some(s => s.id === r.id)
          ? { ...r, approvalStatus: 'REJECTED' as const }
          : r
      )
    )
    message.success(`신청 ${selectedPendingRows.length}건을 반려했습니다.`)
    setSelectedRowKeys([])
  }, [canWrite, selectedRowKeys.length, selectedPendingRows])

  const selectedSingleRowId = selectedRowKeys.length === 1 ? String(selectedRowKeys[0]) : null
  const isSelectedRowPrivacyRevealed =
    selectedSingleRowId != null && Boolean(privacyRevealedByRowId[selectedSingleRowId])

  const handleToggleListPrivacyMask = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('개인정보 상세보기는 회원 1명만 선택해 주세요.')
      return
    }
    const id = String(selectedRowKeys[0])
    if (isSelectedRowPrivacyRevealed) {
      setPrivacyRevealedByRowId(prev => ({ ...prev, [id]: false }))
      return
    }
    setPersonalInfoRevealConfirmTargetId(id)
  }, [selectedRowKeys, isSelectedRowPrivacyRevealed])

  const columns: ColumnsType<MemberPermissionApplicationRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
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
        render: (s: MemberPermissionApplicationRow['approvalStatus']) => (
          <span className={`members-permission-list__approval-status ${APPROVAL_STATUS_CLASS[s]}`}>
            {APPROVAL_STATUS_LABEL[s]}
          </span>
        ),
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

  return (
    <FilterTableLayout
      bordered={false}
      fields={[
        {
          key: 'search',
          type: 'search',
          label: '회원명',
          placeholder: '회원명을 입력하세요',
          width: '20%',
        },
        {
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
        },
        {
          key: 'approvalStatus',
          type: 'select',
          label: '권한 승인 현황',
          placeholder: '전체',
          width: '20%',
          options: [
            { label: '전체', value: 'ALL' },
            { label: APPROVAL_STATUS_LABEL.PENDING, value: 'PENDING' },
            { label: APPROVAL_STATUS_LABEL.APPROVED, value: 'APPROVED' },
            { label: APPROVAL_STATUS_LABEL.REJECTED, value: 'REJECTED' },
          ],
        },
        {
          key: 'createdAtRange',
          type: 'dateRange',
          label: '신청 시기',
          width: '40%',
          defaultValue: null,
        },
      ]}
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
          <CmsButton onClick={bulkApprove} disabled={!canWrite || selectedRowKeys.length === 0}>
            신청 승인
          </CmsButton>
          <CmsButton
            variant={isSelectedRowPrivacyRevealed ? 'default' : 'primary'}
            onClick={handleToggleListPrivacyMask}
            width={180}
            disabled={selectedRowKeys.length !== 1}
          >
            {isSelectedRowPrivacyRevealed ? '개인정보 마스킹' : '개인정보 상세보기'}
          </CmsButton>
        </>
      }
    >
      <Table<MemberPermissionApplicationRow>
        rowKey="id"
        className="cms-data-table"
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
                onChange: keys => setSelectedRowKeys(keys.map(k => String(k))),
                preserveSelectedRowKeys: false,
              }
            : undefined
        }
        pagination={false}
      />
      {personalInfoRevealConfirmTargetId ? (
        <UserPersonalInfoRevealConfirmModal
          onCancel={() => setPersonalInfoRevealConfirmTargetId(null)}
          onConfirm={_reason => {
            setPrivacyRevealedByRowId(prev => ({ ...prev, [personalInfoRevealConfirmTargetId]: true }))
            setPersonalInfoRevealConfirmTargetId(null)
          }}
        />
      ) : null}
    </FilterTableLayout>
  )
}
