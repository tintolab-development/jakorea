import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { ConsentWriteFormPage } from '@/features/mypage/consent/ui/consent-write-form-page'
import {
  getInstructorApplyConsentPageDescription,
  getInstructorApplyConsentPageTitle,
  InstructorApplyConsentWriteForm,
  isInstructorApplyConsentKey,
  MYPAGE_SETTINGS_CONSENTS_TAB,
} from '@/features/mypage'
import { MEMBER_CONSENT_TEMPLATE_MAP } from '@jakorea/form-schema/consent'
import {
  isSettingsConsentWriteKey,
  SETTINGS_PORTRAIT_CONSENT_WRITE_KEY,
} from '@/features/mypage/settings/lib/settings-consent-key'
import { MypagePortraitConsentWriteForm } from '@/features/mypage/settings/ui/mypage-portrait-consent-write-form'
import { parseSafeInternalPath } from '@/features/mypage/lib/safe-internal-path'

export function MypageSettingsConsentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { consentKey = '' } = useParams<{ consentKey: string }>()
  const [searchParams] = useSearchParams()
  const isValidKey = isSettingsConsentWriteKey(consentKey)
  const isPortraitKey = consentKey === SETTINGS_PORTRAIT_CONSENT_WRITE_KEY
  const returnTo =
    parseSafeInternalPath(searchParams.get('returnTo')) ?? MYPAGE_SETTINGS_CONSENTS_TAB
  const isView = searchParams.get('mode') === 'view'

  useEffect(() => {
    if (!isValidKey) {
      navigate(MYPAGE_SETTINGS_CONSENTS_TAB, { replace: true })
    }
  }, [isValidKey, navigate])

  if (!isValidKey) {
    return null
  }

  const title = isPortraitKey
    ? MEMBER_CONSENT_TEMPLATE_MAP.consentPortrait.modalTitle
    : isInstructorApplyConsentKey(consentKey)
      ? getInstructorApplyConsentPageTitle(consentKey)
      : ''
  const description =
    isInstructorApplyConsentKey(consentKey)
      ? getInstructorApplyConsentPageDescription(consentKey)
      : undefined

  const handleComplete = () => {
    void queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.consents() })
    navigate(returnTo)
  }
  const [titleAside, setTitleAside] = useState<ReactNode>(null)

  return (
    <ConsentWriteFormPage
      ariaLabel={title}
      title={title}
      description={description}
      titleAside={titleAside}
      onBack={() => navigate(returnTo)}
    >
      {isPortraitKey ? (
        <MypagePortraitConsentWriteForm
          onComplete={handleComplete}
          onTitleAside={setTitleAside}
        />
      ) : isInstructorApplyConsentKey(consentKey) ? (
        <InstructorApplyConsentWriteForm
          consentKey={consentKey}
          readOnly={isView}
          submitContext="mypageSettings"
          onTitleAside={setTitleAside}
          onComplete={handleComplete}
        />
      ) : null}
    </ConsentWriteFormPage>
  )
}
