import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ProgramBackButton } from '@/features/program'
import {
  buildPortraitConsentReturnPath,
  clearPortraitConsentSession,
  markPortraitConsentCompleted,
  peekPortraitConsentBridge,
} from '@/features/auth/sign-up/lib/portrait-consent-bridge'
import { PortraitConsentWriteForm } from '@/features/auth/sign-up/ui/portrait-consent-write-form'
import { MEMBER_CONSENT_TEMPLATE_MAP } from '@jakorea/form-schema/consent'
import { parseSafeInternalPath } from '@/features/mypage/lib/safe-internal-path'
import { SIGN_UP_PATH } from '@/features/auth/sign-up/lib/wizard-location'
import { PFFormPage } from '@/shared/ui'

const PAGE_TITLE = MEMBER_CONSENT_TEMPLATE_MAP.consentPortrait.modalTitle

export function SignUpPortraitConsentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const bridge = peekPortraitConsentBridge()

  useEffect(() => {
    if (bridge != null) return
    clearPortraitConsentSession()
    navigate(SIGN_UP_PATH, { replace: true })
  }, [bridge, navigate])

  const returnTo =
    parseSafeInternalPath(searchParams.get('returnTo')) ??
    (bridge != null ? buildPortraitConsentReturnPath(bridge.returnSearch) : SIGN_UP_PATH)

  const handleBack = () => {
    navigate(returnTo)
  }

  const handleComplete = () => {
    markPortraitConsentCompleted()
    navigate(returnTo)
  }

  const [titleAside, setTitleAside] = useState<ReactNode>(null)

  if (bridge == null) {
    return null
  }

  return (
    <PFFormPage
      aria-label={PAGE_TITLE}
      back={<ProgramBackButton size="small" label="이전으로" onClick={handleBack} />}
      title={PAGE_TITLE}
      titleAside={titleAside}
    >
      <PortraitConsentWriteForm onComplete={handleComplete} onTitleAside={setTitleAside} />
    </PFFormPage>
  )
}
