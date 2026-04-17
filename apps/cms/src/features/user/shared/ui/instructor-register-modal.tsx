/**
 * 강사 회원 관리 — 강사 추가 등록 모달
 * - `ContentModal` + `DetailInfoForm` + CMS 입력 컴포넌트 (회원 신규 등록·학교 등록 모달과 동일 계열)
 * - 필드 검증 규칙·제출 버튼 비활성 조건은 두지 않음(요청 사양)
 */

import { useCallback, useEffect, useState } from 'react'
import { Form, Space } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import {
  AddressSearch,
  CmsButton,
  CmsCheckbox,
  CmsDatePicker,
  CmsInput,
  CmsRadioGroup,
  CmsSelect,
  ContentModal,
} from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { FreeWriteItemsSection } from '@/shared/components/free-write-items-section'
import { FORM_INPUTS_2_WIDTHS } from '@/features/template/constants/form-input-widths'
import './instructor-register-modal.css'

const FORM_ID = 'cms-instructor-register-modal-form'

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

const BUSINESS_INCOME_OPTIONS = [
  { label: '해당', value: 'yes' },
  { label: '해당 없음', value: 'no' },
]

const CAREER_LEVEL_OPTIONS = [
  { label: '신입', value: 'new' },
  { label: '경력', value: 'experienced' },
]

const AFFILIATION_CATEGORY_OPTIONS = [
  { label: '교사', value: 'teacher' },
  { label: '대학(원)생', value: 'student' },
  { label: '직장인', value: 'worker' },
  { label: '기타', value: 'other' },
]

const FEE_GRADE_OPTIONS = [
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
]

const BANK_OPTIONS = [
  { label: '국민은행', value: 'kb' },
  { label: '신한은행', value: 'shinhan' },
  { label: '우리은행', value: 'woori' },
  { label: '하나은행', value: 'hana' },
]

const EDU_LEVEL_OPTIONS = [
  { label: '학력 단계', value: '' },
  { label: '고등학교', value: 'high' },
  { label: '대학교', value: 'univ' },
  { label: '대학원', value: 'grad' },
]

const EDU_STATUS_OPTIONS = [
  { label: '상태', value: '' },
  { label: '재학', value: 'enrolled' },
  { label: '졸업', value: 'graduated' },
  { label: '수료', value: 'completed' },
]

type CareerRow = {
  companyName: string
  roleName: string
  /** 월 단위 `Dayjs` (`CmsDatePicker` `picker="month"`) */
  periodStart: Dayjs | null
  periodEnd: Dayjs | null
  currentlyEmployed: boolean
}

type SimpleDatedRow = {
  title: string
  orgOrNote: string
  acquiredOrDate: string
}

export type InstructorRegisterModalFormValues = {
  nameKo: string
  nameEn: string
  residentFront: string
  residentBack: string
  affiliationCategory: string
  affiliationCareer: string
  contact: string
  email: string
  isBusinessIncome: 'yes' | 'no'
  feeGrade: string
  bankName: string
  accountNumber: string
  accountHolder: string
  homeAddress: string
  homeAddressDetail: string
  oneLineIntro: string
  consentPersonal: ConsentValue
  consentMarketing: ConsentValue
  consentPortrait: ConsentValue
  consentPaymentStatement: ConsentValue
  consentSexOffenseCheck: ConsentValue
  /** 행정정보 공동이용 사전 동의 */
  consentAdministrativeJoint: ConsentValue
  eduLevel: string
  eduStatus: string
  universityName: string
  universityMajor: string
  universityAdmitYear: string
  universityGradYear: string
  careerLevel: 'new' | 'experienced'
  careers: CareerRow[]
  jaKoreaRows: SimpleDatedRow[]
  licenseRows: SimpleDatedRow[]
  awardRows: SimpleDatedRow[]
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

const EMPTY_SIMPLE_ROW: SimpleDatedRow = {
  title: '',
  orgOrNote: '',
  acquiredOrDate: '',
}

const INITIAL_VALUES: InstructorRegisterModalFormValues = {
  nameKo: '',
  nameEn: '',
  residentFront: '',
  residentBack: '',
  affiliationCategory: '',
  affiliationCareer: '',
  contact: '',
  email: '',
  isBusinessIncome: 'no',
  feeGrade: '',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  homeAddress: '',
  homeAddressDetail: '',
  oneLineIntro: '',
  consentPersonal: 'agree',
  consentMarketing: 'agree',
  consentPortrait: 'agree',
  consentPaymentStatement: 'agree',
  consentSexOffenseCheck: 'agree',
  consentAdministrativeJoint: 'agree',
  eduLevel: '',
  eduStatus: '',
  universityName: '',
  universityMajor: '',
  universityAdmitYear: '',
  universityGradYear: '',
  careerLevel: 'new',
  careers: [],
  jaKoreaRows: [{ ...EMPTY_SIMPLE_ROW }],
  licenseRows: [{ ...EMPTY_SIMPLE_ROW }],
  awardRows: [{ ...EMPTY_SIMPLE_ROW }],
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

/** 동적 행 삭제 — 회색 원형 배경 + 흰색 X (쓰레기통 아이콘 미사용) */
function InstructorRegisterRowDeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="instructor-register-modal__row-delete-circle"
      onClick={onClick}
      aria-label="항목 삭제"
      title="항목 삭제"
    >
      <CloseOutlined className="instructor-register-modal__row-delete-circle-icon" aria-hidden />
    </button>
  )
}

export function InstructorRegisterModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: InstructorRegisterModalProps) {
  const [form] = Form.useForm<InstructorRegisterModalFormValues>()
  const homeAddress = Form.useWatch('homeAddress', form) ?? ''
  const consentPortrait = Form.useWatch('consentPortrait', form)
  const consentPaymentStatement = Form.useWatch('consentPaymentStatement', form)
  const consentSexOffenseCheck = Form.useWatch('consentSexOffenseCheck', form)
  const consentAdministrativeJoint = Form.useWatch('consentAdministrativeJoint', form)
  const careerLevel = Form.useWatch('careerLevel', form) ?? 'new'

  /** 행정정보 공동이용: 라디오 동의와 별도로, 동의서 제출 완료 후에만 `제출 완료` 노출 */
  const [administrativeJointDocumentSubmitted, setAdministrativeJointDocumentSubmitted] =
    useState(false)

  const handleConsentDraft = () => {
    window.alert('준비 중입니다')
  }

  const handleAdministrativeJointConsentDraft = useCallback(() => {
    window.alert('준비 중입니다')
    // 동의서 제출 플로우 연동 시: 전자서명/제출 API 성공 콜백에서만 true 설정
    // setAdministrativeJointDocumentSubmitted(true)
  }, [])

  useEffect(() => {
    if (open) {
      form.setFieldsValue(INITIAL_VALUES)
      setAdministrativeJointDocumentSubmitted(false)
    }
  }, [open, form])

  useEffect(() => {
    if (consentAdministrativeJoint !== 'agree') {
      setAdministrativeJointDocumentSubmitted(false)
    }
  }, [consentAdministrativeJoint])

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

  const handleAddCareerRow = useCallback(() => {
    const current = (form.getFieldValue('careers') ?? []) as CareerRow[]
    form.setFieldValue('careers', [...current, { ...EMPTY_CAREER }])
  }, [form])

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

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="강사 추가 등록"
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
          <CmsButton variant="primary" size="medium" type="submit" form={FORM_ID} loading={loading}>
            추가 등록
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
        onFinish={values => void handleFinish(values)}
      >
        <div className="instructor-register-modal__stack">
          <DetailInfoForm title="기본 정보" mode="edit">
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="한글 성명"
                view="-"
                edit={
                  <Form.Item name="nameKo" noStyle>
                    <CmsInput placeholder="한글 성명" inputSize="medium" width="100%" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="영문 성명"
                view="-"
                edit={
                  <Form.Item name="nameEn" noStyle>
                    <CmsInput placeholder="영문 성명" inputSize="medium" width="100%" />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="주민등록 번호"
                view="-"
                edit={
                  <Space.Compact style={{ width: '100%', alignItems: 'center' }}>
                    <Form.Item name="residentFront" noStyle>
                      <CmsInput
                        placeholder="주민등록 앞 6자리"
                        maxLength={6}
                        inputSize="medium"
                        width="100%"
                      />
                    </Form.Item>
                    <span className="instructor-register-modal__hyphen" aria-hidden>
                      -
                    </span>
                    <Form.Item name="residentBack" noStyle>
                      <CmsInput
                        placeholder="주민등록 뒤 7자리"
                        maxLength={7}
                        inputSize="medium"
                        width="100%"
                      />
                    </Form.Item>
                  </Space.Compact>
                }
              />
              <DetailInfoForm.Field
                label="소속"
                view="-"
                edit={
                  <div className="detail-info-form-inputs-wrapper-no-gap">
                    <Form.Item name="affiliationCategory" noStyle>
                      <CmsSelect
                        placeholder="소속"
                        inputSize="medium"
                        width={FORM_INPUTS_2_WIDTHS[0]}
                        options={AFFILIATION_CATEGORY_OPTIONS}
                      />
                    </Form.Item>
                    <DetailInfoForm.InputsSeparator />
                    <Form.Item name="affiliationCareer" noStyle>
                      <CmsInput
                        placeholder="강사 경력"
                        inputSize="medium"
                        width={FORM_INPUTS_2_WIDTHS[1]}
                      />
                    </Form.Item>
                  </div>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="연락처"
                view="-"
                edit={
                  <Form.Item name="contact" noStyle>
                    <CmsInput placeholder="연락처" inputSize="medium" width="100%" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="이메일"
                view="-"
                edit={
                  <Form.Item name="email" noStyle>
                    <CmsInput placeholder="이메일" inputSize="medium" width="100%" />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="사업소득자 여부"
                view="-"
                edit={
                  <Form.Item name="isBusinessIncome" noStyle>
                    <CmsRadioGroup options={BUSINESS_INCOME_OPTIONS} size="medium" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="강사비 등급"
                view="-"
                edit={
                  <Form.Item name="feeGrade" noStyle>
                    <CmsSelect
                      placeholder="산정 등급"
                      inputSize="medium"
                      width="100%"
                      options={FEE_GRADE_OPTIONS}
                    />
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
                  <div className="detail-info-form-inputs-wrapper-no-gap">
                    <Form.Item name="bankName" noStyle>
                      <CmsSelect
                        placeholder="은행명"
                        inputSize="medium"
                        width="32%"
                        options={BANK_OPTIONS}
                      />
                    </Form.Item>
                    <DetailInfoForm.InputsSeparator />
                    <Form.Item name="accountNumber" noStyle>
                      <CmsInput placeholder="계좌번호(숫자만)" inputSize="medium" width="34%" />
                    </Form.Item>
                    <DetailInfoForm.InputsSeparator />
                    <Form.Item name="accountHolder" noStyle>
                      <CmsInput placeholder="예금주명" inputSize="medium" width="34%" />
                    </Form.Item>
                  </div>
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
                label="한 줄 소개"
                fullRow
                view="-"
                edit={
                  <Form.Item name="oneLineIntro" noStyle>
                    <CmsInput placeholder="자유롭게 작성해주세요" inputSize="medium" width="100%" />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <DetailInfoForm
            title="정보 제공 동의"
            mode="edit"
            description="*미동의 시 프로그램 신청 및 활동에 제한이 있을 수 있습니다."
            className="instructor-register-modal__consent-section"
          >
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="개인정보 수집 동의"
                labelWidth={240}
                view="-"
                edit={
                  <Form.Item name="consentPersonal" noStyle>
                    <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="medium" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="마케팅 제공 동의"
                labelWidth={240}
                view="-"
                edit={
                  <Form.Item name="consentMarketing" noStyle>
                    <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="medium" />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="초상권 수집·이용 동의"
                labelWidth={240}
                fullRow
                view="-"
                edit={
                  <Space
                    align="center"
                    size={12}
                    wrap
                    className="instructor-register-modal__consent-actions"
                  >
                    <Form.Item name="consentPortrait" noStyle>
                      <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="medium" />
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
                    <div className="instructor-register-modal__consent-guide">
                      <p>- 작성 버튼을 눌러 동의서를 작성 및 제출해주세요.</p>
                      <p>- 제출까지 완료되어야 동의된 것으로 간주됩니다.</p>
                    </div>
                  </Space>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="지급조서 작성 동의"
                labelWidth={240}
                fullRow
                view="-"
                edit={
                  <Space
                    align="center"
                    size={12}
                    wrap
                    className="instructor-register-modal__consent-actions"
                  >
                    <Form.Item name="consentPaymentStatement" noStyle>
                      <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="medium" />
                    </Form.Item>
                    <DetailInfoForm.InputsSeparator />
                    <CmsButton
                      variant="secondary"
                      size="medium"
                      type="button"
                      disabled={consentPaymentStatement !== 'agree'}
                      onClick={handleConsentDraft}
                    >
                      동의서 작성
                    </CmsButton>
                    <div className="instructor-register-modal__consent-guide">
                      <p>- 작성 버튼을 눌러 동의서를 작성 및 제출해주세요.</p>
                      <p>- 제출까지 완료되어야 동의된 것으로 간주됩니다.</p>
                    </div>
                  </Space>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="성범죄 경력조회 동의"
                labelWidth={240}
                fullRow
                view="-"
                edit={
                  <Space
                    align="center"
                    size={12}
                    wrap
                    className="instructor-register-modal__consent-actions"
                  >
                    <Form.Item name="consentSexOffenseCheck" noStyle>
                      <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="medium" />
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
                    <div className="instructor-register-modal__consent-guide">
                      <p>- 작성 버튼을 눌러 동의서를 작성 및 제출해주세요.</p>
                      <p>- 제출까지 완료되어야 동의된 것으로 간주됩니다.</p>
                    </div>
                  </Space>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="행정정보 공동이용 사전 동의"
                labelWidth={240}
                fullRow
                view="-"
                edit={
                  <Space
                    align="center"
                    size={12}
                    wrap
                    className="instructor-register-modal__consent-actions"
                  >
                    <Form.Item name="consentAdministrativeJoint" noStyle>
                      <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} size="medium" />
                    </Form.Item>
                    <DetailInfoForm.InputsSeparator />
                    {consentAdministrativeJoint === 'agree' &&
                    administrativeJointDocumentSubmitted ? (
                      <div className="instructor-register-modal__consent-submit-inline">
                        <CmsButton
                          variant="primary"
                          size="medium"
                          type="button"
                          onClick={handleAdministrativeJointConsentDraft}
                        >
                          동의서 수정
                        </CmsButton>
                        <span className="instructor-register-modal__consent-status">제출 완료</span>
                      </div>
                    ) : consentAdministrativeJoint === 'agree' ? (
                      <>
                        <CmsButton
                          variant="secondary"
                          size="medium"
                          type="button"
                          onClick={handleAdministrativeJointConsentDraft}
                        >
                          동의서 작성
                        </CmsButton>
                        <span className="instructor-register-modal__consent-status instructor-register-modal__consent-status--pending">
                          제출 대기
                        </span>
                        <div className="instructor-register-modal__consent-guide">
                          <p>- 작성 버튼을 눌러 동의서를 작성 및 제출해주세요.</p>
                          <p>- 제출까지 완료되어야 동의된 것으로 간주됩니다.</p>
                        </div>
                      </>
                    ) : (
                      <CmsButton variant="secondary" size="medium" type="button" disabled>
                        동의서 작성
                      </CmsButton>
                    )}
                  </Space>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <DetailInfoForm title="학력사항" message="최종학력 정보 노출" mode="edit">
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="최종 학력"
                fullRow
                view="-"
                edit={
                  <div className="detail-info-form-inputs-wrapper-no-gap">
                    <Form.Item name="eduLevel" noStyle>
                      <CmsSelect
                        inputSize="medium"
                        width={FORM_INPUTS_2_WIDTHS[0]}
                        options={EDU_LEVEL_OPTIONS}
                      />
                    </Form.Item>
                    <DetailInfoForm.InputsSeparator />
                    <Form.Item name="eduStatus" noStyle>
                      <CmsSelect
                        inputSize="medium"
                        width={FORM_INPUTS_2_WIDTHS[1]}
                        options={EDU_STATUS_OPTIONS}
                      />
                    </Form.Item>
                  </div>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="대학 4년제"
                fullRow
                view="-"
                edit={
                  <div className="detail-info-form-inputs-wrapper-no-gap">
                    <Form.Item name="universityName" noStyle>
                      <CmsInput placeholder="학교명" inputSize="medium" width="28%" />
                    </Form.Item>
                    <DetailInfoForm.InputsSeparator />
                    <Form.Item name="universityMajor" noStyle>
                      <CmsInput placeholder="전공" inputSize="medium" width="28%" />
                    </Form.Item>
                    <DetailInfoForm.InputsSeparator />
                    <Form.Item name="universityAdmitYear" noStyle>
                      <CmsInput placeholder="입학 연도" inputSize="medium" width="20%" />
                    </Form.Item>
                    <span className="instructor-register-modal__hyphen" aria-hidden>
                      ~
                    </span>
                    <Form.Item name="universityGradYear" noStyle>
                      <CmsInput placeholder="졸업 연도" inputSize="medium" width="20%" />
                    </Form.Item>
                  </div>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <DetailInfoForm
            title="경력사항"
            message="총 경력 정보 노출"
            mode="edit"
            titleTrailing={
              careerLevel === 'experienced' ? (
                <CmsButton
                  variant="primary"
                  size="medium"
                  type="button"
                  onClick={handleAddCareerRow}
                >
                  항목 추가
                </CmsButton>
              ) : null
            }
          >
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="경력 구분"
                labelWidth={240}
                fullRow
                view="-"
                edit={
                  <Form.Item name="careerLevel" noStyle>
                    <CmsRadioGroup options={CAREER_LEVEL_OPTIONS} size="medium" />
                  </Form.Item>
                }
              />
            </DetailInfoForm.Row>
            <Form.List name="careers">
              {(fields, { remove }) =>
                fields.map((field, index) => (
                  <DetailInfoForm.Row key={field.key} type="single">
                    <DetailInfoForm.Field
                      label={`경력 ${String(index + 1).padStart(2, '0')}`}
                      labelWidth={240}
                      fullRow
                      view="-"
                      edit={
                        <div className="detail-info-form-inputs-wrapper-no-gap">
                          <Form.Item name={[field.name, 'companyName']} noStyle>
                            <CmsInput placeholder="회사명" inputSize="medium" width="20%" />
                          </Form.Item>
                          <DetailInfoForm.InputsSeparator />
                          <Form.Item name={[field.name, 'roleName']} noStyle>
                            <CmsInput placeholder="담당 업무" inputSize="medium" width="20%" />
                          </Form.Item>
                          <DetailInfoForm.InputsSeparator />
                          <Form.Item name={[field.name, 'periodStart']} noStyle>
                            <CmsDatePicker
                              picker="month"
                              inputSize="medium"
                              placeholder="입사년월"
                              format="YYYY.MM"
                              width={140}
                            />
                          </Form.Item>
                          <span className="instructor-register-modal__hyphen" aria-hidden>
                            ~
                          </span>
                          <Form.Item name={[field.name, 'periodEnd']} noStyle>
                            <CmsDatePicker
                              picker="month"
                              inputSize="medium"
                              placeholder="퇴사년월"
                              format="YYYY.MM"
                              width={140}
                            />
                          </Form.Item>
                          <DetailInfoForm.InputsSeparator />
                          <Form.Item
                            name={[field.name, 'currentlyEmployed']}
                            valuePropName="checked"
                            noStyle
                          >
                            <CmsCheckbox checkboxSize="medium">재직중</CmsCheckbox>
                          </Form.Item>
                          <InstructorRegisterRowDeleteButton onClick={() => remove(field.name)} />
                        </div>
                      }
                    />
                  </DetailInfoForm.Row>
                ))
              }
            </Form.List>
          </DetailInfoForm>

          <Form.List name="jaKoreaRows">
            {(fields, { add, remove }) => (
              <DetailInfoForm
                title="JA Korea 활동 경험"
                message="총 참여 프로그램 수 노출"
                mode="edit"
                titleTrailing={
                  <CmsButton
                    variant="primary"
                    size="medium"
                    type="button"
                    onClick={() => add({ ...EMPTY_SIMPLE_ROW })}
                  >
                    항목 추가
                  </CmsButton>
                }
              >
                {fields.map((field, index) => (
                  <DetailInfoForm.Row key={field.key} type="single">
                    <DetailInfoForm.Field
                      label={`활동 ${String(index + 1).padStart(2, '0')}`}
                      labelWidth={240}
                      fullRow
                      view="-"
                      edit={
                        <div className="detail-info-form-inputs-wrapper-no-gap">
                          <Form.Item name={[field.name, 'title']} noStyle>
                            <CmsInput placeholder="프로그램명" inputSize="medium" width="28%" />
                          </Form.Item>
                          <DetailInfoForm.InputsSeparator />
                          <Form.Item name={[field.name, 'orgOrNote']} noStyle>
                            <CmsInput placeholder="비고" inputSize="medium" width="26%" />
                          </Form.Item>
                          <DetailInfoForm.InputsSeparator />
                          <Form.Item name={[field.name, 'acquiredOrDate']} noStyle>
                            <CmsInput placeholder="기간 또는 일자" inputSize="medium" width="26%" />
                          </Form.Item>
                          <InstructorRegisterRowDeleteButton onClick={() => remove(field.name)} />
                        </div>
                      }
                    />
                  </DetailInfoForm.Row>
                ))}
              </DetailInfoForm>
            )}
          </Form.List>

          <Form.List name="licenseRows">
            {(fields, { add, remove }) => (
              <DetailInfoForm
                title="자격 및 면허"
                message="총 취득 개수 노출"
                mode="edit"
                titleTrailing={
                  <CmsButton
                    variant="primary"
                    size="medium"
                    type="button"
                    onClick={() => add({ ...EMPTY_SIMPLE_ROW })}
                  >
                    항목 추가
                  </CmsButton>
                }
              >
                {fields.map((field, index) => (
                  <DetailInfoForm.Row key={field.key} type="single">
                    <DetailInfoForm.Field
                      label={`자격 및 면허 ${String(index + 1).padStart(2, '0')}`}
                      labelWidth={240}
                      fullRow
                      view="-"
                      edit={
                        <div className="detail-info-form-inputs-wrapper-no-gap">
                          <Form.Item name={[field.name, 'title']} noStyle>
                            <CmsInput placeholder="자격·면허명" inputSize="medium" width="28%" />
                          </Form.Item>
                          <DetailInfoForm.InputsSeparator />
                          <Form.Item name={[field.name, 'orgOrNote']} noStyle>
                            <CmsInput placeholder="발급기관" inputSize="medium" width="28%" />
                          </Form.Item>
                          <DetailInfoForm.InputsSeparator />
                          <Form.Item name={[field.name, 'acquiredOrDate']} noStyle>
                            <CmsInput placeholder="취득일" inputSize="medium" width="24%" />
                          </Form.Item>
                          <InstructorRegisterRowDeleteButton onClick={() => remove(field.name)} />
                        </div>
                      }
                    />
                  </DetailInfoForm.Row>
                ))}
              </DetailInfoForm>
            )}
          </Form.List>

          <Form.List name="awardRows">
            {(fields, { add, remove }) => (
              <DetailInfoForm
                title="수상 및 수료 내역"
                message="총 수상 개수 노출"
                mode="edit"
                titleTrailing={
                  <CmsButton
                    variant="primary"
                    size="medium"
                    type="button"
                    onClick={() => add({ ...EMPTY_SIMPLE_ROW })}
                  >
                    항목 추가
                  </CmsButton>
                }
              >
                {fields.map((field, index) => (
                  <DetailInfoForm.Row key={field.key} type="single">
                    <DetailInfoForm.Field
                      label={`수상 및 수료 ${String(index + 1).padStart(2, '0')}`}
                      labelWidth={240}
                      fullRow
                      view="-"
                      edit={
                        <div className="detail-info-form-inputs-wrapper-no-gap">
                          <Form.Item name={[field.name, 'title']} noStyle>
                            <CmsInput placeholder="수상·수료명" inputSize="medium" width="28%" />
                          </Form.Item>
                          <DetailInfoForm.InputsSeparator />
                          <Form.Item name={[field.name, 'orgOrNote']} noStyle>
                            <CmsInput placeholder="발급기관" inputSize="medium" width="28%" />
                          </Form.Item>
                          <DetailInfoForm.InputsSeparator />
                          <Form.Item name={[field.name, 'acquiredOrDate']} noStyle>
                            <CmsInput placeholder="일자" inputSize="medium" width="24%" />
                          </Form.Item>
                          <InstructorRegisterRowDeleteButton onClick={() => remove(field.name)} />
                        </div>
                      }
                    />
                  </DetailInfoForm.Row>
                ))}
              </DetailInfoForm>
            )}
          </Form.List>

          <FreeWriteItemsSection
            description="자유 작성 항목 1~4번 문항은 3장 이내 분량으로 작성, 내용과 형식은 자유롭게 기재 가능합니다."
            items={INSTRUCTOR_FREE_WRITE_ITEMS}
            rows={3}
            placeholder="자유롭게 작성해주세요"
          />
        </div>
      </Form>
    </ContentModal>
  )
}
