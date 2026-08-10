import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProgramBackButton } from '@/features/program'
import { INSTRUCTOR_APPLY_PATH, InstructorApplyForm, MYPAGE_PATH } from '@/features/mypage'
import { getDevAuthLoggedIn } from '@/shared/lib'
import { PFAlertModal, PFFormPage } from '@/shared/ui'

export function MypageInstructorApplyPage() {
  const navigate = useNavigate()
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

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
        <InstructorApplyForm onSubmitSuccess={() => setSuccessOpen(true)} />
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
