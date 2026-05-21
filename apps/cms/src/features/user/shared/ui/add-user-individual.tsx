import { useMemo } from 'react'
import { Form, Space } from 'antd'
import type { CreateUserRequest } from '@/entities/user/api/user-service'
import { mockSchools } from '@/data/mock/schools'
import {
  AddressSearch,
  CmsButton,
  CmsInput,
  CmsInputSearch,
  CmsRadioGroup,
  CmsSelect } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import './add-user-individual.css'
import { FORM_INPUTS_2_WIDTHS } from '@/features/template/constants/form-input-widths'

/** 신규 등록 소속 검색용 — `mockSchools` 학교명 (추후 API 연동 시 제거) */
function buildAffiliationSchoolOptions(): readonly string[] {
  const names = mockSchools.map(s => s.name.trim()).filter(Boolean)
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'ko'))
}

type ConsentValue = 'agree' | 'disagree'

interface AddUserIndividualFormValues {
  name: string
  englishName: string
  residentRegistrationFirst?: string
  residentRegistrationLast?: string
  affiliation?: string
  contact?: string
  email: string
  memberType: 'individual'
  volunteerId?: string
  address: string
  detailAddress?: string
  oneLineIntro?: string
  consentPersonalInfo: ConsentValue
  consentMarketing: ConsentValue
  consentPortrait: ConsentValue
  consentWithholdingTax: ConsentValue
}

interface AddUserIndividualProps {
  onSubmit: (request: CreateUserRequest) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const CONSENT_RADIO_OPTIONS = [
  { label: '동의', value: 'agree' },
  { label: '미동의', value: 'disagree' },
]

const INITIAL_VALUES: AddUserIndividualFormValues = {
  name: '',
  englishName: '',
  residentRegistrationFirst: '',
  residentRegistrationLast: '',
  affiliation: '',
  contact: '',
  email: '',
  memberType: 'individual',
  volunteerId: '',
  address: '',
  detailAddress: '',
  oneLineIntro: '',
  consentPersonalInfo: 'agree',
  consentMarketing: 'agree',
  consentPortrait: 'agree',
  consentWithholdingTax: 'agree' }

export function AddUserIndividual({ onSubmit, onCancel, loading = false }: AddUserIndividualProps) {
  const affiliationSchoolOptions = useMemo(() => buildAffiliationSchoolOptions(), [])
  const [form] = Form.useForm<AddUserIndividualFormValues>()
  const allValues = Form.useWatch([], form) as AddUserIndividualFormValues | undefined
  const address = Form.useWatch('address', form) ?? ''
  const consentPortrait = Form.useWatch('consentPortrait', form)
  const consentWithholdingTax = Form.useWatch('consentWithholdingTax', form)
  const canSubmit =
    Boolean(allValues?.name?.trim()) &&
    Boolean(allValues?.englishName?.trim()) &&
    Boolean(allValues?.residentRegistrationFirst?.trim()) &&
    Boolean(allValues?.residentRegistrationLast?.trim()) &&
    Boolean(allValues?.contact?.trim()) &&
    Boolean(allValues?.email?.trim()) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(allValues?.email?.trim() ?? '')

  const handleFinish = async (values: AddUserIndividualFormValues) => {
    const request: CreateUserRequest = {
      email: values.email.trim(),
      password: 'Temp1234!',
      name: values.name.trim(),
      phone: values.contact?.trim() || undefined,
      role: 'INDIVIDUAL',
      isActive: true }
    await onSubmit(request)
    form.resetFields()
  }

  const handleConsentDraft = () => {
    window.alert('준비 중입니다')
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={INITIAL_VALUES}
      onFinish={values => void handleFinish(values)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <DetailInfoForm title="기본 정보" mode="edit">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="한글 성명"
              required
              view="-"
              edit={
                <Form.Item
                  name="name"
                  noStyle
                  rules={[{ required: true }]}
                >
                  <CmsInput placeholder="한글 성명" inputSize="medium" width="100%" />
                </Form.Item>
              }
            />
            <DetailInfoForm.Field
              label="영문 성명"
              required
              view="-"
              edit={
                <Form.Item
                  name="englishName"
                  noStyle
                  rules={[{ required: true }]}
                >
                  <CmsInput placeholder="영문 성명" inputSize="medium" width="100%" />
                </Form.Item>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="주민등록 번호"
              required
              view="-"
              edit={
                <Space.Compact style={{ width: '100%', alignItems: 'center' }}>
                  <Form.Item
                    name="residentRegistrationFirst"
                    noStyle
                    rules={[{ required: true }]}
                  >
                    <CmsInput
                      placeholder="주민등록 앞 6자리"
                      maxLength={6}
                      inputSize="medium"
                      width="100%"
                    />
                  </Form.Item>
                  <div style={{ margin: '0 8px', height: '100%' }}>-</div>
                  <Form.Item
                    name="residentRegistrationLast"
                    noStyle
                    rules={[{ required: true }]}
                  >
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
                  <Form.Item name="affiliation" noStyle>
                    <CmsInputSearch
                      options={affiliationSchoolOptions}
                      placeholder="학교명"
                      inputSize="medium"
                      width={FORM_INPUTS_2_WIDTHS[0]}
                    />
                  </Form.Item>
                  <DetailInfoForm.InputsSeparator />
                  <CmsSelect
                    placeholder="학년"
                    inputSize="medium"
                    width={FORM_INPUTS_2_WIDTHS[1]}
                    options={[
                      { label: '1학년', value: '1학년' },
                      { label: '2학년', value: '2학년' },
                      { label: '3학년', value: '3학년' },
                      { label: '4학년', value: '4학년' },
                      { label: '5학년', value: '5학년' },
                      { label: '6학년', value: '6학년' },
                    ]}
                  />
                </div>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="연락처"
              required
              view="-"
              edit={
                <Form.Item
                  name="contact"
                  noStyle
                  rules={[{ required: true }]}
                >
                  <CmsInput placeholder="연락처" inputSize="medium" width="100%" />
                </Form.Item>
              }
            />
            <DetailInfoForm.Field
              label="이메일"
              required
              view="-"
              edit={
                <Form.Item
                  name="email"
                  noStyle
                  rules={[
                    { required: true },
                    { type: 'email' },
                  ]}
                >
                  <CmsInput placeholder="이메일" inputSize="medium" width="100%" />
                </Form.Item>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="1365 ID"
              fullRow
              view="-"
              edit={
                <Form.Item name="volunteerId" noStyle>
                  <CmsInput placeholder="1365 ID" inputSize="medium" width="100%" />
                </Form.Item>
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
                  <Form.Item
                    name="address"
                    noStyle
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
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="개인정보 수집 동의"
              view="-"
              edit={
                <Form.Item name="consentPersonalInfo" noStyle>
                  <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} />
                </Form.Item>
              }
            />
            <DetailInfoForm.Field
              label="마케팅 제공 동의"
              view="-"
              edit={
                <Form.Item name="consentMarketing" noStyle>
                  <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} />
                </Form.Item>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="초상권 수집·이용 동의"
              fullRow
              view="-"
              edit={
                <Space align="start" size={12}>
                  <Form.Item name="consentPortrait" noStyle>
                    <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} />
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
                  <div className="add-user-individual__consent-guide">
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
              fullRow
              view="-"
              edit={
                <Space align="start" size={12}>
                  <Form.Item name="consentWithholdingTax" noStyle>
                    <CmsRadioGroup options={CONSENT_RADIO_OPTIONS} />
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
                  <div className="add-user-individual__consent-guide">
                    <p>- 작성 버튼을 눌러 동의서를 작성 및 제출해주세요.</p>
                    <p>- 제출까지 완료되어야 동의된 것으로 간주됩니다.</p>
                  </div>
                </Space>
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
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
    </Form>
  )
}
