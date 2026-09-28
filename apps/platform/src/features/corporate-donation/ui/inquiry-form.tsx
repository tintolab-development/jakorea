import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { PFButton, PFCheckbox, PFText, PFTextarea, PFTextInput } from '@/shared/ui'
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

function messageFromError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      const message = data.message.trim()
      if (message) return message
    }
  }
  return '문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

export function CorporateDonationInquiryForm() {
  const [values, setValues] = useState<InquiryValues>(EMPTY_VALUES)
  const [formError, setFormError] = useState<string | null>(null)
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

    if (!companyName || !contactName || !departmentTitle || !contactPhone || !consultationContent) {
      setFormError('필수 항목을 입력해 주세요.')
      return
    }
    if (!values.privacyConsent) {
      setFormError('개인정보 수집·이용에 동의해 주세요.')
      return
    }

    setFormError(null)
    mutation.mutate(
      {
        companyName,
        contactName,
        departmentTitle,
        contactPhone,
        consultationContent,
        privacyConsent: true,
      },
      {
        onError: error => setFormError(messageFromError(error)),
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
        label="연락처"
        size="large"
        width="100%"
        value={values.contactPhone}
        maxLength={40}
        onValueChange={update('contactPhone')}
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
      {formError ? (
        <PFText as="p" typo="bd-sm-md" color="error" className={styles.error}>
          {formError}
        </PFText>
      ) : null}
      <PFButton type="submit" size="xlarge" variant="primary" disabled={mutation.isPending}>
        {mutation.isPending ? '접수 중' : '문의하기'}
      </PFButton>
    </form>
  )
}
