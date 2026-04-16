/**
 * 학교 신규 등록 모달
 * - 스크린샷 스펙: 흰 헤더·진한 제목·우측 닫기(X) → `ContentModal`(공통 콘텐츠 모달)
 * - 본문: `DetailInfoForm` 격자 + `CmsInput` / `CmsSelect` / `AddressSearch` / `CmsButton`
 * - 기관 소재지: `Space.Compact` + `DetailInfoForm.InputsSeparator`(주소 검색 | 상세)
 */

import { useEffect, useMemo } from 'react'
import { Form, Space } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form/detail-info-form'
import { AddressSearch, CmsButton, CmsInput, CmsSelect, ContentModal } from '@/shared/ui'

const FORM_ID = 'cms-school-register-modal-form'

/** 기관 유형 미선택(필터 UI의 「전체」와 동일) */
export const SCHOOL_REGISTER_INSTITUTION_TYPE_ALL = 'ALL' as const

export type SchoolRegisterModalFormValues = {
  institutionName: string
  institutionType?: string
  roadAddress: string
  detailAddress?: string
}

export interface SchoolRegisterModalProps {
  open: boolean
  onClose: () => void
  /** 검증 통과 후 호출. 실패 시 throw 하면 모달은 닫히지 않습니다. */
  onSubmit?: (values: SchoolRegisterModalFormValues) => Promise<void>
  loading?: boolean
}

const INSTITUTION_TYPE_OPTIONS = [
  { label: '전체', value: SCHOOL_REGISTER_INSTITUTION_TYPE_ALL },
  { label: '유아/유치원생', value: 'preschool' },
  { label: '초등학교', value: 'elementary' },
  { label: '중학교', value: 'middle' },
  { label: '고등학교', value: 'high' },
  { label: '대학교', value: 'university' },
]

const INITIAL_VALUES: SchoolRegisterModalFormValues = {
  institutionName: '',
  institutionType: SCHOOL_REGISTER_INSTITUTION_TYPE_ALL,
  roadAddress: '',
  detailAddress: '',
}

function normalizeSubmitValues(
  values: SchoolRegisterModalFormValues
): SchoolRegisterModalFormValues {
  const institutionType =
    !values.institutionType || values.institutionType === SCHOOL_REGISTER_INSTITUTION_TYPE_ALL
      ? undefined
      : values.institutionType
  return {
    ...values,
    institutionName: values.institutionName.trim(),
    institutionType,
    roadAddress: values.roadAddress.trim(),
    detailAddress: values.detailAddress?.trim(),
  }
}

export function SchoolRegisterModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: SchoolRegisterModalProps) {
  const [form] = Form.useForm<SchoolRegisterModalFormValues>()
  const institutionName = Form.useWatch('institutionName', form) ?? ''
  const roadAddress = Form.useWatch('roadAddress', form) ?? ''

  const canSubmit = useMemo(
    () => Boolean(institutionName.trim()) && Boolean(roadAddress.trim()),
    [institutionName, roadAddress]
  )

  useEffect(() => {
    if (open) {
      form.setFieldsValue(INITIAL_VALUES)
    }
  }, [open, form])

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

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="학교 신규 등록"
      width={1000}
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
            disabled={!canSubmit || loading}
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
        onFinish={values => void handleFinish(values)}
      >
        <DetailInfoForm title="기본 정보" mode="edit">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="기관명"
              required
              view="-"
              edit={
                <Form.Item
                  name="institutionName"
                  noStyle
                  rules={[{ required: true, message: '기관명을 입력해주세요' }]}
                >
                  <CmsInput placeholder="기관명" inputSize="medium" width="100%" />
                </Form.Item>
              }
            />
            <DetailInfoForm.Field
              label="기관 유형"
              view="-"
              edit={
                <Form.Item name="institutionType" noStyle>
                  <CmsSelect inputSize="medium" width="100%" options={INSTITUTION_TYPE_OPTIONS} />
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
                  <Form.Item
                    name="roadAddress"
                    noStyle
                    rules={[{ required: true, message: '주소를 검색하여 선택해주세요' }]}
                  >
                    <AddressSearch
                      value={roadAddress}
                      onChange={next => form.setFieldValue('roadAddress', next)}
                      placeholder="건물명, 도로명 또는 지번"
                      inputSize="medium"
                      width="100%"
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
        </DetailInfoForm>
      </Form>
    </ContentModal>
  )
}
