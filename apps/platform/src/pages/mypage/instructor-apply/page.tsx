import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ProgramBackButton } from '@/features/program'
import {
  canSubmitInstructorRoleRequest,
  getInstructorRoleRequestStatusMessage,
  INSTRUCTOR_APPLY_PATH,
  INSTRUCTOR_APPLY_REAPPLY_QUERY,
  InstructorApplyForm,
  InstructorApplyPendingReviewView,
  InstructorApplyRejectedReviewView,
  isInstructorRoleRequestPendingReview,
  isInstructorRoleRequestRejected,
  MYPAGE_PATH,
  useCurrentInstructorRoleRequestQuery,
  useInstructorApplyLockedBasic,
} from '@/features/mypage'
import { InstructorApplyPendingTitle } from './instructor-apply-pending-title'
import { InstructorApplyRejectedTitle } from './instructor-apply-status-title'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  getAccessToken,
  getDevAuthLoggedIn,
  isRemoteApiConfigured,
  resolveLoginRequiredPath,
} from '@/shared/lib'
import { PFAlertModal, PFFormPage, PFText } from '@/shared/ui'

export function MypageInstructorApplyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reapplyFromQuery = searchParams.get(INSTRUCTOR_APPLY_REAPPLY_QUERY) === '1'
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [reapplyAfterReject, setReapplyAfterReject] = useState(reapplyFromQuery)
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const { isLoading, isError, lockedBasic } = useInstructorApplyLockedBasic()
  const remoteSession = isRemoteApiConfigured() && Boolean(getAccessToken())
  const currentRequestQuery = useCurrentInstructorRoleRequestQuery({ enabled: remoteSession })
  const canSubmit = canSubmitInstructorRoleRequest(currentRequestQuery.data)
  const statusMessage = getInstructorRoleRequestStatusMessage(currentRequestQuery.data)
  const isPendingReview =
    remoteSession && isInstructorRoleRequestPendingReview(currentRequestQuery.data)
  const isRejected =
    remoteSession && isInstructorRoleRequestRejected(currentRequestQuery.data)

  useEffect(() => {
    if (reapplyFromQuery) {
      setReapplyAfterReject(true)
    }
  }, [reapplyFromQuery])

  useEffect(() => {
    if (remoteSession) {
      setIsAuthReady(true)
      return
    }

    if (!getDevAuthLoggedIn()) {
      navigate(resolveLoginRequiredPath(INSTRUCTOR_APPLY_PATH))
      return
    }

    setIsAuthReady(true)
  }, [navigate, remoteSession])

  if (!isAuthReady || isChecking || isRedirecting) {
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
        title={
          isPendingReview ? (
            <InstructorApplyPendingTitle />
          ) : isRejected && !reapplyAfterReject ? (
            <InstructorApplyRejectedTitle />
          ) : (
            '강사 신청'
          )
        }
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
        ) : isPendingReview && currentRequestQuery.data ? (
          <InstructorApplyPendingReviewView
            summary={currentRequestQuery.data}
            lockedBasic={lockedBasic}
          />
        ) : isRejected && currentRequestQuery.data && !reapplyAfterReject ? (
          <InstructorApplyRejectedReviewView
            summary={currentRequestQuery.data}
            lockedBasic={lockedBasic}
            onReapply={() => {
              setReapplyAfterReject(true)
              navigate(
                `${INSTRUCTOR_APPLY_PATH}?${INSTRUCTOR_APPLY_REAPPLY_QUERY}=1`,
                { replace: true },
              )
            }}
          />
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
