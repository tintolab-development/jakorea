/**
 * 이메일 찾기 페이지
 */

import { Form } from 'antd'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { lookupFindEmail } from '@/features/auth/api/find-email-service'
import { useFindEmailIdentityVerification } from '@/features/auth/identity-verification'
import { FindEmailForm } from '@/features/auth/ui/find-email/find-email-form'
import { FindEmailResultView } from '@/features/auth/ui/find-email/find-email-result-view'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { AlertModal } from '@/shared/ui/alert-modal'

import './find-email-page.css'

type FindEmailView = 'form' | 'success'

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function isNameMatched(inputName: string, verifiedName?: string): boolean {
  if (!verifiedName?.trim()) {
    return true
  }

  return normalizeName(inputName) === normalizeName(verifiedName)
}

export function FindEmailPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm<{ name: string }>()
  const [view, setView] = useState<FindEmailView>('form')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [verifiedName, setVerifiedName] = useState<string>()
  const [verifiedPhone, setVerifiedPhone] = useState<string>()
  const [isLookupLoading, setIsLookupLoading] = useState(false)
  const [notFoundModalOpen, setNotFoundModalOpen] = useState(false)
  const [nameMismatchMessage, setNameMismatchMessage] = useState<string | null>(null)

  const runLookup = useCallback(
    async (name: string, phoneNumber: string, birthDate?: string) => {
      setIsLookupLoading(true)
      setNameMismatchMessage(null)

      try {
        const result = await lookupFindEmail({
          name,
          phoneNumber,
          birthDate,
        })

        if (result.kind === 'found') {
          setMaskedEmail(result.maskedEmail)
          setView('success')
          return
        }

        setNotFoundModalOpen(true)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '이메일 찾기에 실패했습니다.'
        setNameMismatchMessage(message)
      } finally {
        setIsLookupLoading(false)
      }
    },
    []
  )

  const handleIdentitySuccess = useCallback(
    (result: {
      sessionUuid?: string
      verifiedName?: string
      verifiedPhone?: string
      verifiedBirthDate?: string
      sessionId: number
    }) => {
      const inputName = normalizeName(form.getFieldValue('name') ?? '')

      if (!isNameMatched(inputName, result.verifiedName)) {
        setNameMismatchMessage('입력하신 이름과 본인인증 정보가 일치하지 않습니다.')
        setVerifiedName(undefined)
        setVerifiedPhone(undefined)
        return
      }

      if (!result.verifiedPhone?.trim()) {
        setNameMismatchMessage('본인인증 휴대폰 정보를 확인할 수 없습니다.')
        setVerifiedName(undefined)
        setVerifiedPhone(undefined)
        return
      }

      setVerifiedName(result.verifiedName)
      setVerifiedPhone(result.verifiedPhone)

      void runLookup(inputName, result.verifiedPhone, result.verifiedBirthDate)
    },
    [form, runLookup]
  )

  const nameValue = Form.useWatch('name', form)

  const { verify, status, isVerifying, errorMessage, resetError } =
    useFindEmailIdentityVerification({
      name: nameValue,
      onSuccess: handleIdentitySuccess,
    })

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields()
    resetError()
    setNameMismatchMessage(null)
    await verify({ name: normalizeName(values.name) })
  }, [form, resetError, verify])

  const displayError = nameMismatchMessage ?? errorMessage

  const cardClassName =
    view === 'success' ? 'auth-card--find-email-result' : 'auth-card--find-email'

  return (
    <AuthPageShell showLogo={false} cardClassName={cardClassName}>
      <div className="find-email-page-content">
        {view === 'form' ? (
          <FindEmailForm
            form={form}
            status={status}
            isVerifying={isVerifying}
            isLookupLoading={isLookupLoading}
            errorMessage={displayError}
            verifiedName={verifiedName}
            verifiedPhone={verifiedPhone}
            onSubmit={() => {
              void handleSubmit()
            }}
          />
        ) : (
          <FindEmailResultView
            maskedEmail={maskedEmail}
            onGoLogin={() => navigate('/login', { replace: true })}
            onResetPassword={() => navigate('/find-password', { replace: true })}
          />
        )}
      </div>

      <AlertModal
        open={notFoundModalOpen}
        onClose={() => setNotFoundModalOpen(false)}
        title="회원 정보 미확인"
        content={
          '해당 정보와 일치하는 계정이 없습니다.\n정보를 확인한 뒤 다시 시도해 주세요.'
        }
      />
    </AuthPageShell>
  )
}
