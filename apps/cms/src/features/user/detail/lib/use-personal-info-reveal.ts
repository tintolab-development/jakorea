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
import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'
import { trackPersonalInfoAccess } from '@/features/logs/lib/personal-info-access-tracker'
import { UserPersonalInfoRevealConfirmModal } from '@/features/user/detail/ui/modal/user-personal-info-reveal-confirm-modal'
import { queryClient } from '@/shared/lib/query-client'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

export type PersonalInfoRevealControlMode =
  | 'toggleRemask'
  | 'hideWhenRevealed'
  | 'headerStickyNoop'

export interface UsePersonalInfoRevealOptions {
  resolveAccessItem: () => string
  /** 실 API unmask 시 회원 ID (없으면 mock tracker만 사용) */
  resolveMemberId?: () => string | undefined
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
  confirmModal: ReactNode
}

/**
 * 개인정보 상세보기 확인 모달 + 열람 로깅 + 마스킹 상태를 한곳에서 관리합니다.
 * (JSX 대신 createElement — `.ts` 확장자에서도 esbuild가 파싱 가능)
 */
async function revealPersonalInfoWithAudit(
  resolveAccessItem: () => string,
  resolveMemberId: (() => string | undefined) | undefined,
  reason: string
): Promise<boolean> {
  const memberId = resolveMemberId?.()?.trim()
  if (shouldUseLogsRemoteApi() && memberId) {
    try {
      await fetchMemberPrivacyUnmask(memberId, reason)
      void queryClient.invalidateQueries({ queryKey: logsQueryKeys.all })
      return true
    } catch (error) {
      const message =
        error instanceof PrivacyUnmaskApiError
          ? error.message
          : '개인정보 원문 조회에 실패했습니다.'
      cmsAlertModal.show({ title: '열람 실패', content: message })
      return false
    }
  }

  trackPersonalInfoAccess(resolveAccessItem(), reason)
  return true
}

export function usePersonalInfoReveal({
  resolveAccessItem,
  resolveMemberId,
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

  const submitPersonalInfoReveal = useCallback(
    (reason: string) => {
      void revealPersonalInfoWithAudit(resolveAccessItem, resolveMemberId, reason).then(ok => {
        if (!ok) return
        setPersonalInfoRevealed(true)
        setConfirmOpen(false)
      })
    },
    [resolveAccessItem, resolveMemberId]
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
      ).then(ok => {
        if (!ok) return
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
