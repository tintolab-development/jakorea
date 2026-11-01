import { Form } from 'antd'

import {
  isValidRegisterPassword,
  REGISTER_PASSWORD_HELP_TEXT,
  REGISTER_PASSWORD_MIN_LENGTH,
  REGISTER_PASSWORD_MISMATCH_MESSAGE,
} from '@/features/auth/lib/validate-register-password'
import { CmsButton, CmsInput } from '@/shared/ui'
import { RegisterStepHeader } from '@/features/auth/ui/admin-register/register-step-header'

export interface FindPasswordChangeFormValues {
  newPassword: string
  newPasswordConfirm: string
}

interface FindPasswordChangeFormProps {
  form: ReturnType<typeof Form.useForm<FindPasswordChangeFormValues>>[0]
  isSubmitting: boolean
  submitError?: string | null
  onPasswordChange?: () => void
  onSubmit: () => void
}

export function FindPasswordChangeForm({
  form,
  isSubmitting,
  submitError,
  onPasswordChange,
  onSubmit,
}: FindPasswordChangeFormProps) {
  const newPassword = Form.useWatch('newPassword', form) ?? ''
  const newPasswordConfirm = Form.useWatch('newPasswordConfirm', form) ?? ''

  const isNewPasswordValid = isValidRegisterPassword(newPassword)
  const isNewPasswordConditionError =
    Boolean(newPassword) &&
    !isNewPasswordValid &&
    (newPassword.length >= REGISTER_PASSWORD_MIN_LENGTH || Boolean(newPasswordConfirm))
  const isConfirmMismatch =
    Boolean(newPasswordConfirm) &&
    newPassword !== newPasswordConfirm &&
    !isNewPasswordConditionError

  const canSubmit = isNewPasswordValid && Boolean(newPasswordConfirm) && !isConfirmMismatch

  return (
    <div className="find-password-change-step">
      <RegisterStepHeader
        title="새 비밀번호를 입력해 주세요"
        description={
          <>
            안전한 계정 이용을 위해
            <br />
            다른 곳에서 쓰지 않는 비밀번호를 추천합니다.
          </>
        }
      />

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="auth-form find-password-change-step__form"
        onFinish={onSubmit}
        onValuesChange={() => {
          onPasswordChange?.()
        }}
      >
        <Form.Item
          name="newPassword"
          rules={[{ required: true, message: '새 비밀번호를 입력해 주세요.' }]}
        >
          <CmsInput
            label="새 비밀번호"
            required
            type="password"
            inputSize="xlarge"
            width="100%"
            placeholder="새 비밀번호를 입력해 주세요"
            autoComplete="new-password"
            error={isNewPasswordConditionError || Boolean(submitError)}
            message={
              submitError ?? (isNewPasswordConditionError ? undefined : REGISTER_PASSWORD_HELP_TEXT)
            }
          />
        </Form.Item>

        <Form.Item
          name="newPasswordConfirm"
          rules={[{ required: true, message: '비밀번호를 한 번 더 입력해 주세요.' }]}
        >
          <CmsInput
            label="새 비밀번호 확인"
            required
            type="password"
            inputSize="xlarge"
            width="100%"
            placeholder="비밀번호를 한 번 더 입력해 주세요"
            autoComplete="new-password"
            error={isConfirmMismatch}
            message={isConfirmMismatch ? REGISTER_PASSWORD_MISMATCH_MESSAGE : undefined}
          />
        </Form.Item>

        <div className="auth-actions find-password-change-step__actions">
          <CmsButton
            variant="primary"
            size="h52"
            type="submit"
            loading={isSubmitting}
            disabled={!canSubmit} >
            비밀번호 변경하기
          </CmsButton>
        </div>
      </Form>
    </div>
  )
}
