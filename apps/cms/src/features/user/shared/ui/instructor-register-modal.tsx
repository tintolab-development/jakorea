/**
 * 강사 회원 관리 — 강사 추가 등록 모달
 * - `ContentModal` + `DetailInfoForm` + CMS 입력 컴포넌트 (회원 신규 등록·학교 등록 모달과 동일 계열)
 * - 제출 버튼은 항상 활성(loading 제외). 필수값 미충족 시 alert
 */

import { useEffect, useId, useState } from 'react'
import { Form } from 'antd'
import {
  REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
  buildRequiredConsentDisagreeAlertMessage,
  collectDisagreedRequiredConsentLabels,
  hasUnsetConsentSelections,
} from '@jakorea/domain/shared/required-consent-alert'
import { INSTRUCTOR_REGISTER_ALL_CONSENT_KEYS } from '@jakorea/domain/instructor/consent'
import {
  isBirthDateInputIncomplete,
  isValidBirthDateFormValue,
} from '@/shared/ui/date-text-input'
import { CmsButton, ContentModal } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import { REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE } from '@/shared/constants/messages'
import { KOREAN_PHONE_REGEX } from '@/shared/utils/phone-validation'
import { collectCmsInstructorRegisterValidation } from '@/features/user/shared/lib/validate-cms-instructor-register'
import { JaGradeEvaluationModal } from '@/features/user/detail/ui/modal/ja-grade-evaluation-modal'
import {
  EMPTY_CAREER,
  INITIAL_VALUES,
  InstructorProfileFormBody,
  mergeInstructorRegisterFormValues,
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
  return collectCmsInstructorRegisterValidation(values, {
    isBirthDateIncomplete: isBirthDateInputIncomplete,
    isBirthDateValid: isValidBirthDateFormValue,
    isPhoneValid: value => KOREAN_PHONE_REGEX.test(value),
  })
}

function showRegisterAlert(
  showAlert: ReturnType<typeof useCmsAlert>['showAlert'],
  content: string,
  title = '안내'
) {
  showAlert({
    title,
    content,
    zIndex: CMS_ALERT_MODAL_Z_INDEX,
  })
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

  const handleSubmitAttempt = (rawValues: InstructorRegisterModalFormValues) => {
    try {
      const values = mergeInstructorRegisterFormValues(rawValues)

      if (hasUnsetConsentSelections(values, INSTRUCTOR_REGISTER_ALL_CONSENT_KEYS)) {
        showRegisterAlert(showAlert, REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE)
        return
      }

      const disagreedRequiredLabels = collectDisagreedRequiredConsentLabels(
        {
          consentTermsOfService: values.consentTermsOfService,
          consentPersonal: values.consentPersonal,
        },
        [...INSTRUCTOR_REGISTER_REQUIRED_CONSENT_FIELDS]
      )
      if (disagreedRequiredLabels.length > 0) {
        showRegisterAlert(
          showAlert,
          buildRequiredConsentDisagreeAlertMessage(disagreedRequiredLabels),
          REQUIRED_CONSENT_DISAGREE_ALERT_TITLE
        )
        return
      }

      const { missingRequired, formatMessages } = validateInstructorRegister(values)
      if (missingRequired) {
        showRegisterAlert(showAlert, REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE)
        return
      }
      if (formatMessages.length > 0) {
        showRegisterAlert(showAlert, formatMessages[0])
        return
      }
      void handleFinish(values)
    } catch {
      showRegisterAlert(showAlert, REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE)
    }
  }

  const handleRegisterClick = () => {
    form.submit()
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
            type="button"
            onClick={handleRegisterClick}
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
