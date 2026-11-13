import { useEffect, useState } from 'react'
import { Form } from 'antd'
import type { CreateUserRequest } from '@/entities/user/api/user-service'
import { buildPreRegisterTermsAgreements } from '@/features/user/api/build-pre-register-terms-agreements'
import { resolveAdminProvisionedTempPassword } from '@/features/user/lib/admin-provisioned-temp-password'
import { individualAffiliationGradeSelectOptions } from '@/features/user/detail/ui/user-basic-info/sections/constants'
import {
  AddressSearch,
  CmsButton,
  CmsInput,
  CmsPhoneInput,
  CmsRadioGroup,
  CmsSelect,
  SchoolSearch,
  type SchoolSearchSelection,
  type SchoolSearchSelectMeta,
} from '@/shared/ui'
import {
  CmsDateTextInput,
  isValidBirthDateFormValue,
  birthDateFormValueToApi,
  isBirthDateInputIncomplete,
} from '@/shared/ui/date-text-input'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { isValidKoreanPhoneNumber } from '@/shared/utils/phone-validation'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { resolveIndividualEnrolledSchoolSubmitBlock } from '@/features/user/api/individual-enrolled-school-selection'
import {
  REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
  buildRequiredConsentDisagreeAlertMessage,
  collectDisagreedRequiredConsentLabels,
  hasUnsetConsentSelections,
} from '@jakorea/domain/shared/required-consent-alert'
import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'
import type { MemberConsentFieldKey } from '@/features/user/shared/lib/member-consent-template-map'
import {
  isAgreementMemberConsentField,
  isMemberCrimeConsentField,
  resolveMemberConsentTemplateEntry,
} from '@/features/user/shared/lib/member-consent-template-map'
import { MEMBER_REGISTER_ALL_CONSENT_KEYS } from '@/features/user/shared/lib/member-register-consent-fields'
import { MemberConsentAgreementModal } from '@/features/user/shared/ui/member-consent-agreement-modal'
import { MemberConsentCrimeModal } from '@/features/user/shared/ui/member-consent-crime-modal'
import {
  createEmptyMemberRegisterConsentWriteSnapshots,
  type MemberConsentAgreementDraftSnapshot,
  type MemberConsentCrimeDraftSnapshot,
  type MemberRegisterConsentWriteSnapshots,
} from '@/features/user/shared/lib/member-register-consent-write-snapshot'
import { registerFormGenderToApiLabel } from '@/features/user/detail/lib/profile-form-gender'
import './add-user-individual.css'

type ConsentValue = 'agree' | 'disagree'
type ConsentFieldValue = ConsentValue | undefined
type GenderValue = 'male' | 'female'
type SchoolEnrollmentStatus = 'enrolled' | 'not_enrolled'

export interface AddUserIndividualFormValues {
  name: string
  /** 신규 등록은 미선택(undefined)으로 시작 — 남성으로 추정하지 않는다. */
  gender: GenderValue | undefined
  birthDate: string
  /** 신규 등록은 미선택(undefined)으로 시작 — 「재학 중」·「해당 없음」 모두 미선택 */
  schoolEnrollmentStatus: SchoolEnrollmentStatus | undefined
  schoolName: string
  grade: string
  schoolProvider?: string
  schoolExternalCode?: string
  schoolEducationOfficeCode?: string
  schoolLevel?: string
  schoolAddress?: string
  schoolZipcode?: string
  schoolRegionSido?: string
  schoolRegionSigungu?: string
  schoolOrganizationId?: number
  affiliationOrganization: string
  affiliationNone: boolean
  contact: string
  email: string
  address: string
  detailAddress: string
  volunteerId: string
  consentTermsOfService: ConsentFieldValue
  consentPersonalInfo: ConsentFieldValue
  consentMarketing: ConsentFieldValue
  consentPortrait: ConsentFieldValue
  consentWithholdingTax: ConsentFieldValue
  consentFacilitatorPledge: ConsentFieldValue
  consentAdministrativeJoint: ConsentFieldValue
  consentSexOffenseCheck: ConsentFieldValue
}

interface AddUserIndividualProps {
  onSubmit: (request: CreateUserRequest) => Promise<void>
  onCancel: () => void
  loading?: boolean
  formId?: string
  hideActions?: boolean
  /** 신규 등록 모달 세션 — 동의서 작성 draft 보존·복원 */
  consentWriteSnapshots?: MemberRegisterConsentWriteSnapshots
  onSaveConsentAgreementSnapshot?: (
    fieldKey: MemberConsentFieldKey,
    snapshot: MemberConsentAgreementDraftSnapshot
  ) => void
  onSaveConsentCrimeSnapshot?: (
    fieldKey: MemberConsentFieldKey,
    snapshot: MemberConsentCrimeDraftSnapshot
  ) => void
}

const CONSENT_RADIO_OPTIONS = [
  { label: '동의', value: 'agree' },
  { label: '미동의', value: 'disagree' },
]

const TERMS_CONSENT_DESCRIPTION = '당사자의 서면 동의를 확인한 후 동의 항목을 처리해 주세요.'

/** 시안: 기본 정보·약관 및 동의 라벨 셀 180px */
const FIELD_LABEL_WIDTH = 180 as const
/** 시안: 테이블 인풋 기본 200px · 주소 240px */
const FIELD_INPUT_WIDTH = 200 as const
const ADDRESS_INPUT_WIDTH = 240 as const

function ConsentDocumentFieldEdit({
  value,
  onWrite,
}: {
  value: ConsentFieldValue
  onWrite: () => void
}) {
  return (
    <span className="add-user-individual__consent-document">
      <span className="add-user-individual__consent-status">
        {value === 'agree' ? '동의' : '미동의'}
      </span>
      <DetailInfoForm.InputsSeparator />
      <CmsButton
        variant="secondary"
        size="small"
        type="button"
        className="add-user-individual__consent-write-btn"
        onClick={onWrite}
      >
        동의서 작성
      </CmsButton>
    </span>
  )
}

const GENDER_OPTIONS = [
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
]

const SCHOOL_ENROLLMENT_OPTIONS = [
  { label: '재학 중', value: 'enrolled' },
  { label: '해당 없음', value: 'not_enrolled' },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FORM_ITEM_STYLE = { marginBottom: 0, width: '100%' } as const

const INITIAL_VALUES: AddUserIndividualFormValues = {
  name: '',
  gender: undefined,
  birthDate: '',
  schoolEnrollmentStatus: undefined,
  schoolName: '',
  grade: '',
  affiliationOrganization: '',
  affiliationNone: false,
  contact: '',
  email: '',
  address: '',
  detailAddress: '',
  volunteerId: '',
  consentTermsOfService: undefined,
  consentPersonalInfo: undefined,
  /** CMS 회원 등록 — 마케팅은 미동의 고정(비활성). Form 값도 disagree로 맞춰 미선택(undefined)으로 잡히지 않게 함 */
  consentMarketing: 'disagree',
  consentPortrait: 'disagree',
  consentWithholdingTax: 'disagree',
  consentFacilitatorPledge: 'disagree',
  consentAdministrativeJoint: 'disagree',
  consentSexOffenseCheck: 'disagree',
}

function isUnder14BirthDate(value: string, today = new Date()): boolean {
  const apiValue = birthDateFormValueToApi(value)
  const [year, month, day] = apiValue.split('-').map(Number)
  const birthDate = new Date(year, month - 1, day)
  const fourteenthBirthday = new Date(year + 14, month - 1, day)

  return !Number.isNaN(birthDate.getTime()) && fourteenthBirthday > today
}

const MEMBER_REGISTER_REQUIRED_CONSENT_FIELDS = [
  { key: 'consentTermsOfService', label: '서비스 이용약관' },
  { key: 'consentPersonalInfo', label: '개인정보 수집·이용 동의' },
] as const satisfies ReadonlyArray<{
  key: keyof AddUserIndividualFormValues
  label: string
}>

export function collectMemberRegisterValidation(values: AddUserIndividualFormValues): {
  missingRequired: boolean
  formatMessages: string[]
} {
  let missingRequired = false
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
  } else if (isUnder14BirthDate(birthDate)) {
    formatMessages.push('만 14세 미만 회원은 관리자가 직접 등록할 수 없습니다.')
  }

  if (
    values.schoolEnrollmentStatus !== 'enrolled' &&
    values.schoolEnrollmentStatus !== 'not_enrolled'
  ) {
    missingRequired = true
  }

  if (values.schoolEnrollmentStatus === 'enrolled') {
    if (!values.schoolName?.trim()) {
      missingRequired = true
    }
    if (!values.grade?.trim()) {
      missingRequired = true
    }
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
  }

  if (
    isRequiredAddressIncomplete({
      address: values.address,
      addressDetail: values.detailAddress,
      subject: 'person',
    })
  ) {
    missingRequired = true
  }

  return { missingRequired, formatMessages }
}

export function AddUserIndividual({
  onSubmit,
  onCancel,
  loading = false,
  formId,
  hideActions = false,
  consentWriteSnapshots = createEmptyMemberRegisterConsentWriteSnapshots(),
  onSaveConsentAgreementSnapshot,
  onSaveConsentCrimeSnapshot,
}: AddUserIndividualProps) {
  const { showAlert } = useCmsAlert()
  const [form] = Form.useForm<AddUserIndividualFormValues>()
  const [activeConsentField, setActiveConsentField] = useState<MemberConsentFieldKey | null>(null)
  const allValues = Form.useWatch([], form) as AddUserIndividualFormValues | undefined
  const address = Form.useWatch('address', form) ?? ''
  const memberName = Form.useWatch('name', form) ?? ''
  const schoolName = Form.useWatch('schoolName', form) ?? ''
  const schoolEnrollmentStatus = Form.useWatch('schoolEnrollmentStatus', form) as
    | SchoolEnrollmentStatus
    | undefined
  const isEnrolled = schoolEnrollmentStatus === 'enrolled'
  const isEnrollmentUnselected = schoolEnrollmentStatus == null

  const activeConsentEntry =
    activeConsentField != null ? resolveMemberConsentTemplateEntry(activeConsentField) : null

  const handleConsentWrite = (fieldKey: MemberConsentFieldKey) => {
    setActiveConsentField(fieldKey)
  }

  const handleConsentModalClose = () => {
    setActiveConsentField(null)
  }

  const handleConsentComplete = (fieldKey: MemberConsentFieldKey) => {
    if (fieldKey === 'consentReceiptPreConsent') {
      setActiveConsentField(null)
      return
    }
    form.setFieldValue(fieldKey, 'agree')
    setActiveConsentField(null)
  }

  const handleSchoolSelect = (selection: SchoolSearchSelection, meta: SchoolSearchSelectMeta) => {
    if (selection.source === 'neis') {
      const school = selection.item
      form.setFieldsValue({
        schoolName: school.schulNm.trim(),
        schoolProvider: 'NEIS',
        schoolExternalCode: school.sdSchulCode.trim(),
        schoolEducationOfficeCode: school.atptOfcdcScCode.trim(),
        schoolLevel: school.schulKndScNm.trim(),
        schoolAddress: school.orgRdnma.trim(),
        schoolZipcode: school.orgRdnzc.trim(),
        schoolRegionSido: meta.regionSido,
        schoolRegionSigungu: meta.regionSigungu,
        schoolOrganizationId: undefined,
      })
      return
    }

    const univ = selection.item
    const nextSchoolName = univ.campusName
      ? `${univ.schoolName.trim()} (${univ.campusName.trim()})`
      : univ.schoolName.trim()
    form.setFieldsValue({
      schoolName: nextSchoolName,
      schoolProvider: 'CAREER_NET',
      schoolExternalCode: univ.seq.trim(),
      schoolEducationOfficeCode: undefined,
      schoolLevel: univ.schoolGubun.trim() || univ.schoolType.trim(),
      schoolAddress: univ.address.trim(),
      schoolZipcode: '',
      schoolRegionSido: meta.regionSido || univ.region.trim(),
      schoolRegionSigungu: meta.regionSigungu,
      schoolOrganizationId: undefined,
    })
  }

  const handleFinish = async (values: AddUserIndividualFormValues) => {
    const enrolled = values.schoolEnrollmentStatus === 'enrolled'
    const affiliation = enrolled
      ? values.schoolName.trim()
      : values.affiliationOrganization.trim() || undefined

    const request: CreateUserRequest = {
      email: values.email.trim(),
      password: resolveAdminProvisionedTempPassword(values.email.trim()),
      name: values.name.trim(),
      phone: values.contact.trim(),
      gender: registerFormGenderToApiLabel(values.gender),
      birthDate: birthDateFormValueToApi(values.birthDate),
      role: 'INDIVIDUAL',
      isActive: true,
      id1365: values.volunteerId.trim() || undefined,
      address: values.address.trim(),
      detailAddress: values.detailAddress.trim() || undefined,
      schoolEnrollmentStatus: enrolled ? 'ENROLLED' : 'NOT_ENROLLED',
      affiliation,
      grade: enrolled ? values.grade.trim() : undefined,
      schoolOrganizationId: enrolled ? (values.schoolOrganizationId ?? null) : null,
      schoolProvider: enrolled ? values.schoolProvider?.trim() || undefined : undefined,
      schoolExternalCode: enrolled ? values.schoolExternalCode?.trim() || undefined : undefined,
      schoolEducationOfficeCode: enrolled
        ? values.schoolEducationOfficeCode?.trim() || undefined
        : undefined,
      schoolLevel: enrolled ? values.schoolLevel?.trim() || undefined : undefined,
      schoolAddress: enrolled ? values.schoolAddress?.trim() || undefined : undefined,
      schoolZipcode: enrolled ? values.schoolZipcode?.trim() || undefined : undefined,
      schoolRegionSido: enrolled ? values.schoolRegionSido?.trim() || undefined : undefined,
      schoolRegionSigungu: enrolled ? values.schoolRegionSigungu?.trim() || undefined : undefined,
      termsAgreements: buildPreRegisterTermsAgreements(
        {
          consentTermsOfService: values.consentTermsOfService,
          consentPersonal: values.consentPersonalInfo,
          consentMarketing: values.consentMarketing,
        },
        {
          consentPortrait: values.consentPortrait,
          consentWithholdingTax: values.consentWithholdingTax,
          consentFacilitatorPledge: values.consentFacilitatorPledge,
          consentAdministrativeJoint: values.consentAdministrativeJoint,
          consentSexOffenseCheck: values.consentSexOffenseCheck,
        }
      ),
      consentWriteSnapshots,
    }
    await onSubmit(request)
    form.resetFields()
    setActiveConsentField(null)
  }

  const handleSubmitAttempt = (values: AddUserIndividualFormValues) => {
    if (hasUnsetConsentSelections(values, MEMBER_REGISTER_ALL_CONSENT_KEYS)) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }

    const disagreedRequiredLabels = collectDisagreedRequiredConsentLabels(values, [
      ...MEMBER_REGISTER_REQUIRED_CONSENT_FIELDS,
    ])
    if (disagreedRequiredLabels.length > 0) {
      showAlert({
        title: REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
        content: buildRequiredConsentDisagreeAlertMessage(disagreedRequiredLabels),
      })
      return
    }

    const { missingRequired, formatMessages } = collectMemberRegisterValidation(values)
    if (missingRequired) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
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

    if (values.schoolEnrollmentStatus === 'enrolled') {
      const enrolledSchoolBlock = resolveIndividualEnrolledSchoolSubmitBlock({
        schoolProvider: values.schoolProvider,
        schoolOrganizationId: values.schoolOrganizationId,
        schoolExternalCode: values.schoolExternalCode,
        schoolEducationOfficeCode: values.schoolEducationOfficeCode,
        schoolRegionSido: values.schoolRegionSido,
      })
      if (enrolledSchoolBlock != null) {
        showAlert({
          title: '안내',
          content: enrolledSchoolBlock,
        })
        return
      }
    }

    void handleFinish(values)
  }

  useEffect(() => {
    if (schoolEnrollmentStatus == null) return
    if (schoolEnrollmentStatus === 'not_enrolled') {
      form.setFieldsValue({
        schoolName: '',
        grade: '',
        schoolProvider: undefined,
        schoolExternalCode: undefined,
        schoolEducationOfficeCode: undefined,
        schoolLevel: undefined,
        schoolAddress: undefined,
        schoolZipcode: undefined,
        schoolRegionSido: undefined,
        schoolRegionSigungu: undefined,
        schoolOrganizationId: undefined,
      })
      return
    }
    // 재학 전환 시 잔존 검색 메타·자유입력 제거 — SchoolSearch로 다시 선택
    form.setFieldsValue({
      affiliationOrganization: '',
      affiliationNone: false,
      schoolName: '',
      grade: '',
      schoolProvider: undefined,
      schoolExternalCode: undefined,
      schoolEducationOfficeCode: undefined,
      schoolLevel: undefined,
      schoolAddress: undefined,
      schoolZipcode: undefined,
      schoolRegionSido: undefined,
      schoolRegionSigungu: undefined,
      schoolOrganizationId: undefined,
    })
  }, [form, schoolEnrollmentStatus])

  return (
    <>
      <Form
        id={formId}
        form={form}
        layout="vertical"
        initialValues={INITIAL_VALUES}
        requiredMark={false}
        onFinish={handleSubmitAttempt}
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
                labelWidth={FIELD_LABEL_WIDTH}
                view="-"
                edit={
                  <Form.Item name="name" style={FORM_ITEM_STYLE}>
                    <CmsInput placeholder="성명" inputSize="small" width={FIELD_INPUT_WIDTH} />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="성별 및 생년월일"
                required
                labelWidth={FIELD_LABEL_WIDTH}
                view="-"
                edit={
                  <span className="detail-info-form-inputs-wrapper-no-gap">
                    <Form.Item name="gender" noStyle>
                      <CmsRadioGroup options={GENDER_OPTIONS} size="medium" />
                    </Form.Item>
                    <DetailInfoForm.InputsSeparator />
                    <Form.Item
                      name="birthDate"
                      style={{ ...FORM_ITEM_STYLE, width: FIELD_INPUT_WIDTH }}
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
                labelWidth={FIELD_LABEL_WIDTH}
                view="-"
                edit={
                  <Form.Item name="contact" style={FORM_ITEM_STYLE}>
                    <CmsPhoneInput placeholder="연락처" inputSize="small" width={FIELD_INPUT_WIDTH} />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="이메일"
                required
                labelWidth={FIELD_LABEL_WIDTH}
                view="-"
                edit={
                  <Form.Item name="email" style={FORM_ITEM_STYLE}>
                    <CmsInput placeholder="이메일" inputSize="small" width={FIELD_INPUT_WIDTH} />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="현재 학교 재학 여부"
                required
                labelWidth={FIELD_LABEL_WIDTH}
                view="-"
                edit={
                  <Form.Item name="schoolEnrollmentStatus" noStyle>
                    <CmsRadioGroup options={SCHOOL_ENROLLMENT_OPTIONS} size="medium" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="소속"
                required={isEnrolled}
                labelWidth={FIELD_LABEL_WIDTH}
                view="-"
                edit={
                  isEnrolled ? (
                    <div className="detail-info-form-inputs-wrapper">
                      <div style={{ width: FIELD_INPUT_WIDTH, minWidth: 0 }}>
                        <Form.Item name="schoolName" noStyle>
                          <SchoolSearch
                            value={schoolName}
                            onChange={nextSchoolName =>
                              form.setFieldsValue({
                                schoolName: nextSchoolName,
                                schoolProvider: undefined,
                                schoolExternalCode: undefined,
                                schoolEducationOfficeCode: undefined,
                                schoolLevel: undefined,
                                schoolAddress: undefined,
                                schoolZipcode: undefined,
                                schoolRegionSido: undefined,
                                schoolRegionSigungu: undefined,
                                schoolOrganizationId: undefined,
                              })
                            }
                            onSelect={handleSchoolSelect}
                            placeholder="소속 학교명"
                            inputSize="small"
                            width="100%"
                          />
                        </Form.Item>
                      </div>
                      <Form.Item name="schoolProvider" hidden preserve />
                      <Form.Item name="schoolExternalCode" hidden preserve />
                      <Form.Item name="schoolEducationOfficeCode" hidden preserve />
                      <Form.Item name="schoolLevel" hidden preserve />
                      <Form.Item name="schoolAddress" hidden preserve />
                      <Form.Item name="schoolZipcode" hidden preserve />
                      <Form.Item name="schoolRegionSido" hidden preserve />
                      <Form.Item name="schoolRegionSigungu" hidden preserve />
                      <Form.Item name="schoolOrganizationId" hidden preserve />
                      <Form.Item name="grade" noStyle>
                        <CmsSelect
                          placeholder="학년"
                          withAllOption={false}
                          inputSize="small"
                          width={120}
                          options={individualAffiliationGradeSelectOptions(allValues?.grade)}
                        />
                      </Form.Item>
                    </div>
                  ) : (
                    <div className="add-user-individual__affiliation-row">
                      <Form.Item
                        name="affiliationOrganization"
                        style={{ ...FORM_ITEM_STYLE, width: FIELD_INPUT_WIDTH }}
                      >
                        <CmsInput
                          placeholder="소속 기관명"
                          inputSize="small"
                          width="100%"
                          disabled={isEnrollmentUnselected}
                        />
                      </Form.Item>
                    </div>
                  )
                }
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="자택 주소지"
                required
                fullRow
                labelWidth={FIELD_LABEL_WIDTH}
                view="-"
                edit={
                  <div className="detail-info-form-inputs-wrapper-no-gap add-user-individual__address-row">
                    <Form.Item name="address" noStyle>
                      <AddressSearch
                        inputSize="small"
                        width={ADDRESS_INPUT_WIDTH}
                        value={address}
                        onChange={nextAddress => form.setFieldValue('address', nextAddress)}
                        placeholder="건물명, 도로명 또는 지번"
                      />
                    </Form.Item>
                    <DetailInfoForm.InputsSeparator />
                    <Form.Item name="detailAddress" noStyle>
                      <CmsInput placeholder="상세 주소" inputSize="small" width={ADDRESS_INPUT_WIDTH} />
                    </Form.Item>
                  </div>
                }
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="1365 ID"
                fullRow
                labelWidth={FIELD_LABEL_WIDTH}
                view="-"
                edit={
                  <Form.Item name="volunteerId" noStyle>
                    <CmsInput placeholder="1365 ID" inputSize="small" width={FIELD_INPUT_WIDTH} />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <DetailInfoForm
            title="약관 및 동의"
            mode="edit"
            className="add-user-individual__section add-user-individual__section--terms add-user-individual__terms-consent-heading"
            description={TERMS_CONSENT_DESCRIPTION}
          >
            <div className="add-user-individual__terms-consent-form-stack">
              <DetailInfoForm
                title="약관 및 동의"
                hideHeader
                mode="edit"
                className="add-user-individual__terms-consent-block"
              >
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="서비스 이용약관 동의"
                    required
                    labelWidth={FIELD_LABEL_WIDTH}
                    view="-"
                    edit={
                      <Form.Item name="consentTermsOfService" noStyle>
                        <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="medium" />
                      </Form.Item>
                    }
                  />
                  <DetailInfoForm.Field
                    label="개인정보 수집·이용 동의"
                    required
                    labelWidth={FIELD_LABEL_WIDTH}
                    view="-"
                    edit={
                      <Form.Item name="consentPersonalInfo" noStyle>
                        <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="medium" />
                      </Form.Item>
                    }
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="마케팅 정보 수신 동의"
                    labelWidth={FIELD_LABEL_WIDTH}
                    view="-"
                    edit={
                      <Form.Item name="consentMarketing" noStyle>
                        <CmsRadioGroup
                          options={CONSENT_RADIO_OPTIONS}
                          size="medium"
                          disabled
                        />
                      </Form.Item>
                    }
                  />
                  <DetailInfoForm.Field
                    label="초상권 수집·이용 동의서"
                    labelWidth={FIELD_LABEL_WIDTH}
                    view="-"
                    edit={
                      <>
                        <Form.Item name="consentPortrait" hidden preserve />
                        <ConsentDocumentFieldEdit
                          value={allValues?.consentPortrait ?? INITIAL_VALUES.consentPortrait}
                          onWrite={() => handleConsentWrite('consentPortrait')}
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
                className="add-user-individual__terms-consent-block"
              >
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="지급조서 사전동의서"
                    labelWidth={FIELD_LABEL_WIDTH}
                    view="-"
                    edit={
                      <>
                        <Form.Item name="consentWithholdingTax" hidden preserve />
                        <ConsentDocumentFieldEdit
                          value={
                            allValues?.consentWithholdingTax ?? INITIAL_VALUES.consentWithholdingTax
                          }
                          onWrite={() => handleConsentWrite('consentWithholdingTax')}
                        />
                      </>
                    }
                  />
                  <DetailInfoForm.Field
                    label="교육진행자 서약서"
                    labelWidth={FIELD_LABEL_WIDTH}
                    view="-"
                    edit={
                      <>
                        <Form.Item name="consentFacilitatorPledge" hidden preserve />
                        <ConsentDocumentFieldEdit
                          value={
                            allValues?.consentFacilitatorPledge ??
                            INITIAL_VALUES.consentFacilitatorPledge
                          }
                          onWrite={() => handleConsentWrite('consentFacilitatorPledge')}
                        />
                      </>
                    }
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="성범죄경력 조회 동의서"
                    labelWidth={FIELD_LABEL_WIDTH}
                    view="-"
                    edit={
                      <>
                        <Form.Item name="consentSexOffenseCheck" hidden preserve />
                        <ConsentDocumentFieldEdit
                          value={
                            allValues?.consentSexOffenseCheck ??
                            INITIAL_VALUES.consentSexOffenseCheck
                          }
                          onWrite={() => handleConsentWrite('consentSexOffenseCheck')}
                        />
                      </>
                    }
                  />
                  <DetailInfoForm.Field
                    label="행정정보 공동이용 동의서"
                    labelWidth={FIELD_LABEL_WIDTH}
                    view="-"
                    edit={
                      <>
                        <Form.Item name="consentAdministrativeJoint" hidden preserve />
                        <ConsentDocumentFieldEdit
                          value={
                            allValues?.consentAdministrativeJoint ??
                            INITIAL_VALUES.consentAdministrativeJoint
                          }
                          onWrite={() => handleConsentWrite('consentAdministrativeJoint')}
                        />
                      </>
                    }
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            </div>
          </DetailInfoForm>
        </div>

        {!hideActions ? (
          <div className="add-user-individual__actions">
            <CmsButton
              variant="secondary"
              size="medium"
              type="button"
              onClick={onCancel}
              disabled={loading} >
              닫기
            </CmsButton>
            <CmsButton variant="primary" size="medium" type="submit" disabled={loading}>
              신규 등록
            </CmsButton>
          </div>
        ) : null}
      </Form>

      {activeConsentField != null &&
      activeConsentEntry != null &&
      isAgreementMemberConsentField(activeConsentField) ? (
        <MemberConsentAgreementModal
          open
          templateId={activeConsentEntry.templateId}
          modalTitle={activeConsentEntry.modalTitle}
          memberName={memberName}
          savedSnapshot={consentWriteSnapshots.agreementByFieldKey[activeConsentField]}
          onSnapshotSave={snapshot =>
            onSaveConsentAgreementSnapshot?.(activeConsentField, snapshot)
          }
          onClose={handleConsentModalClose}
          onComplete={() => handleConsentComplete(activeConsentField)}
        />
      ) : null}

      {activeConsentField != null && isMemberCrimeConsentField(activeConsentField) ? (
        <MemberConsentCrimeModal
          open
          savedSnapshot={consentWriteSnapshots.crimeByFieldKey[activeConsentField]}
          onSnapshotSave={snapshot => onSaveConsentCrimeSnapshot?.(activeConsentField, snapshot)}
          onClose={handleConsentModalClose}
          onComplete={() => handleConsentComplete(activeConsentField)}
        />
      ) : null}
    </>
  )
}
