/**
 * 사용자 관리 페이지
 * Phase 5.1.2: 사용자 관리 페이지
 * 회원 목록: React Query useInfiniteQuery + 15명씩 무한 스크롤
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Modal, message } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { useInView } from '@/shared/hooks/use-in-view'
import { UserList } from '@/features/user/shared/ui/user-list'
import {
  UserDetailFullPageModal,
  USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY,
} from '@/pages/users/user-detail-fullpage-modal'
import { UserRoleChangeModal } from '@/features/user/shared/ui/user-role-change-modal'
import { UserCreateForm } from '@/features/user/shared/ui/user-create-form'
import { useInfiniteUserList } from '@/features/user/shared/hooks/use-infinite-user-list'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
  LAYOUT_CONSTANTS,
  MESSAGES,
} from '@/shared/constants'
import { useUserStore, selectSelectedUser } from '@/features/user/shared/model/user-store'
import type { AdminLevel, ProgramRole, User, UserRole } from '@/types/user'
import type { CreateUserRequest } from '@/entities/user/api/user-service'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import {
  DeleteGuideModal,
  buildBulkDeleteGuideTitle,
  buildBulkDomainDeleteMessageLines,
  buildDomainEntityDeleteMessageLines,
} from '@/shared/ui'
import {
  memberListKindToBasicInfoEntrySource,
  memberListPageTitle,
  normalizeMemberListKind,
  userRoleToBasicInfoEntrySource,
  type MemberListKind,
} from '@/shared/config/member-list-kinds'
import '@/pages/programs/program-list-page.css'
import './user-list-page.css'
import { getUserListFilterFields } from './user-list-filter-fields'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  useTablePage,
  EMPTY_TABLE_PAGE_CONTEXT,
} from '@/shared/components/table-system/model/use-table-page'
import {
  buildListQueryApiFilters,
  createUserListTablePageConfig,
  type UserListQueryParams,
} from './user-list-table.config'

type UserListRow = Omit<User, 'password'>

function memberDeleteGuideDomain(kind: MemberListKind) {
  switch (kind) {
    case 'institutions':
      return {
        bulkCounterPhrase: '개의 학교',
        particleTargetNoun: '학교',
        domainLabel: '학교',
        singleTitle: '학교 삭제',
        confirmText: '학교 삭제',
      }
    case 'instructors':
      return {
        bulkCounterPhrase: '명의 강사',
        particleTargetNoun: '강사',
        domainLabel: '강사',
        singleTitle: '강사 삭제',
        confirmText: '강사 삭제',
      }
    default:
      return {
        bulkCounterPhrase: '명의 회원',
        particleTargetNoun: '회원',
        domainLabel: '회원',
        singleTitle: '회원 삭제',
        confirmText: '회원 삭제',
      }
  }
}

function displayNameForUserDelete(kind: MemberListKind, u: UserListRow): string {
  if (kind === 'institutions') {
    const school = u.schoolInfo?.schoolName?.trim()
    if (school) return school
  }
  const name = u.name?.trim()
  if (name) return name
  const email = u.email?.trim()
  if (email) return email
  return '(이름 없음)'
}

export function UserListPage() {
  const { params, setParams } = useQueryParams<UserListQueryParams>()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)

  const listQueryFilters = useMemo(() => buildListQueryApiFilters(params), [params])

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
  const fetchUserById = useUserStore(state => state.fetchUserById)
  const setSelectedUserId = useUserStore(state => state.setSelectedUserId)
  const setFilters = useUserStore(state => state.setFilters)
  const clearSelectedUserId = useUserStore(state => state.setSelectedUserId)
  const loading = useUserStore(state => state.loading)

  const setFiltersRef = useRef(setFilters)
  setFiltersRef.current = setFilters
  const userListTablePageConfig = useMemo(
    () =>
      createUserListTablePageConfig({
        setFilters: f => {
          setFiltersRef.current(f)
        },
      }),
    []
  )

  const { pendingFilters, handleFilterChange, applySearch } = useTablePage(
    userListTablePageConfig,
    {
      data: listUsers,
      searchParams,
      setSearchParams,
      context: EMPTY_TABLE_PAGE_CONTEXT,
    }
  )

  // Drawer 상태 관리 (useModalState 사용) — 행 클릭 시 열리는 회원 상세
  const {
    open: drawerOpen,
    openModal: openDrawer,
    closeModal: closeDrawer,
    selectedItem: drawerUser,
    setSelectedItem: setDrawerUser,
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
    // openModal: openCreateModal,
    closeModal: closeCreateModal,
  } = useModalState()

  // 삭제 확인 모달 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<Omit<User, 'password'> | null>(null)
  const [, setDeleteLoading] = useState(false)

  /**
   * 행 클릭 직후 URL·drawer·목록 배열이 한 틱 어긋날 때(전체 회원 등)에도 풀페이지가 바로 뜨도록
   * 클릭한 행 객체를 동기적으로 보관
   */
  const [detailBridgeUser, setDetailBridgeUser] = useState<Omit<User, 'password'> | null>(null)

  /**
   * handleView가 id 쿼리보다 먼저 반영될 때 한 틱 동안 params.id가 이전 회원을 가리키는 경우가 있다.
   * 이때 URL 동기화 effect가 목록에서 옛 id로 openDrawer를 호출하면 드로어·URL이 서로 덮어써 무한 갱신된다.
   */
  const pendingOpenedUserIdRef = useRef<string | null>(null)

  /** 학교(SCHOOL) 상세 → 소속 교사 linkedUserId 진입 시, X 버튼으로 학교 상세로 되돌리기 */
  const schoolDetailReturnUserRef = useRef<Omit<User, 'password'> | null>(null)

  // 테이블 행 선택 (일괄 삭제용)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  // 일괄 삭제 대상 (여러 명 선택 시)
  const [bulkDeleteUsers, setBulkDeleteUsers] = useState<Omit<User, 'password'>[] | null>(null)

  // 선택된 사용자 (드로어용)
  const selectedUser = useUserStore(state => selectSelectedUser(state))

  const resolvedMemberListKind = useMemo(() => normalizeMemberListKind(params.kind), [params.kind])

  const deleteTargets = useMemo((): UserListRow[] => {
    if (bulkDeleteUsers && bulkDeleteUsers.length > 0) return bulkDeleteUsers
    if (deletingUser) return [deletingUser]
    return []
  }, [bulkDeleteUsers, deletingUser])

  const memberDeleteGuide = useMemo(() => {
    if (deleteTargets.length === 0) return null
    const domain = memberDeleteGuideDomain(resolvedMemberListKind)
    const isMulti = deleteTargets.length >= 2
    const title = isMulti ? buildBulkDeleteGuideTitle(domain.domainLabel) : domain.singleTitle
    const lines = isMulti
      ? buildBulkDomainDeleteMessageLines(
          deleteTargets.length,
          domain.bulkCounterPhrase,
          domain.particleTargetNoun,
          domain.domainLabel
        )
      : buildDomainEntityDeleteMessageLines(
          [displayNameForUserDelete(resolvedMemberListKind, deleteTargets[0])],
          domain.domainLabel
        )
    return { title, lines, confirmText: domain.confirmText }
  }, [deleteTargets, resolvedMemberListKind])

  const userListFilterFields = useMemo(
    () => getUserListFilterFields(resolvedMemberListKind),
    [resolvedMemberListKind]
  )

  // URL(id) 기반 모달 상태 복원: 새로고침/직접 진입 시 상세 모달 유지
  useEffect(() => {
    let cancelled = false
    const targetId = params.id?.trim()

    if (!targetId) {
      // 클릭 직후 handleView는 detailBridgeUser·openDrawer를 먼저 반영하고,
      // React Router의 `id` 쿼리는 다음 틱에 올 수 있음. 이때 !targetId로 닫으면 첫 클릭이 무효화됨.
      if (detailBridgeUser && (drawerOpen || drawerUser)) {
        return
      }
      setDetailBridgeUser(null)
      if (drawerOpen || drawerUser || selectedUser) {
        closeDrawer()
        clearSelectedUserId(null)
      }
      return
    }

    if (pendingOpenedUserIdRef.current) {
      if (targetId === pendingOpenedUserIdRef.current) {
        pendingOpenedUserIdRef.current = null
      } else if (
        drawerUser?.id === pendingOpenedUserIdRef.current &&
        targetId !== pendingOpenedUserIdRef.current
      ) {
        return
      }
    }

    if (selectedUser?.id !== targetId) {
      setSelectedUserId(targetId)
    }

    if (drawerOpen && drawerUser?.id === targetId) return

    const listMatched = listUsers.find(u => u.id === targetId)
    if (listMatched) {
      openDrawer(listMatched)
      return
    }

    if (selectedUser?.id === targetId) {
      openDrawer(selectedUser)
      return
    }

    ;(async () => {
      try {
        await fetchUserById(targetId)
        if (cancelled) return
        const fetched = useUserStore.getState().usersById[targetId]
        if (!fetched) return
        setSelectedUserId(targetId)
        openDrawer(fetched)
      } catch {
        // 잘못된 id 또는 조회 실패 시 모달을 강제로 열지 않음
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    params.id,
    detailBridgeUser,
    drawerOpen,
    drawerUser,
    selectedUser,
    listUsers,
    closeDrawer,
    clearSelectedUserId,
    setSelectedUserId,
    openDrawer,
    fetchUserById,
  ])

  /** URL id만 먼저 반영되고 drawer 상태가 한 틱 늦을 때도 1회 클릭으로 모달이 뜨도록 목록 행으로 보강 */
  const userFromListByUrlId = useMemo(() => {
    const tid = params.id?.trim()
    if (!tid) return null
    return listUsers.find(u => u.id === tid) ?? null
  }, [params.id, listUsers])

  const modalDetailUser = drawerUser ?? selectedUser ?? userFromListByUrlId ?? detailBridgeUser
  /**
   * `params.id && modalDetailUser`만으로 열림을 두면, 닫기 직후 URL id가 한 틱 남거나
   * 목록에서 id로 보강된 user가 남아 X로도 닫히지 않는 것처럼 보인다.
   * URL 복원은 아래 useEffect가 openDrawer로 처리한다.
   */
  const userDetailModalOpen = drawerOpen || Boolean(detailBridgeUser)

  /** 열려 있는 상세 대상이 있으면 그 회원 역할 기준(전체 회원 혼합 목록 대응), 없으면 목록 kind 기준 */
  const basicInfoEntrySource = useMemo(() => {
    if (modalDetailUser) {
      return userRoleToBasicInfoEntrySource(modalDetailUser.role)
    }
    return memberListKindToBasicInfoEntrySource(resolvedMemberListKind)
  }, [modalDetailUser, resolvedMemberListKind])

  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
  }, [queryClient])

  // 사용자 상세 보기
  const handleView = useCallback(
    (user: Omit<User, 'password'>) => {
      pendingOpenedUserIdRef.current = user.id
      setDetailBridgeUser(user)
      setSelectedUserId(user.id) // 스토어에 ID만 저장
      openDrawer(user)
      setParams({
        id: user.id,
        lnb: 'detail-info',
        [USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY]: undefined,
      })
    },
    [setSelectedUserId, openDrawer, setParams]
  )

  const handleNavigateToLinkedUser = useCallback(
    async (userId: string) => {
      const schoolReturn = drawerUser?.role === 'SCHOOL' ? drawerUser : null
      if (schoolReturn) {
        schoolDetailReturnUserRef.current = schoolReturn
      }
      try {
        await fetchUserById(userId)
        const u = useUserStore.getState().usersById[userId]
        if (!u) {
          if (schoolReturn) schoolDetailReturnUserRef.current = null
          message.error('회원 정보를 찾을 수 없습니다.')
          return
        }
        if (u.role === 'INSTRUCTOR') {
          const profile = resolveInstructorMemberProfile(u)
          if (profile === 'instructor_only') {
            if (schoolReturn) schoolDetailReturnUserRef.current = null
            message.warning(
              '학교 소속 교사 목록에서는 교사·교사 및 강사 회원만 열 수 있습니다. 순수 강사는 회원 목록의 강사 탭에서 확인하세요.'
            )
            return
          }
        }
        handleView(u)
      } catch {
        if (schoolReturn) schoolDetailReturnUserRef.current = null
        message.error('회원 정보를 불러오지 못했습니다.')
      }
    },
    [drawerUser, fetchUserById, handleView]
  )

  /** 모달·URL·복귀 스택까지 완전히 닫음 (탈퇴/삭제 플로우 등) */
  const flushUserDetailModal = useCallback(() => {
    pendingOpenedUserIdRef.current = null
    setDetailBridgeUser(null)
    schoolDetailReturnUserRef.current = null
    setDrawerUser(null)
    closeDrawer()
    clearSelectedUserId(null)
    setParams({
      id: undefined,
      lnb: undefined,
      [USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY]: undefined,
    })
  }, [closeDrawer, clearSelectedUserId, setParams, setDrawerUser])

  /** 풀페이지 X — 학교→교사 drill-down 중이면 학교 상세로, 아니면 목록으로 */
  const handleUserDetailModalClose = useCallback(() => {
    const back = schoolDetailReturnUserRef.current
    if (back) {
      schoolDetailReturnUserRef.current = null
      handleView(back)
      return
    }
    flushUserDetailModal()
  }, [handleView, flushUserDetailModal])

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
      <FilterTableLayout
        bordered={false}
        fields={userListFilterFields}
        filters={
          resolvedMemberListKind === 'institutions'
            ? {
                search: pendingFilters.search,
                institutionLocation: pendingFilters.institutionLocation,
                createdAtRange: pendingFilters.createdAtRange ?? undefined,
              }
            : resolvedMemberListKind === 'instructors'
              ? {
                  search: pendingFilters.search,
                  instructorType: pendingFilters.instructorType,
                  settlementStatus: pendingFilters.settlementStatus,
                  createdAtRange: pendingFilters.createdAtRange ?? undefined,
                }
              : resolvedMemberListKind === 'admins'
                ? {
                    search: pendingFilters.search,
                    adminPermissionVariant: pendingFilters.adminPermissionVariant,
                    createdAtRange: pendingFilters.createdAtRange ?? undefined,
                  }
                : {
                    search: pendingFilters.search,
                    role: pendingFilters.role,
                    createdAtRange: pendingFilters.createdAtRange ?? undefined,
                  }
        }
        onFilterChange={handleFilterChange}
        onSearch={applySearch}
        loading={listLoading}
        title={memberListPageTitle(resolvedMemberListKind)}
        description={`총 ${listTotal.toLocaleString()}건`}
        actions={
          <>
            <CmsButton
              variant="delete"
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
              {resolvedMemberListKind === 'institutions'
                ? '학교 삭제'
                : resolvedMemberListKind === 'instructors'
                  ? '강사 삭제'
                  : '회원 삭제'}
            </CmsButton>
            {canWrite && (
              <CmsButton onClick={() => window.alert('준비 중입니다')}>
                {resolvedMemberListKind === 'institutions'
                  ? '학교 등록'
                  : resolvedMemberListKind === 'instructors'
                    ? '강사 등록'
                    : '회원 등록'}
              </CmsButton>
            )}
          </>
        }
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
        <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
      </FilterTableLayout>

      <UserDetailFullPageModal
        open={userDetailModalOpen}
        user={modalDetailUser}
        basicInfoEntrySource={basicInfoEntrySource}
        onClose={handleUserDetailModalClose}
        onEdit={modalDetailUser ? () => handleEdit(modalDetailUser) : undefined}
        onWithdraw={
          canWrite && modalDetailUser
            ? (u: Omit<User, 'password'>) => {
                flushUserDetailModal()
                setDeletingUser(u)
                setBulkDeleteUsers(null)
                setDeleteModalOpen(true)
              }
            : undefined
        }
        onNavigateToLinkedUser={handleNavigateToLinkedUser}
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

      {deleteModalOpen && memberDeleteGuide && (
        <DeleteGuideModal
          open
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title={memberDeleteGuide.title}
          lines={memberDeleteGuide.lines}
          confirmText={memberDeleteGuide.confirmText}
          confirmVariant="delete"
          requiredConfirmInput={DELETE_GUIDE_TYPED_CONFIRM_VALUE}
          confirmInputPlaceholder={DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER}
        />
      )}
    </div>
  )
}
