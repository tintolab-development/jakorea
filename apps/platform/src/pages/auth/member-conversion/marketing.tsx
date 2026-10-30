import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ensureAgeTransitionCompleteIdempotencyKey,
  isAgeTransitionCompleted,
  isAgeTransitionEvidencePending,
  mapAgeTransitionUnknownErrorToAlert,
  useAgeTransitionCompleteMutation,
} from '@/features/auth/age-transition'
import { TermsViewModal, useTermsViewModal } from '@/features/auth'
import { MYPAGE_INQUIRIES_PATH } from '@/features/mypage'
import { PFButton, PFLoadingSpinner, PFText, PFToggle } from '@/shared/ui'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import type { MemberConversionAlertKind } from './lib/alert-copy'
import { readMemberConversionNiceSessionId } from './lib/identity-session'
import { useMemberConversionValidatedGate } from './lib/use-validated-gate'
import {
  MEMBER_CONVERSION_COMPLETE_PATH,
  MEMBER_CONVERSION_IDENTITY_PATH,
  readMemberConversionLaterPath,
  withMemberConversionRedirect,
} from './lib/paths'
import { MemberConversionAlert } from './ui/alert'
import styles from './flow.module.css'
import marketingStyles from './marketing.module.css'

export function MemberConversionMarketingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const gate = useMemberConversionValidatedGate()
  const [marketingAgreed, setMarketingAgreed] = useState<boolean | null>(null)
  const [alertKind, setAlertKind] = useState<MemberConversionAlertKind | null>(null)
  const terms = useTermsViewModal()
  const completeMutation = useAgeTransitionCompleteMutation()
  const submittingRef = useRef(false)
  const redirect = searchParams.get('redirect')

  useEffect(() => {
    if (gate !== 'block') return
    navigate(withMemberConversionRedirect(MEMBER_CONVERSION_IDENTITY_PATH, redirect), {
      replace: true,
    })
  }, [gate, navigate, redirect])

  if (gate === 'pending') return <PFLoadingSpinner centered />
  if (gate !== 'ok') return null

  const handleToggle = (checked: boolean) => {
    setMarketingAgreed(checked)
  }

  const handleComplete = async () => {
    if (submittingRef.current || completeMutation.isPending) return
    const sessionId = readMemberConversionNiceSessionId()
    if (sessionId == null) {
      navigate(withMemberConversionRedirect(MEMBER_CONVERSION_IDENTITY_PATH, redirect), {
        replace: true,
      })
      return
    }

    submittingRef.current = true
    try {
      const result = await completeMutation.mutateAsync({
        sessionId,
        marketingAgreed,
        idempotencyKey: ensureAgeTransitionCompleteIdempotencyKey(),
      })
      if (isAgeTransitionCompleted(result)) {
        navigate(withMemberConversionRedirect(MEMBER_CONVERSION_COMPLETE_PATH, redirect))
        return
      }
      if (isAgeTransitionEvidencePending(result)) {
        navigate(readMemberConversionLaterPath(redirect), { replace: true })
        return
      }
    } catch (error) {
      const mapped = mapAgeTransitionUnknownErrorToAlert(error)
      if (mapped) setAlertKind(mapped)
    } finally {
      submittingRef.current = false
    }
  }

  const handleCloseAlert = () => {
    setAlertKind(null)
  }

  const handleInquiry = () => {
    handleCloseAlert()
    navigate(MYPAGE_INQUIRIES_PATH)
  }

  return (
    <section>
      <div className={styles.header}>
        <PFText as="h1" typo="hd-sm" color="black" className={authPageCopyClass('title')}>
          마케팅 정보 수신 동의 여부를
          <br />
          다시 선택해 주세요.
        </PFText>
        <PFText
          as="p"
          typo="bd-lg-rg"
          color="primary-800"
          className={authPageCopyClass('description')}
        >
          이제 회원님이 직접 동의 여부를 선택해 주세요.
          <br />
          동의하지 않아도 회원 전환은 완료되며,
          <br />
          이전 동의는 철회 처리돼요.
        </PFText>
      </div>

      <div className={marketingStyles.termRow}>
        <PFToggle
          variant="check-small"
          checked={marketingAgreed === true}
          onChange={handleToggle}
          className={marketingStyles.checkButton}
        >
          <span className={marketingStyles.termText}>
            <PFText typo="bd-sm-md" color="inherit" className={marketingStyles.optional}>
              선택
            </PFText>
            <PFText typo="bd-md-md" color="black">
              마케팅 정보 수신 동의
            </PFText>
          </span>
        </PFToggle>
        <button className={marketingStyles.viewButton} type="button" onClick={() => terms.open('marketing')}>
          <PFText typo="bd-sm-md" color="inherit">
            보기
          </PFText>
        </button>
      </div>

      <div className={styles.actions}>
        <PFButton
          size="xlarge"
          width="100%"
          disabled={completeMutation.isPending}
          onClick={() => void handleComplete()}
        >
          전환 완료하기
        </PFButton>
      </div>

      {terms.openType ? (
        <TermsViewModal
          open={terms.isOpen}
          type={terms.openType}
          agreed={marketingAgreed === true}
          onAgreedChange={handleToggle}
          onClose={terms.close}
        />
      ) : null}

      <MemberConversionAlert kind={alertKind} onClose={handleCloseAlert} onInquiry={handleInquiry} />
    </section>
  )
}
