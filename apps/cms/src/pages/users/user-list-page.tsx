/**
 * 사용자 관리 페이지
 * Phase 5.1.2: 사용자 관리 페이지
 * 회원 목록: React Query useInfiniteQuery + 15명씩 무한 스크롤
 */

import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react'
import { Alert } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { useInView } from '@/shared/hooks/use-in-view'
import { UserList } from '@/features/user/shared/ui/user-list'
import {
  UserDetailFullPageModal,
  USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY,
} from '@/pages/users/user-detail-fullpage-modal'
import { MemberRegisterModal } from '@/features/user/shared/ui/member-register-modal'
import {
  AdminRegisterModal,
  type AdminRegisterModalFormValues,
} from '@/features/user/shared/ui/admin-register-modal'
import {
  SchoolRegisterModal,
  type SchoolRegisterModalFormValues,
} from '@/features/school/ui/school-register-modal'
import {
  InstructorRegisterModal,
  type InstructorRegisterModalFormValues,
} from '@/features/user/shared/ui/instructor-register-modal'
import { useInfiniteUserList } from '@/features/user/shared/hooks/use-infinite-user-list'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import { useUserStore, selectSelectedUser } from '@/features/user/shared/model/user-store'
import type { User, AffiliatedTeacherLinkTarget } from '@/types/user'
import type { CreateUserRequest, GetUsersPageResult } from '@/entities/user/api/user-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { handleError } from '@/shared/utils/error-handler'
import {
  ActionResultModal,
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
import {
  getUnsupportedMemberListFilterLabels,
  isMembersRemoteEnabled,
} from '@/features/user/api/member-remote-capabilities'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { mergeListUserWithFetchedDetail } from '@/features/user/api/merge-list-user-with-detail'
import { applyAffiliatedTeacherLinkToUser } from '@/features/user/api/apply-affiliated-teacher-link'
import { SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL } from '@/features/user/detail/lib/school-teacher-employment-status'
import { buildSchoolDeleteMessageLines } from '@/features/program/general/ui/manager-delete-guide-modal'

type UserListRow = Omit<User, 'password'>

function memberDeleteGuideDomain(kind: MemberListKind) {
  switch (kind) {
    case 'institutions':
      return {
        bulkCounterPhrase: '개의 학교',
        particleTargetNoun: '학교',
        domainLabel: '학교',
        singleTitle: '학교 삭제 안내',
        bulkTitle: '학교 일괄 삭제 안내',
        confirmText: '학교 삭제',
      }
    case 'instructors':
      return {
        bulkCounterPhrase: '명의 강사',
        particleTargetNoun: '강사',
        domainLabel: '강사',
        singleTitle: '강사 삭제 안내',
        bulkTitle: '강사 일괄 삭제 안내',
        confirmText: '강사 삭제',
      }
    default:
      return {
        bulkCounterPhrase: '명의 회원',
        particleTargetNoun: '회원',
        domainLabel: '회원',
        singleTitle: '회원 삭제 안내',
        bulkTitle: '회원 일괄 삭제 안내',
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

function buildMemberDeleteGuideLines(names: string[], kind: MemberListKind): string[] {
  const normalized = names.map(name => name.trim()).filter(Boolean)
  if (normalized.length === 0) return []
  if (kind === 'institutions' && normalized.length >= 2) {
    return [
      `선택한 ${normalized.length}개의 학교를 삭제하시겠습니까?`,
      '삭제 시 즉시 삭제 처리 되며, 등록 및 관련된 정보는 모두 삭제됩니다.',
      '삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
    ]
  }
  if (normalized.length >= 2) {
    return [
      `선택한 ${normalized.length}명의 회원을 삭제하시겠습니까?`,
      '삭제 시 즉시 탈퇴 처리 되며, 등록 및 관련된 정보는 모두 삭제됩니다.',
      '삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
    ]
  }
  if (kind === 'institutions') {
    return buildSchoolDeleteMessageLines({ displayName: normalized[0] })
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

  const unsupportedRemoteFilterLabels = useMemo(
    () => (isMembersRemoteEnabled() ? getUnsupportedMemberListFilterLabels(listQueryFilters) : []),
    [listQueryFilters]
  )

  const {
    users: listUsers,
    total: listTotal,
    isFetching: listFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteUserList(listQueryFilters)

  /** 조회 버튼 — 무한스크롤 next page fetch는 제외 */
  const filterSearchLoading = listFetching && !isFetchingNextPage

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
  const {
    open: instructorRegisterOpen,
    openModal: openInstructorRegisterModal,
    closeModal: closeInstructorRegisterModal,
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

  /**
   * X 닫기 직후 `params.id`가 한 틱 남아 있으면 URL 복원 effect가 openDrawer를 다시 호출한다.
   * 의도적 닫기 동안에는 복원을 막고, 다음 handleView에서만 해제한다.
   */
  const suppressDetailRestoreRef = useRef(false)
  /** useUserDetailUrlSync가 닫기 직후 id·lnb를 URL에 다시 쓰지 않도록 */
  const detailCloseIntentRef = useRef(false)
  const drawerOpenRef = useRef(drawerOpen)
  const drawerUserRef = useRef(drawerUser)
  drawerOpenRef.current = drawerOpen
  drawerUserRef.current = drawerUser

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
    const domain = memberDeleteGuideDomain(resolvedMemberListKind)
    const lines = buildMemberDeleteGuideLines(
      deleteTargets.map(target => displayNameForUserDelete(resolvedMemberListKind, target)),
      resolvedMemberListKind
    )
    const title = deleteTargets.length >= 2 ? domain.bulkTitle : domain.singleTitle
    return { title, lines, confirmText: domain.confirmText }
  }, [deleteTargets, resolvedMemberListKind])

  const userListFilterFields = useMemo(
    () => getUserListFilterFields(resolvedMemberListKind),
    [resolvedMemberListKind]
  )

  const userExcelColumns = useMemo<
    ColumnsType<{ name: string; email: string; phone: string }>
  >(
    () => [
      { title: '이름', dataIndex: 'name', key: 'name' },
      { title: '이메일', dataIndex: 'email', key: 'email' },
      { title: '전화번호', dataIndex: 'phone', key: 'phone' },
    ],
    []
  )

  const userExcelData = useMemo(
    () =>
      listUsers.map(user => ({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
      })),
    [listUsers]
  )

  // URL에서 id가 빠지면(뒤로가기 등) 풀페이지·드로어를 같은 페인트 전에 닫음 — 안 닫히는 현상 방지
  useLayoutEffect(() => {
    const targetId = params.id?.trim()
    if (targetId) return
    if (pendingOpenedUserIdRef.current != null && (detailBridgeUser || drawerOpen || drawerUser)) {
      return
    }
    pendingOpenedUserIdRef.current = null
    setDetailBridgeUser(null)
    if (drawerOpen || drawerUser || selectedUser) {
      closeDrawer()
      clearSelectedUserId(null)
    }
  }, [
    params.id,
    detailBridgeUser,
    drawerOpen,
    drawerUser,
    selectedUser,
    closeDrawer,
    clearSelectedUserId,
  ])

  /** 학교→교사 drill-down 후 브라우저 뒤로가기로 학교 URL 복귀 시 X 버튼 전용 스택 해제 */
  useEffect(() => {
    const urlId = params.id?.trim()
    if (urlId && schoolDetailReturnUserRef.current?.id === urlId) {
      schoolDetailReturnUserRef.current = null
    }
  }, [params.id])

  // URL(id) 기반 모달 상태 복원: 새로고침/직접 진입 시 상세 모달 유지
  useEffect(() => {
    let cancelled = false
    const targetId = params.id?.trim()

    if (!targetId) {
      return
    }

    if (suppressDetailRestoreRef.current) {
      return
    }

    if (pendingOpenedUserIdRef.current) {
      if (targetId !== pendingOpenedUserIdRef.current) {
        return
      }
      pendingOpenedUserIdRef.current = null
    }

    if (selectedUser?.id !== targetId) {
      setSelectedUserId(targetId)
    }

    if (drawerOpenRef.current && drawerUserRef.current?.id === targetId) return

    const cachedUser = useUserStore.getState().usersById[targetId]
    const returnSchoolUser =
      schoolDetailReturnUserRef.current?.id === targetId
        ? schoolDetailReturnUserRef.current
        : null
    const listMatched = listUsers.find(u => u.id === targetId)
    const seedUser = returnSchoolUser ?? listMatched ?? cachedUser
    if (seedUser) {
      if (isMembersRemoteEnabled()) {
        ;(async () => {
          try {
            await fetchUserById(targetId, {
              memberId: seedUser.memberId,
              role: seedUser.role,
            })
            if (cancelled) return
            const fetched = useUserStore.getState().usersById[targetId] ?? seedUser
            openDrawer(mergeListUserWithFetchedDetail(seedUser, fetched))
          } catch {
            if (!cancelled) openDrawer(seedUser)
          }
        })()
        return
      }
      openDrawer(seedUser)
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
    selectedUser,
    listUsers,
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

  /** URL id와 일치하는 객체를 우선 — drill-down 중 drawerUser가 이전 회원(학교)일 때 교사 상세로 갱신 */
  const modalDetailUser = useMemo(() => {
    const urlDetailId = params.id?.trim()
    const candidates = [
      detailBridgeUser,
      drawerUser,
      selectedUser,
      userFromListByUrlId,
    ].filter((u): u is Omit<User, 'password'> => u != null)

    if (urlDetailId) {
      const matched = candidates.find(u => u.id === urlDetailId)
      if (matched) return matched
    }

    return drawerUser ?? selectedUser ?? userFromListByUrlId ?? detailBridgeUser
  }, [params.id, detailBridgeUser, drawerUser, selectedUser, userFromListByUrlId])
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
    if (isMembersRemoteEnabled()) {
      void queryClient.invalidateQueries({ queryKey: memberQueryKeys.all })
      return
    }
    void queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
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
    async (user: Omit<User, 'password'>, opts?: { replace?: boolean }) => {
      suppressDetailRestoreRef.current = false
      detailCloseIntentRef.current = false
      pendingOpenedUserIdRef.current = user.id
      setDetailBridgeUser(user)
      setSelectedUserId(user.id)
      openDrawer(user)

      // drill-down 중 URL 복원 effect가 이전 id로 되돌리지 않도록 id를 먼저 반영
      setParams(
        {
          id: user.id,
          lnb: 'detail-info',
          [USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY]: undefined,
        },
        { replace: opts?.replace ?? false }
      )

      let displayUser = user
      if (isMembersRemoteEnabled()) {
        try {
          const fetched = await fetchUserById(user.id, {
            memberId: user.memberId,
            role: user.role,
          })
          if (fetched) {
            displayUser = mergeListUserWithFetchedDetail(user, fetched)
          }
        } catch (error) {
          handleError(error, { defaultMessage: '회원 상세를 불러오지 못했습니다.' })
        }
      }

      openDrawer(displayUser)
    },
    [setSelectedUserId, openDrawer, setParams, fetchUserById]
  )

  const handleNavigateToLinkedUser = useCallback(
    async (target: AffiliatedTeacherLinkTarget) => {
      const { userId, teacherMemberId, name, assignedGrade } = target
      const schoolReturn =
        drawerUserRef.current?.role === 'SCHOOL' ? drawerUserRef.current : null
      const schoolNameHint =
        schoolReturn?.schoolInfo?.schoolName?.trim() || schoolReturn?.name?.trim()

      if (schoolReturn) {
        schoolDetailReturnUserRef.current = schoolReturn
      }

      pendingOpenedUserIdRef.current = userId

      try {
        const fetched = await fetchUserById(userId, {
          memberId: teacherMemberId,
          role: 'INSTRUCTOR',
        })
        if (!fetched) {
          pendingOpenedUserIdRef.current = null
          if (schoolReturn) schoolDetailReturnUserRef.current = null
          handleError(new Error('교사 회원 정보를 찾을 수 없습니다.'), {
            defaultMessage: '교사 상세를 불러오지 못했습니다.',
          })
          return
        }
        // 소속 교사 목록 진입: 상세 API에 프로필이 없어도 교사 상세로 연다
        let nextUser = fetched
        if (
          fetched.role === 'INSTRUCTOR' &&
          !fetched.instructorMemberProfile &&
          !fetched.affiliatedSchoolUserId
        ) {
          nextUser = {
            ...fetched,
            instructorMemberProfile: 'school_teacher',
            ...(schoolReturn
              ? {
                  affiliatedSchoolUserId: schoolReturn.id,
                  affiliatedSchoolName: schoolNameHint,
                }
              : {}),
          }
        } else if (
          fetched.role !== 'INSTRUCTOR' &&
          !fetched.instructorMemberProfile &&
          schoolReturn
        ) {
          // roles 누락 등으로 INDIVIDUAL로 내려와도 소속 교사 목록 진입은 교사 상세로 연다
          nextUser = {
            ...fetched,
            role: 'INSTRUCTOR',
            instructorMemberProfile: 'school_teacher',
            affiliatedSchoolUserId: schoolReturn.id,
            affiliatedSchoolName: schoolNameHint,
          }
        }

        nextUser = applyAffiliatedTeacherLinkToUser(
          nextUser,
          { name, assignedGrade },
          schoolNameHint
        )

        handleView(nextUser, { replace: false })
      } catch (error) {
        pendingOpenedUserIdRef.current = null
        if (schoolReturn) schoolDetailReturnUserRef.current = null
        handleError(error, { defaultMessage: '교사 상세를 불러오지 못했습니다.' })
      }
    },
    [fetchUserById, handleView]
  )

  /** 모달·URL·복귀 스택까지 완전히 닫음 (탈퇴/삭제 플로우 등) */
  const flushUserDetailModal = useCallback(() => {
    suppressDetailRestoreRef.current = true
    detailCloseIntentRef.current = true
    pendingOpenedUserIdRef.current = null
    setDetailBridgeUser(null)
    schoolDetailReturnUserRef.current = null
    setDrawerUser(null)
    closeDrawer()
    clearSelectedUserId(null)
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete('id')
        next.delete('lnb')
        next.delete(USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY)
        return next
      },
      { replace: true }
    )
  }, [closeDrawer, clearSelectedUserId, setSearchParams, setDrawerUser])

  /** 풀페이지 X — 학교→교사 drill-down 중이면 학교 상세로, 아니면 목록으로 */
  const handleUserDetailModalClose = useCallback(() => {
    const back = schoolDetailReturnUserRef.current
    if (back) {
      schoolDetailReturnUserRef.current = null
      handleView(back, { replace: true })
      return
    }
    flushUserDetailModal()
  }, [handleView, flushUserDetailModal])

  // 회원 추가
  const handleCreateUser = async (request: CreateUserRequest) => {
    try {
      await createUser(request)
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
        neisCode: values.neisCode,
        regionSido: values.regionSido,
        regionSigungu: values.regionSigungu,
        zipCode: values.zipCode,
        isActive: true,
      })
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
        phone: values.contact.trim(),
        gender: values.gender === 'male' ? '남성' : '여성',
        birthDate: values.birthDate.trim(),
        role: 'ADMIN',
        adminLevel: 'ADMIN',
        isActive: true,
      })
      invalidateList()
      closeAdminRegisterModal()
    } catch (error) {
      handleError(error, { defaultMessage: '관리자 등록에 실패했습니다.' })
      throw error
    }
  }

  const handleInstructorRegisterSubmit = async (values: InstructorRegisterModalFormValues) => {
    try {
      const emailTrim = values.email.trim()
      const email =
        emailTrim !== '' ? emailTrim : `instructor-${Date.now()}@instructor.jakorea.local`
      const nameTrim = values.name.trim()
      const name = nameTrim !== '' ? nameTrim : '강사'
      const birthDigits = values.birthDate.replace(/\D/g, '')
      const birthDate =
        birthDigits.length === 8
          ? `${birthDigits.slice(0, 4)}-${birthDigits.slice(4, 6)}-${birthDigits.slice(6, 8)}`
          : undefined
      const affiliationParts =
        values.memberType === 'school_teacher'
          ? [
              values.schoolName.trim(),
              values.employmentStatus
                ? SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL[values.employmentStatus]
                : '',
            ].filter(Boolean)
          : [
              values.instructorCareer.trim(),
              values.affiliationNone ? '' : values.affiliationName.trim(),
            ].filter(Boolean)
      await createUser({
        email,
        password: 'Temp1234!',
        name,
        phone: values.contact.trim() || undefined,
        gender: values.gender === 'male' ? '남성' : '여성',
        birthDate,
        role: 'INSTRUCTOR',
        address: values.homeAddress.trim() || undefined,
        detailAddress: values.homeAddressDetail.trim() || undefined,
        affiliation: affiliationParts.length > 0 ? affiliationParts.join(' | ') : undefined,
        instructorType:
          values.memberType === 'school_teacher' ? 'SCHOOL_TEACHER' : 'GENERAL',
        oneLineIntro: values.oneLineIntro.trim() || undefined,
        careerText: values.instructorCareer.trim() || undefined,
        selfIntroduction: values.freeWrite1.trim() || undefined,
        instructorInfo: {
          bankName: values.bankName.trim(),
          accountNumber: values.accountNumber.trim(),
          accountHolder: values.accountHolder.trim(),
          isBusinessIncome: values.isBusinessIncome === 'yes',
        },
        isActive: true,
      })
      invalidateList()
      closeInstructorRegisterModal()
    } catch (error) {
      handleError(error, { defaultMessage: '강사 등록에 실패했습니다.' })
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
        const updated = await patchUserBasicInfo(ctx.userId, {
          listMetrics: { adminPermissionVariant: ctx.nextPermission },
        })
        queryClient.setQueriesData<InfiniteData<GetUsersPageResult>>(
          { queryKey: ['users', 'list'] },
          old => {
            if (!old?.pages) return old
            return {
              ...old,
              pages: old.pages.map(page => ({
                ...page,
                users: page.users.map(u => (u.id === updated.id ? updated : u)),
              })),
            }
          }
        )
        if (drawerUser?.id === ctx.userId) {
          setDrawerUser(updated)
        }
        setDetailBridgeUser(prev => (prev?.id === ctx.userId ? updated : prev))
        } catch (error) {
        handleError(error, { defaultMessage: '관리자 권한 유형 변경에 실패했습니다.' })
      } finally {
        setAdminPermissionChangingUserId(null)
      }
    },
    [patchUserBasicInfo, queryClient, drawerUser?.id, setDrawerUser, setDetailBridgeUser]
  )

  return (
    <div>
      {unsupportedRemoteFilterLabels.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="실 API 모드에서는 일부 필터가 적용되지 않습니다"
          description={`다음 필터는 백엔드 API 미지원으로 무시됩니다: ${unsupportedRemoteFilterLabels.join(', ')}`}
        />
      ) : null}
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
        loading={filterSearchLoading}
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
                  if (resolvedMemberListKind === 'instructors') {
                    openInstructorRegisterModal()
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
        excelExport={{
          columns: userExcelColumns,
          data: userExcelData,
        }}
      >
        <UserList
          listKind={resolvedMemberListKind}
          totalCount={listTotal}
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
        detailCloseIntentRef={detailCloseIntentRef}
      />

      <MemberRegisterModal
        open={createModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateUser}
        loading={loading}
      />

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

      <InstructorRegisterModal
        open={instructorRegisterOpen}
        onClose={closeInstructorRegisterModal}
        onSubmit={handleInstructorRegisterSubmit}
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
        body={deleteResultMessage}
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
