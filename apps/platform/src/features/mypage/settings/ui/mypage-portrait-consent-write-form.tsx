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
  programTarget,
  guardianVerificationToken,
}: {
  onComplete: () => void
  onTitleAside?: (aside: ReactNode | null) => void
  /** 미성년 프로그램 신청 — 프로그램 단위 동의서로 제출 */
  programTarget?: { programId: number }
  guardianVerificationToken?: string
}) {
  const { displayName } = useMypageMember()

  return (
    <PortraitConsentWriteForm
      verifiedName={displayName}
      saveDraftState={saveMypagePortraitConsentDraftState}
      onSubmitAsync={async (state: PortraitSubmitState) => {
        await submitPortalPortraitConsentFromWriteState(state, {
          programTarget: programTarget ? { programId: programTarget.programId } : undefined,
          guardianVerificationToken,
        })
        clearMypagePortraitConsentDraftState()
      }}
      onComplete={onComplete}
      onTitleAside={onTitleAside}
    />
  )
}
