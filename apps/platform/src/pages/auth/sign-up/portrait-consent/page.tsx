import { useNavigate, useSearchParams } from 'react-router-dom'
import { ProgramBackButton } from '@/features/program'
import {
  buildPortraitConsentReturnPath,
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

  return (
    <PFFormPage
      aria-label={PAGE_TITLE}
      back={<ProgramBackButton size="small" label="이전으로" onClick={handleBack} />}
      title={PAGE_TITLE}
    >
      <PortraitConsentWriteForm onComplete={handleComplete} />
    </PFFormPage>
  )
}
