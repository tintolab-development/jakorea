import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ProgramBackButton } from '@/features/program'
import {
  INSTRUCTOR_APPLY_PATH,
  getInstructorApplyConsentPageTitle,
  InstructorApplyConsentWriteForm,
  isInstructorApplyConsentKey,
} from '@/features/mypage'
import { parseSafeInternalPath } from '@/features/mypage/lib/safe-internal-path'
import { PFFormPage } from '@/shared/ui'

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

  return (
    <PFFormPage
      aria-label={title}
      back={
        <ProgramBackButton
          size="small"
          label="이전으로"
          onClick={() => navigate(returnTo)}
        />
      }
      title={title}
    >
      <InstructorApplyConsentWriteForm
        consentKey={consentKey}
        readOnly={isView}
        onComplete={() => navigate(returnTo)}
      />
    </PFFormPage>
  )
}
