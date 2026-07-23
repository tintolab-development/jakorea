/**
 * 강사 회원 관리 — 강사 추가 등록 모달
 * - `ContentModal` + `DetailInfoForm` + CMS 입력 컴포넌트 (회원 신규 등록·학교 등록 모달과 동일 계열)
 * - 제출 버튼은 항상 활성(loading 제외). 필수값 미충족 시 alert
 */

import { useEffect } from 'react'
import { Form, Space } from 'antd'
import type { Dayjs } from 'dayjs'
import {
  AddressSearch,
  CmsButton,
  CmsCheckbox,
  CmsCircleAddButton,
  CmsDatePicker,
  CmsInput,
  CmsNumericInput,
  CmsRadioGroup,
  CmsSelect,
  ContentModal,
  SchoolSearch,
} from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { FreeWriteItemsSection } from '@/shared/components/free-write-items-section'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { FORM_INPUTS_2_WIDTHS } from '@/features/template/constants/form-input-widths'
import {
  CmsDateTextInput,
  isBirthDateInputIncomplete,
  isValidBirthDateFormValue,
} from '@/shared/ui/date-text-input'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { KOREAN_PHONE_REGEX } from '@/shared/utils/phone-validation'
import {
  SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL,
  SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS,
} from '@/features/user/detail/lib/school-teacher-employment-status'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import {
  EMPTY_EDUCATION_GRADUATE_ROW,
  EMPTY_EDUCATION_SCHOOL_ROW,
  InstructorRegisterEducationSection,
  type EducationDetailKey,
  type EducationGraduateRow,
  type EducationSchoolRow,
} from '@/features/user/shared/ui/instructor-register-education-section'
import './instructor-register-modal.css'

const FORM_ID = 'cms-instructor-register-modal-form'
const FORM_ITEM_STYLE = { marginBottom: 0, width: '100%' } as const

const GENDER_OPTIONS = [
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
] as const

const MEMBER_TYPE_OPTIONS = [
  { label: '일반 회원', value: 'general' },
  { label: '교사 회원', value: 'school_teacher' },
] as const

const EMPLOYMENT_STATUS_OPTIONS = SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS.map(value => ({
  label: SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL[value],
  value,
}))

const INSTRUCTOR_FREE_WRITE_ITEMS = [
  {
    name: 'freeWrite1' as const,
    label: '1. 자기소개 및 지원동기',
  },
  {
    name: 'freeWrite2' as const,
    label: '2. 청소년 경제 교육의 중요성에 대해 본인의 생각을 구체적으로 작성해주세요.',
  },
  {
    name: 'freeWrite3' as const,
    label:
      '3. 청소년과 소통할 때 가장 중요하다고 생각하는 점은 무엇이며, 이를 실천하기 위해 어떤 노력을 하는지 작성해주세요.',
  },
  {
    name: 'freeWrite4' as const,
    label:
      '4. 교육 중 예기치 않은 상황(예: 수업 분위기 저하, 참여도 부족 등)이 발생했을 때 대처한 사례가 있다면 공유해주세요.',
  },
] as const

type ConsentValue = 'agree' | 'disagree'

const CONSENT_RADIO_OPTIONS = [
  { label: '동의', value: 'agree' },
  { label: '미동의', value: 'disagree' },
]

const TERMS_CONSENT_DESCRIPTION =
  '*미동의 시 서비스 가입 및 프로그램 참여에 제한이 있을 수 있습니다.'

const TERMS_CONSENT_LABEL_WIDTH = 240 as const

function ConsentDocumentFieldEdit({
  value,
  onWrite,
}: {
  value: ConsentValue
  onWrite: () => void
}) {
  return (
    <span className="instructor-register-modal__consent-document">
      <span className="instructor-register-modal__consent-status">
        {value === 'agree' ? '동의' : '미동의'}
      </span>
      <span className="instructor-register-modal__consent-sep" aria-hidden>
        |
      </span>
      <CmsButton variant="secondary" size="medium" type="button" onClick={onWrite}>
        동의서 작성
      </CmsButton>
    </span>
  )
}

const BUSINESS_INCOME_OPTIONS = [
  { label: '해당', value: 'yes' },
  { label: '해당 없음', value: 'no' },
]

const CAREER_LEVEL_OPTIONS = [
  { label: '신입', value: 'new' },
  { label: '경력', value: 'experienced' },
]

type CareerRow = {
  companyName: string
  roleName: string
  /** 월 단위 `Dayjs` (`CmsDatePicker` `picker="month"`) */
  periodStart: Dayjs | null
  periodEnd: Dayjs | null
  currentlyEmployed: boolean
}

type JaKoreaActivityRow = {
  periodStart: Dayjs | null
  periodEnd: Dayjs | null
  title: string
  note: string
}

type LicenseOrAwardRow = {
  acquiredYear: Dayjs | null
  title: string
  issuer: string
}

export type InstructorRegisterModalFormValues = {
  name: string
  gender: 'male' | 'female'
  birthDate: string
  contact: string
  email: string
  memberType: 'general' | 'school_teacher'
  affiliationName: string
  affiliationNone: boolean
  schoolName: string
  employmentStatus: SchoolTeacherEmploymentStatus | ''
  instructorCareer: string
  isBusinessIncome: 'yes' | 'no'
  bankName: string
  accountNumber: string
  accountHolder: string
  homeAddress: string
  homeAddressDetail: string
  oneLineIntro: string
  consentTermsOfService: ConsentValue
  consentPersonal: ConsentValue
  consentMarketing: ConsentValue
  consentPortrait: ConsentValue
  consentPaymentStatement: ConsentValue
  consentEducatorPledge: ConsentValue
  consentSexOffenseCheck: ConsentValue
  /** 행정정보 공동이용 사전 동의 */
  consentAdministrativeJoint: ConsentValue
  eduSchoolType: string
  eduStatus: string
  educationDetailKeys: EducationDetailKey[]
  highSchool: EducationSchoolRow
  college23Rows: EducationSchoolRow[]
  college4Rows: EducationSchoolRow[]
  graduateRows: EducationGraduateRow[]
  careerLevel: 'new' | 'experienced'
  careers: CareerRow[]
  jaKoreaRows: JaKoreaActivityRow[]
  licenseRows: LicenseOrAwardRow[]
  awardRows: LicenseOrAwardRow[]
  freeWrite1: string
  freeWrite2: string
  freeWrite3: string
  freeWrite4: string
}

const EMPTY_CAREER: CareerRow = {
  companyName: '',
  roleName: '',
  periodStart: null,
  periodEnd: null,
  currentlyEmployed: false,
}

const EMPTY_JA_KOREA_ROW: JaKoreaActivityRow = {
  periodStart: null,
  periodEnd: null,
  title: '',
  note: '',
}

const EMPTY_LICENSE_OR_AWARD_ROW: LicenseOrAwardRow = {
  acquiredYear: null,
  title: '',
  issuer: '',
}

const INITIAL_VALUES: InstructorRegisterModalFormValues = {
  name: '',
  gender: 'male',
  birthDate: '',
  contact: '',
  email: '',
  memberType: 'general',
  affiliationName: '',
  affiliationNone: false,
  schoolName: '',
  employmentStatus: '',
  instructorCareer: '',
  isBusinessIncome: 'no',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  homeAddress: '',
  homeAddressDetail: '',
  oneLineIntro: '',
  consentTermsOfService: 'agree',
  consentPersonal: 'agree',
  consentMarketing: 'disagree',
  consentPortrait: 'disagree',
  consentPaymentStatement: 'disagree',
  consentEducatorPledge: 'disagree',
  consentSexOffenseCheck: 'disagree',
  consentAdministrativeJoint: 'disagree',
  eduSchoolType: '',
  eduStatus: '',
  educationDetailKeys: ['high', 'college23', 'college4', 'graduate'],
  highSchool: { ...EMPTY_EDUCATION_SCHOOL_ROW },
  college23Rows: [{ ...EMPTY_EDUCATION_SCHOOL_ROW }],
  college4Rows: [{ ...EMPTY_EDUCATION_SCHOOL_ROW }],
  graduateRows: [{ ...EMPTY_EDUCATION_GRADUATE_ROW }],
  careerLevel: 'experienced',
  careers: [{ ...EMPTY_CAREER }],
  jaKoreaRows: [{ ...EMPTY_JA_KOREA_ROW }],
  licenseRows: [{ ...EMPTY_LICENSE_OR_AWARD_ROW }],
  awardRows: [{ ...EMPTY_LICENSE_OR_AWARD_ROW }],
  freeWrite1: '',
  freeWrite2: '',
  freeWrite3: '',
  freeWrite4: '',
}

export interface InstructorRegisterModalProps {
  open: boolean
  onClose: () => void
  onSubmit?: (values: InstructorRegisterModalFormValues) => Promise<void>
  loading?: boolean
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const INSTRUCTOR_REGISTER_MULTIPLE_VALIDATION_THRESHOLD = 2
const INSTRUCTOR_REGISTER_MULTIPLE_VALIDATION_MESSAGE = '필수 항목을 모두 입력해 주세요.'

function collectInstructorRegisterValidationMessages(
  values: InstructorRegisterModalFormValues
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

  if (values.memberType === 'school_teacher' && !values.schoolName?.trim()) {
    messages.push('소속 학교명을 입력해 주세요.')
  }

  if (values.consentTermsOfService !== 'agree') {
    messages.push('서비스 이용약관에 동의해 주세요.')
  }
  if (values.consentPersonal !== 'agree') {
    messages.push('개인정보 수집·이용에 동의해 주세요.')
  }

  return messages
}

export function InstructorRegisterModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: InstructorRegisterModalProps) {
  const { showAlert } = useCmsAlert()
  const [form] = Form.useForm<InstructorRegisterModalFormValues>()
  const homeAddress = Form.useWatch('homeAddress', form) ?? ''
  const memberType = Form.useWatch('memberType', form) ?? 'general'
  const schoolName = Form.useWatch('schoolName', form) ?? ''
  const affiliationNone = Form.useWatch('affiliationNone', form) === true
  const isTeacherMember = memberType === 'school_teacher'
  const allValues = Form.useWatch([], form) as InstructorRegisterModalFormValues | undefined
  const careerLevel = Form.useWatch('careerLevel', form) ?? 'new'

  const handleConsentDraft = () => {
    window.alert('준비 중입니다')
  }

  useEffect(() => {
    if (open) {
      form.setFieldsValue(INITIAL_VALUES)
    }
  }, [open, form])

  /** 신입: 경력 행 숨김·데이터 비움 / 경력: 최소 1행 노출 */
  useEffect(() => {
    if (!open) return
    if (careerLevel === 'new') {
      form.setFieldValue('careers', [])
    } else if (careerLevel === 'experienced') {
      const current = form.getFieldValue('careers') as CareerRow[] | undefined
      if (!current?.length) {
        form.setFieldValue('careers', [{ ...EMPTY_CAREER }])
      }
    }
  }, [open, careerLevel, form])

  const handleFinish = async (values: InstructorRegisterModalFormValues) => {
    try {
      if (onSubmit) {
        await onSubmit(values)
      }
      form.resetFields()
      onClose()
    } catch {
      /* 부모에서 에러 처리 시 모달 유지 */
    }
  }

  const handleSubmitAttempt = (values: InstructorRegisterModalFormValues) => {
    const messages = collectInstructorRegisterValidationMessages(values)
    if (messages.length > 0) {
      showAlert({
        title: '안내',
        content:
          messages.length >= INSTRUCTOR_REGISTER_MULTIPLE_VALIDATION_THRESHOLD
            ? INSTRUCTOR_REGISTER_MULTIPLE_VALIDATION_MESSAGE
            : messages[0],
      })
      return
    }
    void handleFinish(values)
  }

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="강사 신규 등록"
      width={1400}
      className="instructor-register-modal"
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
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
      <Form<InstructorRegisterModalFormValues>
        id={FORM_ID}
        form={form}
        layout="vertical"
        initialValues={INITIAL_VALUES}
        requiredMark={false}
        onFinish={handleSubmitAttempt}
      >
        <div className="instructor-register-modal__stack">
          <DetailInfoForm
            title="기본 정보"
            mode="edit"
            className="instructor-register-modal__basic-info"
          >
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="성명"
                view="-"
                edit={
                  <Form.Item name="name" style={FORM_ITEM_STYLE}>
                    <CmsInput placeholder="성명" inputSize="medium" width="100%" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="성별 및 생년월일"
                view="-"
                edit={
                  <span className="detail-info-form-inputs-wrapper-no-gap">
                    <Form.Item name="gender" noStyle>
                      <CmsRadioGroup options={[...GENDER_OPTIONS]} size="large" />
                    </Form.Item>
                    <DetailInfoForm.InputsSeparator />
                    <Form.Item
                      name="birthDate"
                      style={{ ...FORM_ITEM_STYLE, flex: '1 1 0', minWidth: 0 }}
                      trigger="onValueChange"
                      getValueFromEvent={(value: string) => value.replace(/\D/g, '').slice(0, 8)}
                    >
                      <CmsDateTextInput
                        placeholder="생년월일 8자리"
                        maxLength={8}
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
                view="-"
                edit={
                  <Form.Item name="contact" style={FORM_ITEM_STYLE}>
                    <CmsInput placeholder="연락처" inputSize="medium" width="100%" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="이메일"
                view="-"
                edit={
                  <Form.Item name="email" style={FORM_ITEM_STYLE}>
                    <CmsInput placeholder="이메일" inputSize="medium" width="100%" />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="회원 유형"
                view="-"
                edit={
                  <Form.Item name="memberType" noStyle>
                    <CmsRadioGroup options={[...MEMBER_TYPE_OPTIONS]} size="large" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="소속"
                view="-"
                edit={
                  isTeacherMember ? (
                    <div className="detail-info-form-inputs-wrapper-no-gap">
                      <Form.Item name="schoolName" noStyle>
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
                      <Form.Item name="employmentStatus" noStyle>
                        <CmsSelect
                          placeholder="재직현황"
                          inputSize="medium"
                          width={FORM_INPUTS_2_WIDTHS[1]}
                          options={EMPLOYMENT_STATUS_OPTIONS}
                          allowClear
                        />
                      </Form.Item>
                    </div>
                  ) : (
                    <div className="instructor-register-modal__affiliation-row">
                      <Form.Item
                        name="affiliationName"
                        style={{ ...FORM_ITEM_STYLE, flex: 1, minWidth: 0 }}
                      >
                        <CmsInput
                          placeholder="소속 기관명"
                          inputSize="medium"
                          width="100%"
                          disabled={affiliationNone}
                        />
                      </Form.Item>
                      <Form.Item name="affiliationNone" valuePropName="checked" noStyle>
                        <CmsCheckbox checkboxSize="medium">소속 없음</CmsCheckbox>
                      </Form.Item>
                    </div>
                  )
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="자택 주소지"
                fullRow
                view="-"
                edit={
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item name="homeAddress" noStyle>
                      <AddressSearch
                        value={homeAddress}
                        onChange={next => form.setFieldValue('homeAddress', next)}
                        placeholder="건물명, 도로명 또는 지번"
                        inputSize="medium"
                        width="100%"
                      />
                    </Form.Item>
                    <DetailInfoForm.InputsSeparator />
                    <Form.Item name="homeAddressDetail" noStyle>
                      <CmsInput placeholder="상세 주소" inputSize="medium" width="100%" />
                    </Form.Item>
                  </Space.Compact>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="강사 경력"
                fullRow
                view="-"
                edit={
                  <Form.Item name="instructorCareer" style={FORM_ITEM_STYLE}>
                    <CmsInput placeholder="강사 경력" inputSize="medium" width="100%" />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="정산 계좌 정보"
                fullRow
                view="-"
                edit={
                  <div className="instructor-register-modal__settlement-account">
                    <div className="instructor-register-modal__bank-account-pair">
                      <Form.Item name="bankName" noStyle>
                        <CmsInput placeholder="은행명" inputSize="medium" width={120} />
                      </Form.Item>
                      <Form.Item name="accountNumber" trigger="onValueChange" noStyle>
                        <CmsNumericInput
                          mode="numericText"
                          placeholder="계좌번호"
                          inputSize="medium"
                          width={240}
                        />
                      </Form.Item>
                    </div>
                    <DetailInfoForm.InputsSeparator />
                    <Form.Item name="accountHolder" noStyle>
                      <CmsInput placeholder="예금주명" inputSize="medium" width={240} />
                    </Form.Item>
                  </div>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="사업소득자 여부"
                fullRow
                view="-"
                edit={
                  <Form.Item name="isBusinessIncome" noStyle>
                    <CmsRadioGroup options={BUSINESS_INCOME_OPTIONS} size="large" />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="한 줄 소개"
                fullRow
                view="-"
                edit={
                  <div className="instructor-register-modal__full-width-input">
                    <Form.Item name="oneLineIntro" noStyle>
                      <CmsInput
                        placeholder="한 줄 소개를 간략하게 작성해 주세요"
                        inputSize="medium"
                        width="100%"
                      />
                    </Form.Item>
                  </div>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <DetailInfoForm
            title="약관 및 동의"
            mode="edit"
            description={TERMS_CONSENT_DESCRIPTION}
            className="instructor-register-modal__consent-heading"
          >
            <div className="instructor-register-modal__consent-form-stack">
              <DetailInfoForm
                title="약관 및 동의"
                hideHeader
                mode="edit"
                className="instructor-register-modal__consent-block"
              >
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="서비스 이용약관"
                    labelWidth={TERMS_CONSENT_LABEL_WIDTH}
                    view="-"
                    edit={
                      <Form.Item name="consentTermsOfService" noStyle>
                        <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="large" />
                      </Form.Item>
                    }
                  />
                  <DetailInfoForm.Field
                    label="개인정보 수집·이용 동의"
                    labelWidth={TERMS_CONSENT_LABEL_WIDTH}
                    view="-"
                    edit={
                      <Form.Item name="consentPersonal" noStyle>
                        <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="large" />
                      </Form.Item>
                    }
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="마케팅 제공 동의"
                    labelWidth={TERMS_CONSENT_LABEL_WIDTH}
                    view="-"
                    edit={
                      <Form.Item name="consentMarketing" noStyle>
                        <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="large" />
                      </Form.Item>
                    }
                  />
                  <DetailInfoForm.Field
                    label="초상권 수집·이용 동의"
                    labelWidth={TERMS_CONSENT_LABEL_WIDTH}
                    view="-"
                    edit={
                      <>
                        <Form.Item name="consentPortrait" hidden preserve />
                        <ConsentDocumentFieldEdit
                          value={allValues?.consentPortrait ?? INITIAL_VALUES.consentPortrait}
                          onWrite={handleConsentDraft}
                        />
                      </>
                    }
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>

              <DetailInfoForm
                title="약관 및 동의"
                hideHeader
                mode="edit"
                className="instructor-register-modal__consent-block"
              >
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="지급조서 사전 동의서"
                    labelWidth={TERMS_CONSENT_LABEL_WIDTH}
                    view="-"
                    edit={
                      <>
                        <Form.Item name="consentPaymentStatement" hidden preserve />
                        <ConsentDocumentFieldEdit
                          value={
                            allValues?.consentPaymentStatement ??
                            INITIAL_VALUES.consentPaymentStatement
                          }
                          onWrite={handleConsentDraft}
                        />
                      </>
                    }
                  />
                  <DetailInfoForm.Field
                    label="교육진행자 서약서"
                    labelWidth={TERMS_CONSENT_LABEL_WIDTH}
                    view="-"
                    edit={
                      <>
                        <Form.Item name="consentEducatorPledge" hidden preserve />
                        <ConsentDocumentFieldEdit
                          value={
                            allValues?.consentEducatorPledge ?? INITIAL_VALUES.consentEducatorPledge
                          }
                          onWrite={handleConsentDraft}
                        />
                      </>
                    }
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="행정정보 공동이용 사전동의서"
                    labelWidth={TERMS_CONSENT_LABEL_WIDTH}
                    view="-"
                    edit={
                      <>
                        <Form.Item name="consentAdministrativeJoint" hidden preserve />
                        <ConsentDocumentFieldEdit
                          value={
                            allValues?.consentAdministrativeJoint ??
                            INITIAL_VALUES.consentAdministrativeJoint
                          }
                          onWrite={handleConsentDraft}
                        />
                      </>
                    }
                  />
                  <DetailInfoForm.Field
                    label="성범죄 경력 조회 동의서"
                    labelWidth={TERMS_CONSENT_LABEL_WIDTH}
                    view="-"
                    edit={
                      <>
                        <Form.Item name="consentSexOffenseCheck" hidden preserve />
                        <ConsentDocumentFieldEdit
                          value={
                            allValues?.consentSexOffenseCheck ??
                            INITIAL_VALUES.consentSexOffenseCheck
                          }
                          onWrite={handleConsentDraft}
                        />
                      </>
                    }
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            </div>
          </DetailInfoForm>

          <InstructorRegisterEducationSection />

          <DetailInfoForm title="경력사항" mode="edit" className="instructor-register-career">
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="경력 구분"
                labelWidth={200}
                fullRow
                view="-"
                edit={
                  <Form.Item name="careerLevel" noStyle>
                    <CmsRadioGroup options={CAREER_LEVEL_OPTIONS} size="large" />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>
            {careerLevel === 'experienced' ? (
              <DetailInfoForm.Row type="single" className="instructor-register-modal__multi-row">
                <DetailInfoForm.Field
                  label="경력 사항"
                  labelWidth={200}
                  fullRow
                  view="-"
                  edit={
                    <div className="instructor-register-modal__field-stack">
                      <Form.List name="careers">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map((field, index) => (
                              <div
                                key={field.key}
                                className="detail-info-form-inputs-wrapper-no-gap instructor-register-modal__field-stack-row"
                              >
                                <div className="instructor-register-modal__period">
                                  <Form.Item name={[field.name, 'periodStart']} noStyle>
                                    <CmsDatePicker
                                      picker="month"
                                      inputSize="medium"
                                      placeholder="입사연월"
                                      format="YYYY.MM"
                                      width={140}
                                    />
                                  </Form.Item>
                                  <span className="instructor-register-modal__tilde" aria-hidden>
                                    ~
                                  </span>
                                  <Form.Item name={[field.name, 'periodEnd']} noStyle>
                                    <CmsDatePicker
                                      picker="month"
                                      inputSize="medium"
                                      placeholder="퇴사연월"
                                      format="YYYY.MM"
                                      width={140}
                                    />
                                  </Form.Item>
                                </div>
                                <DetailInfoForm.InputsSeparator />
                                <div className="instructor-register-modal__inline-group">
                                  <Form.Item name={[field.name, 'companyName']} noStyle>
                                    <CmsInput placeholder="회사명" inputSize="medium" width={220} />
                                  </Form.Item>
                                  <Form.Item name={[field.name, 'roleName']} noStyle>
                                    <CmsInput
                                      placeholder="담당 업무"
                                      inputSize="medium"
                                      width={160}
                                    />
                                  </Form.Item>
                                  <Form.Item
                                    name={[field.name, 'currentlyEmployed']}
                                    valuePropName="checked"
                                    noStyle
                                  >
                                    <CmsCheckbox checkboxSize="medium">재직중</CmsCheckbox>
                                  </Form.Item>
                                  {index === 0 ? (
                                    <CmsCircleAddButton onClick={() => add({ ...EMPTY_CAREER })} />
                                  ) : (
                                    <ItemDeleteButton
                                      className="item-delete-button"
                                      aria-label="항목 삭제"
                                      onClick={() => remove(field.name)}
                                    />
                                  )}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </Form.List>
                    </div>
                  }
                />
              </DetailInfoForm.Row>
            ) : null}
          </DetailInfoForm>

          <DetailInfoForm
            title="JA Korea 활동 경험"
            mode="edit"
            className="instructor-register-list-section"
          >
            <DetailInfoForm.Row type="single" className="instructor-register-modal__multi-row">
              <DetailInfoForm.Field
                label="활동 이력"
                labelWidth={200}
                fullRow
                view="-"
                edit={
                  <div className="instructor-register-modal__field-stack">
                    <Form.List name="jaKoreaRows">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map((field, index) => (
                            <div
                              key={field.key}
                              className="detail-info-form-inputs-wrapper-no-gap instructor-register-modal__field-stack-row"
                            >
                              <div className="instructor-register-modal__period">
                                <Form.Item name={[field.name, 'periodStart']} noStyle>
                                  <CmsDatePicker
                                    inputSize="medium"
                                    placeholder="활동 시작일"
                                    format="YYYY.MM.DD"
                                    width={140}
                                  />
                                </Form.Item>
                                <span className="instructor-register-modal__tilde" aria-hidden>
                                  ~
                                </span>
                                <Form.Item name={[field.name, 'periodEnd']} noStyle>
                                  <CmsDatePicker
                                    inputSize="medium"
                                    placeholder="활동 종료일"
                                    format="YYYY.MM.DD"
                                    width={140}
                                  />
                                </Form.Item>
                              </div>
                              <DetailInfoForm.InputsSeparator />
                              <div className="instructor-register-modal__inline-group">
                                <Form.Item name={[field.name, 'title']} noStyle>
                                  <CmsInput
                                    placeholder="프로그램명"
                                    inputSize="medium"
                                    width={220}
                                  />
                                </Form.Item>
                                <Form.Item name={[field.name, 'note']} noStyle>
                                  <CmsInput placeholder="비고" inputSize="medium" width={160} />
                                </Form.Item>
                                {index === 0 ? (
                                  <CmsCircleAddButton
                                    onClick={() => add({ ...EMPTY_JA_KOREA_ROW })}
                                  />
                                ) : (
                                  <ItemDeleteButton
                                    className="item-delete-button"
                                    aria-label="항목 삭제"
                                    onClick={() => remove(field.name)}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </Form.List>
                  </div>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <DetailInfoForm
            title="자격 및 면허"
            mode="edit"
            className="instructor-register-list-section"
          >
            <DetailInfoForm.Row type="single" className="instructor-register-modal__multi-row">
              <DetailInfoForm.Field
                label="자격 및 면허 내역"
                labelWidth={200}
                fullRow
                view="-"
                edit={
                  <div className="instructor-register-modal__field-stack">
                    <Form.List name="licenseRows">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map((field, index) => (
                            <div
                              key={field.key}
                              className="detail-info-form-inputs-wrapper-no-gap instructor-register-modal__field-stack-row"
                            >
                              <Form.Item name={[field.name, 'acquiredYear']} noStyle>
                                <CmsDatePicker
                                  picker="year"
                                  inputSize="medium"
                                  placeholder="취득연도"
                                  format="YYYY"
                                  width={140}
                                />
                              </Form.Item>
                              <DetailInfoForm.InputsSeparator />
                              <div className="instructor-register-modal__inline-group">
                                <Form.Item name={[field.name, 'title']} noStyle>
                                  <CmsInput
                                    placeholder="자격증/면허명"
                                    inputSize="medium"
                                    width={220}
                                  />
                                </Form.Item>
                                <Form.Item name={[field.name, 'issuer']} noStyle>
                                  <CmsInput placeholder="발행처" inputSize="medium" width={160} />
                                </Form.Item>
                                {index === 0 ? (
                                  <CmsCircleAddButton
                                    onClick={() => add({ ...EMPTY_LICENSE_OR_AWARD_ROW })}
                                  />
                                ) : (
                                  <ItemDeleteButton
                                    className="item-delete-button"
                                    aria-label="항목 삭제"
                                    onClick={() => remove(field.name)}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </Form.List>
                  </div>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <DetailInfoForm
            title="수상 및 수료"
            mode="edit"
            className="instructor-register-list-section"
          >
            <DetailInfoForm.Row type="single" className="instructor-register-modal__multi-row">
              <DetailInfoForm.Field
                label="수상 및 수료 내역"
                labelWidth={200}
                fullRow
                view="-"
                edit={
                  <div className="instructor-register-modal__field-stack">
                    <Form.List name="awardRows">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map((field, index) => (
                            <div
                              key={field.key}
                              className="detail-info-form-inputs-wrapper-no-gap instructor-register-modal__field-stack-row"
                            >
                              <Form.Item name={[field.name, 'acquiredYear']} noStyle>
                                <CmsDatePicker
                                  picker="year"
                                  inputSize="medium"
                                  placeholder="수상/수료연도"
                                  format="YYYY"
                                  width={140}
                                />
                              </Form.Item>
                              <DetailInfoForm.InputsSeparator />
                              <div className="instructor-register-modal__inline-group">
                                <Form.Item name={[field.name, 'title']} noStyle>
                                  <CmsInput
                                    placeholder="수상/수료명"
                                    inputSize="medium"
                                    width={220}
                                  />
                                </Form.Item>
                                <Form.Item name={[field.name, 'issuer']} noStyle>
                                  <CmsInput placeholder="발행처" inputSize="medium" width={160} />
                                </Form.Item>
                                {index === 0 ? (
                                  <CmsCircleAddButton
                                    onClick={() => add({ ...EMPTY_LICENSE_OR_AWARD_ROW })}
                                  />
                                ) : (
                                  <ItemDeleteButton
                                    className="item-delete-button"
                                    aria-label="항목 삭제"
                                    onClick={() => remove(field.name)}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </Form.List>
                  </div>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <FreeWriteItemsSection
            required
            description="1~4번 문항은 1,000자 이내로 자유롭게 작성 가능합니다."
            items={INSTRUCTOR_FREE_WRITE_ITEMS}
            rows={3}
            placeholder="자유롭게 작성해주세요"
          />
        </div>
      </Form>
    </ContentModal>
  )
}
