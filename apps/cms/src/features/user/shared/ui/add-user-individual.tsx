import { useEffect } from 'react'
import { Form, Space } from 'antd'
import type { Rule } from 'antd/es/form'
import type { CreateUserRequest } from '@/entities/user/api/user-service'
import { individualAffiliationGradeSelectOptions } from '@/features/user/detail/ui/user-basic-info/sections/constants'
import {
  AddressSearch,
  CmsButton,
  CmsInput,
  CmsRadioGroup,
  CmsSelect,
  SchoolSearch,
} from '@/shared/ui'
import { CmsDateTextInput, isValidCalendarDate } from '@/shared/ui/date-text-input'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { FORM_INPUTS_2_WIDTHS } from '@/features/template/constants/form-input-widths'
import { KOREAN_PHONE_REGEX } from '@/shared/utils/phone-validation'
import './add-user-individual.css'

type ConsentValue = 'agree' | 'disagree'
type GenderValue = 'male' | 'female'
type SchoolEnrollmentStatus = 'enrolled' | 'not_enrolled'

interface AddUserIndividualFormValues {
  name: string
  gender: GenderValue
  birthDate: string
  schoolEnrollmentStatus: SchoolEnrollmentStatus
  schoolName: string
  grade: string
  affiliationOrganization: string
  contact: string
  email: string
  address: string
  detailAddress: string
  volunteerId: string
  consentTermsOfService: ConsentValue
  consentPersonalInfo: ConsentValue
  consentMarketing: ConsentValue
  consentPortrait: ConsentValue
  consentWithholdingTax: ConsentValue
  consentFacilitatorPledge: ConsentValue
  consentAdministrativeJoint: ConsentValue
  consentSexOffenseCheck: ConsentValue
}

interface AddUserIndividualProps {
  onSubmit: (request: CreateUserRequest) => Promise<void>
  onCancel: () => void
  loading?: boolean
  formId?: string
  hideActions?: boolean
  onCanSubmitChange?: (canSubmit: boolean) => void
}

const CONSENT_RADIO_OPTIONS = [
  { label: '동의', value: 'agree' },
  { label: '미동의', value: 'disagree' },
]

const GENDER_OPTIONS = [
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
]

const SCHOOL_ENROLLMENT_OPTIONS = [
  { label: '재학 중', value: 'enrolled' },
  { label: '해당 없음', value: 'not_enrolled' },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BIRTH_DATE_PATTERN = /^\d{8}$/
const FORM_ITEM_STYLE = { marginBottom: 0, width: '100%' } as const

const INITIAL_VALUES: AddUserIndividualFormValues = {
  name: '',
  gender: 'male',
  birthDate: '',
  schoolEnrollmentStatus: 'enrolled',
  schoolName: '',
  grade: '',
  affiliationOrganization: '',
  contact: '',
  email: '',
  address: '',
  detailAddress: '',
  volunteerId: '',
  consentTermsOfService: 'agree',
  consentPersonalInfo: 'agree',
  consentMarketing: 'disagree',
  consentPortrait: 'disagree',
  consentWithholdingTax: 'disagree',
  consentFacilitatorPledge: 'disagree',
  consentAdministrativeJoint: 'disagree',
  consentSexOffenseCheck: 'disagree',
}

function sanitizeBirthDateInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8)
}

function isValidBirthDateDigits(value: string): boolean {
  if (!BIRTH_DATE_PATTERN.test(value)) return false
  return isValidCalendarDate(`${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`)
}

function canSubmitMemberRegisterForm(values: AddUserIndividualFormValues | undefined): boolean {
  if (!values) return false

  const name = values.name?.trim()
  const birthDate = values.birthDate?.trim()
  const contact = values.contact?.trim()
  const email = values.email?.trim()
  const address = values.address?.trim()

  if (!name || !birthDate || !isValidBirthDateDigits(birthDate)) return false
  if (!contact || !KOREAN_PHONE_REGEX.test(contact)) return false
  if (!email || !EMAIL_PATTERN.test(email)) return false
  if (!address) return false

  if (values.schoolEnrollmentStatus === 'enrolled') {
    if (!values.schoolName?.trim() || !values.grade?.trim()) return false
  }

  return values.consentTermsOfService === 'agree' && values.consentPersonalInfo === 'agree'
}

function createEnrolledSchoolNameRules(getEnrollmentStatus: () => SchoolEnrollmentStatus): Rule[] {
  return [
    {
      validator: async (_, value: string | undefined) => {
        if (getEnrollmentStatus() !== 'enrolled') return
        if (value?.trim()) return
        throw new Error('소속 학교명을 입력해 주세요.')
      },
    },
  ]
}

function createEnrolledGradeRules(getEnrollmentStatus: () => SchoolEnrollmentStatus): Rule[] {
  return [
    {
      validator: async (_, value: string | undefined) => {
        if (getEnrollmentStatus() !== 'enrolled') return
        if (value?.trim()) return
        throw new Error('학년을 선택해 주세요.')
      },
    },
  ]
}

export function AddUserIndividual({
  onSubmit,
  onCancel,
  loading = false,
  formId,
  hideActions = false,
  onCanSubmitChange,
}: AddUserIndividualProps) {
  const [form] = Form.useForm<AddUserIndividualFormValues>()
  const allValues = Form.useWatch([], form) as AddUserIndividualFormValues | undefined
  const address = Form.useWatch('address', form) ?? ''
  const schoolName = Form.useWatch('schoolName', form) ?? ''
  const schoolEnrollmentStatus =
    Form.useWatch('schoolEnrollmentStatus', form) ?? INITIAL_VALUES.schoolEnrollmentStatus
  const consentPortrait = Form.useWatch('consentPortrait', form)
  const consentWithholdingTax = Form.useWatch('consentWithholdingTax', form)
  const consentFacilitatorPledge = Form.useWatch('consentFacilitatorPledge', form)
  const consentAdministrativeJoint = Form.useWatch('consentAdministrativeJoint', form)
  const consentSexOffenseCheck = Form.useWatch('consentSexOffenseCheck', form)
  const isEnrolled = schoolEnrollmentStatus === 'enrolled'
  const canSubmit = canSubmitMemberRegisterForm(allValues)

  useEffect(() => {
    onCanSubmitChange?.(canSubmit)
  }, [canSubmit, onCanSubmitChange])

  useEffect(() => {
    if (schoolEnrollmentStatus === 'not_enrolled') {
      form.setFieldsValue({ schoolName: '', grade: '' })
      form.setFields([
        { name: 'schoolName', errors: [] },
        { name: 'grade', errors: [] },
      ])
      return
    }
    form.setFieldsValue({ affiliationOrganization: '' })
    form.setFields([{ name: 'affiliationOrganization', errors: [] }])
  }, [form, schoolEnrollmentStatus])

  const handleFinish = async (values: AddUserIndividualFormValues) => {
    const enrolled = values.schoolEnrollmentStatus === 'enrolled'
    const affiliation = enrolled
      ? values.schoolName.trim()
      : values.affiliationOrganization.trim() || undefined

    const request: CreateUserRequest = {
      email: values.email.trim(),
      password: 'Temp1234!',
      name: values.name.trim(),
      phone: values.contact.trim(),
      gender: values.gender === 'male' ? '남성' : '여성',
      birthDate: values.birthDate.trim(),
      role: 'INDIVIDUAL',
      isActive: true,
      id1365: values.volunteerId.trim() || undefined,
      address: values.address.trim(),
      detailAddress: values.detailAddress.trim() || undefined,
      schoolEnrollmentStatus: enrolled ? 'ENROLLED' : 'NOT_ENROLLED',
      affiliation,
      grade: enrolled ? values.grade.trim() : undefined,
    }
    await onSubmit(request)
    form.resetFields()
  }

  const handleConsentDraft = () => {
    window.alert('준비 중입니다')
  }

  return (
    <Form
      id={formId}
      form={form}
      layout="vertical"
      initialValues={INITIAL_VALUES}
      requiredMark={false}
      onFinish={values => void handleFinish(values)}
    >
      <div className="add-user-individual__sections">
        <DetailInfoForm
          title="기본 정보"
          mode="edit"
          className="add-user-individual__section add-user-individual__section--basic"
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
                  rules={[{ required: true, whitespace: true, message: '성명을 입력해 주세요.' }]}
                >
                  <CmsInput placeholder="성명" inputSize="medium" width="100%" />
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
                    <CmsRadioGroup options={GENDER_OPTIONS} size="large" />
                  </Form.Item>
                  <DetailInfoForm.InputsSeparator />
                  <Form.Item
                    name="birthDate"
                    style={{ ...FORM_ITEM_STYLE, flex: '1 1 0', minWidth: 0 }}
                    rules={[
                      { required: true, whitespace: true, message: '생년월일을 입력해 주세요.' },
                      {
                        validator: async (_, value: string | undefined) => {
                          const trimmed = value?.trim()
                          if (!trimmed || isValidBirthDateDigits(trimmed)) return
                          throw new Error('생년월일 8자리 숫자로 입력해 주세요.')
                        },
                      },
                    ]}
                    trigger="onValueChange"
                    validateTrigger="onValueChange"
                    getValueFromEvent={sanitizeBirthDateInput}
                  >
                    <CmsDateTextInput
                      placeholder="생년월일 8자리"
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
              label="현재 학교 재학 여부"
              required
              labelWidth={200}
              view="-"
              edit={
                <Form.Item name="schoolEnrollmentStatus" noStyle>
                  <CmsRadioGroup options={SCHOOL_ENROLLMENT_OPTIONS} size="large" />
                </Form.Item>
              }
            />
            <DetailInfoForm.Field
              label="소속"
              required={isEnrolled}
              labelWidth={200}
              view="-"
              edit={
                isEnrolled ? (
                  <div className="detail-info-form-inputs-wrapper-no-gap">
                    <Form.Item
                      name="schoolName"
                      noStyle
                      dependencies={['schoolEnrollmentStatus']}
                      rules={createEnrolledSchoolNameRules(() => schoolEnrollmentStatus)}
                    >
                      <SchoolSearch
                        value={schoolName}
                        onChange={nextSchoolName =>
                          form.setFieldValue('schoolName', nextSchoolName)
                        }
                        placeholder="소속 학교명"
                        inputSize="medium"
                        width={FORM_INPUTS_2_WIDTHS[0]}
                      />
                    </Form.Item>
                    <DetailInfoForm.InputsSeparator />
                    <Form.Item
                      name="grade"
                      noStyle
                      dependencies={['schoolEnrollmentStatus']}
                      rules={createEnrolledGradeRules(() => schoolEnrollmentStatus)}
                    >
                      <CmsSelect
                        placeholder="학년"
                        inputSize="medium"
                        width={FORM_INPUTS_2_WIDTHS[1]}
                        options={individualAffiliationGradeSelectOptions(allValues?.grade)}
                      />
                    </Form.Item>
                  </div>
                ) : (
                  <Form.Item name="affiliationOrganization" noStyle>
                    <CmsInput placeholder="소속 기관" inputSize="medium" width="100%" />
                  </Form.Item>
                )
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
                  rules={[
                    { required: true, whitespace: true, message: '연락처를 입력해 주세요.' },
                    {
                      validator: async (_, value: string | undefined) => {
                        if (!value?.trim() || KOREAN_PHONE_REGEX.test(value.trim())) return
                        throw new Error('올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)')
                      },
                    },
                  ]}
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
                  rules={[
                    { required: true, whitespace: true, message: '이메일을 입력해 주세요.' },
                    { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
                  ]}
                >
                  <CmsInput placeholder="이메일" inputSize="medium" width="100%" />
                </Form.Item>
              }
            />
          </DetailInfoForm.Row>

          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="자택 주소지"
              required
              fullRow
              labelWidth={200}
              view="-"
              edit={
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name="address"
                    noStyle
                    rules={[{ required: true, whitespace: true, message: '주소를 검색해 주세요.' }]}
                  >
                    <AddressSearch
                      value={address}
                      onChange={nextAddress => form.setFieldValue('address', nextAddress)}
                      placeholder="건물명, 도로명 또는 지번"
                    />
                  </Form.Item>
                  <DetailInfoForm.InputsSeparator />
                  <Form.Item name="detailAddress" noStyle>
                    <CmsInput placeholder="상세 주소" inputSize="medium" width="100%" />
                  </Form.Item>
                </Space.Compact>
              }
            />
          </DetailInfoForm.Row>

          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="1365 ID"
              fullRow
              labelWidth={200}
              view="-"
              edit={
                <Form.Item name="volunteerId" noStyle>
                  <CmsInput placeholder="1365 ID" inputSize="medium" width={200} />
                </Form.Item>
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>

        <DetailInfoForm
          title="약관 및 동의"
          mode="edit"
          className="add-user-individual__section add-user-individual__section--terms"
          description="* 미동의 시 프로그램 신청 및 활동에 제한이 있을 수 있습니다."
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="서비스 이용약관"
              labelWidth={220}
              view="-"
              edit={
                <Form.Item name="consentTermsOfService" noStyle>
                  <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="large" />
                </Form.Item>
              }
            />
            <DetailInfoForm.Field
              label="개인정보 수집·이용 동의"
              labelWidth={220}
              view="-"
              edit={
                <Form.Item name="consentPersonalInfo" noStyle>
                  <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="large" />
                </Form.Item>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="마케팅 제공 동의"
              labelWidth={220}
              fullRow
              view="-"
              edit={
                <Form.Item name="consentMarketing" noStyle>
                  <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="large" />
                </Form.Item>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="초상권 수집·이용 동의"
              labelWidth={220}
              fullRow
              view="-"
              edit={
                <Space
                  align="start"
                  size={12}
                  wrap
                  className="add-user-individual__consent-actions"
                >
                  <Form.Item name="consentPortrait" noStyle>
                    <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="large" />
                  </Form.Item>
                  <DetailInfoForm.InputsSeparator />
                  <CmsButton
                    variant="secondary"
                    size="medium"
                    type="button"
                    disabled={consentPortrait !== 'agree'}
                    onClick={handleConsentDraft}
                  >
                    동의서 작성
                  </CmsButton>
                </Space>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="지급조서 작성 동의"
              labelWidth={220}
              fullRow
              view="-"
              edit={
                <Space
                  align="start"
                  size={12}
                  wrap
                  className="add-user-individual__consent-actions"
                >
                  <Form.Item name="consentWithholdingTax" noStyle>
                    <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="large" />
                  </Form.Item>
                  <DetailInfoForm.InputsSeparator />
                  <CmsButton
                    variant="secondary"
                    size="medium"
                    type="button"
                    disabled={consentWithholdingTax !== 'agree'}
                    onClick={handleConsentDraft}
                  >
                    동의서 작성
                  </CmsButton>
                </Space>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="파실리테이터 하기 서약"
              labelWidth={220}
              fullRow
              view="-"
              edit={
                <Space
                  align="start"
                  size={12}
                  wrap
                  className="add-user-individual__consent-actions"
                >
                  <Form.Item name="consentFacilitatorPledge" noStyle>
                    <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="large" />
                  </Form.Item>
                  <DetailInfoForm.InputsSeparator />
                  <CmsButton
                    variant="secondary"
                    size="medium"
                    type="button"
                    disabled={consentFacilitatorPledge !== 'agree'}
                    onClick={handleConsentDraft}
                  >
                    동의서 작성
                  </CmsButton>
                </Space>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="행정정보 공동이용 사전 동의"
              labelWidth={220}
              fullRow
              view="-"
              edit={
                <Space
                  align="start"
                  size={12}
                  wrap
                  className="add-user-individual__consent-actions"
                >
                  <Form.Item name="consentAdministrativeJoint" noStyle>
                    <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="large" />
                  </Form.Item>
                  <DetailInfoForm.InputsSeparator />
                  <CmsButton
                    variant="secondary"
                    size="medium"
                    type="button"
                    disabled={consentAdministrativeJoint !== 'agree'}
                    onClick={handleConsentDraft}
                  >
                    동의서 작성
                  </CmsButton>
                </Space>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="성범죄 경력조회 동의"
              labelWidth={220}
              fullRow
              view="-"
              edit={
                <Space
                  align="start"
                  size={12}
                  wrap
                  className="add-user-individual__consent-actions"
                >
                  <Form.Item name="consentSexOffenseCheck" noStyle>
                    <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="large" />
                  </Form.Item>
                  <DetailInfoForm.InputsSeparator />
                  <CmsButton
                    variant="secondary"
                    size="medium"
                    type="button"
                    disabled={consentSexOffenseCheck !== 'agree'}
                    onClick={handleConsentDraft}
                  >
                    동의서 작성
                  </CmsButton>
                </Space>
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>

      {!hideActions ? (
        <div className="add-user-individual__actions">
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            onClick={onCancel}
            disabled={loading}
          >
            닫기
          </CmsButton>
          <CmsButton variant="primary" size="medium" type="submit" disabled={loading || !canSubmit}>
            신규 등록
          </CmsButton>
        </div>
      ) : null}
    </Form>
  )
}
