import { useMemo, useState, type ReactNode } from 'react'
import { Form, Space } from 'antd'
import type { FormInstance } from 'antd/es/form'
import type { FormListFieldData } from 'antd/es/form/FormList'
import {
  INSTRUCTOR_FORM_PLACEHOLDERS,
  INSTRUCTOR_FORM_SECTION_DESCRIPTIONS,
} from '@jakorea/domain/instructor/form-copy'
import { getInstructorFormLayout } from '@jakorea/domain/instructor/form-layout'
import {
  AddressSearch,
  CmsButton,
  CmsCheckbox,
  CmsCircleAddButton,
  CmsDatePicker,
  CmsInput,
  CmsNumericInput,
  CmsPhoneInput,
  CmsRadioGroup,
  CmsSelect,
  SchoolSearch,
} from '@/shared/ui'
import type { SchoolSearchSelection, SchoolSearchSelectMeta } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { FreeWriteItemsSection } from '@/shared/components/free-write-items-section'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { FORM_INPUTS_2_WIDTHS } from '@/features/template/constants/form-input-widths'
import { CmsDateTextInput } from '@/shared/ui/date-text-input'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/data/mock/program-wage-info'
import type { MemberConsentMemberContext } from '@/features/user/shared/lib/build-member-portrait-consent-draft'
import { buildMemberPaymentStatementBasicInfoAutofill } from '@/features/user/shared/lib/build-member-payment-statement-consent-autofill'
import {
  isAgreementInstructorConsentField,
  isInstructorCrimeConsentField,
  resolveInstructorConsentTemplateEntry,
  type InstructorConsentFieldKey,
} from '@/features/user/shared/lib/instructor-consent-field-map'
import { MemberConsentAgreementModal } from '@/features/user/shared/ui/member-consent-agreement-modal'
import { MemberConsentCrimeModal } from '@/features/user/shared/ui/member-consent-crime-modal'
import { InstructorRegisterEducationSection } from '@/features/user/shared/ui/instructor-register-education-section'
import {
  BUSINESS_INCOME_OPTIONS,
  CAREER_LEVEL_OPTIONS,
  CONSENT_RADIO_OPTIONS,
  EMPTY_CAREER,
  EMPTY_JA_KOREA_ROW,
  EMPTY_LICENSE_OR_AWARD_ROW,
  EMPLOYMENT_STATUS_OPTIONS,
  FORM_ITEM_STYLE,
  GENDER_OPTIONS,
  INSTRUCTOR_FREE_WRITE_ITEMS,
  MEMBER_TYPE_OPTIONS,
  TERMS_CONSENT_LABEL_WIDTH,
  type ConsentValue,
  type InstructorProfileFormValues,
} from './instructor-profile-form-model'
import '../instructor-register-modal.css'

function InstructorCareerRowEdit({
  form,
  field,
  index,
  onAdd,
  onRemove,
}: {
  form: FormInstance<InstructorProfileFormValues>
  field: FormListFieldData
  index: number
  onAdd: () => void
  onRemove: () => void
}) {
  const currentlyEmployed =
    Form.useWatch(['careers', field.name, 'currentlyEmployed'], form) === true

  return (
    <div
      className="detail-info-form-inputs-wrapper-no-gap instructor-register-modal__field-stack-row"
    >
      <div className="instructor-register-modal__period">
        <Form.Item name={[field.name, 'periodStart']} noStyle>
          <CmsDatePicker
            picker="month"
            inputSize="medium"
            placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.careerPeriodStart}
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
            placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.careerPeriodEnd}
            format="YYYY.MM"
            width={140}
            disabled={currentlyEmployed}
          />
        </Form.Item>
      </div>
      <DetailInfoForm.InputsSeparator />
      <div className="instructor-register-modal__inline-group">
        <Form.Item name={[field.name, 'companyName']} noStyle>
          <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.companyName} inputSize="medium" width={220} />
        </Form.Item>
        <Form.Item name={[field.name, 'roleName']} noStyle>
          <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.roleName} inputSize="medium" width={160} />
        </Form.Item>
        <Form.Item
          name={[field.name, 'currentlyEmployed']}
          valuePropName="checked"
          noStyle
          getValueFromEvent={event => {
            if (event.target.checked) {
              form.setFieldValue(['careers', field.name, 'periodEnd'], null)
            }
            return event.target.checked
          }}
        >
          <CmsCheckbox checkboxSize="medium">재직중</CmsCheckbox>
        </Form.Item>
        {index === 0 ? (
          <CmsCircleAddButton onClick={onAdd} />
        ) : (
          <ItemDeleteButton
            className="item-delete-button"
            aria-label="항목 삭제"
            onClick={onRemove}
          />
        )}
      </div>
    </div>
  )
}

/** Form.Item 자식 — value/onChange로 미동의 시 draft·onValuesChange까지 동기화 */
function ConsentDocumentFieldEdit({
  value,
  onChange,
  onWrite,
}: {
  value?: ConsentValue
  onChange?: (value: ConsentValue) => void
  onWrite: () => void
}) {
  return (
    <span className="instructor-register-modal__consent-document">
      <CmsRadioGroup
        options={CONSENT_RADIO_OPTIONS}
        size="large"
        value={value}
        onChange={event => {
          const next = event.target.value as ConsentValue
          if (next === 'disagree') {
            onChange?.('disagree')
            return
          }
          onWrite()
        }}
      />
      <span className="instructor-register-modal__consent-sep" aria-hidden>
        |
      </span>
      <CmsButton variant="secondary" size="medium" type="button" onClick={onWrite}>
        동의서 작성
      </CmsButton>
    </span>
  )
}

export type InstructorProfileFormLayoutVariant = 'register' | 'detailEdit'

export interface InstructorProfileFormBodyProps {
  form: FormInstance<InstructorProfileFormValues>
  /** 등록 모달 vs 강사 상세 수정 — 기본 정보 행 구성 분기 */
  layoutVariant?: InstructorProfileFormLayoutVariant
  /** Extra rows injected at top of 기본 정보 DetailInfoForm (before 성명) — e.g. 정산현황/JA등급 for detail edit */
  basicInfoPrefix?: ReactNode
  /** Extra rows before 사업소득자 (e.g. 강사비 등급) */
  basicInfoExtraBeforeBusinessIncome?: ReactNode
  /** 신규 등록 — JA 등급 평가 모달 열기 */
  onOpenJaGradeEvaluation?: () => void
  /**
   * 동의서 작성 완료 등 `setFieldValue`로 동의값을 바꾼 뒤 호출.
   * Ant Design Form은 setFieldValue 시 onValuesChange를 호출하지 않음.
   */
  onConsentValuesCommit?: () => void
  /**
   * 학력·경력·JA활동·자격·수상·자유작성·강사등급 등 강사 제출양식 섹션.
   * 순수 교사(`school_teacher`) 상세에서만 false — 기본 정보·약관만.
   * 신규 등록은 교사/일반 모두 동일하게 노출(소속 필드만 분기).
   */
  includeInstructorApplicationSections?: boolean
  className?: string
}

function formatJaEvaluationGradeDisplay(grade: string): string {
  const trimmed = grade.trim()
  if (!trimmed) return ''
  return trimmed.endsWith('등급') ? trimmed : `${trimmed}등급`
}

export function InstructorProfileFormBody({
  form,
  layoutVariant = 'register',
  basicInfoPrefix,
  basicInfoExtraBeforeBusinessIncome,
  onOpenJaGradeEvaluation,
  onConsentValuesCommit,
  includeInstructorApplicationSections = true,
  className,
}: InstructorProfileFormBodyProps) {
  const isDetailEdit = layoutVariant === 'detailEdit'
  const formLayout = getInstructorFormLayout(isDetailEdit ? 'cmsDetailEdit' : 'cmsRegister')
  const [activeConsentField, setActiveConsentField] = useState<InstructorConsentFieldKey | null>(
    null
  )
  const homeAddress = Form.useWatch('homeAddress', form) ?? ''
  const memberType = Form.useWatch('memberType', form) ?? 'general'
  const memberName = Form.useWatch('name', form) ?? ''
  const schoolName = Form.useWatch('schoolName', form) ?? ''
  const affiliationNone = Form.useWatch('affiliationNone', form) === true
  const jaEvaluationGrade = Form.useWatch('jaEvaluationGrade', form) ?? ''
  const isTeacherMember = memberType === 'school_teacher'
  /** 등록: 교사/일반 동일 노출. 상세: 순수 교사만 prop false */
  const showInstructorApplicationSections = includeInstructorApplicationSections
  /** 등록은 강사 전용 동의 4건도 일반과 동일. 상세 순수 교사만 숨김 */
  const showInstructorConsentDocuments = !isDetailEdit || !isTeacherMember
  const allValues = Form.useWatch([], form) as InstructorProfileFormValues | undefined
  const careerLevel = Form.useWatch('careerLevel', form) ?? 'new'

  const activeConsentEntry =
    activeConsentField != null ? resolveInstructorConsentTemplateEntry(activeConsentField) : null

  const memberConsentContext = useMemo((): MemberConsentMemberContext => {
    return {
      name: memberName,
      birthDate: allValues?.birthDate,
      phone: allValues?.contact,
      schoolEnrollmentStatus: isTeacherMember ? 'enrolled' : 'not_enrolled',
      schoolName: isTeacherMember ? schoolName : undefined,
      affiliationOrganization:
        !isTeacherMember && !affiliationNone ? allValues?.affiliationName?.trim() : undefined,
      affiliationNone: !isTeacherMember && affiliationNone,
    }
  }, [
    affiliationNone,
    allValues?.affiliationName,
    allValues?.birthDate,
    allValues?.contact,
    isTeacherMember,
    memberName,
    schoolName,
  ])

  const paymentStatementBasicInfoAutofill = useMemo(
    () =>
      buildMemberPaymentStatementBasicInfoAutofill({
        name: memberName,
        birthDate: allValues?.birthDate,
        homeAddress,
        homeAddressDetail: allValues?.homeAddressDetail,
        bankName: allValues?.bankName,
        accountNumber: allValues?.accountNumber,
        accountHolder: allValues?.accountHolder,
        memberType,
        affiliationNone,
        schoolName,
        affiliationName: allValues?.affiliationName,
      }),
    [
      affiliationNone,
      allValues?.accountHolder,
      allValues?.accountNumber,
      allValues?.affiliationName,
      allValues?.bankName,
      allValues?.birthDate,
      allValues?.homeAddressDetail,
      homeAddress,
      memberName,
      memberType,
      schoolName,
    ]
  )
  const consentAutofillProps = {
    memberContext: memberConsentContext,
    paymentStatementBasicInfoAutofill,
  }

  const handleConsentWrite = (fieldKey: InstructorConsentFieldKey) => {
    setActiveConsentField(fieldKey)
  }

  const handleConsentModalClose = () => {
    setActiveConsentField(null)
  }

  const handleConsentComplete = (fieldKey: InstructorConsentFieldKey) => {
    form.setFieldValue(fieldKey, 'agree')
    setActiveConsentField(null)
    onConsentValuesCommit?.()
  }

  const handleSchoolSelect = (selection: SchoolSearchSelection, meta: SchoolSearchSelectMeta) => {
    if (selection.source === 'neis') {
      const school = selection.item
      form.setFieldsValue({
        schoolName: school.schulNm.trim(),
        schoolProvider: 'NEIS',
        schoolExternalCode: school.sdSchulCode.trim(),
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
    const schoolName = univ.campusName
      ? `${univ.schoolName.trim()} (${univ.campusName.trim()})`
      : univ.schoolName.trim()
    form.setFieldsValue({
      schoolName,
      schoolProvider: 'CAREER_NET',
      schoolExternalCode: univ.seq.trim(),
      schoolLevel: univ.schoolGubun.trim() || univ.schoolType.trim(),
      schoolAddress: univ.address.trim(),
      schoolZipcode: '',
      schoolRegionSido: meta.regionSido || univ.region.trim(),
      schoolRegionSigungu: meta.regionSigungu,
      schoolOrganizationId: undefined,
    })
  }

  const affiliationFieldEdit = isTeacherMember ? (
    <div className="detail-info-form-inputs-wrapper-no-gap">
      <Form.Item name="schoolName" noStyle>
        <SchoolSearch
          value={schoolName}
          onChange={nextSchoolName => form.setFieldValue('schoolName', nextSchoolName)}
          onSelect={handleSchoolSelect}
          placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.schoolName}
          inputSize="medium"
          width={FORM_INPUTS_2_WIDTHS[0]}
        />
      </Form.Item>
      <Form.Item name="schoolProvider" hidden preserve />
      <Form.Item name="schoolExternalCode" hidden preserve />
      <Form.Item name="schoolLevel" hidden preserve />
      <Form.Item name="schoolAddress" hidden preserve />
      <Form.Item name="schoolZipcode" hidden preserve />
      <Form.Item name="schoolRegionSido" hidden preserve />
      <Form.Item name="schoolRegionSigungu" hidden preserve />
      <Form.Item name="schoolOrganizationId" hidden preserve />
      <DetailInfoForm.InputsSeparator />
      <Form.Item name="employmentStatus" noStyle>
        <CmsSelect
          placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.employmentStatus}
          inputSize="medium"
          width={FORM_INPUTS_2_WIDTHS[1]}
          options={EMPLOYMENT_STATUS_OPTIONS}
          allowClear
        />
      </Form.Item>
    </div>
  ) : (
    <div className="instructor-register-modal__affiliation-row">
      <Form.Item name="affiliationName" style={{ ...FORM_ITEM_STYLE, flex: 1, minWidth: 0 }}>
        <CmsInput
          placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.affiliationName}
          inputSize="medium"
          width="100%"
          disabled={affiliationNone}
        />
      </Form.Item>
      <Form.Item
        name="affiliationNone"
        valuePropName="checked"
        noStyle
        getValueFromEvent={event => {
          const checked = event.target.checked === true
          if (checked) {
            form.setFieldValue('affiliationName', '')
          }
          return checked
        }}
      >
        <CmsCheckbox checkboxSize="medium">소속 없음</CmsCheckbox>
      </Form.Item>
    </div>
  )

  const instructorCareerFieldEdit = (
    <Form.Item name="instructorCareer" style={FORM_ITEM_STYLE}>
      <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.instructorCareer} inputSize="medium" width="100%" />
    </Form.Item>
  )

  const gradeEvaluateButton = (
    <CmsButton
      type="button"
      variant="secondary"
      size="medium"
      disabled={!onOpenJaGradeEvaluation}
      onClick={() => onOpenJaGradeEvaluation?.()}
    >
      등급 평가
    </CmsButton>
  )

  const jaEvaluationGradeFieldEdit =
    jaEvaluationGrade.trim() !== '' ? (
      <div className="instructor-register-modal__ja-grade">
        <span>{formatJaEvaluationGradeDisplay(jaEvaluationGrade)}</span>
        <DetailInfoForm.InputsSeparator />
        {gradeEvaluateButton}
      </div>
    ) : (
      gradeEvaluateButton
    )

  return (
    <>
      <div className={className ?? 'instructor-register-modal__stack'}>
        <DetailInfoForm
          title="기본 정보"
          mode="edit"
          className="instructor-register-modal__basic-info"
        >
          {basicInfoPrefix}
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="성명"
              view="-"
              edit={
                <Form.Item name="name" style={FORM_ITEM_STYLE}>
                  <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.name} inputSize="medium" width="100%" />
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
                    getValueFromEvent={(value: string) => value}
                  >
                    <CmsDateTextInput
                      placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.birthDate}
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
              view="-"
              edit={
                <Form.Item name="contact" style={FORM_ITEM_STYLE}>
                  <CmsPhoneInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.contact} inputSize="medium" width="100%" />
                </Form.Item>
              }
            />
            <DetailInfoForm.Field
              label="이메일"
              view="-"
              edit={
                <Form.Item name="email" style={FORM_ITEM_STYLE}>
                  <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.email} inputSize="medium" width="100%" />
                </Form.Item>
              }
            />
          </DetailInfoForm.Row>
          {isDetailEdit ? (
            <>
              <Form.Item name="memberType" hidden preserve />
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field label="소속" view="-" edit={affiliationFieldEdit} />
                <DetailInfoForm.Field label="강사 경력" view="-" edit={instructorCareerFieldEdit} />
              </DetailInfoForm.Row>
            </>
          ) : (
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
              <DetailInfoForm.Field label="소속" view="-" edit={affiliationFieldEdit} />
            </DetailInfoForm.Row>
          )}
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
                      placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.homeAddress}
                      inputSize="medium"
                      width="100%"
                    />
                  </Form.Item>
                  <DetailInfoForm.InputsSeparator />
                  <Form.Item name="homeAddressDetail" noStyle>
                    <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.homeAddressDetail} inputSize="medium" width="100%" />
                  </Form.Item>
                </Space.Compact>
              }
            />
          </DetailInfoForm.Row>
          {!isDetailEdit ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="강사 경력" fullRow view="-" edit={instructorCareerFieldEdit} />
            </DetailInfoForm.Row>
          ) : null}
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="정산 계좌 정보"
              fullRow
              view="-"
              edit={
                <div className="instructor-register-modal__settlement-account">
                  <div className="instructor-register-modal__bank-account-pair">
                    <Form.Item name="bankName" noStyle>
                      <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.bankName} inputSize="medium" width={120} />
                    </Form.Item>
                    <Form.Item name="accountNumber" trigger="onValueChange" noStyle>
                      <CmsNumericInput
                        mode="numericText"
                        placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.accountNumber}
                        inputSize="medium"
                        width={240}
                      />
                    </Form.Item>
                  </div>
                  <DetailInfoForm.InputsSeparator />
                  <Form.Item name="accountHolder" noStyle>
                    <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.accountHolder} inputSize="medium" width={240} />
                  </Form.Item>
                </div>
              }
            />
          </DetailInfoForm.Row>
          {basicInfoExtraBeforeBusinessIncome}
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
                      placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.oneLineIntro}
                      inputSize="medium"
                      width="100%"
                    />
                  </Form.Item>
                </div>
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>

        {formLayout.showInstructorGradeSection && showInstructorApplicationSections ? (
          <DetailInfoForm title="강사 등급" mode="edit" className="instructor-register-modal__grade-section">
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="강사비 등급"
                view="-"
                edit={
                  <div className="instructor-register-modal__fee-grade-select">
                    <Form.Item name="instructorFeeGrade" noStyle>
                      <CmsSelect
                        placeholder="강사비 등급을 선택하세요"
                        options={INSTRUCTOR_FEE_GRADE_OPTIONS}
                        inputSize="large"
                        width="100%"
                        allowClear
                      />
                    </Form.Item>
                  </div>
                }
              />
              <DetailInfoForm.Field
                label="JA 평가 등급"
                view="-"
                edit={
                  <div className="instructor-register-modal__ja-grade-field">
                    <Form.Item name="jaEvaluationGrade" hidden noStyle>
                      <CmsInput />
                    </Form.Item>
                    {jaEvaluationGradeFieldEdit}
                  </div>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        ) : null}

        <DetailInfoForm
          title={formLayout.consent.title}
          mode="edit"
          description={formLayout.consent.description}
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
                      {/* 상세 수정: 필수 약관 변경 불가 (FE/BE 공통) */}
                      <CmsRadioGroup
                        options={CONSENT_RADIO_OPTIONS}
                        size="large"
                        disabled={isDetailEdit}
                      />
                    </Form.Item>
                  }
                />
                <DetailInfoForm.Field
                  label="개인정보 수집·이용 동의"
                  labelWidth={TERMS_CONSENT_LABEL_WIDTH}
                  view="-"
                  edit={
                    <Form.Item name="consentPersonal" noStyle>
                      <CmsRadioGroup
                        options={CONSENT_RADIO_OPTIONS}
                        size="large"
                        disabled={isDetailEdit}
                      />
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
                    <Form.Item name="consentPortrait" noStyle>
                      <ConsentDocumentFieldEdit
                        onWrite={() => handleConsentWrite('consentPortrait')}
                      />
                    </Form.Item>
                  }
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>

            {showInstructorConsentDocuments ? (
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
                    <Form.Item name="consentPaymentStatement" noStyle>
                      <ConsentDocumentFieldEdit
                        onWrite={() => handleConsentWrite('consentPaymentStatement')}
                      />
                    </Form.Item>
                  }
                />
                <DetailInfoForm.Field
                  label="교육진행자 서약서"
                  labelWidth={TERMS_CONSENT_LABEL_WIDTH}
                  view="-"
                  edit={
                    <Form.Item name="consentEducatorPledge" noStyle>
                      <ConsentDocumentFieldEdit
                        onWrite={() => handleConsentWrite('consentEducatorPledge')}
                      />
                    </Form.Item>
                  }
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="행정정보 공동이용 사전동의서"
                  labelWidth={TERMS_CONSENT_LABEL_WIDTH}
                  view="-"
                  edit={
                    <Form.Item name="consentAdministrativeJoint" noStyle>
                      <ConsentDocumentFieldEdit
                        onWrite={() => handleConsentWrite('consentAdministrativeJoint')}
                      />
                    </Form.Item>
                  }
                />
                <DetailInfoForm.Field
                  label="성범죄 경력 조회 동의서"
                  labelWidth={TERMS_CONSENT_LABEL_WIDTH}
                  view="-"
                  edit={
                    <Form.Item name="consentSexOffenseCheck" noStyle>
                      <ConsentDocumentFieldEdit
                        onWrite={() => handleConsentWrite('consentSexOffenseCheck')}
                      />
                    </Form.Item>
                  }
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
            ) : null}
          </div>
        </DetailInfoForm>

        {showInstructorApplicationSections ? (
          <>
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
                            <InstructorCareerRowEdit
                              key={field.key}
                              form={form}
                              field={field}
                              index={index}
                              onAdd={() => add({ ...EMPTY_CAREER })}
                              onRemove={() => remove(field.name)}
                            />
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
                                  placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.jaPeriodStart}
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
                                  placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.jaPeriodEnd}
                                  format="YYYY.MM.DD"
                                  width={140}
                                />
                              </Form.Item>
                            </div>
                            <DetailInfoForm.InputsSeparator />
                            <div className="instructor-register-modal__inline-group">
                              <Form.Item name={[field.name, 'title']} noStyle>
                                <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.jaProgramName} inputSize="medium" width={220} />
                              </Form.Item>
                              <Form.Item name={[field.name, 'note']} noStyle>
                                <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.jaNote} inputSize="medium" width={160} />
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
                                placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.licenseYear}
                                format="YYYY"
                                width={140}
                              />
                            </Form.Item>
                            <DetailInfoForm.InputsSeparator />
                            <div className="instructor-register-modal__inline-group">
                              <Form.Item name={[field.name, 'title']} noStyle>
                                <CmsInput
                                  placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.licenseTitle}
                                  inputSize="medium"
                                  width={220}
                                />
                              </Form.Item>
                              <Form.Item name={[field.name, 'issuer']} noStyle>
                                <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.licenseIssuer} inputSize="medium" width={160} />
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
                                placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.awardYear}
                                format="YYYY"
                                width={140}
                              />
                            </Form.Item>
                            <DetailInfoForm.InputsSeparator />
                            <div className="instructor-register-modal__inline-group">
                              <Form.Item name={[field.name, 'title']} noStyle>
                                <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.awardTitle} inputSize="medium" width={220} />
                              </Form.Item>
                              <Form.Item name={[field.name, 'issuer']} noStyle>
                                <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.licenseIssuer} inputSize="medium" width={160} />
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
          description={INSTRUCTOR_FORM_SECTION_DESCRIPTIONS.freeWrite}
          items={INSTRUCTOR_FREE_WRITE_ITEMS}
          rows={3}
          placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.freeWrite}
          className={isDetailEdit ? 'detail-info-form--gap-bottom' : undefined}
        />
          </>
        ) : null}
      </div>

      {activeConsentField != null &&
      activeConsentEntry != null &&
      isAgreementInstructorConsentField(activeConsentField) ? (
        <MemberConsentAgreementModal
          open
          templateId={activeConsentEntry.templateId}
          modalTitle={activeConsentEntry.modalTitle}
          {...consentAutofillProps}
          onClose={handleConsentModalClose}
          onComplete={() => handleConsentComplete(activeConsentField)}
        />
      ) : null}

      {activeConsentField != null && isInstructorCrimeConsentField(activeConsentField) ? (
        <MemberConsentCrimeModal
          open
          onClose={handleConsentModalClose}
          onComplete={() => handleConsentComplete(activeConsentField)}
        />
      ) : null}
    </>
  )
}
