import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DependencyList,
  type Dispatch,
  type Key,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { shouldUseLogsRemoteApi } from '@/features/logs/api/admin-logs-service'
import {
  fetchMemberPrivacyUnmask,
  PrivacyUnmaskApiError,
} from '@/features/logs/api/privacy-unmask-fetcher'
import {
  fetchAdminAccountPrivacyUnmask,
  fetchInstructorRoleRequestPrivacyUnmask,
  fetchMemberRolePrivacyUnmask,
} from '@/features/user/api/member-privacy-unmask'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'
import { trackPersonalInfoAccess } from '@/features/logs/lib/personal-info-access-tracker'
import { UserPersonalInfoRevealConfirmModal } from '@/features/user/detail/ui/modal/user-personal-info-reveal-confirm-modal'
import { queryClient } from '@/shared/lib/query-client'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import type { UserRole } from '@/types/user'

export type PersonalInfoRevealControlMode =
  | 'toggleRemask'
  | 'hideWhenRevealed'
  | 'headerStickyNoop'

export interface UsePersonalInfoRevealOptions {
  resolveAccessItem: () => string
  /** 실 API unmask 시 회원 ID (없으면 mock tracker만 사용) */
  resolveMemberId?: () => string | undefined
  /** 회원 관리 역할별 unmask path 분기 */
  resolveMemberRole?: () => UserRole | undefined
  /** ADMIN unmask — `adminAccountId`(숫자). `User.id`의 `admin-account-*`와 별개 */
  resolveAdminAccountId?: () => number | undefined
  /** 강사 권한 신청 상세 unmask — `instructor-role-requests/{requestId}/privacy/unmask` */
  resolveInstructorRoleRequestId?: () => number | undefined
  /**
   * 역할별 unmask API가 원문 상세 DTO를 반환하면 호출.
   * 회원 상세 화면에서 주소·계좌 등 표시 갱신에 사용.
   */
  onPrivacyUnmasked?: (payload: unknown, role: UserRole | undefined) => void
  resetDeps: DependencyList
  controlMode: PersonalInfoRevealControlMode
  modalZIndex?: number
}

export interface UsePersonalInfoRevealResult {
  personalInfoRevealed: boolean
  personalInfoRevealConfirmOpen: boolean
  onPrivacyControlClick: () => void
  /** 마스킹 해제 전에만 확인 모달을 연다 (회원 상세 헤더·신청자 헤더 등) */
  openPersonalInfoRevealConfirm: () => void
  closePersonalInfoRevealConfirm: () => void
  submitPersonalInfoReveal: (reason: string) => void
  /**
   * 사유 입력 모달 없이 unmask 수행 (정보 수정 선행 해제 등).
   * 성공 시 onPrivacyUnmasked + personalInfoRevealed=true.
   */
  revealWithReason: (
    reason: string
  ) => Promise<{ ok: true; payload?: unknown } | { ok: false }>
  confirmModal: ReactNode
}

/**
 * 개인정보 상세보기 확인 모달 + 열람 로깅 + 마스킹 상태를 한곳에서 관리합니다.
 * (JSX 대신 createElement — `.ts` 확장자에서도 esbuild가 파싱 가능)
 */
async function revealPersonalInfoWithAudit(
  resolveAccessItem: () => string,
  resolveMemberId: (() => string | undefined) | undefined,
  reason: string,
  resolveMemberRole?: () => UserRole | undefined,
  resolveAdminAccountId?: () => number | undefined,
  resolveInstructorRoleRequestId?: () => number | undefined
): Promise<{ ok: true; payload?: unknown; role?: UserRole } | { ok: false }> {
  const memberIdRaw = resolveMemberId?.()?.trim()
  const memberIdNum = memberIdRaw != null ? Number(memberIdRaw) : NaN
  const role = resolveMemberRole?.()
  const adminAccountId =
    role === 'ADMIN' ? resolveAdminAccountId?.() : undefined
  const instructorRoleRequestId = resolveInstructorRoleRequestId?.()

  if (isMembersRemoteEnabled() && instructorRoleRequestId != null) {
    try {
      const payload = await fetchInstructorRoleRequestPrivacyUnmask(
        instructorRoleRequestId,
        reason
      )
      void queryClient.invalidateQueries({ queryKey: logsQueryKeys.privacyAccessAll() })
      return { ok: true, payload, role: role ?? 'INSTRUCTOR' }
    } catch (error) {
      const message =
        error instanceof PrivacyUnmaskApiError
          ? error.message
          : '개인정보 원문 조회에 실패했습니다.'
      cmsAlertModal.show({ title: '열람 실패', content: message })
      return { ok: false }
    }
  }

  if (isMembersRemoteEnabled() && adminAccountId != null) {
    try {
      const payload = await fetchAdminAccountPrivacyUnmask(adminAccountId, reason)
      void queryClient.invalidateQueries({ queryKey: logsQueryKeys.privacyAccessAll() })
      return { ok: true, payload, role: 'ADMIN' }
    } catch (error) {
      const message =
        error instanceof PrivacyUnmaskApiError
          ? error.message
          : '개인정보 원문 조회에 실패했습니다.'
      cmsAlertModal.show({ title: '열람 실패', content: message })
      return { ok: false }
    }
  }

  if (isMembersRemoteEnabled() && Number.isFinite(memberIdNum)) {
    try {
      const payload = await fetchMemberRolePrivacyUnmask(memberIdNum, reason, role)
      void queryClient.invalidateQueries({ queryKey: logsQueryKeys.privacyAccessAll() })
      return { ok: true, payload, role }
    } catch (error) {
      const message =
        error instanceof PrivacyUnmaskApiError
          ? error.message
          : '개인정보 원문 조회에 실패했습니다.'
      cmsAlertModal.show({ title: '열람 실패', content: message })
      return { ok: false }
    }
  }

  if (shouldUseLogsRemoteApi() && memberIdRaw) {
    try {
      await fetchMemberPrivacyUnmask(memberIdRaw, reason)
      void queryClient.invalidateQueries({ queryKey: logsQueryKeys.privacyAccessAll() })
      return { ok: true, role }
    } catch (error) {
      const message =
        error instanceof PrivacyUnmaskApiError
          ? error.message
          : '개인정보 원문 조회에 실패했습니다.'
      cmsAlertModal.show({ title: '열람 실패', content: message })
      return { ok: false }
    }
  }

  trackPersonalInfoAccess(resolveAccessItem(), reason)
  return { ok: true, role }
}

export function usePersonalInfoReveal({
  resolveAccessItem,
  resolveMemberId,
  resolveMemberRole,
  resolveAdminAccountId,
  resolveInstructorRoleRequestId,
  onPrivacyUnmasked,
  resetDeps,
  controlMode,
  modalZIndex,
}: UsePersonalInfoRevealOptions): UsePersonalInfoRevealResult {
  const [personalInfoRevealed, setPersonalInfoRevealed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    setPersonalInfoRevealed(false)
    setConfirmOpen(false)
    // resetDeps: 호출 화면의 기존 reset effect와 동일한 의존성 배열
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps)

  const closePersonalInfoRevealConfirm = useCallback(() => {
    setConfirmOpen(false)
  }, [])

  const revealWithReason = useCallback(
    async (
      reason: string
    ): Promise<{ ok: true; payload?: unknown } | { ok: false }> => {
      const result = await revealPersonalInfoWithAudit(
        resolveAccessItem,
        resolveMemberId,
        reason,
        resolveMemberRole,
        resolveAdminAccountId,
        resolveInstructorRoleRequestId
      )
      if (!result.ok) return { ok: false }
      if (result.payload !== undefined) {
        onPrivacyUnmasked?.(result.payload, result.role)
      }
      setPersonalInfoRevealed(true)
      setConfirmOpen(false)
      return { ok: true, payload: result.payload }
    },
    [
      onPrivacyUnmasked,
      resolveAccessItem,
      resolveMemberId,
      resolveMemberRole,
      resolveAdminAccountId,
      resolveInstructorRoleRequestId,
    ]
  )

  const submitPersonalInfoReveal = useCallback(
    (reason: string) => {
      void revealWithReason(reason)
    },
    [revealWithReason]
  )

  const openPersonalInfoRevealConfirm = useCallback(() => {
    if (personalInfoRevealed) return
    setConfirmOpen(true)
  }, [personalInfoRevealed])

  const onPrivacyControlClick = useCallback(() => {
    if (controlMode === 'toggleRemask') {
      if (personalInfoRevealed) {
        setPersonalInfoRevealed(false)
        return
      }
      setConfirmOpen(true)
      return
    }
    if (controlMode === 'hideWhenRevealed') {
      if (personalInfoRevealed) return
      setConfirmOpen(true)
      return
    }
    if (personalInfoRevealed) return
    setConfirmOpen(true)
  }, [controlMode, personalInfoRevealed])

  const confirmModal = useMemo(
    () =>
      confirmOpen
        ? createElement(UserPersonalInfoRevealConfirmModal, {
            onCancel: closePersonalInfoRevealConfirm,
            onConfirm: submitPersonalInfoReveal,
            zIndex: modalZIndex,
          })
        : null,
    [confirmOpen, closePersonalInfoRevealConfirm, submitPersonalInfoReveal, modalZIndex]
  )

  return {
    personalInfoRevealed,
    personalInfoRevealConfirmOpen: confirmOpen,
    onPrivacyControlClick,
    openPersonalInfoRevealConfirm,
    closePersonalInfoRevealConfirm,
    submitPersonalInfoReveal,
    revealWithReason,
    confirmModal,
  }
}

export interface UsePersonalInfoRevealByRowOptions {
  resolveAccessItem: (rowId: string) => string
  resolveMemberId?: (rowId: string) => string | undefined
  resetDeps: DependencyList
}

export interface UsePersonalInfoRevealByRowResult {
  privacyRevealedByRowId: Record<string, boolean>
  setPrivacyRevealedByRowId: Dispatch<SetStateAction<Record<string, boolean>>>
  handleToggleListPrivacyMask: (selectedRowKeys: Key[], isSelectedRowRevealed: boolean) => void
  confirmModal: ReactNode
}

/**
 * 권한 신청 목록처럼 행 단위로 마스킹 해제 여부를 관리할 때 사용합니다.
 */
export function usePersonalInfoRevealByRow({
  resolveAccessItem,
  resolveMemberId,
  resetDeps,
}: UsePersonalInfoRevealByRowOptions): UsePersonalInfoRevealByRowResult {
  const [privacyRevealedByRowId, setPrivacyRevealedByRowId] = useState<Record<string, boolean>>({})
  const [pendingConfirmRowId, setPendingConfirmRowId] = useState<string | null>(null)

  useEffect(() => {
    setPrivacyRevealedByRowId({})
    setPendingConfirmRowId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps)

  const closeConfirm = useCallback(() => {
    setPendingConfirmRowId(null)
  }, [])

  const submitReveal = useCallback(
    (reason: string) => {
      if (pendingConfirmRowId == null) return
      const id = pendingConfirmRowId
      void revealPersonalInfoWithAudit(
        () => resolveAccessItem(id),
        () => resolveMemberId?.(id),
        reason
      ).then(result => {
        if (!result.ok) return
        setPrivacyRevealedByRowId(prev => ({ ...prev, [id]: true }))
        setPendingConfirmRowId(null)
      })
    },
    [pendingConfirmRowId, resolveAccessItem, resolveMemberId]
  )

  const handleToggleListPrivacyMask = useCallback(
    (selectedRowKeys: Key[], isSelectedRowRevealed: boolean) => {
      if (selectedRowKeys.length !== 1) return
      const id = String(selectedRowKeys[0])
      if (isSelectedRowRevealed) {
        setPrivacyRevealedByRowId(prev => ({ ...prev, [id]: false }))
        return
      }
      setPendingConfirmRowId(id)
    },
    []
  )

  const confirmModal = useMemo(
    () =>
      pendingConfirmRowId
        ? createElement(UserPersonalInfoRevealConfirmModal, {
            onCancel: closeConfirm,
            onConfirm: submitReveal,
          })
        : null,
    [pendingConfirmRowId, closeConfirm, submitReveal]
  )

  return {
    privacyRevealedByRowId,
    setPrivacyRevealedByRowId,
    handleToggleListPrivacyMask,
    confirmModal,
  }
}
