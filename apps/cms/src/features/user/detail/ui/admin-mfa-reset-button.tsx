import { useRef, useState } from 'react'
import { App, Form, Input, Select } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import type { User } from '@/types/user'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { AdminMfaApiError } from '@/features/auth/api/admin-auth-fetcher'
import {
  fetchAdminMfaReset,
  fetchAdminMfaResetStepUp,
} from '@/features/auth/api/admin-mfa-reset-fetcher'
import {
  buildMfaResetRequest,
  containsMfaSecretMaterial,
  isExecutorTotpCode,
  mapMfaResetError,
  MFA_RECOVERY_TYPE_LABEL,
  MFA_RECOVERY_TYPES,
  type MfaRecoveryType,
} from '@/features/auth/lib/admin-mfa-contract'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import {
  canShowAdminMfaReset,
  resolveExplicitAdminPermissionVariant,
  toPositiveAdminAccountId,
} from '@/features/user/detail/lib/can-show-admin-mfa-reset'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  getAdminPermissionVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui/cms-button'
import { ContentModal } from '@/shared/ui/content-modal'

const SUCCESS_MESSAGE =
  'MFA 초기화가 완료되었습니다. 대상 관리자는 기존 세션이 종료되며, 다시 로그인한 뒤 새 QR로 등록해야 합니다. 확인된 연락처로 대상에게 안내하고 티켓에 기록하세요.'

interface ResetDraft {
  reason: string
  recoveryType: MfaRecoveryType
  verificationReference: string
}

type Phase = 'closed' | 'details' | 'step-up' | 'result'

export function AdminMfaResetButton({ target }: { target: Omit<User, 'password'> }) {
  const sessionUser = useAuthStore(state => state.user)
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const [phase, setPhase] = useState<Phase>('closed')
  const [stepUpError, setStepUpError] = useState<string | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const draftRef = useRef<ResetDraft | null>(null)
  const proofRef = useRef<string | null>(null)
  const submittingRef = useRef(false)
  const [form] = Form.useForm<ResetDraft>()

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
  if (!visible || adminAccountId == null) return null

  const isSelfReset =
    toPositiveAdminAccountId(sessionUser?.adminAccountId) === adminAccountId
  const targetPermissionLabel = ADMIN_PERMISSION_TAG_LABEL[getAdminPermissionVariant(target)]

  const close = () => {
    proofRef.current = null
    draftRef.current = null
    submittingRef.current = false
    setSubmitting(false)
    setStepUpError(null)
    setResultMessage(null)
    setOtpCode('')
    form.resetFields()
    setPhase('closed')
  }

  const openDetails = () => {
    setStepUpError(null)
    setResultMessage(null)
    setPhase('details')
  }

  const submitDetails = async () => {
    const values = await form.validateFields()
    const recoveryType = values.recoveryType
    if (!MFA_RECOVERY_TYPES.includes(recoveryType)) return
    draftRef.current = {
      reason: values.reason.trim(),
      recoveryType,
      verificationReference: values.verificationReference.trim(),
    }
    setOtpCode('')
    setStepUpError(null)
    setPhase('step-up')
  }

  const submitStepUp = async () => {
    const draft = draftRef.current
    if (!draft || submittingRef.current) return
    if (!isExecutorTotpCode(otpCode)) {
      setStepUpError('본인 인증번호 6~8자리를 입력하세요.')
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setStepUpError(null)
    let proof: string | null = null
    try {
      proof = await fetchAdminMfaResetStepUp(adminAccountId, otpCode)
      proofRef.current = proof
      const built = buildMfaResetRequest({
        reason: draft.reason,
        recoveryType: draft.recoveryType,
        verificationReference: draft.verificationReference,
        stepUpProof: proof,
      })
      if (!built.ok) {
        setStepUpError(built.message)
        return
      }
      await fetchAdminMfaReset(adminAccountId, built.body)
      await queryClient.invalidateQueries({
        queryKey: memberQueryKeys.detailResource('admin', adminAccountId),
      })
      await queryClient.invalidateQueries({
        queryKey: memberQueryKeys.adminApprovalRequests.detail(adminAccountId),
      })
      message.success(SUCCESS_MESSAGE)
      setResultMessage(SUCCESS_MESSAGE)
      setPhase('result')
    } catch (error: unknown) {
      const code = error instanceof AdminMfaApiError ? error.code : 'UNKNOWN'
      const status = error instanceof AdminMfaApiError ? error.httpStatus : undefined
      const mapped = mapMfaResetError(code, status)
      if (mapped.action === 'restart-step-up' || mapped.action === 'rate-limited') {
        setStepUpError(mapped.message)
        setOtpCode('')
        return
      }
      setResultMessage(mapped.message)
      setPhase('result')
    } finally {
      proofRef.current = null
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <>
      <DetailInfoForm.InputsSeparator />
      <CmsButton size="h32" variant="secondary" width={100} onClick={openDetails}>
        MFA 재발급
      </CmsButton>

      <ContentModal
        open={phase === 'details'}
        onCancel={close}
        title="MFA 초기화"
        width={600}
        footer={
          <>
            <CmsButton variant="secondary" size="large" type="button" onClick={close}>
              취소
            </CmsButton>
            <CmsButton variant="primary" size="large" type="button" onClick={() => void submitDetails()}>
              다음
            </CmsButton>
          </>
        }
      >
        <p>
          {target.name} ({target.email})
        </p>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="사유"
            name="reason"
            rules={[
              { required: true, message: '사유를 입력하세요.' },
              { max: 500, message: '사유는 500자 이하여야 합니다.' },
              {
                validator: async (_, value: string | undefined) => {
                  if (value && containsMfaSecretMaterial(value)) {
                    throw new Error('사유에 인증번호나 토큰을 넣을 수 없습니다.')
                  }
                },
              },
            ]}
          >
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
          <Form.Item
            label="복구 유형"
            name="recoveryType"
            rules={[{ required: true, message: '복구 유형을 선택하세요.' }]}
          >
            <Select
              options={MFA_RECOVERY_TYPES.map(type => ({
                value: type,
                label: MFA_RECOVERY_TYPE_LABEL[type],
              }))}
            />
          </Form.Item>
          <Form.Item
            label="내부 티켓 번호"
            name="verificationReference"
            rules={[
              { required: true, message: '내부 티켓 번호를 입력하세요.' },
              { max: 120, message: '티켓 번호는 120자 이하여야 합니다.' },
              {
                validator: async (_, value: string | undefined) => {
                  if (value && containsMfaSecretMaterial(value)) {
                    throw new Error('티켓 번호에 인증번호나 토큰을 넣을 수 없습니다.')
                  }
                },
              },
            ]}
          >
            <Input maxLength={120} />
          </Form.Item>
        </Form>
      </ContentModal>

      <ContentModal
        open={phase === 'step-up'}
        onCancel={close}
        title="본인 인증"
        width={600}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="large"
              type="button"
              onClick={close}
              disabled={submitting}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="large"
              type="button"
              loading={submitting}
              disabled={submitting || !isExecutorTotpCode(otpCode)}
              onClick={() => void submitStepUp()}
            >
              초기화
            </CmsButton>
          </>
        }
      >
        <p>
          {isSelfReset
            ? '본인 MFA를 초기화합니다. 현재 사용 중인 인증 앱의 6~8자리 코드를 입력하세요. 초기화 후 기존 세션이 종료되며 다시 로그인한 뒤 새 QR로 등록해야 합니다.'
            : `${target.name} (${targetPermissionLabel}) 대상 MFA를 초기화합니다. 실행자 본인 인증 앱의 6~8자리 코드를 입력하세요. 대상 관리자의 코드가 아닙니다.`}
        </p>
        {stepUpError ? <p>{stepUpError}</p> : null}
        <Input
          value={otpCode}
          onChange={event => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 8))}
          disabled={submitting}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          placeholder="본인 인증번호"
        />
      </ContentModal>

      <ContentModal
        open={phase === 'result'}
        onCancel={close}
        title="MFA 초기화"
        width={600}
        footer={
          <CmsButton variant="primary" size="large" type="button" onClick={close}>
            닫기
          </CmsButton>
        }
      >
        <p>{resultMessage}</p>
      </ContentModal>
    </>
  )
}
