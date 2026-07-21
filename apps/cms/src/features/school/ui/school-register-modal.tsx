/**
 * 학교 신규 등록 모달
 * - 기관명: NEIS 학교 검색 (`SchoolSearch`)
 * - 기관 소재지: 학교 선택 시 도로명 주소 자동 반영 + 상세 주소 입력
 */

import { useEffect, useMemo } from 'react'
import { Form, Space } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form/detail-info-form'
import { CmsButton, CmsInput, ContentModal, SchoolSearch } from '@/shared/ui'
import type { SchoolSearchSelection } from '@/shared/ui'

const FORM_ID = 'cms-school-register-modal-form'

export type SchoolRegisterModalFormValues = {
  institutionName: string
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

const INITIAL_VALUES: SchoolRegisterModalFormValues = {
  institutionName: '',
  roadAddress: '',
  detailAddress: '',
}

function normalizeSubmitValues(
  values: SchoolRegisterModalFormValues
): SchoolRegisterModalFormValues {
  return {
    ...values,
    institutionName: values.institutionName.trim(),
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

  const handleSchoolSelect = (school: SchoolSearchSelection) => {
    form.setFieldsValue({
      institutionName: school.schulNm.trim(),
      roadAddress: school.orgRdnma.trim(),
      detailAddress: '',
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
