/**
 * 학교 신규 등록 모달
 * - 기관명: NEIS 학교 검색 (`SchoolSearch`)
 * - 기관 소재지: 학교 선택 시 도로명 주소 자동 반영 + 상세 주소 입력
 * - 선택 시 NEIS 코드·검색 지역(시/도·시/군/구)을 함께 보관해 등록 API에 전달
 */

import { useEffect } from 'react'
import { Form, Space } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form/detail-info-form'
import { CmsButton, CmsInput, ContentModal, SchoolSearch } from '@/shared/ui'
import type { SchoolSearchSelection, SchoolSearchSelectMeta } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'

const FORM_ID = 'cms-school-register-modal-form'

export type SchoolRegisterModalFormValues = {
  institutionName: string
  roadAddress: string
  detailAddress?: string
  neisCode?: string
  regionSido?: string
  regionSigungu?: string
  zipCode?: string
}

export interface SchoolRegisterModalProps {
  open: boolean
  onClose: () => void
  /** 검증 통과 후 호출. 실패 시 throw 하면 모달은 닫히지 않습니다. */
  onSubmit?: (values: SchoolRegisterModalFormValues) => Promise<void>
  loading?: boolean
}

const INITIAL_VALUES: SchoolRegisterModalFormValues = {
  institutionName: '',
  roadAddress: '',
  detailAddress: '',
  neisCode: '',
  regionSido: '',
  regionSigungu: '',
  zipCode: '',
}

const SCHOOL_REGISTER_MULTIPLE_VALIDATION_THRESHOLD = 2
const SCHOOL_REGISTER_MULTIPLE_VALIDATION_MESSAGE = '필수 항목을 모두 입력해 주세요.'

function normalizeSubmitValues(
  values: SchoolRegisterModalFormValues
): SchoolRegisterModalFormValues {
  return {
    ...values,
    institutionName: values.institutionName.trim(),
    roadAddress: values.roadAddress.trim(),
    detailAddress: values.detailAddress?.trim(),
    neisCode: values.neisCode?.trim() || undefined,
    regionSido: values.regionSido?.trim() || undefined,
    regionSigungu: values.regionSigungu?.trim() || undefined,
    zipCode: values.zipCode?.trim() || undefined,
  }
}

function collectSchoolRegisterValidationMessages(
  values: SchoolRegisterModalFormValues
): string[] {
  const messages: string[] = []

  if (!values.institutionName?.trim()) {
    messages.push('기관명을 검색해 주세요.')
  }
  if (!values.roadAddress?.trim()) {
    messages.push('기관 소재지를 입력해 주세요.')
  }

  return messages
}

export function SchoolRegisterModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: SchoolRegisterModalProps) {
  const { showAlert } = useCmsAlert()
  const [form] = Form.useForm<SchoolRegisterModalFormValues>()
  const institutionName = Form.useWatch('institutionName', form) ?? ''
  const roadAddress = Form.useWatch('roadAddress', form) ?? ''

  useEffect(() => {
    if (open) {
      form.setFieldsValue(INITIAL_VALUES)
    }
  }, [open, form])

  const handleSchoolSelect = (
    school: SchoolSearchSelection,
    meta: SchoolSearchSelectMeta
  ) => {
    form.setFieldsValue({
      institutionName: school.schulNm.trim(),
      roadAddress: school.orgRdnma.trim(),
      detailAddress: '',
      neisCode: school.sdSchulCode.trim(),
      regionSido: meta.regionSido,
      regionSigungu: meta.regionSigungu,
      zipCode: school.orgRdnzc.trim(),
    })
  }

  const handleFinish = async (values: SchoolRegisterModalFormValues) => {
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

  const handleSubmitAttempt = (values: SchoolRegisterModalFormValues) => {
    const messages = collectSchoolRegisterValidationMessages(values)
    if (messages.length > 0) {
      showAlert({
        title: '안내',
        content:
          messages.length >= SCHOOL_REGISTER_MULTIPLE_VALIDATION_THRESHOLD
            ? SCHOOL_REGISTER_MULTIPLE_VALIDATION_MESSAGE
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
      title="학교 신규 등록"
      width={800}
      className="school-register-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="medium" type="button" onClick={onClose}>
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
      <Form<SchoolRegisterModalFormValues>
        id={FORM_ID}
        form={form}
        layout="vertical"
        initialValues={INITIAL_VALUES}
        requiredMark={false}
        onFinish={handleSubmitAttempt}
      >
        <Form.Item name="neisCode" hidden>
          <input type="hidden" />
        </Form.Item>
        <Form.Item name="regionSido" hidden>
          <input type="hidden" />
        </Form.Item>
        <Form.Item name="regionSigungu" hidden>
          <input type="hidden" />
        </Form.Item>
        <Form.Item name="zipCode" hidden>
          <input type="hidden" />
        </Form.Item>
        <DetailInfoForm title="기본 정보" mode="edit">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="기관명"
              required
              view="-"
              edit={
                <Form.Item name="institutionName" noStyle>
                  <SchoolSearch
                    value={institutionName}
                    onChange={nextInstitutionName =>
                      form.setFieldValue('institutionName', nextInstitutionName)
                    }
                    onSelect={handleSchoolSelect}
                    placeholder="기관명"
                    inputSize="medium"
                    width="100%"
                  />
                </Form.Item>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="기관 소재지"
              required
              fullRow
              view="-"
              edit={
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="roadAddress" noStyle>
                    <CmsInput
                      value={roadAddress}
                      readOnly
                      disabled={!roadAddress.trim()}
                      placeholder="건물명, 도로명 또는 지번"
                      inputSize="medium"
                      width="100%"
                    />
                  </Form.Item>
                  <DetailInfoForm.InputsSeparator />
                  <Form.Item name="detailAddress" noStyle>
                    <CmsInput
                      placeholder="상세 주소"
                      inputSize="medium"
                      width="100%"
                      disabled={!roadAddress.trim()}
                    />
                  </Form.Item>
                </Space.Compact>
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </Form>
    </ContentModal>
  )
}
