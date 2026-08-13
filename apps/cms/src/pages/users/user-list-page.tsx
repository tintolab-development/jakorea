/**
 * 사용자 관리 페이지
 * Phase 5.1.2: 사용자 관리 페이지
 * 회원 목록: React Query useInfiniteQuery + 15명씩 무한 스크롤
 */

import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react'
import { Alert, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { UserList } from '@/features/user/shared/ui/user-list'
import {
  UserDetailFullPageModal,
  USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY,
} from '@/pages/users/user-detail-fullpage-modal'
import {
  applyTeacherDetailUrlContext,
  memberDetailUrlParamsFromUser,
  readMemberDetailUrlContext,
  USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY,
  USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY,
  USER_DETAIL_MEMBER_ID_QUERY_KEY,
  USER_DETAIL_MEMBER_ROLE_QUERY_KEY,
} from '@/features/user/detail/lib/teacher-detail-url-context'
import {
  canResolveMemberIdForDetailRestore,
  resolveMemberDetailRestoreHint,
} from '@/features/user/detail/lib/resolve-member-detail-restore-hint'
import { prefetchSchoolAffiliatedTeachers } from '@/features/user/api/hooks/use-member-detail-subresource-queries'
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
import {
  deleteUsersByListKind,
  type CreateUserRequest,
  type GetUsersPageResult,
} from '@/entities/user/api/user-service'
import { resolveAdminProvisionedTempPassword } from '@/features/user/lib/admin-provisioned-temp-password'
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
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import '@/shared/ui/detail-fullpage-modal.css'
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
import { memberQueryKeys, serializeMemberListFilters } from '@/features/user/api/member-query-keys'
import { resolveDeleteUserOptions } from '@/features/user/api/resolve-delete-user-options'
import { mergeListUserWithFetchedDetail } from '@/features/user/api/merge-list-user-with-detail'
import { applyAffiliatedTeacherLinkToUser } from '@/features/user/api/apply-affiliated-teacher-link'
import { buildAdminAccountCreateTermsAgreements } from '@/features/user/api/build-pre-register-terms-agreements'
import {
  buildInstructorRegisterCertifications,
  buildPreRegisterTermsAgreements,
} from '@/features/user/api/map-instructor-register-extras'
import {
  instructorProfileFormValuesToCmsProfile,
  instructorProfileFormValuesToCmsSettlement,
} from '@/features/user/api/map-instructor-cms-profile'
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
  const listQueryFiltersKey = useMemo(
    () => serializeMemberListFilters(listQueryFilters),
    [listQueryFilters]
  )

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

  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: listQueryFiltersKey,
  })

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
   * 상세 GET 완료 후 동기 보관(목록 시드 선표시용 아님).
   * fetch 완료 직후 drawer 반영 전 한 틱 보강용.
   */
  const [detailBridgeUser, setDetailBridgeUser] = useState<Omit<User, 'password'> | null>(null)
  /** 상세 API 대기 중 — 목록 DTO로 본문을 채우지 않음 */
  const [memberDetailLoading, setMemberDetailLoading] = useState(false)

  /**
   * handleView가 fetch 중인 회원 id. URL 복원 effect가 동일 id로 중복 fetch하지 않도록 한다.
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

  const urlDetailRestoreHint = useMemo(() => {
    const targetId = params.id?.trim()
    if (!targetId) return null
    return resolveMemberDetailRestoreHint({
      userId: targetId,
      urlCtx: readMemberDetailUrlContext(new URLSearchParams(window.location.search)),
      listKind: resolvedMemberListKind,
      storeUsersById: useUserStore.getState().usersById,
      listUsers,
      queryClient,
    })
  }, [
    params.id,
    params[USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY],
    params[USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY],
    params[USER_DETAIL_MEMBER_ID_QUERY_KEY],
    params[USER_DETAIL_MEMBER_ROLE_QUERY_KEY],
    resolvedMemberListKind,
    listUsers,
    queryClient,
  ])

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
    if (pendingOpenedUserIdRef.current != null && (memberDetailLoading || drawerOpen || drawerUser)) {
      return
    }
    pendingOpenedUserIdRef.current = null
    setDetailBridgeUser(null)
    setMemberDetailLoading(false)
    if (drawerOpen || drawerUser || selectedUser) {
      closeDrawer()
      clearSelectedUserId(null)
    }
  }, [
    params.id,
    memberDetailLoading,
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

  // URL(id) 기반 모달 상태 복원: 새로고침/직접 진입 — 목록 시드 없이 상세 GET 후 오픈
  useEffect(() => {
    let cancelled = false
    const targetId = params.id?.trim()

    if (!targetId) {
      return
    }

    if (suppressDetailRestoreRef.current) {
      return
    }

    // handleView가 fetch 중이면 URL effect는 개입하지 않음
    if (pendingOpenedUserIdRef.current != null) {
      return
    }

    if (drawerOpenRef.current && drawerUserRef.current?.id === targetId) return

    const urlDetailCtx = readMemberDetailUrlContext(
      new URLSearchParams(window.location.search)
    )
    const restoreHint =
      urlDetailRestoreHint ??
      resolveMemberDetailRestoreHint({
        userId: targetId,
        urlCtx: urlDetailCtx,
        listKind: resolvedMemberListKind,
        storeUsersById: useUserStore.getState().usersById,
        listUsers,
        queryClient,
      })
    const withTeacherCtx = (user: Omit<User, 'password'>) =>
      applyTeacherDetailUrlContext(user, urlDetailCtx)

    const hintUser =
      (schoolDetailReturnUserRef.current?.id === targetId
        ? schoolDetailReturnUserRef.current
        : null) ?? restoreHint.user

    if (
      isMembersRemoteEnabled() &&
      !canResolveMemberIdForDetailRestore(targetId, restoreHint) &&
      listFetching
    ) {
      setMemberDetailLoading(true)
      setSelectedUserId(targetId)
      return
    }

    setMemberDetailLoading(true)
    setSelectedUserId(targetId)

    ;(async () => {
      try {
        if (!isMembersRemoteEnabled()) {
          if (hintUser) {
            if (!cancelled) {
              openDrawer(withTeacherCtx(hintUser))
              setDetailBridgeUser(withTeacherCtx(hintUser))
            }
            return
          }
          await fetchUserById(targetId)
          if (cancelled) return
          const fetched = useUserStore.getState().usersById[targetId]
          if (!fetched) return
          openDrawer(withTeacherCtx(fetched))
          setDetailBridgeUser(withTeacherCtx(fetched))
          return
        }

        if (!canResolveMemberIdForDetailRestore(targetId, restoreHint)) {
          handleError(new Error('회원 식별자(memberId)를 찾을 수 없습니다. 목록에서 다시 열어 주세요.'), {
            defaultMessage: '회원 상세를 불러오지 못했습니다.',
          })
          return
        }

        const roleHint = restoreHint.role
        await fetchUserById(targetId, {
          memberId: restoreHint.memberId,
          organizationId: restoreHint.organizationId ?? hintUser?.organizationId,
          role: roleHint,
          adminAccountId: restoreHint.adminAccountId ?? hintUser?.adminAccountId,
          email: restoreHint.email ?? hintUser?.email,
          instructorMemberProfile:
            urlDetailCtx.instructorMemberProfile ?? hintUser?.instructorMemberProfile,
        })
        if (cancelled) return
        const fetched = useUserStore.getState().usersById[targetId]
        if (!fetched) {
          handleError(new Error('회원 상세를 불러오지 못했습니다.'), {
            defaultMessage: '회원 상세를 불러오지 못했습니다.',
          })
          return
        }
        const displayUser = withTeacherCtx(fetched)
        openDrawer(displayUser)
        setDetailBridgeUser(displayUser)
        prefetchSchoolAffiliatedTeachers(queryClient, displayUser)
        setParams(
          {
            id: displayUser.id,
            lnb: params.lnb ?? 'detail-info',
            ...memberDetailUrlParamsFromUser(displayUser),
          },
          { replace: true }
        )
      } catch (error) {
        if (!cancelled) {
          handleError(error, { defaultMessage: '회원 상세를 불러오지 못했습니다.' })
        }
      } finally {
        if (!cancelled) setMemberDetailLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // listUsers·목록 fetch 완료 후 memberId 힌트가 생기면 재시도
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URL id·복원 힌트만으로 복원
  }, [
    params.id,
    params.lnb,
    params[USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY],
    params[USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY],
    params[USER_DETAIL_MEMBER_ID_QUERY_KEY],
    params[USER_DETAIL_MEMBER_ROLE_QUERY_KEY],
    urlDetailRestoreHint?.memberId,
    urlDetailRestoreHint?.role,
    listFetching,
    resolvedMemberListKind,
    setSelectedUserId,
    openDrawer,
    fetchUserById,
    setParams,
  ])

  /** 상세 GET 완료분만이 본문 — 목록 행으로 필드를 채우지 않음 */
  const modalDetailUser = useMemo(() => {
    const urlDetailId = params.id?.trim()
    const candidates = [detailBridgeUser, drawerUser].filter(
      (u): u is Omit<User, 'password'> => u != null
    )

    if (urlDetailId) {
      const matched = candidates.find(u => u.id === urlDetailId)
      if (matched) return matched
    }

    return drawerUser ?? detailBridgeUser
  }, [params.id, detailBridgeUser, drawerUser])

  const userDetailModalOpen = drawerOpen || Boolean(detailBridgeUser)
  const showMemberDetailLoadingShell =
    memberDetailLoading && !modalDetailUser && Boolean(params.id?.trim())

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
    (
      updated: Omit<User, 'password'>,
      options?: { skipListInvalidate?: boolean }
    ) => {
      setDrawerUser(updated)
      setDetailBridgeUser(prev => (prev?.id === updated.id ? updated : prev))
      const patchListCache = (
        old: InfiniteData<GetUsersPageResult> | undefined
      ): InfiniteData<GetUsersPageResult> | undefined => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            users: page.users.map(u =>
              u.id === updated.id ||
              (updated.memberId != null && u.memberId === updated.memberId) ||
              (updated.organizationId != null &&
                u.organizationId === updated.organizationId)
                ? mergeListUserWithFetchedDetail(u, updated)
                : u
            ),
          })),
        }
      }
      // mock 목록 키
      queryClient.setQueriesData<InfiniteData<GetUsersPageResult>>(
        { queryKey: ['users', 'list'] },
        patchListCache
      )
      // remote 목록 키 (`['cms','members','list'|schoolsList', …]`)
      queryClient.setQueriesData<InfiniteData<GetUsersPageResult>>(
        { queryKey: [...memberQueryKeys.all, 'list'] },
        patchListCache
      )
      queryClient.setQueriesData<InfiniteData<GetUsersPageResult>>(
        { queryKey: [...memberQueryKeys.all, 'schoolsList'] },
        patchListCache
      )
      if (!options?.skipListInvalidate) {
        invalidateList()
      }
    },
    [setDrawerUser, setDetailBridgeUser, queryClient, invalidateList]
  )

  /** 상세 GET 완료 후 모달·URL 반영 (목록 시드 선오픈 없음) */
  const openMemberDetailFetched = useCallback(
    (displayUser: Omit<User, 'password'>, opts?: { replace?: boolean }) => {
      suppressDetailRestoreRef.current = false
      detailCloseIntentRef.current = false
      setSelectedUserId(displayUser.id)
      setParams(
        {
          id: displayUser.id,
          lnb: 'detail-info',
          [USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY]: undefined,
          ...memberDetailUrlParamsFromUser(displayUser),
        },
        { replace: opts?.replace ?? false }
      )
      setDetailBridgeUser(displayUser)
      openDrawer(displayUser)
      pendingOpenedUserIdRef.current = null
      // 학교 상세 직후 소속 교사 목록을 항상 다시 조회
      prefetchSchoolAffiliatedTeachers(queryClient, displayUser)
    },
    [setSelectedUserId, openDrawer, setParams, queryClient]
  )

  // 사용자 상세 보기 — remote면 상세 GET 완료 후에만 오픈
  const handleView = useCallback(
    async (
      user: Omit<User, 'password'>,
      opts?: { replace?: boolean; skipRemoteFetch?: boolean }
    ) => {
      suppressDetailRestoreRef.current = false
      detailCloseIntentRef.current = false
      pendingOpenedUserIdRef.current = user.id
      setSelectedUserId(user.id)
      setParams(
        {
          id: user.id,
          lnb: 'detail-info',
          [USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY]: undefined,
          ...memberDetailUrlParamsFromUser(user),
        },
        { replace: opts?.replace ?? false }
      )

      if (!isMembersRemoteEnabled() || opts?.skipRemoteFetch) {
        const displayUser = applyTeacherDetailUrlContext(user, {
          affiliatedSchoolName: user.affiliatedSchoolName,
          instructorMemberProfile: user.instructorMemberProfile,
        })
        openMemberDetailFetched(displayUser, opts)
        return
      }

      setMemberDetailLoading(true)
      try {
        const fetched = await fetchUserById(user.id, {
          memberId: user.memberId,
          organizationId: user.organizationId,
          role: user.role,
          adminAccountId: user.adminAccountId,
          email: user.email,
          instructorMemberProfile: user.instructorMemberProfile,
        })
        if (!fetched) {
          handleError(new Error('회원 상세를 불러오지 못했습니다.'), {
            defaultMessage: '회원 상세를 불러오지 못했습니다.',
          })
          pendingOpenedUserIdRef.current = null
          return
        }
        // 상세 GET만 본문으로 사용 — 목록 행 필드(소속·프로필 등)를 덮어쓰지 않음
        openMemberDetailFetched(fetched, { replace: opts?.replace ?? false })
      } catch (error) {
        pendingOpenedUserIdRef.current = null
        handleError(error, { defaultMessage: '회원 상세를 불러오지 못했습니다.' })
      } finally {
        setMemberDetailLoading(false)
      }
    },
    [setSelectedUserId, fetchUserById, openMemberDetailFetched, setParams]
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
      setMemberDetailLoading(true)

      try {
        const fetched = await fetchUserById(userId, {
          memberId: teacherMemberId,
          role: 'INSTRUCTOR',
          // 학교 소속 교사 → GET /api/admin/users/{id}/teacher (instructor 아님)
          instructorMemberProfile: 'school_teacher',
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

        // 이미 상세 GET 완료 — 재fetch 없이 오픈
        openMemberDetailFetched(nextUser, { replace: false })
      } catch (error) {
        pendingOpenedUserIdRef.current = null
        if (schoolReturn) schoolDetailReturnUserRef.current = null
        handleError(error, { defaultMessage: '교사 상세를 불러오지 못했습니다.' })
      } finally {
        setMemberDetailLoading(false)
      }
    },
    [fetchUserById, openMemberDetailFetched]
  )

  /** 모달·URL·복귀 스택까지 완전히 닫음 (탈퇴/삭제 플로우 등) */
  const flushUserDetailModal = useCallback(() => {
    suppressDetailRestoreRef.current = true
    detailCloseIntentRef.current = true
    pendingOpenedUserIdRef.current = null
    setDetailBridgeUser(null)
    setMemberDetailLoading(false)
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
        next.delete(USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY)
        next.delete(USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY)
        next.delete(USER_DETAIL_MEMBER_ID_QUERY_KEY)
        next.delete(USER_DETAIL_MEMBER_ROLE_QUERY_KEY)
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
      // 학교 등록 폼에 계정 아이디(email) 없음 — 로그인 계정/임시 비밀번호 미발급
      await createUser({
        name: values.institutionName.trim(),
        role: 'SCHOOL',
        schoolInfo: {
          schoolName: values.institutionName.trim(),
          address: values.roadAddress.trim(),
        },
        detailAddress: values.detailAddress?.trim() || undefined,
        phone: values.phone,
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
      const email = values.email.trim()
      await createUser({
        email,
        password: resolveAdminProvisionedTempPassword(email),
        name: values.name.trim(),
        phone: values.contact.trim(),
        gender: values.gender === 'male' ? '남성' : '여성',
        birthDate: values.birthDate.trim(),
        role: 'ADMIN',
        adminLevel: 'ADMIN',
        isActive: true,
        adminTermsAgreements: buildAdminAccountCreateTermsAgreements({
          consentTermsOfService: values.consentTermsOfService,
          consentPersonal: values.consentPersonalInfo,
          consentMarketing: values.consentMarketing,
          consentMfaSetup: values.consentMfaSetup,
        }),
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
        password: resolveAdminProvisionedTempPassword(email),
        name,
        phone: values.contact.trim() || undefined,
        gender: values.gender === 'male' ? '남성' : '여성',
        birthDate,
        role: 'INSTRUCTOR',
        affiliation: affiliationParts.length > 0 ? affiliationParts.join(' | ') : undefined,
        instructorType:
          values.memberType === 'school_teacher' ? 'SCHOOL_TEACHER' : 'GENERAL',
        instructorCmsProfile: instructorProfileFormValuesToCmsProfile(values),
        instructorCmsSettlement: instructorProfileFormValuesToCmsSettlement(values),
        termsAgreements: buildPreRegisterTermsAgreements(
          {
            consentTermsOfService: values.consentTermsOfService,
            consentPersonal: values.consentPersonal,
            consentMarketing: values.consentMarketing,
          },
          {
            consentPortrait: values.consentPortrait,
            consentPaymentStatement: values.consentPaymentStatement,
            consentEducatorPledge: values.consentEducatorPledge,
            consentAdministrativeJoint: values.consentAdministrativeJoint,
            consentSexOffenseCheck: values.consentSexOffenseCheck,
          }
        ),
        certifications: buildInstructorRegisterCertifications(values.licenseRows),
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
      await deleteUsersByListKind(toDelete, resolvedMemberListKind)
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
        await deleteUser(u.id, resolveDeleteUserOptions(u))
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
        const patchListCache = (
          old: InfiniteData<GetUsersPageResult> | undefined
        ): InfiniteData<GetUsersPageResult> | undefined => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              users: page.users.map(u =>
                u.id === ctx.userId || u.id === updated.id
                  ? {
                      ...u,
                      ...updated,
                      listMetrics: {
                        ...u.listMetrics,
                        ...updated.listMetrics,
                        adminPermissionVariant: ctx.nextPermission,
                      },
                    }
                  : u
              ),
            })),
          }
        }
        queryClient.setQueriesData<InfiniteData<GetUsersPageResult>>(
          { queryKey: ['users', 'list'] },
          patchListCache
        )
        queryClient.setQueriesData<InfiniteData<GetUsersPageResult>>(
          { queryKey: [...memberQueryKeys.all, 'list'] },
          patchListCache
        )
        queryClient.setQueriesData<InfiniteData<GetUsersPageResult>>(
          { queryKey: [...memberQueryKeys.all, 'schoolsList'] },
          patchListCache
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
                  jaEvaluationGrade: pendingFilters.jaEvaluationGrade,
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
          loading={memberDetailLoading}
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

      {showMemberDetailLoadingShell ? (
        <DetailFullPageModal
          open
          onClose={handleUserDetailModalClose}
          title="회원 상세"
        >
          <div
            className="detail-fullpage-modal__loading"
            role="status"
            aria-label="상세 불러오는 중"
          >
            <Spin size="large" />
          </div>
        </DetailFullPageModal>
      ) : (
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
      )}

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
