import { useState, useEffect, useCallback, useMemo, createElement, type MutableRefObject } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Application, UserHistory } from '@/types/domain'
import type { ApplicationProgressStatus } from '@/types/application-progress'
import { applicationService } from '@/entities/application/api/application-service'
import { mockUserHistories } from '@/data/mock/mypage'
import dayjs from 'dayjs'
import {
  maskedUserForInstructorDetail,
  userToApplicantInstructorRow,
} from '@/features/user/shared/lib/user-to-applicant-instructor-row'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import {
  programsHistoryHasChildMenu,
  clampProgramsChildForUser,
  instructorDetailLnbClickShowsPrepareMessage,
  resolveUserDetailSubjectKey,
  type TabState,
  type UserDetailLnbKey,
  type UserDetailProgramsChildKey,
} from './user-detail-fullpage-helpers'
import { buildUserDetailSidebarItems } from '../ui/detail-info/user-detail-fullpage-sidebar-items'
import { useUserDetailApplications } from './use-user-detail-applications'
import { useMemberProgramHistoryQuery } from '@/features/user/api/hooks/use-member-detail-subresource-queries'
import { useUserDetailUrlSync } from './use-user-detail-url-sync'
import type { UseUserDetailModalsResult } from './use-user-detail-modals'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { User } from '@/types/user'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import { getProgramAdminDetailInfoTabUrl } from '@/features/program/general/lib/program-admin-detail-url'
import type { PatchUserBasicInfoInput } from '@/entities/user/api/user-service'
import {
  canAccessAdminCommentInAdminDetail,
  canEditAdminMemberInfo,
  canStartAdminMemberProfileEdit,
  shouldShowCmsMemberInfoEditButton,
  shouldShowAdminCommentSectionForViewer,
} from '@/features/user/shared/lib/admin-provisioned-member-policy'
import {
  getAdminPermissionVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import {
  draftToAdminMemberRestrictedPatch,
  draftToAdminProvisionedInstructorBasicInfoPatch,
  draftToBasicInfoPatch,
  draftToSchoolAdminCommentOnlyPatch,
  draftToSchoolInstitutionBasicInfoPatch,
  userToAdminCommentOnlyDraft,
  userToAdminProvisionedBasicDraft,
  userToSchoolInstitutionEditDraft,
  type AdminProvisionedMemberBasicInfoDraft,
} from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import {
  resolveUserBasicInfoBodyKey,
  parseUserBasicInfoEntryQuery,
  USER_BASIC_INFO_ENTRY_QUERY_KEY,
  type UserBasicInfoEntrySource,
} from '@/features/user/detail/ui/user-basic-info-section'
import { handleError } from '@/shared/utils/error-handler'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useQueryClient } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { applyPrivacyUnmaskResponseToUser } from '@/features/user/api/apply-privacy-unmask-to-user'
import { institutionHasRegisteredTeachers } from '@/features/user/shared/lib/institution-delete-guard'
import {
  isMembersRemoteEnabled,
} from '@/features/user/api/member-remote-capabilities'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { revokeInstructorPermission } from '@/entities/user/api/user-service'
import { ConfirmModal } from '@/shared/ui/confirm-modal'

const PERSONAL_INFO_REVEAL_MODAL_Z_INDEX = 1100

/** 관리자 등록 회원 정보 수정 시 unmask 감사 로그 사유 */
const BASIC_INFO_EDIT_UNMASK_REASON = '정보 수정'

const BASIC_INFO_EDIT_UNMASK_CONFIRM_CONTENT =
  "관리자에 의해 등록된 회원은 정보 수정 시 개인정보 마스킹이 해제되며, 개인정보 열람 사유는 '정보 수정'으로 로그 이력에 기록됩니다. 해당 회원의 개인정보 열람 및 정보를 수정하시겠습니까?"

export type BasicInfoEditScope = 'none' | 'profile' | 'comment'

export type InstructorPermissionRevokeNotifyTiming = 'immediate' | 'manual'

export type UserDetailControllerModalMode = 'default' | 'permission'

export interface UseUserDetailControllerParams {
  open: boolean
  displayUser: Omit<User, 'password'> | null
  mode: UserDetailControllerModalMode
  programsChildQueryKey: string
  basicInfoEntrySource?: UserBasicInfoEntrySource
  onWithdraw?: (user: Omit<User, 'password'>) => void
  modals: UseUserDetailModalsResult
  patchMemberBasicInfo?: (
    userId: string,
    patch: PatchUserBasicInfoInput
  ) => Promise<Omit<User, 'password'>>
  onMemberBasicInfoSaved?: (user: Omit<User, 'password'>) => void
  detailCloseIntentRef?: MutableRefObject<boolean>
}

export function useUserDetailController({
  open,
  displayUser,
  mode,
  programsChildQueryKey,
  basicInfoEntrySource,
  onWithdraw,
  modals,
  patchMemberBasicInfo,
  onMemberBasicInfoSaved,
  detailCloseIntentRef,
}: UseUserDetailControllerParams) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUser = useAuthStore(state => state.user)
  const queryClient = useQueryClient()

  const [tabState, setTabState] = useState<TabState>({ lnb: 'detail-info' })
  const { applications, enrollmentApplications, applicationsLoading, refetchApplications } =
    useUserDetailApplications(open, displayUser)

  const membersRemote = isMembersRemoteEnabled()
  const { data: programHistoryData, isLoading: programHistoryLoading } =
    useMemberProgramHistoryQuery(
      displayUser?.memberId,
      displayUser?.id,
      open && membersRemote
    )

  const [volunteerHistories, setVolunteerHistories] = useState<UserHistory[]>([])
  const [volunteerHistoriesLoading, setVolunteerHistoriesLoading] = useState(false)
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false)
  const [institutionDeleteBlockedOpen, setInstitutionDeleteBlockedOpen] = useState(false)
  const [basicInfoEditing, setBasicInfoEditing] = useState(false)
  const [basicInfoEditScope, setBasicInfoEditScope] = useState<BasicInfoEditScope>('none')
  const [basicInfoDraft, setBasicInfoDraft] = useState<AdminProvisionedMemberBasicInfoDraft | null>(
    null
  )
  const [basicInfoSaveLoading, setBasicInfoSaveLoading] = useState(false)
  const [adminPermissionVariantPatching, setAdminPermissionVariantPatching] = useState(false)
  const [instructorPermissionRevokeOpen, setInstructorPermissionRevokeOpen] = useState(false)
  const [jaGradeEvaluationOpen, setJaGradeEvaluationOpen] = useState(false)

  const detailSubjectKey = useMemo(
    () => resolveUserDetailSubjectKey(displayUser),
    [displayUser?.id, displayUser?.memberId, displayUser?.adminAccountId]
  )

  useUserDetailUrlSync({
    open,
    displayUser,
    mode,
    searchParams,
    setSearchParams,
    setTabState,
    programsChildQueryKey,
    detailCloseIntentRef,
  })

  const resolvePersonalInfoAccessItem = useCallback(
    () =>
      displayUser?.schoolInfo?.schoolName?.trim() || displayUser?.name || '회원 상세 정보',
    [displayUser?.name, displayUser?.schoolInfo?.schoolName]
  )

  const handlePrivacyUnmasked = useCallback(
    (payload: unknown, role: User['role'] | undefined) => {
      if (!displayUser) return
      const merged = applyPrivacyUnmaskResponseToUser(
        displayUser,
        payload,
        role ?? displayUser.role
      )
      if (displayUser.memberId != null) {
        queryClient.setQueryData(memberQueryKeys.detail(displayUser.memberId), merged)
      }
      queryClient.setQueryData(
        [...memberQueryKeys.detailByUuid(displayUser.id), displayUser.role],
        merged
      )
      onMemberBasicInfoSaved?.(merged)
    },
    [displayUser, onMemberBasicInfoSaved, queryClient]
  )

  const {
    personalInfoRevealed,
    personalInfoRevealConfirmOpen,
    openPersonalInfoRevealConfirm,
    closePersonalInfoRevealConfirm,
    submitPersonalInfoReveal,
    revealWithReason,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolvePersonalInfoAccessItem,
    resolveMemberId: () => {
      if (displayUser?.memberId != null) return String(displayUser.memberId)
      return displayUser?.id
    },
    resolveMemberRole: () => displayUser?.role,
    onPrivacyUnmasked: handlePrivacyUnmasked,
    resetDeps: [open, displayUser?.id, displayUser?.memberId, displayUser?.role],
    controlMode: 'hideWhenRevealed',
    modalZIndex: PERSONAL_INFO_REVEAL_MODAL_Z_INDEX,
  })

  const [editUnmaskConfirmOpen, setEditUnmaskConfirmOpen] = useState(false)
  const [editUnmaskConfirmLoading, setEditUnmaskConfirmLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setBasicInfoEditing(false)
      setBasicInfoEditScope('none')
      setBasicInfoDraft(null)
      setBasicInfoSaveLoading(false)
      setAdminPermissionVariantPatching(false)
      setInstructorPermissionRevokeOpen(false)
      setJaGradeEvaluationOpen(false)
      setInstitutionDeleteBlockedOpen(false)
      setEditUnmaskConfirmOpen(false)
      setEditUnmaskConfirmLoading(false)
    }
  }, [open])

  useEffect(() => {
    setBasicInfoEditing(false)
    setBasicInfoEditScope('none')
    setBasicInfoDraft(null)
    setBasicInfoSaveLoading(false)
    setAdminPermissionVariantPatching(false)
    setInstructorPermissionRevokeOpen(false)
    setJaGradeEvaluationOpen(false)
    setInstitutionDeleteBlockedOpen(false)
    setEditUnmaskConfirmOpen(false)
    setEditUnmaskConfirmLoading(false)
  }, [detailSubjectKey])

  useEffect(() => {
    if (membersRemote) {
      setVolunteerHistories(programHistoryData?.volunteerHistories ?? [])
      setVolunteerHistoriesLoading(programHistoryLoading)
      return
    }

    if (open && displayUser) {
      setVolunteerHistoriesLoading(true)
      try {
        const histories = mockUserHistories.filter(
          h => h.userId === displayUser.id && h.finalStatus !== 'CANCELLED'
        )
        histories.sort((a, b) => dayjs(b.completedAt).diff(dayjs(a.completedAt)))
        setVolunteerHistories(histories)
      } catch (error) {
        console.error('Failed to load user histories:', error)
        setVolunteerHistories([])
      } finally {
        setVolunteerHistoriesLoading(false)
      }
    } else {
      setVolunteerHistories([])
    }
  }, [open, displayUser, membersRemote, programHistoryData, programHistoryLoading])

  const handleProgressStatusChange = useCallback(
    async (app: Application, displayStatus: ProgramEnrollmentDisplayStatus) => {
      if (!displayUser) return
      try {
        if (displayStatus === 'REJECTED') {
          await applicationService.update(app.id, {
            status: 'rejected',
            rejectionKind: 'APPLICATION',
            progressStatus: undefined,
          })
        } else if (displayStatus === 'INTERVIEW_FAILED') {
          await applicationService.update(app.id, {
            status: 'rejected',
            rejectionKind: 'INTERVIEW',
            progressStatus: undefined,
          })
        } else if (displayStatus === 'WAITING_RESULT') {
          await applicationService.update(app.id, {
            status: 'submitted',
            rejectionKind: undefined,
            progressStatus: undefined,
          })
        } else if (displayStatus === 'DOCUMENT_PASS') {
          await applicationService.update(app.id, {
            status: 'reviewing',
            rejectionKind: undefined,
          })
        } else {
          const progressMap: Record<
            Exclude<
              ProgramEnrollmentDisplayStatus,
              'REJECTED' | 'INTERVIEW_FAILED' | 'WAITING_RESULT' | 'DOCUMENT_PASS'
            >,
            ApplicationProgressStatus
          > = {
            EDUCATION_SCHEDULED: 'RECEIVED',
            EDUCATION_IN_PROGRESS: 'IN_PROGRESS',
            PROGRAM_ENDED: 'REPORT_SUBMITTED',
          }
          await applicationService.update(app.id, {
            status: 'approved',
            progressStatus: progressMap[displayStatus],
            rejectionKind: undefined,
          })
        }
        await refetchApplications()
      } catch (e) {
        console.error('Failed to update progress status:', e)
      }
    },
    [displayUser, refetchApplications]
  )

  const openWithdrawConfirm = useCallback(() => {
    if (
      displayUser?.role === 'SCHOOL' &&
      institutionHasRegisteredTeachers(displayUser)
    ) {
      setInstitutionDeleteBlockedOpen(true)
      return
    }
    setWithdrawConfirmOpen(true)
  }, [displayUser])

  const closeWithdrawConfirm = useCallback(() => {
    setWithdrawConfirmOpen(false)
  }, [])

  const closeInstitutionDeleteBlocked = useCallback(() => {
    setInstitutionDeleteBlockedOpen(false)
  }, [])

  const handleWithdrawConfirm = useCallback(() => {
    if (displayUser && onWithdraw) {
      onWithdraw(displayUser)
      setWithdrawConfirmOpen(false)
    }
  }, [displayUser, onWithdraw])

  const focusDetailInfoTab = useCallback(() => {
    setTabState({ lnb: 'detail-info' })
    setSearchParams(
      prev => {
        const nextParams = new URLSearchParams(prev)
        const curId = prev.get('id')?.trim()
        // 목록·드릴다운이 이미 id를 넣은 경우 덮어쓰지 않음 — admin-account-{id}/uuid 혼용 시 URL·상태 리셋 방지
        if (displayUser?.id && !curId) {
          nextParams.set('id', displayUser.id)
        }
        nextParams.set('lnb', 'detail-info')
        nextParams.delete(programsChildQueryKey)
        return nextParams
      },
      { replace: true }
    )
  }, [displayUser?.id, programsChildQueryKey, setSearchParams])

  const startBasicInfoEdit = useCallback(
    (sourceUser?: Omit<User, 'password'> | null) => {
      const target = sourceUser ?? displayUser
      if (!target) return
      if (!shouldShowCmsMemberInfoEditButton(target)) return

      const entryQ = parseUserBasicInfoEntryQuery(searchParams.get(USER_BASIC_INFO_ENTRY_QUERY_KEY))
      const bodyKey = resolveUserBasicInfoBodyKey(basicInfoEntrySource, entryQ, target.role)

      if (target.role === 'SCHOOL' && bodyKey === 'institution') {
        setBasicInfoDraft(userToSchoolInstitutionEditDraft(target))
        setBasicInfoEditScope('profile')
        setBasicInfoEditing(true)
        focusDetailInfoTab()
        return
      }

      if (target.role === 'INSTRUCTOR' && bodyKey === 'instructor') {
        setBasicInfoDraft(userToAdminProvisionedBasicDraft(target))
        setBasicInfoEditScope('profile')
        setBasicInfoEditing(true)
        focusDetailInfoTab()
        return
      }

      if (bodyKey === 'admin') {
        if (!canStartAdminMemberProfileEdit(currentUser, target)) return
        setBasicInfoDraft(userToAdminProvisionedBasicDraft(target))
        setBasicInfoEditScope('profile')
        setBasicInfoEditing(true)
        focusDetailInfoTab()
        return
      }

      if (bodyKey !== 'all_users') return
      setBasicInfoDraft(userToAdminProvisionedBasicDraft(target))
      setBasicInfoEditScope('profile')
      setBasicInfoEditing(true)
      focusDetailInfoTab()
    },
    [displayUser, basicInfoEntrySource, searchParams, currentUser, focusDetailInfoTab]
  )

  /** 관리자 등록 회원 — 마스킹 미해제 시 안내 모달 후 unmask, 이후 수정 진입 */
  const requestStartBasicInfoEdit = useCallback(() => {
    if (!displayUser) return
    if (!shouldShowCmsMemberInfoEditButton(displayUser)) return
    if (!personalInfoRevealed) {
      setEditUnmaskConfirmOpen(true)
      return
    }
    startBasicInfoEdit()
  }, [displayUser, personalInfoRevealed, startBasicInfoEdit])

  const closeEditUnmaskConfirm = useCallback(() => {
    if (editUnmaskConfirmLoading) return
    setEditUnmaskConfirmOpen(false)
  }, [editUnmaskConfirmLoading])

  const confirmEditUnmaskAndStartEdit = useCallback(() => {
    if (editUnmaskConfirmLoading || !displayUser) return
    setEditUnmaskConfirmLoading(true)
    void revealWithReason(BASIC_INFO_EDIT_UNMASK_REASON)
      .then(result => {
        if (!result.ok) return
        const unmaskedUser =
          result.payload !== undefined
            ? applyPrivacyUnmaskResponseToUser(displayUser, result.payload, displayUser.role)
            : displayUser
        setEditUnmaskConfirmOpen(false)
        startBasicInfoEdit(unmaskedUser)
      })
      .finally(() => {
        setEditUnmaskConfirmLoading(false)
      })
  }, [displayUser, editUnmaskConfirmLoading, revealWithReason, startBasicInfoEdit])

  const editUnmaskConfirmModal = useMemo(
    () =>
      createElement(ConfirmModal, {
        open: editUnmaskConfirmOpen,
        title: '정보 수정 안내',
        content: BASIC_INFO_EDIT_UNMASK_CONFIRM_CONTENT,
        confirmText: '정보 수정',
        cancelText: '취소',
        onConfirm: confirmEditUnmaskAndStartEdit,
        onCancel: closeEditUnmaskConfirm,
        confirmLoading: editUnmaskConfirmLoading,
        zIndex: PERSONAL_INFO_REVEAL_MODAL_Z_INDEX,
      }),
    [
      editUnmaskConfirmOpen,
      editUnmaskConfirmLoading,
      confirmEditUnmaskAndStartEdit,
      closeEditUnmaskConfirm,
    ]
  )

  const startAdminCommentEdit = useCallback(() => {
    if (!displayUser) return
    if (!shouldShowAdminCommentSectionForViewer(currentUser, displayUser)) return

    const entryQ = parseUserBasicInfoEntryQuery(searchParams.get(USER_BASIC_INFO_ENTRY_QUERY_KEY))
    const bodyKey = resolveUserBasicInfoBodyKey(basicInfoEntrySource, entryQ, displayUser.role)

    if (bodyKey === 'admin' && !canAccessAdminCommentInAdminDetail(currentUser)) return
    if (
      bodyKey !== 'all_users' &&
      bodyKey !== 'institution' &&
      bodyKey !== 'instructor' &&
      bodyKey !== 'admin'
    ) {
      return
    }

    setBasicInfoDraft(userToAdminCommentOnlyDraft(displayUser))
    setBasicInfoEditScope('comment')
    setBasicInfoEditing(true)
    focusDetailInfoTab()
  }, [displayUser, basicInfoEntrySource, searchParams, currentUser, focusDetailInfoTab])

  const cancelBasicInfoEdit = useCallback(() => {
    setBasicInfoEditing(false)
    setBasicInfoEditScope('none')
    setBasicInfoDraft(null)
  }, [])

  const saveBasicInfoEdit = useCallback(async () => {
    if (!displayUser || !basicInfoDraft || !patchMemberBasicInfo) return
    if (basicInfoEditScope === 'comment' && displayUser.role === 'ADMIN') {
      if (!canAccessAdminCommentInAdminDetail(currentUser)) return
    }
    if (basicInfoEditScope === 'profile' && displayUser.role === 'ADMIN') {
      if (!canStartAdminMemberProfileEdit(currentUser, displayUser)) return
    }
    setBasicInfoSaveLoading(true)
    try {
      let patch: PatchUserBasicInfoInput
      if (basicInfoEditScope === 'comment') {
        patch = draftToSchoolAdminCommentOnlyPatch(basicInfoDraft)
      } else if (displayUser.role === 'SCHOOL') {
        patch = draftToSchoolInstitutionBasicInfoPatch(basicInfoDraft)
      } else if (displayUser.role === 'INSTRUCTOR') {
        patch = draftToAdminProvisionedInstructorBasicInfoPatch(basicInfoDraft)
      } else if (displayUser.role === 'ADMIN') {
        patch = canEditAdminMemberInfo(currentUser, displayUser)
          ? draftToBasicInfoPatch(basicInfoDraft)
          : draftToAdminMemberRestrictedPatch(basicInfoDraft)
      } else {
        patch = draftToBasicInfoPatch(basicInfoDraft)
      }

      if (basicInfoEditScope === 'profile' && Object.prototype.hasOwnProperty.call(patch, 'adminComment')) {
        const { adminComment: _adminComment, ...patchWithoutComment } = patch
        patch = patchWithoutComment
      }

      const updated = await patchMemberBasicInfo(displayUser.id, patch)
      if (membersRemote && displayUser.memberId != null) {
        void queryClient.invalidateQueries({
          queryKey: [...memberQueryKeys.all, 'comments', displayUser.memberId],
        })
      }
      setBasicInfoEditing(false)
      setBasicInfoEditScope('none')
      setBasicInfoDraft(null)
      onMemberBasicInfoSaved?.(updated)
    } catch (error) {
      handleError(error, { defaultMessage: '회원 정보 저장에 실패했습니다.' })
    } finally {
      setBasicInfoSaveLoading(false)
    }
  }, [
    displayUser,
    basicInfoDraft,
    basicInfoEditScope,
    patchMemberBasicInfo,
    onMemberBasicInfoSaved,
    currentUser,
    membersRemote,
    queryClient,
  ])

  const updateBasicInfoDraft = useCallback((partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => {
    setBasicInfoDraft(prev => (prev ? { ...prev, ...partial } : prev))
  }, [])

  const patchAdminPermissionVariantFromDetailView = useCallback(
    async (nextPermission: AdminPermissionTagVariant) => {
      if (!displayUser || displayUser.role !== 'ADMIN') return
      if (!canAccessAdminCommentInAdminDetail(currentUser)) return
      if (!patchMemberBasicInfo) return
      const current = getAdminPermissionVariant(displayUser)
      if (nextPermission === current) return
      setAdminPermissionVariantPatching(true)
      try {
        const updated = await patchMemberBasicInfo(displayUser.id, {
          listMetrics: { adminPermissionVariant: nextPermission },
        })
        onMemberBasicInfoSaved?.(updated)
        } catch (error) {
        handleError(error, { defaultMessage: '관리자 권한 유형 변경에 실패했습니다.' })
      } finally {
        setAdminPermissionVariantPatching(false)
      }
    },
    [displayUser, currentUser, patchMemberBasicInfo, onMemberBasicInfoSaved]
  )

  const openInstructorPermissionRevoke = useCallback(() => {
    if (!displayUser || displayUser.role !== 'INSTRUCTOR') return
    if (resolveInstructorMemberProfile(displayUser) === 'school_teacher') return
    if (displayUser.instructorApprovalStatus?.trim().toUpperCase() === 'REVOKED') return
    setInstructorPermissionRevokeOpen(true)
  }, [displayUser])

  const closeInstructorPermissionRevoke = useCallback(() => {
    setInstructorPermissionRevokeOpen(false)
  }, [])

  const confirmInstructorPermissionRevoke = useCallback(
    async (payload: { reason: string; notifyTiming: InstructorPermissionRevokeNotifyTiming }) => {
      if (!displayUser || displayUser.role !== 'INSTRUCTOR') return
      const reason = payload.reason.trim()
      if (!reason) return

      try {
        const revoked = await revokeInstructorPermission(
          displayUser.id,
          { reason, revokeReason: reason },
          { memberId: displayUser.memberId }
        )
        if (isMembersRemoteEnabled()) {
          void queryClient.invalidateQueries({ queryKey: memberQueryKeys.all })
        }
        onMemberBasicInfoSaved?.(revoked)
        setInstructorPermissionRevokeOpen(false)
      } catch (error) {
        handleError(error, {
          defaultMessage: getMemberApiErrorMessage(error, '강사 권한 박탈에 실패했습니다.'),
        })
      }
    },
    [displayUser, onMemberBasicInfoSaved, queryClient]
  )

  const openJaGradeEvaluation = useCallback(() => {
    if (!displayUser || displayUser.role !== 'INSTRUCTOR') return
    setJaGradeEvaluationOpen(true)
  }, [displayUser])

  const closeJaGradeEvaluation = useCallback(() => {
    setJaGradeEvaluationOpen(false)
  }, [])

  const completeJaGradeEvaluation = useCallback(
    async ({ grade }: { grade: string; totalScore: number }) => {
      if (!displayUser) {
        throw new Error('강사 정보가 없어 평가 등급을 반영할 수 없습니다.')
      }

      // remote: 모달에서 evaluation-grade POST 완료됨. mock만 상세 패치로 영속화.
      if (patchMemberBasicInfo && !isMembersRemoteEnabled()) {
        const persisted = await patchMemberBasicInfo(displayUser.id, {
          listMetrics: { jaEvaluationGrade: grade },
        })
        if (persisted.memberId != null) {
          queryClient.setQueryData(memberQueryKeys.detail(persisted.memberId), persisted)
        }
        queryClient.setQueryData(
          [...memberQueryKeys.detailByUuid(persisted.id), persisted.role],
          persisted
        )
        setJaGradeEvaluationOpen(false)
        onMemberBasicInfoSaved?.(persisted)
        return
      }

      const mergedUser: Omit<User, 'password'> = {
        ...displayUser,
        listMetrics: {
          ...displayUser.listMetrics,
          jaEvaluationGrade: grade,
        },
      }

      if (displayUser.memberId != null) {
        queryClient.setQueryData(memberQueryKeys.detail(displayUser.memberId), mergedUser)
      }
      queryClient.setQueryData(
        [...memberQueryKeys.detailByUuid(displayUser.id), displayUser.role],
        mergedUser
      )

      setJaGradeEvaluationOpen(false)
      onMemberBasicInfoSaved?.(mergedUser)
    },
    [displayUser, onMemberBasicInfoSaved, patchMemberBasicInfo, queryClient]
  )

  const handleSidebarSelectTop = useCallback(
    (key: string) => {
      if (mode === 'permission') {
        setTabState({ lnb: 'detail-info' })
        return
      }
      if (!displayUser) return
      const k = key as UserDetailLnbKey

      if (k === 'payment-status') {
        if (instructorDetailLnbClickShowsPrepareMessage(displayUser, k, 'payment-top')) {
          window.alert('준비 중입니다.')
          return
        }
      }

      if (k === 'history' && programsHistoryHasChildMenu(displayUser)) {
        if (instructorDetailLnbClickShowsPrepareMessage(displayUser, k, 'history-top')) {
          window.alert('준비 중입니다.')
          return
        }
        setTabState({ lnb: 'history', child: 'enrollment' })
      } else {
        setTabState({ lnb: k })
      }

      setSearchParams(
        prev => {
          const nextParams = new URLSearchParams(prev)
          if (displayUser?.id) nextParams.set('id', displayUser.id)
          nextParams.set('lnb', k)
          if (k === 'history' && programsHistoryHasChildMenu(displayUser)) {
            nextParams.set(programsChildQueryKey, 'enrollment')
          } else {
            nextParams.delete(programsChildQueryKey)
          }
          return nextParams
        },
        { replace: true }
      )
    },
    [mode, displayUser, setSearchParams, programsChildQueryKey]
  )

  const handleSidebarSelectChild = useCallback(
    (_groupKey: string, childKey: string) => {
      if (mode === 'permission') return
      if (!displayUser) return
      const child = clampProgramsChildForUser(displayUser, childKey as UserDetailProgramsChildKey)
      if (
        instructorDetailLnbClickShowsPrepareMessage(displayUser, 'history', 'history-child', child)
      ) {
        window.alert('준비 중입니다.')
        return
      }
      setTabState({ lnb: 'history', child })
      setSearchParams(
        prev => {
          const nextParams = new URLSearchParams(prev)
          if (displayUser?.id) nextParams.set('id', displayUser.id)
          nextParams.set('lnb', 'history')
          nextParams.set(programsChildQueryKey, child)
          return nextParams
        },
        { replace: true }
      )
    },
    [mode, displayUser, setSearchParams, programsChildQueryKey]
  )

  const openEnrollmentProgramDetail = useCallback(
    (record: Application) => {
      navigate(getProgramAdminDetailInfoTabUrl(record.programId))
    },
    [navigate]
  )

  const sidebarItems = useMemo(
    () => buildUserDetailSidebarItems(displayUser ?? undefined, mode),
    [displayUser, mode]
  )

  const sidebarExpandedGroupKeys = useMemo(() => {
    if (!displayUser || !programsHistoryHasChildMenu(displayUser)) return [] as const
    if (displayUser.role === 'INSTRUCTOR') {
      const p = resolveInstructorMemberProfile(displayUser)
      if (p === 'instructor_only') {
        if (tabState.lnb === 'payment-status') return [] as const
        return ['history'] as const
      }
    }
    if (tabState.lnb !== 'history') return [] as const
    return ['history'] as const
  }, [tabState.lnb, displayUser])

  const sidebarActiveChildKey = useMemo(
    () =>
      tabState.lnb === 'history' && displayUser && programsHistoryHasChildMenu(displayUser)
        ? (tabState.child ?? 'enrollment')
        : '',
    [tabState.lnb, tabState.child, displayUser]
  )

  const role = displayUser?.role

  const canPatchAdminPermissionInDetailView = useMemo(
    () =>
      Boolean(
        patchMemberBasicInfo &&
          displayUser?.role === 'ADMIN' &&
          canAccessAdminCommentInAdminDetail(currentUser)
      ),
    [patchMemberBasicInfo, displayUser?.role, currentUser]
  )

  const instructorResumeApplicantRow = useMemo((): ApplicantInstructorRow | null => {
    if (!displayUser || displayUser.role !== 'INSTRUCTOR') return null
    const profile = resolveInstructorMemberProfile(displayUser)
    if (profile !== 'instructor_dual' && profile !== 'instructor_only') return null
    const src = personalInfoRevealed ? displayUser : maskedUserForInstructorDetail(displayUser)
    return userToApplicantInstructorRow(src)
  }, [displayUser, personalInfoRevealed])

  return {
    state: {
      tabState,
      applications,
      enrollmentApplications,
      applicationsLoading,
      volunteerHistories,
      volunteerHistoriesLoading,
      withdrawConfirmOpen,
      institutionDeleteBlockedOpen,
      personalInfoRevealed,
      personalInfoRevealConfirmOpen,
      basicInfoEditing,
      basicInfoEditScope,
      basicInfoDraft,
      basicInfoSaveLoading,
      adminPermissionVariantPatching,
      instructorPermissionRevokeOpen,
      jaGradeEvaluationOpen,
      personalInfoRevealModal,
      editUnmaskConfirmModal,
    },
    actions: {
      setTabState,
      handleProgressStatusChange,
      handleSidebarSelectTop,
      handleSidebarSelectChild,
      openLectureAttendance: modals.lectureAttendance.show,
      openAssignmentSubmission: modals.assignment.show,
      closeLectureAttendanceModal: modals.lectureAttendance.close,
      closeAssignmentSubmissionModal: modals.assignment.close,
      openEnrollmentProgramDetail,
      openWithdrawConfirm,
      closeWithdrawConfirm,
      closeInstitutionDeleteBlocked,
      handleWithdrawConfirm,
      openPersonalInfoRevealConfirm,
      closePersonalInfoRevealConfirm,
      submitPersonalInfoReveal,
      startBasicInfoEdit: requestStartBasicInfoEdit,
      startAdminCommentEdit,
      cancelBasicInfoEdit,
      saveBasicInfoEdit,
      updateBasicInfoDraft,
      patchAdminPermissionVariantFromDetailView,
      openInstructorPermissionRevoke,
      closeInstructorPermissionRevoke,
      confirmInstructorPermissionRevoke,
      openJaGradeEvaluation,
      closeJaGradeEvaluation,
      completeJaGradeEvaluation,
    },
    derived: {
      role,
      sidebarItems,
      sidebarExpandedGroupKeys,
      sidebarActiveChildKey,
      instructorResumeApplicantRow,
      canPatchAdminPermissionInDetailView,
    },
  }
}
