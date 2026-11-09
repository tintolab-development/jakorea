import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
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
import type { InstructorMemberProfile } from '@/types/user'
import {
  guardAdminAction,
  resolveAdminRoleCodeFromUser,
  showAdminAccessDeniedAlert,
} from '@/shared/lib/admin-role-policy'
import { canRevealProgramPrivacy } from '@/entities/program/lib/program-privacy-access'
import {
  canRevealProgramGeneralPii,
  canRevealProgramSensitivePii,
  evictProgramUnmaskDetailCaches,
  resetTrackedProgramUnmaskCaches,
  isUnknownAssignmentRole,
} from '@/features/program/shared/lib/program-my-assignment'
import { useMyProgramPrivacyRole } from '@/features/user/detail/lib/use-my-program-privacy-role'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { ProgramRole } from '@/types/user'
import type { PrivacyRevealOptions } from '@/shared/lib/privacy-unmask-purpose'

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
  /**
   * INSTRUCTOR 세부 프로필 — 상세 GET과 동일하게 `school_teacher`면 teacher unmask 사용.
   */
  resolveInstructorMemberProfile?: () => InstructorMemberProfile | null | undefined
  /** ADMIN unmask — `adminAccountId`(숫자). `User.id`의 `admin-account-*`와 별개 */
  resolveAdminAccountId?: () => number | undefined
  /** 강사 권한 신청 상세 unmask — `instructor-role-requests/{requestId}/privacy/unmask` */
  resolveInstructorRoleRequestId?: () => number | undefined
  /** 회원 API가 아닌 화면 전용 개인정보 원문 조회 API */
  /** options.purpose는 수정 진입 흐름에서만 'EDIT_MODE'다(사유 문자열로 추론하지 않음). */
  revealPersonalInfo?: (reason: string, options?: PrivacyRevealOptions) => Promise<unknown>
  /**
   * 역할별 unmask API가 원문 상세 DTO를 반환하면 호출.
   * 회원 상세 화면에서 주소·계좌 등 표시 갱신에 사용.
   */
  onPrivacyUnmasked?: (payload: unknown, role: UserRole | undefined) => void
  /**
   * 열람 상태가 해제되는 모든 경로(다시 가리기·토글·행 전환·권한 회수·조회 실패)에서
   * 같은 이벤트·effect 안에서 동기 호출한다. 화면의 원문 오버레이 정리용(렌더 뒤 fallback 정리 금지).
   */
  onRemask?: () => void
  resetDeps: DependencyList
  controlMode: PersonalInfoRevealControlMode
  modalZIndex?: number
  /**
   * member: 회원 관리 전역 역할(MASTER / ACCOUNTING_MANAGER / PROGRAM_MANAGER).
   * program: 해당 프로그램 PM/PARTNER. 전역 역할로 대체하지 않는다.
   */
  privacyScope?: 'member' | 'program'
  /** 프로그램 담당자 API로 본인 역할을 조회할 프로그램 ID */
  programId?: string | number | null
  resolveProgramRole?: () => ProgramRole | null | undefined
  /**
   * 신청 unmask API는 SENSITIVE_PII_READ만 허용한다. 지정하지 않으면
   * revealPersonalInfo가 있으면 신청 unmask로 본다.
   */
  programUnmaskRequiresSensitive?: boolean
}

export interface UsePersonalInfoRevealResult {
  personalInfoRevealed: boolean
  /** 프로그램 담당 역할 조회 중·실패. 원문 버튼은 비활성이다. */
  programPrivacyPending: boolean
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
    reason: string,
    options?: PrivacyRevealOptions
  ) => Promise<{ ok: true; payload?: unknown } | { ok: false }>
  /** 수정 취소·저장 등 원문 열람을 끝낼 때 마스킹 상태로 되돌린다(원문 재조회 없음). */
  remaskPersonalInfo: () => void
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
  resolveInstructorRoleRequestId?: () => number | undefined,
  resolveInstructorMemberProfile?: () => InstructorMemberProfile | null | undefined,
  options?: PrivacyRevealOptions
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
      const payload = await fetchMemberRolePrivacyUnmask(memberIdNum, reason, role, {
        instructorMemberProfile: resolveInstructorMemberProfile?.() ?? undefined,
        purpose: options?.purpose,
      })
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
      const payload = await fetchMemberPrivacyUnmask(memberIdRaw, reason)
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

  // 실서버( remote API 설정됨 )에서는 unmask 대상 없이 성공 처리하지 않는다.
  if (isRealApiModuleEnabled('members') || isRealApiModuleEnabled('logs')) {
    cmsAlertModal.show({
      title: '열람 실패',
      content: '개인정보 원문 조회 대상이 없습니다.',
    })
    return { ok: false }
  }

  trackPersonalInfoAccess(resolveAccessItem(), reason)
  return { ok: true, role }
}

export function usePersonalInfoReveal({
  resolveAccessItem,
  resolveMemberId,
  resolveMemberRole,
  resolveInstructorMemberProfile,
  resolveAdminAccountId,
  resolveInstructorRoleRequestId,
  revealPersonalInfo,
  onPrivacyUnmasked,
  onRemask,
  resetDeps,
  controlMode,
  modalZIndex,
  privacyScope = 'member',
  programId,
  resolveProgramRole,
  programUnmaskRequiresSensitive = revealPersonalInfo != null,
}: UsePersonalInfoRevealOptions): UsePersonalInfoRevealResult {
  const programAssignment = useMyProgramPrivacyRole(privacyScope === 'program' ? programId : undefined)
  const [personalInfoRevealed, setPersonalInfoRevealed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  /** 원문을 실제로 받은 상태인지(캐시 초기화 대상 여부). 렌더와 무관하게 이벤트 시점 값을 쓴다. */
  const revealedRef = useRef(false)
  const onRemaskRef = useRef(onRemask)
  onRemaskRef.current = onRemask

  /**
   * 원문 열람 해제 — 프로그램 원문 캐시 초기화·화면 오버레이 정리·상태 해제를 한 번에 동기 수행한다.
   * 렌더 뒤 effect로 지우는 fallback을 두지 않는다(CMS-29: 한 프레임도 원문 재표시 금지).
   */
  const releaseReveal = (evict = false) => {
    if (privacyScope === 'program' && revealedRef.current) {
      if (evict) evictProgramUnmaskDetailCaches(programId)
      else resetTrackedProgramUnmaskCaches(programId)
    }
    revealedRef.current = false
    onRemaskRef.current?.()
    setPersonalInfoRevealed(false)
    setConfirmOpen(false)
  }
  const releaseRevealRef = useRef(releaseReveal)
  releaseRevealRef.current = releaseReveal

  useEffect(() => {
    releaseRevealRef.current()
    // resetDeps: 호출 화면의 기존 reset effect와 동일한 의존성 배열
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps)

  const programCanReveal = programUnmaskRequiresSensitive
    ? programAssignment.canRevealSensitive
    : programAssignment.canRevealGeneral

  // 화면 이탈(unmount) 시 원문을 쓴 상세 캐시를 남기지 않는다.
  useEffect(() => {
    if (privacyScope !== 'program') return
    return () => {
      if (revealedRef.current) resetTrackedProgramUnmaskCaches(programId)
      revealedRef.current = false
    }
  }, [privacyScope, programId])

  useEffect(() => {
    if (privacyScope !== 'program') return
    if (programAssignment.pending || !programCanReveal) {
      releaseRevealRef.current(true)
    }
  }, [
    privacyScope,
    programId,
    programAssignment.pending,
    programCanReveal,
    personalInfoRevealed,
  ])

  const closePersonalInfoRevealConfirm = useCallback(() => {
    setConfirmOpen(false)
  }, [])

  const guardPiiReveal = useCallback(async () => {
    if (privacyScope === 'program') {
      if (programId != null && String(programId).trim() !== '') {
        if (programAssignment.pending) return false
        const fresh = await programAssignment.refetch()
        const allowed = programUnmaskRequiresSensitive
          ? canRevealProgramSensitivePii(fresh)
          : canRevealProgramGeneralPii(fresh)
        if (isUnknownAssignmentRole(fresh) || !allowed) {
          if (!isUnknownAssignmentRole(fresh)) showAdminAccessDeniedAlert()
          return false
        }
        return true
      }
      if (canRevealProgramPrivacy(resolveProgramRole?.() ?? null, 'general')) return true
      showAdminAccessDeniedAlert()
      return false
    }
    const roleCode = resolveAdminRoleCodeFromUser(useAuthStore.getState().user)
    return guardAdminAction({ roleCode, action: 'pii' })
  }, [privacyScope, programId, programAssignment, programUnmaskRequiresSensitive, resolveProgramRole])

  const revealWithReason = useCallback(
    async (
      reason: string,
      options?: PrivacyRevealOptions
    ): Promise<{ ok: true; payload?: unknown } | { ok: false }> => {
      if (!(await guardPiiReveal())) return { ok: false }
      if (revealPersonalInfo) {
        try {
          const payload = await revealPersonalInfo(reason, options)
          onPrivacyUnmasked?.(payload, resolveMemberRole?.())
          revealedRef.current = true
          setPersonalInfoRevealed(true)
          setConfirmOpen(false)
          return { ok: true, payload }
        } catch (error) {
          const status =
            error != null && typeof error === 'object' && 'response' in error
              ? (error as { response?: { status?: number } }).response?.status
              : undefined
          revealedRef.current = true
          releaseRevealRef.current(true)
          const message =
            status === 403
              ? '이 프로그램에서 원문을 열람할 권한이 없습니다.'
              : !status && error instanceof Error && error.message.trim()
                ? error.message
                : '개인정보 원문 조회에 실패했습니다.'
          cmsAlertModal.show({
            title: status === 403 ? '열람 권한 없음' : '열람 실패',
            content: message,
          })
          return { ok: false }
        }
      }
      const result = await revealPersonalInfoWithAudit(
        resolveAccessItem,
        resolveMemberId,
        reason,
        resolveMemberRole,
        resolveAdminAccountId,
        resolveInstructorRoleRequestId,
        resolveInstructorMemberProfile,
        options
      )
      if (!result.ok) return { ok: false }
      if (result.payload !== undefined) {
        onPrivacyUnmasked?.(result.payload, result.role)
      }
      revealedRef.current = true
      setPersonalInfoRevealed(true)
      setConfirmOpen(false)
      return { ok: true, payload: result.payload }
    },
    [
      onPrivacyUnmasked,
      resolveAccessItem,
      resolveMemberId,
      resolveMemberRole,
      resolveInstructorMemberProfile,
      resolveAdminAccountId,
      resolveInstructorRoleRequestId,
      revealPersonalInfo,
      guardPiiReveal,
      programId,
    ]
  )

  const submitPersonalInfoReveal = useCallback(
    (reason: string) => {
      // 수동 열람: 사유가 '회원 정보 수정'이어도 purpose를 붙이지 않는다.
      void revealWithReason(reason)
    },
    [revealWithReason]
  )

  const openPersonalInfoRevealConfirm = useCallback(() => {
    if (personalInfoRevealed) return
    void guardPiiReveal().then(allowed => {
      if (allowed) setConfirmOpen(true)
    })
  }, [personalInfoRevealed, guardPiiReveal])

  /**
   * 원문 열람 종료. 프로그램 범위는 상태를 바꾸기 전에 원문을 쓴 상세 캐시를 동기적으로 초기화한다 —
   * 다음 렌더가 원문 캐시를 한 번이라도 읽으면 취소 직후 원문이 잠깐 다시 보인다(CMS-29).
   */
  const remaskPersonalInfo = useCallback(() => {
    releaseRevealRef.current()
  }, [])

  const onPrivacyControlClick = useCallback(() => {
    if (controlMode === 'toggleRemask') {
      if (personalInfoRevealed) {
        remaskPersonalInfo()
        return
      }
      void guardPiiReveal().then(allowed => {
        if (allowed) setConfirmOpen(true)
      })
      return
    }
    if (controlMode === 'hideWhenRevealed') {
      if (personalInfoRevealed) return
      void guardPiiReveal().then(allowed => {
        if (allowed) setConfirmOpen(true)
      })
      return
    }
    if (personalInfoRevealed) return
    void guardPiiReveal().then(allowed => {
      if (allowed) setConfirmOpen(true)
    })
  }, [controlMode, personalInfoRevealed, guardPiiReveal, remaskPersonalInfo])

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
    // 권한 설정 V1.2: 권한이 없어도 「개인정보 상세보기」는 활성 상태로 두고, 클릭 시 guardPiiReveal이 접근 불가 안내를 띄운다.
    // 배정 응답을 확인하는 동안만 비활성화한다.
    programPrivacyPending: privacyScope === 'program' && programAssignment.pending,
    personalInfoRevealConfirmOpen: confirmOpen,
    onPrivacyControlClick,
    openPersonalInfoRevealConfirm,
    closePersonalInfoRevealConfirm,
    submitPersonalInfoReveal,
    revealWithReason,
    remaskPersonalInfo,
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
      const roleCode = resolveAdminRoleCodeFromUser(useAuthStore.getState().user)
      if (!guardAdminAction({ roleCode, action: 'pii' })) return
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
