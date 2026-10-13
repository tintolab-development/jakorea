import type { ReactNode } from 'react'
import { PortraitConsentWriteForm } from '@/features/auth/sign-up/ui/portrait-consent-write-form'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import type { FormSignatureValue } from '@/shared/ui'
import { useMypageMember } from '../../hooks/use-mypage-member'
import {
  clearMypagePortraitConsentDraftState,
  saveMypagePortraitConsentDraftState,
} from '../lib/mypage-portrait-consent-draft'
import { submitPortalPortraitConsentFromWriteState } from '../lib/submit-portal-consent-document'

type PortraitSubmitState = {
  draft: WritingFormDraft
  signatures?: {
    final?: FormSignatureValue | string
  }
}

export function MypagePortraitConsentWriteForm({
  onComplete,
  onTitleAside,
}: {
  onComplete: () => void
  onTitleAside?: (aside: ReactNode | null) => void
}) {
  const { displayName } = useMypageMember()

  return (
    <PortraitConsentWriteForm
      verifiedName={displayName}
      saveDraftState={saveMypagePortraitConsentDraftState}
      onSubmitAsync={async (state: PortraitSubmitState) => {
        await submitPortalPortraitConsentFromWriteState(state)
        clearMypagePortraitConsentDraftState()
      }}
      onComplete={onComplete}
      onTitleAside={onTitleAside}
    />
  )
}
