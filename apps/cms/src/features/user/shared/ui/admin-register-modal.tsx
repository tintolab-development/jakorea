import { useEffect } from 'react'
import { Form } from 'antd'
import { CmsButton, CmsInput, CmsRadioGroup, ContentModal } from '@/shared/ui'
import {
  CmsDateTextInput,
  birthDateFormValueToApi,
  isBirthDateInputIncomplete,
  isValidBirthDateFormValue,
} from '@/shared/ui/date-text-input'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { KOREAN_PHONE_REGEX } from '@/shared/utils/phone-validation'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import './admin-register-modal.css'

const FORM_ID = 'cms-admin-register-modal-form'

type ConsentValue = 'agree' | 'disagree'
type GenderValue = 'male' | 'female'

export interface AdminRegisterModalFormValues {
  name: string
  gender: GenderValue
  birthDate: string
  contact: string
  email: string
  consentTermsOfService: ConsentValue
  consentPersonalInfo: ConsentValue
  consentMarketing: ConsentValue
  consentMfaSetup: ConsentValue
}

export interface AdminRegisterModalProps {
  open: boolean
  onClose: () => void
  onSubmit?: (values: AdminRegisterModalFormValues) => Promise<void>
  loading?: boolean
}

const CONSENT_OPTIONS = [
  { label: '동의', value: 'agree' },
  { label: '미동의', value: 'disagree' },
]

const GENDER_OPTIONS = [
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
]

const INITIAL_VALUES: AdminRegisterModalFormValues = {
  name: '',
  gender: 'male',
  birthDate: '',
  contact: '',
  email: '',
  consentTermsOfService: 'agree',
  consentPersonalInfo: 'agree',
  consentMarketing: 'disagree',
  consentMfaSetup: 'agree',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FORM_ITEM_STYLE = { marginBottom: 0, width: '100%' } as const

function normalizeSubmitValues(
  values: AdminRegisterModalFormValues
): AdminRegisterModalFormValues {
  return {
    ...values,
    name: values.name.trim(),
    birthDate: birthDateFormValueToApi(values.birthDate),
    contact: values.contact.trim(),
    email: values.email.trim(),
  }
}

function collectAdminRegisterValidationMessages(
  values: AdminRegisterModalFormValues
): string[] {
  const messages: string[] = []

  if (!values.name?.trim()) {
    messages.push('성명을 입력해 주세요.')
  }

  const birthDate = values.birthDate?.trim()
  if (!birthDate || isBirthDateInputIncomplete(birthDate)) {
    messages.push('생년월일을 입력해 주세요.')
  } else if (!isValidBirthDateFormValue(birthDate)) {
    messages.push('올바른 생년월일을 입력해 주세요.')
  }

  const contact = values.contact?.trim()
  if (!contact) {
    messages.push('연락처를 입력해 주세요.')
  } else if (!KOREAN_PHONE_REGEX.test(contact)) {
    messages.push('올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)')
  }

  const email = values.email?.trim()
  if (!email) {
    messages.push('이메일을 입력해 주세요.')
  } else if (!EMAIL_PATTERN.test(email)) {
    messages.push('올바른 이메일 형식이 아닙니다')
  }

  if (values.consentTermsOfService !== 'agree') {
    messages.push('서비스 이용약관에 동의해 주세요.')
  }
  if (values.consentPersonalInfo !== 'agree') {
    messages.push('개인정보 수집·이용에 동의해 주세요.')
  }

  return messages
}

const ADMIN_REGISTER_MULTIPLE_VALIDATION_THRESHOLD = 2
const ADMIN_REGISTER_MULTIPLE_VALIDATION_MESSAGE = '필수 항목을 모두 입력해 주세요.'

export function AdminRegisterModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: AdminRegisterModalProps) {
  const { showAlert } = useCmsAlert()
  const [form] = Form.useForm<AdminRegisterModalFormValues>()

  useEffect(() => {
    if (open) {
      form.setFieldsValue(INITIAL_VALUES)
    }
  }, [open, form])

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  const handleFinish = async (values: AdminRegisterModalFormValues) => {
    try {
      if (onSubmit) {
        await onSubmit(normalizeSubmitValues(values))
      }
      form.resetFields()
      onClose()
    } catch {
      /* onSubmit 실패 시 모달 유지 — 부모에서 메시지 처리 */
    }
  }

  const handleSubmitAttempt = (values: AdminRegisterModalFormValues) => {
    const messages = collectAdminRegisterValidationMessages(values)
    if (messages.length > 0) {
      showAlert({
        title: '안내',
        content:
          messages.length >= ADMIN_REGISTER_MULTIPLE_VALIDATION_THRESHOLD
            ? ADMIN_REGISTER_MULTIPLE_VALIDATION_MESSAGE
            : messages[0],
      })
      return
    }
    void handleFinish(values)
  }

  return (
    <ContentModal
      open={open}
      onCancel={handleClose}
      title="관리자 신규 등록"
      width={1000}
      footer={
        <>
          <CmsButton variant="secondary" size="medium" type="button" onClick={handleClose}>
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="submit"
            form={FORM_ID}
            loading={loading}
            disabled={loading}
          >
            신규 등록
          </CmsButton>
        </>
      }
    >
      <Form<AdminRegisterModalFormValues>
        id={FORM_ID}
        form={form}
        layout="vertical"
        initialValues={INITIAL_VALUES}
        requiredMark={false}
        onFinish={handleSubmitAttempt}
      >
        <div className="admin-register-modal__sections">
          <DetailInfoForm
            title="기본 정보"
            mode="edit"
            className="admin-register-modal__section admin-register-modal__section--basic"
          >
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="성명"
                required
                labelWidth={200}
                view="-"
                edit={
                  <Form.Item
                    name="name"
                    style={FORM_ITEM_STYLE}
                  >
                    <CmsInput placeholder="한글 성명" inputSize="medium" width="100%" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="성별 및 생년월일"
                required
                labelWidth={200}
                view="-"
                edit={
                  <span className="detail-info-form-inputs-wrapper-no-gap">
                    <Form.Item name="gender" noStyle>
                      <CmsRadioGroup options={GENDER_OPTIONS} size="medium" />
                    </Form.Item>
                    <DetailInfoForm.InputsSeparator />
                    <Form.Item
                      name="birthDate"
                      style={{ ...FORM_ITEM_STYLE, flex: '1 1 0', minWidth: 0 }}
                      trigger="onValueChange"
                      getValueFromEvent={(value: string) => value}
                    >
                      <CmsDateTextInput
                        placeholder="YYYY.MM.DD"
                        maxLength={10}
                        inputSize="medium"
                        width="100%"
                      />
                    </Form.Item>
                  </span>
                }
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="연락처"
                required
                labelWidth={200}
                view="-"
                edit={
                  <Form.Item
                    name="contact"
                    style={FORM_ITEM_STYLE}
                  >
                    <CmsInput placeholder="연락처" inputSize="medium" width="100%" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="이메일"
                required
                labelWidth={200}
                view="-"
                edit={
                  <Form.Item
                    name="email"
                    style={FORM_ITEM_STYLE}
                  >
                    <CmsInput placeholder="이메일" inputSize="medium" width="100%" />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <DetailInfoForm
            title="약관 및 동의"
            mode="edit"
            className="admin-register-modal__section admin-register-modal__section--terms"
            description="* 미동의 시 서비스 가입 및 관리자 활동에 제한이 있을 수 있습니다."
          >
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="서비스 이용약관"
                labelWidth={220}
                view="-"
                edit={
                  <Form.Item
                    name="consentTermsOfService"
                    style={FORM_ITEM_STYLE}
                  >
                    <CmsRadioGroup options={CONSENT_OPTIONS} size="medium" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="개인정보 수집·이용 동의"
                labelWidth={220}
                view="-"
                edit={
                  <Form.Item
                    name="consentPersonalInfo"
                    style={FORM_ITEM_STYLE}
                  >
                    <CmsRadioGroup options={CONSENT_OPTIONS} size="medium" />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="마케팅 제공 동의"
                labelWidth={220}
                view="-"
                edit={
                  <Form.Item name="consentMarketing" noStyle>
                    <CmsRadioGroup options={CONSENT_OPTIONS} size="medium" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="2단계 인증(MFA) 설정 동의"
                labelWidth={220}
                view="-"
                edit={
                  <Form.Item name="consentMfaSetup" noStyle>
                    <CmsRadioGroup options={CONSENT_OPTIONS} size="medium" />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </div>
      </Form>
    </ContentModal>
  )
}
