/**
 * 이메일 찾기 페이지
 */

import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { lookupFindEmail } from '@/features/auth/api/find-email-service'
import { useFindEmailIdentityVerification } from '@/features/auth/identity-verification'
import type { IdentityChallengeCompleteResult } from '@/features/auth/identity-verification'
import { FindEmailForm } from '@/features/auth/ui/find-email/find-email-form'
import { FindEmailResultView } from '@/features/auth/ui/find-email/find-email-result-view'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { AlertModal } from '@/shared/ui/alert-modal'

import './find-email-page.css'

type FindEmailView = 'form' | 'success'

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function isRequestAborted(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as { code?: string; name?: string; message?: string }
  return (
    candidate.code === 'ERR_CANCELED' ||
    candidate.name === 'AbortError' ||
    candidate.name === 'CanceledError' ||
    candidate.message === 'Request aborted' ||
    candidate.message === 'canceled'
  )
}

export function FindEmailPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<FindEmailView>('form')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [isLookupLoading, setIsLookupLoading] = useState(false)
  const [notFoundModalOpen, setNotFoundModalOpen] = useState(false)

  const handleAccountNotFoundRef = useRef<() => void>(() => {})
  const resetErrorRef = useRef<() => void>(() => {})

  const runLookup = useCallback(async (name: string, phoneNumber: string, birthDate?: string) => {
    setIsLookupLoading(true)

    try {
      const result = await lookupFindEmail({
        name,
        phoneNumber,
        birthDate,
      })

      if (result.kind === 'found') {
        setMaskedEmail(result.maskedEmail)
        setNotFoundModalOpen(false)
        resetErrorRef.current()
        setView('success')
        return
      }

      handleAccountNotFoundRef.current()
    } catch (error) {
      if (isRequestAborted(error)) {
        return
      }
    } finally {
      setIsLookupLoading(false)
    }
  }, [])

  const handleIdentitySuccess = useCallback(
    (result: IdentityChallengeCompleteResult) => {
      const identityName = normalizeName(result.verifiedName ?? '')

      if (!identityName || !result.verifiedPhone?.trim()) {
        return
      }

      void runLookup(identityName, result.verifiedPhone, result.verifiedBirthDate)
    },
    [runLookup]
  )

  const { verify, status, isVerifying, errorMessage, resetError } =
    useFindEmailIdentityVerification({
      onSuccess: handleIdentitySuccess,
    })

  const handleAccountNotFound = useCallback(() => {
    resetError()
    setNotFoundModalOpen(true)
  }, [resetError])

  handleAccountNotFoundRef.current = handleAccountNotFound
  resetErrorRef.current = resetError

  const handleSubmit = useCallback(async () => {
    if (isLookupLoading || isVerifying) {
      return
    }

    resetError()
    await verify()
  }, [isLookupLoading, isVerifying, resetError, verify])

  const cardClassName =
    view === 'success' ? 'auth-card--find-email-result' : 'auth-card--find-email'

  return (
    <AuthPageShell showLogo={false} cardClassName={cardClassName}>
      <div className="find-email-page-content">
        {view === 'form' ? (
          <FindEmailForm
            status={status}
            isVerifying={isVerifying}
            isLookupLoading={isLookupLoading}
            errorMessage={isLookupLoading || notFoundModalOpen ? null : errorMessage}
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
