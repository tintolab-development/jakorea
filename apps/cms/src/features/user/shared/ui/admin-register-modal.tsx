import { useEffect } from 'react'
import { Form } from 'antd'
import {
  CmsButton,
  CmsInput,
  CmsPhoneInput,
  CmsRadioGroup,
  CmsSelect,
  ContentModal,
} from '@/shared/ui'
import {
  CmsDateTextInput,
  birthDateFormValueToApi,
  isBirthDateInputIncomplete,
  isValidBirthDateFormValue,
} from '@/shared/ui/date-text-input'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { isValidKoreanPhoneNumber } from '@/shared/utils/phone-validation'
import { isValidJakoreaEmail } from '@/features/auth/lib/jakorea-email'
import {
  ADMIN_EMAIL_DOMAIN_ALERT_CONTENT,
  ADMIN_EMAIL_DOMAIN_ALERT_TITLE,
} from '@/features/user/shared/ui/admin-email-domain-alert'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import {
  REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
  buildRequiredConsentDisagreeAlertMessage,
  collectDisagreedRequiredConsentLabels,
  hasUnsetConsentSelections,
} from '@jakorea/domain/shared/required-consent-alert'
import {
  ADMIN_PERMISSION_SELECT_OPTIONS,
  isAdminPermissionTagVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import './admin-register-modal.css'

const FORM_ID = 'cms-admin-register-modal-form'

type ConsentValue = 'agree' | 'disagree'
type GenderValue = 'male' | 'female'

export interface AdminRegisterModalFormValues {
  name: string
  /** 수정 폼에서 미등록·마스킹 성별은 undefined(선택 안 됨) — 남성으로 추정하지 않는다. */
  gender: GenderValue | undefined
  birthDate: string
  contact: string
  email: string
  /**
   * 권한 유형 — 신규 등록에서 필수·기본값 없음 (관리자 서비스 이용약관 제4조, QA-0394).
   * 같은 값 타입을 쓰는 관리자 상세 프로필 수정 폼은 권한 유형을 따로 다루므로 선택 속성으로 둔다.
   */
  permissionType?: AdminPermissionTagVariant
  /** 신규 등록은 미선택(undefined)으로 시작 — 필수 동의 항목 */
  consentTermsOfService: ConsentValue | undefined
  consentPersonalInfo: ConsentValue | undefined
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
  // 신규 등록은 미선택으로 시작 — 남성으로 추정하지 않는다.
  gender: undefined,
  birthDate: '',
  contact: '',
  email: '',
  // 권한 유형은 미선택으로 시작 — 기본 권한을 정하지 않는다.
  permissionType: undefined,
  consentTermsOfService: undefined,
  consentPersonalInfo: undefined,
  consentMarketing: 'disagree',
  consentMfaSetup: 'agree',
}

/** 필수 동의 — 미선택이면 필수 항목 미입력 안내 */
const ADMIN_REGISTER_REQUIRED_CONSENT_SELECTION_KEYS = [
  'consentTermsOfService',
  'consentPersonalInfo',
] as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FORM_ITEM_STYLE = { marginBottom: 0, width: '100%' } as const

const ADMIN_REGISTER_REQUIRED_CONSENT_FIELDS = [
  { key: 'consentTermsOfService', label: '서비스 이용약관' },
  { key: 'consentPersonalInfo', label: '개인정보 수집·이용 동의' },
  { key: 'consentMfaSetup', label: '2단계 인증 설정 동의' },
] as const satisfies ReadonlyArray<{
  key: keyof AdminRegisterModalFormValues
  label: string
}>

function normalizeSubmitValues(values: AdminRegisterModalFormValues): AdminRegisterModalFormValues {
  return {
    ...values,
    name: values.name.trim(),
    birthDate: birthDateFormValueToApi(values.birthDate),
    contact: values.contact.trim(),
    email: values.email.trim(),
    consentMarketing: 'disagree',
  }
}

export function collectAdminRegisterValidation(values: AdminRegisterModalFormValues): {
  missingRequired: boolean
  /** 이메일 형식은 맞지만 `@jakorea.org` 도메인이 아님 — 이메일 재확인 안내 */
  emailDomainInvalid: boolean
  formatMessages: string[]
} {
  let missingRequired = false
  let emailDomainInvalid = false
  const formatMessages: string[] = []

  if (!values.name?.trim()) {
    missingRequired = true
  }

  if (values.gender !== 'male' && values.gender !== 'female') {
    missingRequired = true
  }

  const birthDate = values.birthDate?.trim()
  if (!birthDate || isBirthDateInputIncomplete(birthDate)) {
    missingRequired = true
  } else if (!isValidBirthDateFormValue(birthDate)) {
    formatMessages.push('올바른 생년월일을 입력해 주세요.')
  }

  const contact = values.contact?.trim()
  if (!contact) {
    missingRequired = true
  } else if (!isValidKoreanPhoneNumber(contact)) {
    formatMessages.push('올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)')
  }

  const email = values.email?.trim()
  if (!email) {
    missingRequired = true
  } else if (!EMAIL_PATTERN.test(email)) {
    formatMessages.push('올바른 이메일 형식이 아닙니다')
  } else if (!isValidJakoreaEmail(email)) {
    emailDomainInvalid = true
  }

  if (!isAdminPermissionTagVariant(values.permissionType)) {
    missingRequired = true
  }

  return { missingRequired, emailDomainInvalid, formatMessages }
}

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
    if (hasUnsetConsentSelections(values, ADMIN_REGISTER_REQUIRED_CONSENT_SELECTION_KEYS)) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }

    const disagreedRequiredLabels = collectDisagreedRequiredConsentLabels(values, [
      ...ADMIN_REGISTER_REQUIRED_CONSENT_FIELDS,
    ])
    if (disagreedRequiredLabels.length > 0) {
      showAlert({
        title: REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
        content: buildRequiredConsentDisagreeAlertMessage(disagreedRequiredLabels),
      })
      return
    }

    const { missingRequired, emailDomainInvalid, formatMessages } =
      collectAdminRegisterValidation(values)
    if (missingRequired) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }
    if (emailDomainInvalid) {
      showAlert({
        title: ADMIN_EMAIL_DOMAIN_ALERT_TITLE,
        content: ADMIN_EMAIL_DOMAIN_ALERT_CONTENT,
      })
      return
    }
    if (formatMessages.length > 0) {
      showAlert({
        title: '안내',
        content: formatMessages[0],
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
      width={1200}
      className="admin-register-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="medium" type="button" onClick={handleClose}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="submit"
            form={FORM_ID}
            loading={loading}
            disabled={loading} >
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
                  <Form.Item name="name" style={FORM_ITEM_STYLE}>
                    <CmsInput placeholder="한글 성명" inputSize="small" width="100%" />
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
                        placeholder="생년월일 8자리"
                        maxLength={10}
                        inputSize="small"
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
                  <Form.Item name="contact" style={FORM_ITEM_STYLE}>
                    <CmsPhoneInput placeholder="연락처" inputSize="small" width="100%" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="이메일"
                required
                labelWidth={200}
                view="-"
                edit={
                  <Form.Item name="email" style={FORM_ITEM_STYLE}>
                    <CmsInput placeholder="이메일" inputSize="small" width="100%" />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="권한 유형"
                required
                labelWidth={200}
                view="-"
                edit={
                  <Form.Item name="permissionType" style={FORM_ITEM_STYLE}>
                    {/* 선택지·라벨은 권한 승인 화면과 같은 목록. 선택 값 길이와 무관하게 200px 고정 */}
                    <CmsSelect
                      inputSize="small"
                      width={200}
                      placeholder="승인 권한을 선택해 주세요"
                      withAllOption={false}
                      options={ADMIN_PERMISSION_SELECT_OPTIONS}
                    />
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
                required
                labelWidth={220}
                view="-"
                edit={
                  <Form.Item name="consentTermsOfService" noStyle>
                    <CmsRadioGroup options={CONSENT_OPTIONS} size="medium" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="개인정보 수집·이용 동의"
                required
                labelWidth={220}
                view="-"
                edit={
                  <Form.Item name="consentPersonalInfo" noStyle>
                    <CmsRadioGroup options={CONSENT_OPTIONS} size="medium" />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="마케팅 정보 수신 동의"
                labelWidth={220}
                view="-"
                edit={
                  <Form.Item name="consentMarketing" noStyle>
                    <CmsRadioGroup options={CONSENT_OPTIONS} size="medium" disabled />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="2단계 인증 설정 동의"
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
