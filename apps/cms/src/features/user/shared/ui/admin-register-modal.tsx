import { useEffect } from 'react'
import { Form } from 'antd'
import { CmsButton, CmsInput, CmsRadioGroup, ContentModal } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'

const FORM_ID = 'cms-admin-register-modal-form'

type ConsentValue = 'agree' | 'disagree'
type GenderValue = 'male' | 'female'

export interface AdminRegisterModalFormValues {
  name: string
  nameEn?: string
  gender: GenderValue
  birthDate?: string
  contact: string
  email: string
  consentPersonalInfo: ConsentValue
  consentMarketing: ConsentValue
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
  nameEn: '',
  gender: 'male',
  birthDate: '',
  contact: '',
  email: '',
  consentPersonalInfo: 'agree',
  consentMarketing: 'agree',
}

export function AdminRegisterModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: AdminRegisterModalProps) {
  const [form] = Form.useForm<AdminRegisterModalFormValues>()
  const nameValue = Form.useWatch('name', form)
  const isSubmitDisabled = loading || !nameValue?.trim()

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
    if (onSubmit) {
      await onSubmit({
        ...values,
        name: values.name.trim(),
        nameEn: values.nameEn?.trim(),
        birthDate: values.birthDate?.trim(),
        contact: values.contact.trim(),
        email: values.email.trim(),
      })
    }
    handleClose()
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
            type="button"
            onClick={() => form.submit()}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <DetailInfoForm title="기본 정보" mode="edit">
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.NameBlock
                rows={[
                  {
                    subLabel: '한글 *',
                    main: (
                      <Form.Item
                        name="name"
                        required
                        noStyle
                        rules={[{ required: true }]}
                      >
                        <CmsInput placeholder="한글 성명" inputSize="medium" width="100%" />
                      </Form.Item>
                    ),
                    sideLabel: '성별',
                    side: (
                      <Form.Item name="gender" noStyle>
                        <CmsRadioGroup options={GENDER_OPTIONS} size="medium" />
                      </Form.Item>
                    ),
                  },
                  {
                    subLabel: '영문',
                    main: (
                      <Form.Item name="nameEn" noStyle>
                        <CmsInput placeholder="영문 성명" inputSize="medium" width="100%" />
                      </Form.Item>
                    ),
                    sideLabel: '생년월일',
                    side: (
                      <Form.Item
                        name="birthDate"
                        noStyle
                      >
                        <CmsInput
                          placeholder="생년월일 8자리"
                          maxLength={8}
                          inputSize="medium"
                          width="100%"
                        />
                      </Form.Item>
                    ),
                  },
                ]}
              />
            </DetailInfoForm.Row>

            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="연락처"
                view="-"
                edit={
                  <Form.Item
                    name="contact"
                    noStyle
                  >
                    <CmsInput placeholder="연락처" inputSize="medium" width="100%" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="이메일"
                view="-"
                edit={
                  <Form.Item
                    name="email"
                    noStyle
                  >
                    <CmsInput placeholder="이메일" inputSize="medium" width="100%" />
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
                    <CmsRadioGroup options={CONSENT_OPTIONS} size="medium" />
                  </Form.Item>
                }
              />
              <DetailInfoForm.Field
                label="마케팅 제공 동의"
                view="-"
                edit={
                  <Form.Item name="consentMarketing" noStyle>
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
