/**
 * 강사 회원 관리 — 강사 추가 등록 모달
 * - `ContentModal` + `DetailInfoForm` + CMS 입력 컴포넌트 (회원 신규 등록·학교 등록 모달과 동일 계열)
 * - 제출 버튼은 항상 활성(loading 제외). 필수값 미충족 시 alert
 */

import { useEffect, useState } from 'react'
import { Form } from 'antd'
import {
  isBirthDateInputIncomplete,
  isValidBirthDateFormValue,
} from '@/shared/ui/date-text-input'
import { CmsButton, ContentModal } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE } from '@/shared/constants/messages'
import { KOREAN_PHONE_REGEX } from '@/shared/utils/phone-validation'
import {
  EMPTY_CAREER,
  INITIAL_VALUES,
  InstructorProfileFormBody,
  type CareerRow,
  type InstructorRegisterModalFormValues,
} from '@/features/user/shared/ui/instructor-profile-form'
import './instructor-register-modal.css'

export type { InstructorRegisterModalFormValues } from '@/features/user/shared/ui/instructor-profile-form'

const FORM_ID = 'cms-instructor-register-modal-form'

export interface InstructorRegisterModalProps {
  open: boolean
  onClose: () => void
  onSubmit?: (values: InstructorRegisterModalFormValues) => Promise<void>
  loading?: boolean
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type InstructorRegisterValidation = {
  missingRequired: boolean
  formatMessages: string[]
}

function collectInstructorRegisterValidation(
  values: InstructorRegisterModalFormValues
): InstructorRegisterValidation {
  let missingRequired = false
  const formatMessages: string[] = []

  if (!values.name?.trim()) {
    missingRequired = true
  }

  const birthDate = values.birthDate?.trim()
  if (!birthDate || isBirthDateInputIncomplete(birthDate)) {
    missingRequired = true
  } else if (!isValidBirthDateFormValue(birthDate)) {
    formatMessages.push('올바른 생년월일을 입력해 주세요.')
  }

  const contact = values.contact?.trim()
  if (!contact) {
    missingRequired = true
  } else if (!KOREAN_PHONE_REGEX.test(contact)) {
    formatMessages.push('올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)')
  }

  const email = values.email?.trim()
  if (!email) {
    missingRequired = true
  } else if (!EMAIL_PATTERN.test(email)) {
    formatMessages.push('올바른 이메일 형식이 아닙니다')
  }

  if (values.memberType === 'school_teacher' && !values.schoolName?.trim()) {
    missingRequired = true
  }

  if (values.consentTermsOfService !== 'agree') {
    missingRequired = true
  }
  if (values.consentPersonal !== 'agree') {
    missingRequired = true
  }

  return { missingRequired, formatMessages }
}

export function InstructorRegisterModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: InstructorRegisterModalProps) {
  const { showAlert } = useCmsAlert()
  const [form] = Form.useForm<InstructorRegisterModalFormValues>()
  const [formBodyKey, setFormBodyKey] = useState(0)
  const careerLevel = Form.useWatch('careerLevel', form) ?? 'new'

  useEffect(() => {
    if (open) {
      form.setFieldsValue(INITIAL_VALUES)
      setFormBodyKey(key => key + 1)
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
    const { missingRequired, formatMessages } = collectInstructorRegisterValidation(values)
    if (missingRequired) {
      showAlert({
        title: '안내',
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
        <InstructorProfileFormBody key={formBodyKey} form={form} />
      </Form>
    </ContentModal>
  )
}
