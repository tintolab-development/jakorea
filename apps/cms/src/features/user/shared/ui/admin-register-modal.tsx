import { useEffect } from 'react'
import type { ChangeEvent } from 'react'
import type { Rule } from 'antd/es/form'
import { Form } from 'antd'
import { CmsButton, CmsInput, CmsRadioGroup, ContentModal } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { KOREAN_PHONE_REGEX } from '@/shared/utils/phone-validation'
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
const BIRTH_DATE_PATTERN = /^\d{8}$/

const FORM_ITEM_STYLE = { marginBottom: 0, width: '100%' } as const

const ADMIN_REGISTER_NAME_RULES: Rule[] = [
  { required: true, whitespace: true, message: '한글 성명을 입력해 주세요.' },
]

const ADMIN_REGISTER_BIRTH_DATE_RULES: Rule[] = [
  { required: true, whitespace: true, message: '생년월일을 입력해 주세요.' },
  {
    validator: async (_, value: string | undefined) => {
      const trimmed = value?.trim()
      if (!trimmed || BIRTH_DATE_PATTERN.test(trimmed)) {
        return
      }
      throw new Error('생년월일 8자리 숫자로 입력해 주세요.')
    },
  },
]

const ADMIN_REGISTER_CONTACT_RULES: Rule[] = [
  { required: true, whitespace: true, message: '연락처를 입력해 주세요.' },
  {
    validator: async (_, value: string | undefined) => {
      if (!value?.trim() || KOREAN_PHONE_REGEX.test(value.trim())) {
        return
      }
      throw new Error('올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)')
    },
  },
]

const ADMIN_REGISTER_EMAIL_RULES: Rule[] = [
  { required: true, whitespace: true, message: '이메일을 입력해 주세요.' },
  { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
]

function requireConsentAgreed(message: string): Rule[] {
  return [
    {
      validator: async (_, value: ConsentValue | undefined) => {
        if (value === 'agree') {
          return
        }
        throw new Error(message)
      },
    },
  ]
}

const ADMIN_REGISTER_TERMS_OF_SERVICE_RULES = requireConsentAgreed('서비스 이용약관에 동의해 주세요.')
const ADMIN_REGISTER_CONSENT_PERSONAL_RULES = requireConsentAgreed(
  '개인정보 수집·이용에 동의해 주세요.'
)
const ADMIN_REGISTER_CONSENT_MFA_RULES = requireConsentAgreed(
  '2단계 인증(MFA) 설정에 동의해 주세요.'
)

function normalizeSubmitValues(
  values: AdminRegisterModalFormValues
): AdminRegisterModalFormValues {
  return {
    ...values,
    name: values.name.trim(),
    birthDate: values.birthDate.trim(),
    contact: values.contact.trim(),
    email: values.email.trim(),
  }
}

function canSubmitAdminRegisterForm(values: AdminRegisterModalFormValues | undefined): boolean {
  if (!values) {
    return false
  }

  const name = values.name?.trim()
  const contact = values.contact?.trim()
  const email = values.email?.trim()
  const birthDate = values.birthDate?.trim()

  return Boolean(
    name &&
      birthDate &&
      BIRTH_DATE_PATTERN.test(birthDate) &&
      contact &&
      KOREAN_PHONE_REGEX.test(contact) &&
      email &&
      EMAIL_PATTERN.test(email) &&
      values.consentTermsOfService === 'agree' &&
      values.consentPersonalInfo === 'agree' &&
      values.consentMfaSetup === 'agree'
  )
}

function sanitizeBirthDateInput(event: ChangeEvent<HTMLInputElement>): string {
  return event.target.value.replace(/\D/g, '').slice(0, 8)
}

export function AdminRegisterModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: AdminRegisterModalProps) {
  const [form] = Form.useForm<AdminRegisterModalFormValues>()
  const watchedValues = Form.useWatch([], form) as AdminRegisterModalFormValues | undefined
  const isSubmitDisabled = loading || !canSubmitAdminRegisterForm(watchedValues)

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
            disabled={isSubmitDisabled}
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
        onFinish={values => void handleFinish(values)}
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
                    rules={ADMIN_REGISTER_NAME_RULES}
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
                      rules={ADMIN_REGISTER_BIRTH_DATE_RULES}
                      getValueFromEvent={sanitizeBirthDateInput}
                    >
                      <CmsInput
                        placeholder="생년월일 8자리"
                        maxLength={8}
                        inputSize="medium"
                        width="100%"
                        inputMode="numeric"
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
                    rules={ADMIN_REGISTER_CONTACT_RULES}
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
                    rules={ADMIN_REGISTER_EMAIL_RULES}
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
                    rules={ADMIN_REGISTER_TERMS_OF_SERVICE_RULES}
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
                    rules={ADMIN_REGISTER_CONSENT_PERSONAL_RULES}
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
                  <Form.Item
                    name="consentMfaSetup"
                    style={FORM_ITEM_STYLE}
                    rules={ADMIN_REGISTER_CONSENT_MFA_RULES}
                  >
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
