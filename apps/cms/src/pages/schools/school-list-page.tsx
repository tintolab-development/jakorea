/**
 * 학교(교사) 회원 목록 페이지
 * 전체 회원 목록(user-list-page)과 동일한 테이블 UI
 * mock 사용자 데이터에서 SCHOOL 역할만 필터링
 */

import { useState, useMemo } from 'react'
import { Card, Modal } from 'antd'
import { mockUsers } from '@/data/mock/users'
import { UserList } from '@/features/user/ui/user-list'
import { SchoolDetailModal } from '@/features/school/ui/school-detail-modal'
import { UserCreateForm } from '@/features/user/ui/user-create-form'
import { PageHeader } from '@/shared/ui/page-header'
import { AppButton } from '@/shared/ui/app-button'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useUserStore } from '@/features/user/model/user-store'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import {
  DeleteGuideModal,
  buildMemberDeleteMessageLines,
} from '@/features/program/ui/manager-delete-guide-modal'
import type { User } from '@/types/user'
import type { CreateUserRequest } from '@/entities/user/api/user-service'
import './school-list-page.css'

interface SchoolListQueryParams extends Record<string, string | undefined> {
  search?: string
  region?: string
}

export function SchoolListPage() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { params, setParams } = useQueryParams<SchoolListQueryParams>()

  const createUser = useUserStore(state => state.createUser)
  const deleteUser = useUserStore(state => state.deleteUser)
  const loading = useUserStore(state => state.loading)

  // 회원 상세 모달
  const {
    open: detailOpen,
    openModal: openDetail,
    closeModal: closeDetail,
    selectedItem: detailUser,
  } = useModalState<Omit<User, 'password'>>()

  // 회원 등록 모달
  const {
    open: createModalOpen,
    openModal: openCreateModal,
    closeModal: closeCreateModal,
  } = useModalState()

  // 삭제 모달
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<Omit<User, 'password'> | null>(null)
  const [bulkDeleteUsers, setBulkDeleteUsers] = useState<Omit<User, 'password'>[] | null>(null)
  const [, setDeleteLoading] = useState(false)

  // 테이블 행 선택 (일괄 삭제용)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 지역 옵션 (SCHOOL 사용자 주소에서 추출)
  const regionOptions = useMemo(() => {
    const regions = Array.from(
      new Set(
        mockUsers
          .filter(u => u.role === 'SCHOOL')
          .map(u => {
            const addr = u.schoolInfo?.address || ''
            return addr.split(' ')[0] || ''
          })
          .filter(Boolean)
      )
    ).sort()
    return [
      { label: '전체', value: 'ALL' },
      ...regions.map(r => ({ label: r, value: r })),
    ]
  }, [])

  // Pending 필터 상태
  const [pendingFilters, setPendingFilters] = useState({
    search: params.search || '',
    region: params.region || 'ALL',
  })

  // SCHOOL 역할 사용자만 필터링
  const schoolUsers: Omit<User, 'password'>[] = useMemo(() => {
    let filtered = mockUsers
      .filter(u => u.role === 'SCHOOL')
      .map(({ password, ...rest }) => rest)

    if (params.search) {
      const s = params.search.toLowerCase()
      filtered = filtered.filter(
        u =>
          u.name.toLowerCase().includes(s) ||
          u.schoolInfo?.schoolName?.toLowerCase().includes(s)
      )
    }

    if (params.region && params.region !== 'ALL') {
      filtered = filtered.filter(u => {
        const addr = u.schoolInfo?.address || ''
        return addr.startsWith(params.region!)
      })
    }

    return filtered
  }, [params.search, params.region])

  const handleSearch = () => {
    setParams({
      search: pendingFilters.search || undefined,
      region: pendingFilters.region === 'ALL' ? undefined : pendingFilters.region,
    })
  }

  const handleView = (u: Omit<User, 'password'>) => {
    openDetail(u)
  }

  const handleDeleteClick = (u: Omit<User, 'password'>) => {
    setDeletingUser(u)
    setBulkDeleteUsers(null)
    setDeleteModalOpen(true)
  }

  const handleBulkDelete = () => {
    const toDelete = schoolUsers.filter(u => selectedRowKeys.includes(u.id))
    if (toDelete.length === 0) return
    if (toDelete.length === 1) {
      setDeletingUser(toDelete[0])
      setBulkDeleteUsers(null)
    } else {
      setDeletingUser(null)
      setBulkDeleteUsers(toDelete)
    }
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true)
    try {
      if (bulkDeleteUsers) {
        for (const u of bulkDeleteUsers) {
          await deleteUser(u.id)
        }
        showSuccessMessage(`${bulkDeleteUsers.length}명의 회원이 삭제되었습니다.`)
      } else if (deletingUser) {
        await deleteUser(deletingUser.id)
        showSuccessMessage(MESSAGES.success.deleted)
      }
      setDeleteModalOpen(false)
      setDeletingUser(null)
      setBulkDeleteUsers(null)
      setSelectedRowKeys([])
    } catch (error) {
      handleError(error, { defaultMessage: '학교 삭제에 실패했습니다.' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setDeletingUser(null)
    setBulkDeleteUsers(null)
  }

  const handleCreateUser = async (data: CreateUserRequest) => {
    try {
      await createUser(data)
      showSuccessMessage(MESSAGES.success.created)
      closeCreateModal()
    } catch (error) {
      handleError(error, { defaultMessage: MESSAGES.error.create })
    }
  }

  return (
    <div className="school-list-page">
      <PageHeader
        title="학교(교사) 회원 목록"
        description={`총 ${schoolUsers.length}건`}
      />

      <UnifiedFilterCard
        fields={[
          {
            key: 'search',
            type: 'search',
            label: '학교명',
            placeholder: '학교명을 입력하세요',
          },
          {
            key: 'region',
            type: 'select',
            label: '지역',
            placeholder: '전체',
            options: regionOptions,
          },
        ]}
        filters={{
          search: pendingFilters.search,
          region: pendingFilters.region,
        }}
        onFilterChange={(key, value) => {
          setPendingFilters(prev => ({ ...prev, [key]: value }))
        }}
        onSearch={handleSearch}
      />

      <Card className="school-list-page__table-card" bodyStyle={{ padding: 20 }}>
        <div className="school-list-page__table-header">
          <div className="school-list-page__table-actions">
            <AppButton
              variant="danger"
              size="filter"
              dangerFillOnHover
              onClick={handleBulkDelete}
              disabled={selectedRowKeys.length === 0}
            >
              학교 삭제
            </AppButton>
            {canWrite && (
              <AppButton variant="primary" size="filter" onClick={openCreateModal}>
                학교 등록
              </AppButton>
            )}
          </div>
        </div>

        <UserList
          data={schoolUsers}
          loading={false}
          onView={handleView}
          onDelete={canWrite ? handleDeleteClick : undefined}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={setSelectedRowKeys}
          pagination={false}
        />
      </Card>

      <SchoolDetailModal
        open={detailOpen}
        user={detailUser}
        onClose={closeDetail}
        onDeleteMembers={canWrite ? () => {} : undefined}
      />

      <Modal
        open={createModalOpen}
        title="회원 추가"
        onCancel={closeCreateModal}
        footer={null}
        width={LAYOUT_CONSTANTS.widths.modal.medium}
        destroyOnHidden
      >
        <UserCreateForm onSubmit={handleCreateUser} onCancel={closeCreateModal} loading={loading} />
      </Modal>

      {deleteModalOpen && (
        <DeleteGuideModal
          open
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="학교 삭제 안내"
          lines={buildMemberDeleteMessageLines(
            deletingUser ? { name: deletingUser.name, email: deletingUser.email } : null,
            bulkDeleteUsers?.length ?? (deletingUser ? 1 : 0)
          )}
          confirmText="삭제"
          confirmVariant="danger"
        />
      )}
    </div>
  )
}
