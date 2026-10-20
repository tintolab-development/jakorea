import { useRef, useState } from 'react'
import { Form, Input, Select } from 'antd'
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
  mapMfaResetError,
  MFA_RECOVERY_TYPE_LABEL,
  MFA_RECOVERY_TYPES,
  type MfaRecoveryType,
} from '@/features/auth/lib/admin-mfa-contract'
import {
  canShowAdminMfaReset,
  resolveExplicitAdminPermissionVariant,
} from '@/features/user/detail/lib/can-show-admin-mfa-reset'
import { CmsButton } from '@/shared/ui/cms-button'
import { ContentModal } from '@/shared/ui/content-modal'
import { OTP_LENGTH } from '@/shared/constants/mfa-policy'

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
    sessionAdminAccountId: sessionUser?.adminAccountId,
    targetRole: target.role,
    targetAdminAccountId: target.adminAccountId,
    targetIsActive: target.isActive,
    targetPermissionVariant: resolveExplicitAdminPermissionVariant(target),
  })

  if (!visible || target.adminAccountId == null) return null

  const adminAccountId = target.adminAccountId

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
    if (!/^\d{6}$/.test(otpCode)) {
      setStepUpError('인증번호 6자리를 입력하세요.')
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
      <CmsButton size="large" variant="secondary" onClick={openDetails}>
        MFA 초기화
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
              disabled={submitting || otpCode.length !== OTP_LENGTH}
              onClick={() => void submitStepUp()}
            >
              초기화
            </CmsButton>
          </>
        }
      >
        <p>본인 인증 앱의 6자리 코드를 입력하세요. 확인 직후 대상 MFA를 한 번만 초기화합니다.</p>
        {stepUpError ? <p>{stepUpError}</p> : null}
        <Input.OTP
          length={OTP_LENGTH}
          value={otpCode}
          onChange={setOtpCode}
          disabled={submitting}
          size="large"
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
