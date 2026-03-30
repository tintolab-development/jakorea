/**
 * 사용자 관리 페이지
 * Phase 5.1.2: 사용자 관리 페이지
 * 회원 목록: React Query useInfiniteQuery + 15명씩 무한 스크롤
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, Modal } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useQueryClient } from '@tanstack/react-query'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { useInView } from '@/shared/hooks/use-in-view'
import { UserList } from '@/features/user/ui/user-list'
import { UserDetailFullPageModal } from '@/features/user/ui/user-detail-fullpage-modal'
import { UserRoleChangeModal } from '@/features/user/ui/user-role-change-modal'
import { UserCreateForm } from '@/features/user/ui/user-create-form'
import { useInfiniteUserList } from '@/features/user/hooks/use-infinite-user-list'
import { FilterListLayout } from '@/shared/ui/filter-list-layout'
import { AppButton } from '@/shared/ui/app-button'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import { useUserStore, selectSelectedUser } from '@/features/user/model/user-store'
import type { AdminLevel, ProgramRole, User, UserRole } from '@/types/user'
import type { CreateUserRequest } from '@/entities/user/api/user-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import {
  DeleteGuideModal,
  buildMemberDeleteMessageLines,
} from '@/features/program/ui/manager-delete-guide-modal'
import { Divider } from '@/shared/components/divider'
import {
  memberListKindToBasicInfoEntrySource,
  memberListKindToPendingRole,
  memberListPageTitle,
  normalizeMemberListKind,
  pendingRoleToMemberListKind,
  resolveRoleFilterFromMemberListParams,
  userRoleToBasicInfoEntrySource,
} from '@/shared/config/member-list-kinds'
import '@/pages/programs/program-list-page.css'
import './user-list-page.css'

interface UserListQueryParams extends Record<string, string | undefined> {
  /** 전체·학교·강사·관리자 등 목록 맥락 (`member-list-kinds` 참고) */
  kind?: string
  role?: UserRole | 'ALL'
  search?: string
  id?: string
  createdAtFrom?: string
  createdAtTo?: string
}

type ApiFilters = {
  role?: UserRole
  search?: string
  createdAtFrom?: string
  createdAtTo?: string
}

function pendingRoleFromParams(params: UserListQueryParams): UserRole | 'ALL' {
  if (params.kind !== undefined && params.kind !== '') {
    return memberListKindToPendingRole(normalizeMemberListKind(params.kind))
  }
  if (params.role && params.role !== 'ALL') {
    return params.role as UserRole
  }
  return 'ALL'
}

function pendingToApiFilters(pending: {
  search: string
  createdAtRange: [Dayjs | null, Dayjs | null] | null
}): ApiFilters {
  const api: ApiFilters = {}
  if (pending.search) api.search = pending.search
  if (pending.createdAtRange?.[0] && pending.createdAtRange[1]) {
    api.createdAtFrom = pending.createdAtRange[0].format('YYYY-MM-DD')
    api.createdAtTo = pending.createdAtRange[1].format('YYYY-MM-DD')
  }
  return api
}

export function UserListPage() {
  const { params, setParam } = useQueryParams<UserListQueryParams>()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)

  // React Query 무한 스크롤 (15명씩)
  const [activeFilters, setActiveFilters] = useState<ApiFilters>(() => {
    const from = params.createdAtFrom
    const to = params.createdAtTo
    const api: ApiFilters = {}
    if (params.search) api.search = params.search
    if (from && to) {
      api.createdAtFrom = from
      api.createdAtTo = to
    }
    return api
  })

  const listQueryFilters = useMemo((): ApiFilters => {
    const role = resolveRoleFilterFromMemberListParams({
      kind: params.kind,
      role: params.role,
    })
    return {
      ...activeFilters,
      ...(role ? { role } : {}),
    }
  }, [activeFilters, params.kind, params.role])

  const {
    users: listUsers,
    total: listTotal,
    isLoading: listLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteUserList(listQueryFilters)

  // 무한 스크롤: 하단 센티넬이 보이면 다음 페이지 로드
  const { ref: loadMoreRef, inView } = useInView({ rootMargin: '200px', threshold: 0 })
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // 스토어: 선택 사용자(드로어), mutations
  const createUser = useUserStore(state => state.createUser)
  const deleteUser = useUserStore(state => state.deleteUser)
  const changeUserRole = useUserStore(state => state.changeUserRole)
  const setSelectedUserId = useUserStore(state => state.setSelectedUserId)
  const setFilters = useUserStore(state => state.setFilters)
  const clearSelectedUserId = useUserStore(state => state.setSelectedUserId)
  const loading = useUserStore(state => state.loading)

  // Drawer 상태 관리 (useModalState 사용) — 행 클릭 시 열리는 회원 상세
  const {
    open: drawerOpen,
    openModal: openDrawer,
    closeModal: closeDrawer,
    selectedItem: drawerUser,
  } = useModalState<Omit<User, 'password'>>()

  // 권한 변경 모달 상태 관리 (useModalState 사용)
  const {
    open: roleChangeModalOpen,
    openModal: openRoleChangeModal,
    closeModal: closeRoleChangeModal,
    selectedItem: editingUser,
  } = useModalState<Omit<User, 'password'>>()

  // 회원 추가 모달 상태 관리
  const {
    open: createModalOpen,
    openModal: openCreateModal,
    closeModal: closeCreateModal,
  } = useModalState()

  // 삭제 확인 모달 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<Omit<User, 'password'> | null>(null)
  const [, setDeleteLoading] = useState(false)

  // 테이블 행 선택 (일괄 삭제용)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  // 일괄 삭제 대상 (여러 명 선택 시)
  const [bulkDeleteUsers, setBulkDeleteUsers] = useState<Omit<User, 'password'>[] | null>(null)

  // Pending 필터 상태 (조회 버튼 클릭 전까지 적용하지 않음)
  const [pendingFilters, setPendingFilters] = useState<{
    search: string
    role: UserRole | 'ALL'
    createdAtRange: [Dayjs | null, Dayjs | null] | null
  }>(() => {
    const from = params.createdAtFrom
    const to = params.createdAtTo
    let createdAtRange: [Dayjs | null, Dayjs | null] | null = null
    if (from && to) {
      const start = dayjs(from)
      const end = dayjs(to)
      if (start.isValid() && end.isValid()) createdAtRange = [start, end]
    }
    return {
      search: params.search || '',
      role: pendingRoleFromParams(params),
      createdAtRange,
    }
  })

  // URL에서 필터 값을 읽어와서 pendingFilters 동기화
  useEffect(() => {
    const from = params.createdAtFrom
    const to = params.createdAtTo
    let createdAtRange: [Dayjs | null, Dayjs | null] | null = null
    if (from && to) {
      const start = dayjs(from)
      const end = dayjs(to)
      if (start.isValid() && end.isValid()) createdAtRange = [start, end]
    }
    setPendingFilters({
      search: params.search || '',
      role: pendingRoleFromParams(params),
      createdAtRange,
    })
  }, [params.kind, params.search, params.role, params.createdAtFrom, params.createdAtTo])

  // 선택된 사용자 (드로어용)
  const selectedUser = useUserStore(state => selectSelectedUser(state))

  const resolvedMemberListKind = useMemo(
    () => normalizeMemberListKind(params.kind),
    [params.kind]
  )

  const modalDetailUser = drawerUser ?? selectedUser

  /** 열려 있는 상세 대상이 있으면 그 회원 역할 기준(전체 회원 혼합 목록 대응), 없으면 목록 kind 기준 */
  const basicInfoEntrySource = useMemo(() => {
    if (modalDetailUser) {
      return userRoleToBasicInfoEntrySource(modalDetailUser.role)
    }
    return memberListKindToBasicInfoEntrySource(resolvedMemberListKind)
  }, [modalDetailUser?.id, modalDetailUser?.role, resolvedMemberListKind])

  // 조회 버튼 클릭 시: URL·스토어 동기화 + React Query 키 변경으로 자동 재조회
  const handleSearch = () => {
    const api = pendingToApiFilters(pendingFilters)
    setActiveFilters(api)
    setParam('search', pendingFilters.search || null)
    setParam('kind', pendingRoleToMemberListKind(pendingFilters.role))
    setParam('role', null)
    if (pendingFilters.createdAtRange?.[0] && pendingFilters.createdAtRange[1]) {
      setParam('createdAtFrom', pendingFilters.createdAtRange[0].format('YYYY-MM-DD'))
      setParam('createdAtTo', pendingFilters.createdAtRange[1].format('YYYY-MM-DD'))
    } else {
      setParam('createdAtFrom', null)
      setParam('createdAtTo', null)
    }
    const roleForStore =
      pendingFilters.role === 'ALL' ? undefined : (pendingFilters.role as UserRole)
    setFilters({ ...api, role: roleForStore })
  }

  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
  }, [queryClient])

  // 사용자 상세 보기
  const handleView = (user: Omit<User, 'password'>) => {
    setSelectedUserId(user.id) // 스토어에 ID만 저장
    openDrawer(user)
    setParam('id', user.id)
  }

  // Drawer 닫기
  const handleDrawerClose = () => {
    closeDrawer()
    clearSelectedUserId(null) // 스토어에서 선택 해제
    setParam('id', null)
  }

  // 권한 변경
  const handleEdit = (user: Omit<User, 'password'>) => {
    openRoleChangeModal(user)
  }

  const handleRoleChange = async (
    userId: string,
    newRole: UserRole,
    adminLevel?: AdminLevel,
    programRole?: ProgramRole
  ) => {
    try {
      await changeUserRole(userId, newRole, adminLevel, programRole)
      showSuccessMessage(MESSAGES.success.updated)
      closeRoleChangeModal()
      invalidateList()
    } catch (error) {
      handleError(error, { defaultMessage: MESSAGES.error.roleChangeFailed })
    }
  }

  const handleRoleChangeCancel = () => {
    closeRoleChangeModal()
  }

  // 회원 추가
  const handleCreateUser = async (request: CreateUserRequest) => {
    try {
      await createUser(request)
      showSuccessMessage(MESSAGES.success.created)
      closeCreateModal()
      invalidateList()
    } catch (error) {
      handleError(error, { defaultMessage: '회원 추가에 실패했습니다.' })
      throw error
    }
  }

  // 회원 삭제
  const handleDeleteClick = (user: Omit<User, 'password'>) => {
    setDeletingUser(user)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    const bulk = bulkDeleteUsers && bulkDeleteUsers.length > 0
    const toDelete = bulk ? bulkDeleteUsers! : deletingUser ? [deletingUser] : []
    if (toDelete.length === 0) return

    setDeleteLoading(true)
    try {
      for (const u of toDelete) {
        await deleteUser(u.id)
      }
      showSuccessMessage(
        bulk ? `선택한 ${toDelete.length}명이 삭제되었습니다.` : MESSAGES.success.deleted
      )
      setDeleteModalOpen(false)
      setDeletingUser(null)
      setBulkDeleteUsers(null)
      setSelectedRowKeys(prev => prev.filter(key => !toDelete.some(u => u.id === key)))
      invalidateList()
    } catch (error) {
      handleError(error, { defaultMessage: '회원 삭제에 실패했습니다.' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setDeletingUser(null)
    setBulkDeleteUsers(null)
  }

  return (
    <div>
      <div className="user-list-page__filter-wrap">
        <FilterListLayout
          className="program-list-content-wrapper"
          bordered={false}
          fields={[
            {
              key: 'search',
              type: 'search',
              label: '회원명',
              placeholder: '회원명을 입력하세요',
            },
            {
              key: 'role',
              type: 'select',
              label: '회원 유형',
              placeholder: '전체',
              options: [
                { label: '전체', value: 'ALL' },
                { label: '개인', value: 'INDIVIDUAL' },
                { label: '학교(교사)', value: 'SCHOOL' },
                { label: '강사', value: 'INSTRUCTOR' },
                { label: '관리자', value: 'ADMIN' },
              ],
            },
            {
              key: 'createdAtRange',
              type: 'dateRange',
              label: '가입일',
            },
          ]}
          filters={{
            search: pendingFilters.search,
            role: pendingFilters.role,
            createdAtRange: pendingFilters.createdAtRange ?? undefined,
          }}
          onFilterChange={(key, value) => {
            if (key === 'createdAtRange') {
              setPendingFilters(prev => ({
                ...prev,
                createdAtRange: value as [Dayjs | null, Dayjs | null] | null,
              }))
            } else {
              setPendingFilters(prev => ({ ...prev, [key]: value }))
            }
          }}
          onSearch={handleSearch}
          loading={listLoading}
          listHeader={
            <>
              <div className="program-list-page__divider-wrapper">
                <Divider />
              </div>
              <div className="program-list-page__filter-info">
                <div className="program-list-page__filter-info-texts">
                  <div className="program-list-page__filter-info-title">
                    {memberListPageTitle(resolvedMemberListKind)}
                  </div>
                  <div className="program-list-page__filter-info-count">
                    총 {listTotal.toLocaleString()}건
                  </div>
                </div>
                <div className="program-list-page__widget-header-actions">
                  <AppButton
                    variant="danger"
                    size="filter"
                    dangerFillOnHover
                    onClick={() => {
                      const toDelete = listUsers.filter(u => selectedRowKeys.includes(u.id))
                      if (toDelete.length === 0) return
                      if (toDelete.length === 1) {
                        setDeletingUser(toDelete[0])
                        setBulkDeleteUsers(null)
                      } else {
                        setDeletingUser(null)
                        setBulkDeleteUsers(toDelete)
                      }
                      setDeleteModalOpen(true)
                    }}
                    disabled={selectedRowKeys.length === 0}
                  >
                    회원 삭제
                  </AppButton>
                  {canWrite && (
                    <AppButton variant="primary" size="filter" onClick={openCreateModal}>
                      회원 등록
                    </AppButton>
                  )}
                </div>
              </div>
            </>
          }
        >
          <div className="program-list-content-wrapper__table">
            <Card
              loading={listLoading}
              className="program-list-card program-list-card--in-wrapper program-list-card--no-border"
              style={{ border: 'none', boxShadow: 'none' }}
            >
              <UserList
                listKind={resolvedMemberListKind}
                data={listUsers}
                loading={false}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={canWrite ? handleDeleteClick : undefined}
                selectedRowKeys={selectedRowKeys}
                onSelectionChange={setSelectedRowKeys}
                pagination={false}
              />
            </Card>
          </div>

          <div ref={loadMoreRef} className="user-list-page__load-more-sentinel" aria-hidden>
            {isFetchingNextPage && (
              <div className="user-list-page__load-more-spinner">불러오는 중...</div>
            )}
          </div>
        </FilterListLayout>
      </div>

      <UserDetailFullPageModal
        open={drawerOpen}
        user={drawerUser ?? selectedUser}
        basicInfoEntrySource={basicInfoEntrySource}
        onClose={handleDrawerClose}
        onEdit={
          (drawerUser ?? selectedUser) ? () => handleEdit(drawerUser ?? selectedUser!) : undefined
        }
        onWithdraw={
          canWrite && (drawerUser ?? selectedUser)
            ? (u: Omit<User, 'password'>) => {
                handleDrawerClose()
                setDeletingUser(u)
                setBulkDeleteUsers(null)
                setDeleteModalOpen(true)
              }
            : undefined
        }
      />

      <UserRoleChangeModal
        open={roleChangeModalOpen}
        user={editingUser}
        loading={loading}
        onConfirm={handleRoleChange}
        onCancel={handleRoleChangeCancel}
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
          title="회원 삭제 안내"
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
