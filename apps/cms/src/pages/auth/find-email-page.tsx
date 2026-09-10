/**
 * 이메일 찾기 페이지
 */

import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { lookupFindEmail } from '@/features/auth/api/find-email-service'
import { useFindEmailIdentityVerification } from '@/features/auth/identity-verification'
import type { IdentityChallengeCompleteResult } from '@/features/auth/identity-verification'
import { FindEmailForm } from '@/features/auth/ui/find-email/find-email-form'
import { FindEmailNotFoundView } from '@/features/auth/ui/find-email/find-email-not-found-view'
import { FindEmailResultView } from '@/features/auth/ui/find-email/find-email-result-view'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'

import './find-email-page.css'

type FindEmailView = 'form' | 'success' | 'not_found'

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

  const handleAccountNotFoundRef = useRef<() => void>(() => {})
  const resetErrorRef = useRef<() => void>(() => {})

  const runLookup = useCallback(
    async (identityResult: IdentityChallengeCompleteResult) => {
      const profileToken = identityResult.profileToken?.trim()
      if (!profileToken) {
        return
      }

      setIsLookupLoading(true)

      try {
        const result = await lookupFindEmail({
          identityVerificationSessionId: identityResult.sessionId,
          profileToken,
          mockNotFoundHint: normalizeName(identityResult.verifiedName ?? ''),
        })

        if (result.kind === 'found') {
          setMaskedEmail(result.maskedEmail)
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
    },
    []
  )

  const handleIdentitySuccess = useCallback(
    (result: IdentityChallengeCompleteResult) => {
      if (!result.profileToken?.trim()) {
        return
      }

      void runLookup(result)
    },
    [runLookup]
  )

  const { verify, status, isVerifying, errorMessage, resetError } =
    useFindEmailIdentityVerification({
      onSuccess: handleIdentitySuccess,
    })

  const handleAccountNotFound = useCallback(() => {
    resetError()
    setView('not_found')
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
    view === 'form' ? 'auth-card--find-email' : 'auth-card--find-email-result'
  const showLogo = view === 'not_found'

  return (
    <AuthPageShell showLogo={showLogo} cardClassName={cardClassName}>
      <div className="find-email-page-content">
        {view === 'form' ? (
          <FindEmailForm
            status={status}
            isVerifying={isVerifying}
            isLookupLoading={isLookupLoading}
            errorMessage={isLookupLoading ? null : errorMessage}
            onSubmit={() => {
              void handleSubmit()
            }}
          />
        ) : view === 'success' ? (
          <FindEmailResultView
            maskedEmail={maskedEmail}
            onGoLogin={() => navigate('/login', { replace: true })}
            onResetPassword={() => navigate('/find-password', { replace: true })}
          />
        ) : (
          <FindEmailNotFoundView
            onGoRegister={() => navigate('/register', { replace: true })}
            onGoLogin={() => navigate('/login', { replace: true })}
          />
        )}
      </div>
    </AuthPageShell>
  )
}
