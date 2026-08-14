import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProgramBackButton } from '@/features/program'
import {
  INSTRUCTOR_APPLY_PATH,
  getInstructorApplyConsentPageTitle,
  InstructorApplyConsentWriteForm,
  isInstructorApplyConsentKey,
} from '@/features/mypage'
import { PFFormPage } from '@/shared/ui'

export function MypageInstructorApplyConsentPage() {
  const navigate = useNavigate()
  const { consentKey = '' } = useParams<{ consentKey: string }>()
  const isValidKey = isInstructorApplyConsentKey(consentKey)

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
          onClick={() => navigate(INSTRUCTOR_APPLY_PATH)}
        />
      }
      title={title}
    >
      <InstructorApplyConsentWriteForm
        consentKey={consentKey}
        onComplete={() => navigate(INSTRUCTOR_APPLY_PATH)}
      />
    </PFFormPage>
  )
}
