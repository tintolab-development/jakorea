/**
 * 강사 회원 관리 — 강사 추가 등록 모달
 * - `ContentModal` + `DetailInfoForm` + CMS 입력 컴포넌트 (회원 신규 등록·학교 등록 모달과 동일 계열)
 * - 제출 버튼은 항상 활성(loading 제외). 필수값 미충족 시 alert
 */

import { useEffect, useId, useState } from 'react'
import { Form } from 'antd'
import { collectInstructorRegisterValidation } from '@jakorea/domain/instructor/validate-register'
import {
  REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
  buildRequiredConsentDisagreeAlertMessage,
  collectDisagreedRequiredConsentLabels,
} from '@jakorea/domain/shared/required-consent-alert'
import {
  isBirthDateInputIncomplete,
  isValidBirthDateFormValue,
} from '@/shared/ui/date-text-input'
import { CmsButton, ContentModal } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE } from '@/shared/constants/messages'
import { KOREAN_PHONE_REGEX } from '@/shared/utils/phone-validation'
import { JaGradeEvaluationModal } from '@/features/user/detail/ui/modal/ja-grade-evaluation-modal'
import {
  EMPTY_CAREER,
  INITIAL_VALUES,
  InstructorProfileFormBody,
  mapInstructorRegisterFormValuesToValidationInput,
  type CareerRow,
  type InstructorRegisterModalFormValues,
} from '@/features/user/shared/ui/instructor-profile-form'
import './instructor-register-modal.css'

export type { InstructorRegisterModalFormValues } from '@/features/user/shared/ui/instructor-profile-form'

const FORM_ID = 'cms-instructor-register-modal-form'

const INSTRUCTOR_REGISTER_REQUIRED_CONSENT_FIELDS = [
  { key: 'consentTermsOfService', label: '서비스 이용약관' },
  { key: 'consentPersonal', label: '개인정보 수집·이용 동의' },
] as const

export interface InstructorRegisterModalProps {
  open: boolean
  onClose: () => void
  onSubmit?: (values: InstructorRegisterModalFormValues) => Promise<void>
  loading?: boolean
}

function validateInstructorRegister(values: InstructorRegisterModalFormValues) {
  return collectInstructorRegisterValidation(
    mapInstructorRegisterFormValuesToValidationInput(values),
    {
      isBirthDateIncomplete: isBirthDateInputIncomplete,
      isBirthDateValid: isValidBirthDateFormValue,
      isPhoneValid: value => KOREAN_PHONE_REGEX.test(value),
    }
  )
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
  const [jaGradeEvaluationOpen, setJaGradeEvaluationOpen] = useState(false)
  const registerDraftId = useId()
  const careerLevel = Form.useWatch('careerLevel', form) ?? 'new'

  useEffect(() => {
    if (open) {
      form.setFieldsValue(INITIAL_VALUES)
      setFormBodyKey(key => key + 1)
      setJaGradeEvaluationOpen(false)
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
    const disagreedRequiredLabels = collectDisagreedRequiredConsentLabels(
      {
        consentTermsOfService: values.consentTermsOfService,
        consentPersonal: values.consentPersonal,
      },
      [...INSTRUCTOR_REGISTER_REQUIRED_CONSENT_FIELDS]
    )
    if (disagreedRequiredLabels.length > 0) {
      showAlert({
        title: REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
        content: buildRequiredConsentDisagreeAlertMessage(disagreedRequiredLabels),
      })
      return
    }

    const { missingRequired, formatMessages } = validateInstructorRegister(values)
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
        <InstructorProfileFormBody
          key={formBodyKey}
          form={form}
          onOpenJaGradeEvaluation={() => setJaGradeEvaluationOpen(true)}
        />
      </Form>
      <JaGradeEvaluationModal
        open={jaGradeEvaluationOpen}
        instructorMemberId={null}
        instructorUserId={`instructor-register-draft:${registerDraftId}:${formBodyKey}`}
        persistMode="localOnly"
        onClose={() => setJaGradeEvaluationOpen(false)}
        onComplete={({ grade }) => {
          form.setFieldValue('jaEvaluationGrade', grade)
          setJaGradeEvaluationOpen(false)
        }}
      />
    </ContentModal>
  )
}
