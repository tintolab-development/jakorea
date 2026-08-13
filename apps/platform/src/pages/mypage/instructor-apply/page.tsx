import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProgramBackButton } from '@/features/program'
import {
  canSubmitInstructorRoleRequest,
  getInstructorRoleRequestStatusMessage,
  INSTRUCTOR_APPLY_PATH,
  InstructorApplyForm,
  MYPAGE_PATH,
  useCurrentInstructorRoleRequestQuery,
  useInstructorApplyLockedBasic,
} from '@/features/mypage'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getDevAuthLoggedIn } from '@/shared/lib'
import { PFAlertModal, PFFormPage, PFText } from '@/shared/ui'

export function MypageInstructorApplyPage() {
  const navigate = useNavigate()
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const { isLoading, isError, lockedBasic } = useInstructorApplyLockedBasic()
  const remoteSession = isRemoteApiConfigured() && Boolean(getAccessToken())
  const currentRequestQuery = useCurrentInstructorRoleRequestQuery({ enabled: remoteSession })
  const canSubmit = canSubmitInstructorRoleRequest(currentRequestQuery.data)
  const statusMessage = getInstructorRoleRequestStatusMessage(currentRequestQuery.data)

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

  const isPageLoading =
    isLoading || (remoteSession && currentRequestQuery.isPending && !currentRequestQuery.data)

  return (
    <>
      <PFFormPage
        aria-label="강사 신청"
        back={
          <ProgramBackButton
            size="small"
            label="이전으로"
            onClick={() => navigate(MYPAGE_PATH)}
          />
        }
        title="강사 신청"
      >
        {isPageLoading ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            회원 정보를 불러오는 중…
          </PFText>
        ) : isError ? (
          <PFText as="p" typo="bd-md-rg" color="error">
            회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </PFText>
        ) : remoteSession && currentRequestQuery.isError ? (
          <PFText as="p" typo="bd-md-rg" color="error">
            강사 신청 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </PFText>
        ) : remoteSession && !canSubmit ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            {statusMessage}
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
        description="강사 신청이 접수되었습니다."
        onConfirm={() => {
          setSuccessOpen(false)
          navigate(MYPAGE_PATH)
        }}
      />
    </>
  )
}
