import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import {
  formatKoreanPhoneNumber,
  isValidKoreanPhoneNumber,
  KOREAN_MOBILE_PREFIX,
  normalizeKoreanPhoneDigits,
} from '@jakorea/domain/shared/korean-phone'
import { PLATFORM_ALERT_COPY, type PlatformAlertCopy } from '@/shared/lib/platform-alert-copy'
import { resolvePlatformErrorAlert } from '@/shared/lib/platform-error-alert'
import {
  buildRequiredMissingAlertCopy,
  type RequiredMissingAlertCopy,
} from '@/shared/lib/required-missing-alert'
import {
  PFAlertModal,
  PFButton,
  PFCheckbox,
  PFRequiredMissingAlert,
  PFText,
  PFTextarea,
  PFTextInput,
} from '@/shared/ui'
import { useCreatePublicCorporateConsultation } from '../api/hooks'
import { CORPORATE_DONATION_PATH } from '../lib/constants'
import styles from './inquiry-form.module.css'

type InquiryValues = {
  companyName: string
  contactName: string
  departmentTitle: string
  contactPhone: string
  consultationContent: string
  privacyConsent: boolean
}

const EMPTY_VALUES: InquiryValues = {
  companyName: '',
  contactName: '',
  departmentTitle: '',
  contactPhone: '',
  consultationContent: '',
  privacyConsent: false,
}

/** 서버가 보낸 업무 메시지만 — FE 기본 문구는 시안 「처리 실패」 팝업이 맡는다 */
function serverMessageFromError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return data.message.trim()
    }
  }
  return ''
}

/** 필수 누락 팝업 항목명 — 화면 라벨과 같은 순서 */
const REQUIRED_FIELD_LABELS = {
  companyName: '회사명',
  contactName: '담당자명',
  departmentTitle: '부서/직책',
  contactPhone: '휴대폰 번호',
  consultationContent: '문의 내용',
} as const

/** QA-0475 — 문의 모달(inquiry-modal.tsx)과 같은 휴대폰 번호 검사·문구 */
function validateContactPhone(value: string): string | null {
  if (!value.trim()) return '휴대폰 번호를 입력해 주세요.'

  const digits = normalizeKoreanPhoneDigits(value)
  const isMobile =
    digits.startsWith(KOREAN_MOBILE_PREFIX) &&
    digits.length === 11 &&
    isValidKoreanPhoneNumber(value)

  return isMobile ? null : '휴대폰 번호 형식(010-0000-0000)으로 입력해 주세요.'
}

export function CorporateDonationInquiryForm() {
  const [values, setValues] = useState<InquiryValues>(EMPTY_VALUES)
  const [requiredMissing, setRequiredMissing] = useState<RequiredMissingAlertCopy | null>(null)
  /** 미동의·접수 실패 — 시안 공통 안내 팝업 */
  const [alert, setAlert] = useState<PlatformAlertCopy | null>(null)
  const [contactPhoneError, setContactPhoneError] = useState<string | null>(null)
  const mutation = useCreatePublicCorporateConsultation()

  const update = (key: keyof Omit<InquiryValues, 'privacyConsent'>) => (value: string) => {
    setValues(current => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const companyName = values.companyName.trim()
    const contactName = values.contactName.trim()
    const departmentTitle = values.departmentTitle.trim()
    const contactPhone = values.contactPhone.trim()
    const consultationContent = values.consultationContent.trim()

    const phoneError = validateContactPhone(contactPhone)
    setContactPhoneError(phoneError)

    const trimmed = { companyName, contactName, departmentTitle, contactPhone, consultationContent }
    const missingLabels = (Object.keys(REQUIRED_FIELD_LABELS) as (keyof typeof trimmed)[])
      .filter(key => !trimmed[key])
      .map(key => REQUIRED_FIELD_LABELS[key])
    if (missingLabels.length > 0) {
      setRequiredMissing(buildRequiredMissingAlertCopy({ kind: 'field', labels: missingLabels }))
      return
    }
    // 휴대폰 형식 오류는 입력란 아래 문구로 안내한다
    if (phoneError) return
    if (!values.privacyConsent) {
      setAlert(PLATFORM_ALERT_COPY.requiredNotAgreed)
      return
    }

    mutation.mutate(
      {
        companyName,
        contactName,
        departmentTitle,
        contactPhone: formatKoreanPhoneNumber(contactPhone),
        consultationContent,
        privacyConsent: true,
      },
      {
        onError: error =>
          setAlert(resolvePlatformErrorAlert(error, { serverMessage: serverMessageFromError })),
      },
    )
  }

  if (mutation.isSuccess) {
    return (
      <div className={styles.success}>
        <PFText as="p" typo="bd-lg-rg" color="black">
          기업후원 문의가 접수되었습니다.
        </PFText>
        <Link to={CORPORATE_DONATION_PATH} className={styles.backLink}>
          기업후원으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <PFTextInput
        label="회사명"
        size="large"
        width="100%"
        value={values.companyName}
        maxLength={300}
        onValueChange={update('companyName')}
        required
      />
      <PFTextInput
        label="담당자명"
        size="large"
        width="100%"
        value={values.contactName}
        maxLength={200}
        onValueChange={update('contactName')}
        required
      />
      <PFTextInput
        label="부서/직책"
        size="large"
        width="100%"
        value={values.departmentTitle}
        maxLength={300}
        onValueChange={update('departmentTitle')}
        required
      />
      <PFTextInput
        label="휴대폰 번호"
        placeholder="휴대폰 번호를 입력해 주세요"
        size="large"
        width="100%"
        value={values.contactPhone}
        maxLength={13}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        error={Boolean(contactPhoneError)}
        message={contactPhoneError ?? undefined}
        messageStatus="error"
        onValueChange={value => {
          update('contactPhone')(formatKoreanPhoneNumber(value))
          setContactPhoneError(null)
        }}
        required
      />
      <PFTextarea
        label="문의 내용"
        size="large"
        width="100%"
        rows={6}
        value={values.consultationContent}
        maxLength={5000}
        onValueChange={update('consultationContent')}
        required
      />
      <PFCheckbox
        checked={values.privacyConsent}
        onCheckedChange={checked => setValues(current => ({ ...current, privacyConsent: checked }))}
        label="개인정보 수집·이용에 동의합니다."
      />
      <PFButton type="submit" size="xlarge" variant="primary" disabled={mutation.isPending}>
        {mutation.isPending ? '접수 중' : '문의하기'}
      </PFButton>
      <PFRequiredMissingAlert copy={requiredMissing} onConfirm={() => setRequiredMissing(null)} />
      <PFAlertModal
        open={alert != null}
        title={alert?.title ?? ''}
        description={alert?.description}
        onConfirm={() => setAlert(null)}
      />
    </form>
  )
}
