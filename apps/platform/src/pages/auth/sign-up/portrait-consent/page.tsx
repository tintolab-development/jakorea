import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
import { useSignupTermsQuery } from '@/features/auth/sign-up/api/queries/use-signup-terms'
import { pickSignupPortraitTermsDocument } from '@/features/auth/sign-up/lib/pick-signup-portrait-terms'
import { parseWritingFormDraftFromUnknown } from '@/features/mypage/settings/lib/parse-consent-document-draft'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

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
  const memberType = bridge?.memberType ?? null
  const birthDateIso = bridge?.birthDateIso ?? null
  const termsQuery = useSignupTermsQuery({
    memberType,
    birthDateIso,
    enabled: bridge != null,
  })
  const portraitTerms = pickSignupPortraitTermsDocument(termsQuery.data)
  // 작성형 동의서는 약관 본문(content, HTML)이 아니라 게시 양식 formTemplateVersion.schemaJson으로 그린다
  // (마이페이지 작성 화면과 같은 PortraitConsentWriteForm). null이면 양식을 불러오지 못함 안내를 유지한다.
  const serverDraft = useMemo(
    () => parseWritingFormDraftFromUnknown(portraitTerms?.formTemplateVersion?.schemaJson ?? null),
    [portraitTerms],
  )
  const remote = isRemoteApiConfigured()
  const canQueryTerms = Boolean(memberType && birthDateIso)
  const termsReady = termsQuery.isSuccess || termsQuery.isError
  const serverDraftPending = Boolean(bridge) && remote && canQueryTerms && !termsReady
  const serverDraftUnavailable =
    Boolean(bridge) &&
    remote &&
    (!canQueryTerms || termsQuery.isError || (termsQuery.isSuccess && serverDraft == null))

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
      <PortraitConsentWriteForm
        onComplete={handleComplete}
        onTitleAside={setTitleAside}
        serverDraft={serverDraft}
        serverDraftPending={serverDraftPending}
        serverDraftUnavailable={serverDraftUnavailable}
      />
    </PFFormPage>
  )
}
