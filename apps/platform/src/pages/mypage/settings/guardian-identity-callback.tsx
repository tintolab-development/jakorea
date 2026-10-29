import { useEffect, useState } from 'react'
import {
  closeIdentityPopupOrResume,
  deliverIdentityMessage,
} from '@jakorea/identity-verification'
import { PFText } from '@/shared/ui'
import {
  MEMBER_GUARDIAN_VERIFICATION_CALLBACK_PATH,
  MEMBER_GUARDIAN_VERIFICATION_COMPLETION_PREFIX,
} from '@/features/mypage/settings/lib/member-guardian-verification-callback'
import {
  buildIdentityCallbackKey,
  isIdentityCallbackHandled,
  markIdentityCallbackHandled,
} from '@/features/auth/identity-verification'
import styles from '@/pages/auth/sign-up/identity-callback.module.css'

/**
 * 로그인 회원 보호자 NICE 복귀 팝업.
 * GET 폴링·verificationToken 소비는 부모 창이 한다. 가입 Bridge 를 호출하지 않는다.
 */
export function GuardianIdentityCallbackPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const callbackKey = buildIdentityCallbackKey(
      'GUARDIAN_MEMBER_CONSENT',
      window.location.search,
    )
    if (isIdentityCallbackHandled(callbackKey)) {
      return
    }
    markIdentityCallbackHandled(callbackKey)

    const params = new URLSearchParams(window.location.search)
    const queryError = params.get('error')
    const queryMessage = params.get('message') ?? params.get('errorMessage')

    if (queryError) {
      const message = queryMessage?.trim() || '보호자 본인인증에 실패했습니다.'
      const { openerPosted } = deliverIdentityMessage(
        { type: 'IDENTITY_FAILED', message },
        MEMBER_GUARDIAN_VERIFICATION_COMPLETION_PREFIX,
      )
      if (!openerPosted) {
        setErrorMessage(message)
        return
      }
    }

    closeIdentityPopupOrResume(MEMBER_GUARDIAN_VERIFICATION_CALLBACK_PATH)
  }, [])

  if (errorMessage) {
    return (
      <div className={styles.fallback}>
        <PFText as="p" typo="bd-md-sb" color="error">
          {errorMessage}
        </PFText>
      </div>
    )
  }

  return (
    <div className={styles.fallback}>
      <PFText as="p" typo="bd-md-md" color="neutral-warm-600">
        보호자 본인인증을 확인하는 중이에요…
      </PFText>
    </div>
  )
}
