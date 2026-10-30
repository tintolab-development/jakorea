import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  IDENTITY_MODULE_IDLE_DESCRIPTION,
  IDENTITY_MODULE_IDLE_TITLE,
} from '@jakorea/domain/shared/identity-module-copy'
import {
  clearAgeTransitionIdentityPending,
  getAgeTransitionNiceStatus,
  isAgeTransitionNiceValid,
  isNiceSessionVerified,
  mapAgeTransitionUnknownErrorToAlert,
  markAgeTransitionNiceValidated,
  postAgeTransitionNiceValidate,
  setAgeTransitionNiceSessionId,
} from '@/features/auth/age-transition'
import { useMemberConversionIdentityVerification } from '@/features/auth/identity-verification'
import { MYPAGE_INQUIRIES_PATH } from '@/features/mypage'
import { PFButton, PFText } from '@/shared/ui'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import type { MemberConversionAlertKind } from './lib/alert-copy'
import {
  MEMBER_CONVERSION_CONFIRM_PATH,
  withMemberConversionRedirect,
} from './lib/paths'
import { MemberConversionAlert } from './ui/alert'
import styles from './flow.module.css'

export function MemberConversionIdentityPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [alertKind, setAlertKind] = useState<MemberConversionAlertKind | null>(null)
  const succeededRef = useRef(false)
  const wasVerifyingRef = useRef(false)
  const awaitingServerRef = useRef(false)

  const handleSuccess = useCallback(
    async (result: { sessionId: number }) => {
      try {
        const session = await getAgeTransitionNiceStatus(result.sessionId)
        if (!isNiceSessionVerified(session)) {
          clearAgeTransitionIdentityPending()
          setAlertKind('fail')
          return
        }

        const validated = await postAgeTransitionNiceValidate(result.sessionId)
        if (!isAgeTransitionNiceValid(validated)) {
          clearAgeTransitionIdentityPending()
          setAlertKind('fail')
          return
        }

        succeededRef.current = true
        clearAgeTransitionIdentityPending()
        setAgeTransitionNiceSessionId(result.sessionId)
        markAgeTransitionNiceValidated()
        navigate(
          withMemberConversionRedirect(MEMBER_CONVERSION_CONFIRM_PATH, searchParams.get('redirect')),
        )
      } catch (error) {
        clearAgeTransitionIdentityPending()
        const mapped = mapAgeTransitionUnknownErrorToAlert(error)
        if (mapped) setAlertKind(mapped)
      }
    },
    [navigate, searchParams],
  )

  const { verify, isVerifying, resetError, errorMessage } =
    useMemberConversionIdentityVerification({
    onSuccess: result => {
      awaitingServerRef.current = true
      void handleSuccess(result).finally(() => {
        awaitingServerRef.current = false
      })
    },
  })

  useEffect(() => {
    if (isVerifying) {
      wasVerifyingRef.current = true
      succeededRef.current = false
      return
    }
    if (errorMessage?.trim()) {
      setAlertKind('fail')
    } else if (
      wasVerifyingRef.current &&
      !succeededRef.current &&
      !alertKind &&
      !awaitingServerRef.current
    ) {
      setAlertKind('fail')
    }
    wasVerifyingRef.current = false
  }, [alertKind, errorMessage, isVerifying])

  const handleCloseAlert = () => {
    setAlertKind(null)
    resetError()
  }

  const handleInquiry = () => {
    handleCloseAlert()
    navigate(MYPAGE_INQUIRIES_PATH)
  }

  return (
    <section>
      <div className={styles.header}>
        <PFText as="h1" typo="hd-sm" color="black" className={authPageCopyClass('title')}>
          본인인증을 진행해 주세요.
        </PFText>
        <PFText
          as="p"
          typo="bd-lg-rg"
          color="primary-800"
          className={authPageCopyClass('description')}
        >
          안전하게 회원 유형을 전환하기 위해 휴대폰 본인인증이 필요해요.
          <br />
          인증 결과는 생년월일과 함께 확인하며, 본인확인 절차에만 사용돼요.
        </PFText>
      </div>

      <div className={styles.content}>
        <div className={styles.identityModule}>
          <PFText as="p" typo="bd-sm-rg" color="neutral-warm-500">
            {IDENTITY_MODULE_IDLE_TITLE}
            <br />
            {IDENTITY_MODULE_IDLE_DESCRIPTION}
          </PFText>
        </div>
      </div>

      <div className={styles.actions}>
        <PFButton
          size="xlarge"
          width="100%"
          disabled={isVerifying}
          onClick={() => {
            void verify().catch(() => setAlertKind('fail'))
          }}
        >
          {isVerifying ? '본인인증 진행 중…' : '휴대폰 본인인증하기'}
        </PFButton>
      </div>

      <MemberConversionAlert kind={alertKind} onClose={handleCloseAlert} onInquiry={handleInquiry} />
    </section>
  )
}
