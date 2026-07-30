import { useMemo, useState, type ReactNode } from 'react'
import { Form, Space } from 'antd'
import type { FormInstance } from 'antd/es/form'
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
  SchoolSearch,
} from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { FreeWriteItemsSection } from '@/shared/components/free-write-items-section'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { FORM_INPUTS_2_WIDTHS } from '@/features/template/constants/form-input-widths'
import { CmsDateTextInput } from '@/shared/ui/date-text-input'
import type { MemberConsentMemberContext } from '@/features/user/shared/lib/build-member-portrait-consent-draft'
import { INSTRUCTOR_PORTRAIT_CONSENT_AFFILIATION_OPTIONS } from '@/features/user/shared/lib/instructor-portrait-consent-affiliation-options'
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
  INITIAL_VALUES,
  INSTRUCTOR_FREE_WRITE_ITEMS,
  MEMBER_TYPE_OPTIONS,
  TERMS_CONSENT_DESCRIPTION,
  TERMS_CONSENT_LABEL_WIDTH,
  type ConsentValue,
  type InstructorProfileFormValues,
} from './instructor-profile-form-model'
import '../instructor-register-modal.css'

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

export interface InstructorProfileFormBodyProps {
  form: FormInstance<InstructorProfileFormValues>
  /** Extra rows injected at top of 기본 정보 DetailInfoForm (before 성명) — e.g. 정산현황/JA등급 for detail edit */
  basicInfoPrefix?: ReactNode
  /** Extra rows before 사업소득자 (e.g. 강사비 등급) */
  basicInfoExtraBeforeBusinessIncome?: ReactNode
  className?: string
}

export function InstructorProfileFormBody({
  form,
  basicInfoPrefix,
  basicInfoExtraBeforeBusinessIncome,
  className,
}: InstructorProfileFormBodyProps) {
  const [activeConsentField, setActiveConsentField] = useState<InstructorConsentFieldKey | null>(
    null
  )
  const homeAddress = Form.useWatch('homeAddress', form) ?? ''
  const memberType = Form.useWatch('memberType', form) ?? 'general'
  const memberName = Form.useWatch('name', form) ?? ''
  const schoolName = Form.useWatch('schoolName', form) ?? ''
  const affiliationNone = Form.useWatch('affiliationNone', form) === true
  const isTeacherMember = memberType === 'school_teacher'
  const allValues = Form.useWatch([], form) as InstructorProfileFormValues | undefined
  const careerLevel = Form.useWatch('careerLevel', form) ?? 'new'

  const activeConsentEntry =
    activeConsentField != null ? resolveInstructorConsentTemplateEntry(activeConsentField) : null

  const memberConsentContext = useMemo((): MemberConsentMemberContext => {
    return {
      name: memberName,
      schoolEnrollmentStatus: isTeacherMember ? 'enrolled' : 'not_enrolled',
      schoolName: isTeacherMember ? schoolName : undefined,
      portraitAffiliationSelectOptions: INSTRUCTOR_PORTRAIT_CONSENT_AFFILIATION_OPTIONS,
    }
  }, [isTeacherMember, memberName, schoolName])

  const handleConsentWrite = (fieldKey: InstructorConsentFieldKey) => {
    setActiveConsentField(fieldKey)
  }

  const handleConsentModalClose = () => {
    setActiveConsentField(null)
  }

  const handleConsentComplete = (fieldKey: InstructorConsentFieldKey) => {
    form.setFieldValue(fieldKey, 'agree')
    setActiveConsentField(null)
  }

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
                        onChange={nextSchoolName => form.setFieldValue('schoolName', nextSchoolName)}
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
                        onWrite={() => handleConsentWrite('consentPaymentStatement')}
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
                        onWrite={() => handleConsentWrite('consentEducatorPledge')}
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
                        onWrite={() => handleConsentWrite('consentAdministrativeJoint')}
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
                          allValues?.consentSexOffenseCheck ?? INITIAL_VALUES.consentSexOffenseCheck
                        }
                        onWrite={() => handleConsentWrite('consentSexOffenseCheck')}
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
                                  <CmsInput placeholder="담당 업무" inputSize="medium" width={160} />
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
                                <CmsInput placeholder="프로그램명" inputSize="medium" width={220} />
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
                                <CmsInput placeholder="수상/수료명" inputSize="medium" width={220} />
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

      {activeConsentField != null &&
      activeConsentEntry != null &&
      isAgreementInstructorConsentField(activeConsentField) ? (
        <MemberConsentAgreementModal
          open
          templateId={activeConsentEntry.templateId}
          modalTitle={activeConsentEntry.modalTitle}
          memberContext={memberConsentContext}
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
