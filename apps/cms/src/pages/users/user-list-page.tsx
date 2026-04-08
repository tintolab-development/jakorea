/**
 * 사용자 관리 페이지
 * Phase 5.1.2: 사용자 관리 페이지
 * 회원 목록: React Query useInfiniteQuery + 15명씩 무한 스크롤
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, Modal, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useQueryClient } from '@tanstack/react-query'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { useInView } from '@/shared/hooks/use-in-view'
import { UserList } from '@/features/user/ui/user-list'
import {
  UserDetailFullPageModal,
  USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY,
} from '@/features/user/ui/user-detail-fullpage-modal'
import { UserRoleChangeModal } from '@/features/user/ui/user-role-change-modal'
import { UserCreateForm } from '@/features/user/ui/user-create-form'
import { useInfiniteUserList } from '@/features/user/hooks/use-infinite-user-list'
import { FilterListLayout } from '@/shared/components/filter-list-layout'
import { AppButton } from '@/shared/ui/app-button'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import { useUserStore, selectSelectedUser } from '@/features/user/model/user-store'
import type { AdminLevel, ProgramRole, User, UserRole } from '@/types/user'
import type { CreateUserRequest } from '@/entities/user/api/user-service'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
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
  type MemberListKind,
} from '@/shared/config/member-list-kinds'
import type { AdminPermissionTagVariant } from '@/features/user/lib/admin-permission-display'
import '@/pages/programs/program-list-page.css'
import './user-list-page.css'
import { getUserListFilterFields } from './user-list-filter-fields'

interface UserListQueryParams extends Record<string, string | undefined> {
  /** 전체·학교·강사·관리자 등 목록 맥락 (`member-list-kinds` 참고) */
  kind?: string
  role?: UserRole | 'ALL'
  search?: string
  id?: string
  lnb?: string
  /** 회원 상세 풀페이지 — 프로그램 참여 이력 하위 탭 */
  programsChild?: string
  createdAtFrom?: string
  createdAtTo?: string
  institutionLocation?: string
  instructorType?: string
  settlementStatus?: string
  adminPermissionVariant?: string
}

type ApiFilters = {
  role?: UserRole
  search?: string
  createdAtFrom?: string
  createdAtTo?: string
  institutionLocation?: string
  instructorType?: string
  settlementStatus?: string
  adminPermissionVariant?: AdminPermissionTagVariant
  /** `kind=instructors` 전용 — getUsersPage에만 합성 */
  instructorListPureOnly?: boolean
}

function parseAdminPermissionVariantParam(raw: string | undefined): AdminPermissionTagVariant | '' {
  if (!raw || raw === 'ALL') return ''
  if (raw === 'manager' || raw === 'partner' || raw === 'viewer') return raw
  return ''
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

function pendingToApiFilters(
  pending: {
    search: string
    institutionLocation: string
    instructorType: string
    settlementStatus: string
    adminPermissionVariant: string
    createdAtRange: [Dayjs | null, Dayjs | null] | null
  },
  listKind: MemberListKind
): ApiFilters {
  const api: ApiFilters = {}
  if (pending.search) api.search = pending.search
  if (listKind === 'institutions') {
    const loc = pending.institutionLocation.trim()
    if (loc) api.institutionLocation = loc
  }
  if (listKind === 'instructors') {
    const it = pending.instructorType.trim()
    if (it) api.instructorType = it
    const ss = pending.settlementStatus.trim()
    if (ss) api.settlementStatus = ss
  }
  if (listKind === 'admins') {
    const v = pending.adminPermissionVariant.trim()
    if (v === 'manager' || v === 'partner' || v === 'viewer') {
      api.adminPermissionVariant = v
    }
  }
  if (pending.createdAtRange?.[0] && pending.createdAtRange[1]) {
    api.createdAtFrom = pending.createdAtRange[0].format('YYYY-MM-DD')
    api.createdAtTo = pending.createdAtRange[1].format('YYYY-MM-DD')
  }
  return api
}

export function UserListPage() {
  const { params, setParam, setParams } = useQueryParams<UserListQueryParams>()
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
    const initialKind = normalizeMemberListKind(params.kind)
    if (initialKind === 'institutions') {
      const loc = params.institutionLocation?.trim()
      if (loc) api.institutionLocation = loc
    }
    if (initialKind === 'instructors') {
      const it = params.instructorType?.trim()
      if (it) api.instructorType = it
      const ss = params.settlementStatus?.trim()
      if (ss) api.settlementStatus = ss
    }
    if (initialKind === 'admins') {
      const apv = parseAdminPermissionVariantParam(params.adminPermissionVariant)
      if (apv) api.adminPermissionVariant = apv
    }
    return api
  })

  const listQueryFilters = useMemo((): ApiFilters => {
    const role = resolveRoleFilterFromMemberListParams({
      kind: params.kind,
      role: params.role,
    })
    const kind = normalizeMemberListKind(params.kind)
    const base: ApiFilters = { ...activeFilters }
    if (kind !== 'institutions') {
      delete base.institutionLocation
    }
    if (kind !== 'instructors') {
      delete base.instructorType
      delete base.settlementStatus
    }
    if (kind !== 'admins') {
      delete base.adminPermissionVariant
    }
    return {
      ...base,
      ...(role ? { role } : {}),
      ...(kind === 'instructors' ? { instructorListPureOnly: true as const } : {}),
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
  const fetchUserById = useUserStore(state => state.fetchUserById)
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

  // Pending 필터 상태 (조회 버튼 클릭 전까지 적용하지 않음)
  const [pendingFilters, setPendingFilters] = useState<{
    search: string
    role: UserRole | 'ALL'
    institutionLocation: string
    instructorType: string
    settlementStatus: string
    adminPermissionVariant: string
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
    const initialKind = normalizeMemberListKind(params.kind)
    return {
      search: params.search || '',
      role: pendingRoleFromParams(params),
      institutionLocation:
        initialKind === 'institutions' ? (params.institutionLocation ?? '').trim() : '',
      instructorType: initialKind === 'instructors' ? (params.instructorType ?? '').trim() : '',
      settlementStatus: initialKind === 'instructors' ? (params.settlementStatus ?? '').trim() : '',
      adminPermissionVariant:
        initialKind === 'admins'
          ? parseAdminPermissionVariantParam(params.adminPermissionVariant)
          : '',
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
    const kind = normalizeMemberListKind(params.kind)
    setPendingFilters({
      search: params.search || '',
      role: pendingRoleFromParams(params),
      institutionLocation: kind === 'institutions' ? (params.institutionLocation ?? '').trim() : '',
      instructorType: kind === 'instructors' ? (params.instructorType ?? '').trim() : '',
      settlementStatus: kind === 'instructors' ? (params.settlementStatus ?? '').trim() : '',
      adminPermissionVariant:
        kind === 'admins' ? parseAdminPermissionVariantParam(params.adminPermissionVariant) : '',
      createdAtRange,
    })
  }, [
    params.kind,
    params.search,
    params.role,
    params.createdAtFrom,
    params.createdAtTo,
    params.institutionLocation,
    params.instructorType,
    params.settlementStatus,
    params.adminPermissionVariant,
  ])

  // 선택된 사용자 (드로어용)
  const selectedUser = useUserStore(state => selectSelectedUser(state))

  const resolvedMemberListKind = useMemo(() => normalizeMemberListKind(params.kind), [params.kind])

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
  }, [modalDetailUser?.id, modalDetailUser?.role, resolvedMemberListKind])

  // 조회 버튼 클릭 시: URL·스토어 동기화 + React Query 키 변경으로 자동 재조회
  const handleSearch = () => {
    const api = pendingToApiFilters(pendingFilters, resolvedMemberListKind)
    setActiveFilters(api)
    setParam('search', pendingFilters.search || null)
    setParam('kind', pendingRoleToMemberListKind(pendingFilters.role))
    setParam('role', null)
    if (resolvedMemberListKind === 'institutions') {
      setParam('institutionLocation', pendingFilters.institutionLocation.trim() || null)
    } else {
      setParam('institutionLocation', null)
    }
    if (resolvedMemberListKind === 'instructors') {
      setParam('instructorType', pendingFilters.instructorType.trim() || null)
      setParam('settlementStatus', pendingFilters.settlementStatus.trim() || null)
    } else {
      setParam('instructorType', null)
      setParam('settlementStatus', null)
    }
    if (resolvedMemberListKind === 'admins') {
      const apv = pendingFilters.adminPermissionVariant.trim()
      setParam(
        'adminPermissionVariant',
        apv === 'manager' || apv === 'partner' || apv === 'viewer' ? apv : null
      )
    } else {
      setParam('adminPermissionVariant', null)
    }
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
      <div className="user-list-page__filter-wrap">
        <FilterListLayout
          className="program-list-content-wrapper"
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
          onFilterChange={(key, value) => {
            if (key === 'createdAtRange') {
              setPendingFilters(prev => ({
                ...prev,
                createdAtRange: value as [Dayjs | null, Dayjs | null] | null,
              }))
            } else if (key === 'institutionLocation') {
              setPendingFilters(prev => ({
                ...prev,
                institutionLocation: value === undefined || value === null ? '' : String(value),
              }))
            } else if (key === 'instructorType' || key === 'settlementStatus') {
              setPendingFilters(prev => ({
                ...prev,
                [key]: value === undefined || value === null ? '' : String(value),
              }))
            } else if (key === 'adminPermissionVariant') {
              setPendingFilters(prev => ({
                ...prev,
                adminPermissionVariant: value === undefined || value === null ? '' : String(value),
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
                      // if (toDelete.length === 1) {
                      //   setDeletingUser(toDelete[0])
                      //   setBulkDeleteUsers(null)
                      // } else {
                      //   setDeletingUser(null)
                      //   setBulkDeleteUsers(toDelete)
                      // }
                      window.alert('준비 중입니다')

                      // setDeleteModalOpen(true)
                    }}
                    disabled={selectedRowKeys.length === 0}
                  >
                    회원 삭제
                  </AppButton>
                  {canWrite && (
                    <AppButton
                      variant="primary"
                      size="filter"
                      onClick={() => window.alert('준비 중입니다')}
                    >
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
