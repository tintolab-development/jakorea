import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ConsentWriteFormPage } from '@/features/mypage/consent/ui/consent-write-form-page'
import {
  INSTRUCTOR_APPLY_PATH,
  getInstructorApplyConsentPageDescription,
  getInstructorApplyConsentPageTitle,
  InstructorApplyConsentWriteForm,
  isInstructorApplyConsentKey,
} from '@/features/mypage'
import { parseSafeInternalPath } from '@/features/mypage/lib/safe-internal-path'

export function MypageInstructorApplyConsentPage() {
  const navigate = useNavigate()
  const { consentKey = '' } = useParams<{ consentKey: string }>()
  const [searchParams] = useSearchParams()
  const isValidKey = isInstructorApplyConsentKey(consentKey)
  const returnTo = parseSafeInternalPath(searchParams.get('returnTo')) ?? INSTRUCTOR_APPLY_PATH
  const isView = searchParams.get('mode') === 'view'

  useEffect(() => {
    if (!isValidKey) {
      navigate(INSTRUCTOR_APPLY_PATH, { replace: true })
    }
  }, [isValidKey, navigate])

  if (!isValidKey) {
    return null
  }

  const title = getInstructorApplyConsentPageTitle(consentKey)
  const description = getInstructorApplyConsentPageDescription(consentKey)
  const [titleAside, setTitleAside] = useState<ReactNode>(null)

  return (
    <ConsentWriteFormPage
      ariaLabel={title}
      title={title}
      description={description}
      titleAside={titleAside}
      onBack={() => navigate(returnTo)}
    >
      <InstructorApplyConsentWriteForm
        consentKey={consentKey}
        readOnly={isView}
        submitContext="instructorApply"
        onTitleAside={setTitleAside}
        onComplete={() => navigate(returnTo)}
      />
    </ConsentWriteFormPage>
  )
}
