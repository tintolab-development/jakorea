import { useEffect, useState } from 'react'
import { PFLoadingSpinner, PFText } from '@/shared/ui'
import {
  AGE14_NICE_IDENTITY_FLOW,
  isAgeTransitionNiceReturnFailure,
} from '@/features/auth/age-transition'
import {
  ageTransitionIdentityVerificationClient,
  buildIdentityCallbackKey,
  isIdentityCallbackHandled,
  markIdentityCallbackHandled,
  processIdentityCallback,
} from '@/features/auth/identity-verification'
import { getLoginApiErrorMessage } from '@/features/auth/sign-in'
import styles from '../sign-up/identity-callback.module.css'

/**
 * 만 14세 전환 NICE 전용 콜백 (가입 `/auth/sign-up/identity/callback` 과 분리).
 * 성공 시 profileToken 없음 — validate 전까지 마케팅 진입 금지.
 */
export function AgeTransitionIdentityCallbackPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noOpener, setNoOpener] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const callbackKey = buildIdentityCallbackKey(AGE14_NICE_IDENTITY_FLOW, window.location.search)

    if (isIdentityCallbackHandled(callbackKey)) {
      return
    }

    markIdentityCallbackHandled(callbackKey)

    const execute = async () => {
      const flow = params.get('flow')?.trim()
      if (flow && flow !== AGE14_NICE_IDENTITY_FLOW) {
        setNoOpener(false)
        setErrorMessage('본인인증 요청 정보가 올바르지 않습니다. 전환 화면에서 다시 시도해 주세요.')
        return
      }

      try {
        const outcome = await processIdentityCallback(
          ageTransitionIdentityVerificationClient,
          params,
          { skipVerifiedProfileFetch: true },
        )

        if (outcome.kind === 'verified' || outcome.kind === 'cancelled') {
          return
        }

        if (outcome.kind === 'failed') {
          setNoOpener(outcome.noOpener)
          if (isAgeTransitionNiceReturnFailure(params)) {
            setErrorMessage(outcome.message ?? '본인인증에 실패했습니다.')
          } else {
            setErrorMessage(outcome.message)
          }
        }
      } catch (error) {
        setNoOpener(false)
        setErrorMessage(
          getLoginApiErrorMessage(error, '본인인증 정보를 확인할 수 없습니다. 다시 시도해 주세요.'),
        )
      }
    }

    void execute()
  }, [])

  if (errorMessage) {
    return (
      <div className={styles.fallback}>
        <PFText as="p" typo="bd-md-sb" color={noOpener ? 'neutral-warm-600' : 'error'}>
          {errorMessage}
        </PFText>
      </div>
    )
  }

  return <PFLoadingSpinner centered label="본인인증 확인 중" />
}
