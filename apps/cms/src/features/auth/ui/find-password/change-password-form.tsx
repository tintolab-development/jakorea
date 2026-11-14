import { Form } from 'antd'
import type { FormInstance } from 'antd'

import {
  isValidRegisterPassword,
  REGISTER_PASSWORD_HELP_TEXT,
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

/** 로그인 화면과 같은 기준 — 입력을 바꾸면 [비밀번호 변경하기]로 띄운 필드 에러를 지운다 */
function clearChangePasswordFieldErrors(form: FormInstance<FindPasswordChangeFormValues>): void {
  form.setFields([
    { name: 'newPassword', errors: [] },
    { name: 'newPasswordConfirm', errors: [] },
  ])
}

export function FindPasswordChangeForm({
  form,
  isSubmitting,
  submitError,
  onPasswordChange,
  onSubmit,
}: FindPasswordChangeFormProps) {
  return (
    <div className="find-password-change-step">
      <RegisterStepHeader
        title="새 비밀번호를 입력해 주세요."
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
        // 입력 중 실시간 검증 안내를 띄우지 않고 [비밀번호 변경하기] 클릭 시에만 노출한다
        validateTrigger={[]}
        onFinish={onSubmit}
        onValuesChange={() => {
          clearChangePasswordFieldErrors(form)
          onPasswordChange?.()
        }}
      >
        <Form.Item
          name="newPassword"
          rules={[
            { required: true, message: '새 비밀번호를 입력해 주세요.' },
            {
              validator: (_, value: string | undefined) =>
                !value || isValidRegisterPassword(value)
                  ? Promise.resolve()
                  : Promise.reject(new Error(REGISTER_PASSWORD_HELP_TEXT)),
            },
          ]}
        >
          <CmsInput
            label="새 비밀번호"
            required
            type="password"
            inputSize="xlarge"
            width="100%"
            placeholder="새 비밀번호를 입력해 주세요"
            autoComplete="new-password"
            error={Boolean(submitError)}
            message={submitError ?? undefined}
          />
        </Form.Item>

        <Form.Item
          name="newPasswordConfirm"
          rules={[
            { required: true, message: '비밀번호를 한 번 더 입력해 주세요.' },
            ({ getFieldValue }) => ({
              validator: (_, value: string | undefined) =>
                !value || value === getFieldValue('newPassword')
                  ? Promise.resolve()
                  : Promise.reject(new Error(REGISTER_PASSWORD_MISMATCH_MESSAGE)),
            }),
          ]}
        >
          <CmsInput
            label="새 비밀번호 확인"
            required
            type="password"
            inputSize="xlarge"
            width="100%"
            placeholder="비밀번호를 한 번 더 입력해 주세요"
            autoComplete="new-password"
          />
        </Form.Item>

        <div className="auth-actions find-password-change-step__actions">
          <CmsButton variant="primary" size="h52" type="submit" loading={isSubmitting}>
            비밀번호 변경하기
          </CmsButton>
        </div>
      </Form>
    </div>
  )
}
