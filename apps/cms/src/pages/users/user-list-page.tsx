/**
 * 사용자 관리 페이지
 * Phase 5.1.2: 사용자 관리 페이지
 * 회원 목록: React Query useInfiniteQuery + 15명씩 무한 스크롤
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { message } from 'antd'
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
import { AddUserIndividual } from '@/features/user/shared/ui/add-user-individual'
import {
  AdminRegisterModal,
  type AdminRegisterModalFormValues,
} from '@/features/user/shared/ui/admin-register-modal'
import {
  SchoolRegisterModal,
  type SchoolRegisterModalFormValues,
} from '@/features/school/ui/school-register-modal'
import { useInfiniteUserList } from '@/features/user/shared/hooks/use-infinite-user-list'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
  MESSAGES,
} from '@/shared/constants'
import { useUserStore, selectSelectedUser } from '@/features/user/shared/model/user-store'
import type { User } from '@/types/user'
import type { CreateUserRequest } from '@/entities/user/api/user-service'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import {
  ActionResultModal,
  ContentModal,
  DeleteGuideModal,
  buildDeleteCompletedMessageBulk,
  buildDeleteCompletedMessageSingle,
  buildDeleteCompletedTitle,
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
import { institutionHasRegisteredTeachers } from '@/features/user/shared/lib/institution-delete-guard'
import { InstitutionDeleteBlockedModal } from '@/features/user/shared/ui/institution-delete-blocked-modal'
import {
  useTablePage,
  EMPTY_TABLE_PAGE_CONTEXT,
} from '@/shared/components/table-system/model/use-table-page'
import {
  buildListQueryApiFilters,
  createUserListTablePageConfig,
  type UserListQueryParams,
} from './user-list-table.config'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'

type UserListRow = Omit<User, 'password'>

function memberDeleteGuideDomain(kind: MemberListKind) {
  switch (kind) {
    case 'institutions':
      return {
        bulkCounterPhrase: '개의 학교',
        particleTargetNoun: '학교',
        domainLabel: '학교',
        singleTitle: '학교 삭제 안내',
        confirmText: '학교 삭제',
      }
    case 'instructors':
      return {
        bulkCounterPhrase: '명의 강사',
        particleTargetNoun: '강사',
        domainLabel: '강사',
        singleTitle: '강사 삭제 안내',
        confirmText: '강사 삭제',
      }
    default:
      return {
        bulkCounterPhrase: '명의 회원',
        particleTargetNoun: '회원',
        domainLabel: '회원',
        singleTitle: '회원 삭제 안내',
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

function buildMemberDeleteGuideLines(names: string[]): string[] {
  const normalized = names.map(name => name.trim()).filter(Boolean)
  if (normalized.length === 0) return []
  if (normalized.length >= 2) {
    return [
      `선택한 ${normalized.length}명의 회원을 삭제하시겠습니까?`,
      '삭제 시 즉시 탈퇴 처리 되며, 등록 및 관련된 정보는 모두 삭제됩니다.',
      '삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
    ]
  }
  return [
    `[${normalized[0]}] 회원을 삭제하시겠습니까?`,
    '삭제 시 즉시 탈퇴 처리 되며, 등록 및 관련된 정보는 모두 삭제됩니다.',
    '삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
  ]
}

/** 상세 > 탈퇴 확정 후 삭제 완료 모달에 쓰는 엔티티 라벨 */
function entityLabelForWithdrawDeletedUser(u: UserListRow): string {
  if (u.role === 'SCHOOL') return '학교'
  if (u.role === 'INSTRUCTOR') return '강사'
  if (u.role === 'ADMIN') return '관리자'
  return '회원'
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
  const fetchUserById = useUserStore(state => state.fetchUserById)
  const patchUserBasicInfo = useUserStore(state => state.patchUserBasicInfo)
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

  // 회원 추가 모달 상태 관리
  const {
    open: createModalOpen,
    openModal: openCreateModal,
    closeModal: closeCreateModal,
  } = useModalState()

  // 학교(기관) 신규 등록 모달
  const {
    open: schoolRegisterOpen,
    openModal: openSchoolRegisterModal,
    closeModal: closeSchoolRegisterModal,
  } = useModalState()
  const {
    open: adminRegisterOpen,
    openModal: openAdminRegisterModal,
    closeModal: closeAdminRegisterModal,
  } = useModalState()

  // 삭제 확인 모달 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<Omit<User, 'password'> | null>(null)
  const [, setDeleteLoading] = useState(false)

  /** 삭제 완료 안내(결과) 모달 */
  const [deleteResultModalOpen, setDeleteResultModalOpen] = useState(false)
  const [deleteResultTitle, setDeleteResultTitle] = useState('')
  const [deleteResultMessage, setDeleteResultMessage] = useState('')

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
  const [adminPermissionChangingUserId, setAdminPermissionChangingUserId] = useState<string | null>(
    null
  )

  /** 학교(기관) — 소속 교사가 있으면 삭제 불가 안내 */
  const [institutionDeleteBlockedOpen, setInstitutionDeleteBlockedOpen] = useState(false)
  const [institutionDeleteBlockedCount, setInstitutionDeleteBlockedCount] = useState(1)

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
    const lines = buildMemberDeleteGuideLines(
      deleteTargets.map(target => displayNameForUserDelete(resolvedMemberListKind, target))
    )
    return { title: '회원 삭제 안내', lines, confirmText: '회원 삭제' }
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

  const handleMemberBasicInfoSaved = useCallback(
    (updated: Omit<User, 'password'>) => {
      setDrawerUser(updated)
      invalidateList()
    },
    [setDrawerUser, invalidateList]
  )

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

  const handleSchoolRegisterSubmit = async (values: SchoolRegisterModalFormValues) => {
    try {
      const address = [values.roadAddress.trim(), values.detailAddress?.trim()]
        .filter(Boolean)
        .join(' ')
      await createUser({
        email: `school-${Date.now()}@institution.jakorea.local`,
        password: 'Temp1234!',
        name: values.institutionName.trim(),
        role: 'SCHOOL',
        schoolInfo: {
          schoolName: values.institutionName.trim(),
          address,
        },
        isActive: true,
      })
      showSuccessMessage(MESSAGES.success.created)
      invalidateList()
    } catch (error) {
      handleError(error, { defaultMessage: '학교 등록에 실패했습니다.' })
      throw error
    }
  }

  const handleAdminRegisterSubmit = async (values: AdminRegisterModalFormValues) => {
    try {
      await createUser({
        email: values.email.trim(),
        password: 'Temp1234!',
        name: values.name.trim(),
        nameEn: values.nameEn?.trim() || undefined,
        phone: values.contact.trim(),
        gender: values.gender === 'male' ? '남성' : '여성',
        birthDate: values.birthDate?.trim() || undefined,
        role: 'ADMIN',
        adminLevel: 'ADMIN',
        isActive: true,
      })
      showSuccessMessage(MESSAGES.success.created)
      invalidateList()
      closeAdminRegisterModal()
    } catch (error) {
      handleError(error, { defaultMessage: '관리자 등록에 실패했습니다.' })
      throw error
    }
  }

  // 회원 삭제
  const handleDeleteClick = (user: Omit<User, 'password'>) => {
    if (resolvedMemberListKind === 'institutions' && institutionHasRegisteredTeachers(user)) {
      setInstitutionDeleteBlockedCount(1)
      setInstitutionDeleteBlockedOpen(true)
      return
    }
    setDeletingUser(user)
    setBulkDeleteUsers(null)
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
      const domain = memberDeleteGuideDomain(resolvedMemberListKind)
      setDeleteResultTitle(buildDeleteCompletedTitle(domain.domainLabel))
      setDeleteResultMessage(
        bulk
          ? buildDeleteCompletedMessageBulk(toDelete.length, domain.bulkCounterPhrase)
          : buildDeleteCompletedMessageSingle(
              displayNameForUserDelete(resolvedMemberListKind, toDelete[0]),
              domain.domainLabel
            )
      )
      setDeleteResultModalOpen(true)
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

  /** 회원 상세 > 탈퇴 확인 모달 확정 — 목록용 DeleteGuideModal 없이 바로 삭제 후 완료 안내 */
  const handleWithdrawFromDetail = useCallback(
    async (u: Omit<User, 'password'>) => {
      flushUserDetailModal()
      setDeleteLoading(true)
      try {
        await deleteUser(u.id)
        const entityLabel = entityLabelForWithdrawDeletedUser(u)
        setDeleteResultTitle(buildDeleteCompletedTitle(entityLabel))
        setDeleteResultMessage(
          buildDeleteCompletedMessageSingle(
            displayNameForUserDelete(resolvedMemberListKind, u),
            entityLabel
          )
        )
        setDeleteResultModalOpen(true)
        setSelectedRowKeys(prev => prev.filter(key => key !== u.id))
        invalidateList()
      } catch (error) {
        handleError(error, { defaultMessage: '회원 탈퇴 처리에 실패했습니다.' })
      } finally {
        setDeleteLoading(false)
      }
    },
    [flushUserDetailModal, deleteUser, resolvedMemberListKind, invalidateList]
  )

  const handleCloseDeleteResultModal = useCallback(() => {
    setDeleteResultModalOpen(false)
  }, [])

  const handleAdminPermissionChange = useCallback(
    async (ctx: { userId: string; nextPermission: AdminPermissionTagVariant }) => {
      setAdminPermissionChangingUserId(ctx.userId)
      try {
        await patchUserBasicInfo(ctx.userId, {
          listMetrics: { adminPermissionVariant: ctx.nextPermission },
        })
        showSuccessMessage('관리자 권한 유형이 변경되었습니다.')
        invalidateList()
      } catch (error) {
        handleError(error, { defaultMessage: '관리자 권한 유형 변경에 실패했습니다.' })
      } finally {
        setAdminPermissionChangingUserId(null)
      }
    },
    [patchUserBasicInfo, invalidateList]
  )

  return (
    <div>
      <FilterTableLayout
        bordered={false}
        fields={userListFilterFields}
        filters={
          resolvedMemberListKind === 'institutions'
            ? {
                search: pendingFilters.search,
                institutionSido: pendingFilters.institutionSido,
                institutionSigungu: pendingFilters.institutionSigungu,
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
                if (resolvedMemberListKind === 'institutions') {
                  const blocked = toDelete.filter(institutionHasRegisteredTeachers)
                  if (blocked.length > 0) {
                    setInstitutionDeleteBlockedCount(toDelete.length)
                    setInstitutionDeleteBlockedOpen(true)
                    return
                  }
                }
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
                  : resolvedMemberListKind === 'admins'
                    ? '관리자 삭제'
                    : '회원 삭제'}
            </CmsButton>
            {canWrite && (
              <CmsButton
                onClick={() => {
                  if (resolvedMemberListKind === 'all') {
                    openCreateModal()
                    return
                  }
                  if (resolvedMemberListKind === 'institutions') {
                    openSchoolRegisterModal()
                    return
                  }
                  if (resolvedMemberListKind === 'admins') {
                    openAdminRegisterModal()
                    return
                  }
                  window.alert('준비 중입니다')
                }}
              >
                {resolvedMemberListKind === 'institutions'
                  ? '학교 등록'
                  : resolvedMemberListKind === 'instructors'
                    ? '강사 등록'
                    : resolvedMemberListKind === 'admins'
                      ? '관리자 등록'
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
          onDelete={canWrite ? handleDeleteClick : undefined}
          onAdminPermissionChange={canWrite ? handleAdminPermissionChange : undefined}
          adminPermissionChangeLoadingUserId={adminPermissionChangingUserId}
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
        onWithdraw={canWrite && modalDetailUser ? handleWithdrawFromDetail : undefined}
        onNavigateToLinkedUser={handleNavigateToLinkedUser}
        onMemberBasicInfoSaved={handleMemberBasicInfoSaved}
      />

      <ContentModal
        open={createModalOpen}
        title="회원 신규 등록"
        onCancel={closeCreateModal}
        footer={null}
        width={1400}
      >
        <AddUserIndividual
          onSubmit={handleCreateUser}
          onCancel={closeCreateModal}
          loading={loading}
        />
      </ContentModal>

      <SchoolRegisterModal
        open={schoolRegisterOpen}
        onClose={closeSchoolRegisterModal}
        onSubmit={handleSchoolRegisterSubmit}
        loading={loading}
      />

      <AdminRegisterModal
        open={adminRegisterOpen}
        onClose={closeAdminRegisterModal}
        onSubmit={handleAdminRegisterSubmit}
        loading={loading}
      />

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

      <ActionResultModal
        open={deleteResultModalOpen}
        title={deleteResultTitle}
        message={deleteResultMessage}
        onClose={handleCloseDeleteResultModal}
      />

      <InstitutionDeleteBlockedModal
        open={institutionDeleteBlockedOpen}
        onClose={() => setInstitutionDeleteBlockedOpen(false)}
        selectedCount={institutionDeleteBlockedCount}
      />
    </div>
  )
}
