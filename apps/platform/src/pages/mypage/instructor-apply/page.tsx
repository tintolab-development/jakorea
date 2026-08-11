import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProgramBackButton } from '@/features/program'
import {
  INSTRUCTOR_APPLY_PATH,
  InstructorApplyForm,
  MYPAGE_PATH,
  useInstructorApplyLockedBasic,
} from '@/features/mypage'
import { getDevAuthLoggedIn } from '@/shared/lib'
import { PFAlertModal, PFFormPage, PFText } from '@/shared/ui'

export function MypageInstructorApplyPage() {
  const navigate = useNavigate()
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const { isLoading, isError, lockedBasic } = useInstructorApplyLockedBasic()

  useEffect(() => {
    if (!getDevAuthLoggedIn()) {
      navigate(`/auth/required?redirect=${encodeURIComponent(INSTRUCTOR_APPLY_PATH)}`)
      return
    }

    setIsAuthReady(true)
  }, [navigate])

  if (!isAuthReady) {
    return null
  }

  return (
    <>
      <PFFormPage
        aria-label="강사 신청"
        back={<ProgramBackButton label="이전으로" onClick={() => navigate(MYPAGE_PATH)} />}
        title="강사 신청"
      >
        {isLoading ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            회원 정보를 불러오는 중…
          </PFText>
        ) : isError ? (
          <PFText as="p" typo="bd-md-rg" color="error">
            회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </PFText>
        ) : (
          <InstructorApplyForm
            lockedBasic={lockedBasic}
            onSubmitSuccess={() => setSuccessOpen(true)}
          />
        )}
      </PFFormPage>

      <PFAlertModal
        open={successOpen}
        title="신청 완료"
        description="강사 신청이 접수되었습니다. (임시 — API 연동 예정)"
        onConfirm={() => {
          setSuccessOpen(false)
          navigate(MYPAGE_PATH)
        }}
      />
    </>
  )
}
