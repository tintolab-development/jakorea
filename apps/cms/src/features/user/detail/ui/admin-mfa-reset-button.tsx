import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { User } from '@/types/user'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { AdminMfaApiError } from '@/features/auth/api/admin-auth-fetcher'
import {
  fetchAdminMfaReset,
  fetchAdminMfaResetStepUp,
} from '@/features/auth/api/admin-mfa-reset-fetcher'
import {
  ADMIN_DETAIL_MFA_RESET_DEFAULTS,
  buildMfaResetRequest,
  mapMfaResetError,
} from '@/features/auth/lib/admin-mfa-contract'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import {
  canShowAdminMfaReset,
  resolveExplicitAdminPermissionVariant,
  toPositiveAdminAccountId,
} from '@/features/user/detail/lib/can-show-admin-mfa-reset'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, ConfirmModal, useCmsAlert } from '@/shared/ui'
import { showIssueCompletedAlert } from '@/shared/ui/show-issue-completed-alert'
import { showRateLimitedAlert } from '@/shared/ui/show-rate-limited-alert'

/** 본인 재발급 — 시안에 별도 문구가 없어 기존 안내 유지(재로그인 필요) */
const SELF_SUCCESS_MESSAGE =
  'MFA 재발급이 완료되었습니다.\n다시 로그인한 뒤 새 QR로 등록해 주세요.'

/** 시안(16127:606933) 「MFA 재발급 안내」 — 시안 「QA」는 오타 — QR로 표기 */
function buildAdminMfaResetConfirmContent(targetName: string | undefined): string {
  const name = targetName?.trim()
  return name
    ? `**[${name}]** 님의 MFA QR 코드를 재발급하시겠습니까?`
    : 'MFA QR 코드를 재발급하시겠습니까?'
}

export function AdminMfaResetButton({ target }: { target: Omit<User, 'password'> }) {
  const sessionUser = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showAlert } = useCmsAlert()
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const proofRef = useRef<string | null>(null)
  const submittingRef = useRef(false)

  const visible = canShowAdminMfaReset({
    sessionRoleCode: sessionUser?.roleCode,
    sessionAdminLevel: sessionUser?.adminLevel,
    sessionAdminAccountId: sessionUser?.adminAccountId,
    targetRole: target.role,
    targetAdminAccountId: target.adminAccountId,
    targetIsActive: target.isActive,
    targetPermissionVariant: resolveExplicitAdminPermissionVariant(target),
    targetRoleCode: target.roleCode,
    targetAdminLevel: target.adminLevel,
  })

  const adminAccountId = toPositiveAdminAccountId(target.adminAccountId)
  const isSelfReset =
    adminAccountId != null &&
    toPositiveAdminAccountId(sessionUser?.adminAccountId) === adminAccountId

  const showResult = (content: string, logoutAfterConfirm: boolean) => {
    showAlert({
      title: 'MFA 재발급',
      content,
      onConfirm: logoutAfterConfirm
        ? () => {
            logout()
            navigate('/login', { replace: true })
          }
        : undefined,
    })
  }

  const runReset = async () => {
    if (submittingRef.current || adminAccountId == null) return

    submittingRef.current = true
    setSubmitting(true)
    let proof: string | null = null
    try {
      proof = await fetchAdminMfaResetStepUp(adminAccountId)
      proofRef.current = proof
      const built = buildMfaResetRequest({
        ...ADMIN_DETAIL_MFA_RESET_DEFAULTS,
        stepUpProof: proof,
      })
      if (!built.ok) {
        showResult(built.message, false)
        return
      }
      await fetchAdminMfaReset(adminAccountId, built.body)
      proofRef.current = null
      if (isSelfReset) {
        showResult(SELF_SUCCESS_MESSAGE, true)
        return
      }
      await queryClient.invalidateQueries({
        queryKey: memberQueryKeys.detailResource('admin', adminAccountId),
      })
      await queryClient.invalidateQueries({
        queryKey: memberQueryKeys.adminApprovalRequests.detail(adminAccountId),
      })
      // 시안(16909-166394) 공통 「발급 완료」
      showIssueCompletedAlert()
    } catch (error: unknown) {
      const code = error instanceof AdminMfaApiError ? error.code : 'UNKNOWN'
      const status = error instanceof AdminMfaApiError ? error.httpStatus : undefined
      const mapped = mapMfaResetError(code, status)
      // 429·MFA_RESET_RATE_LIMITED — 시안(16909-166437) 공통 「처리 제한 안내」. 계정 잠금은 기존 안내 유지
      if (mapped.action === 'rate-limited' && code !== 'ACCOUNT_LOCKED') {
        showRateLimitedAlert()
        return
      }
      showResult(mapped.message, false)
    } finally {
      proofRef.current = null
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  if (!visible || adminAccountId == null) return null

  return (
    <>
      <DetailInfoForm.InputsSeparator />
      <CmsButton
        size="h32"
        variant="secondary"
        loading={submitting}
        disabled={submitting}
        onClick={() => setConfirmOpen(true)} >
        MFA 재발급
      </CmsButton>
      <ConfirmModal
        open={confirmOpen}
        title="MFA 재발급 안내"
        content={buildAdminMfaResetConfirmContent(target.name)}
        confirmText="발급"
        cancelText="취소"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          // 확인 후에만 재발급 API 호출
          setConfirmOpen(false)
          void runReset()
        }}
        zIndex={2600}
      />
    </>
  )
}
