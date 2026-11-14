import { useEffect, useState } from 'react'
import { useInstructorApplySessionCacheOnLeave } from '@/features/mypage/instructor-apply/lib/use-instructor-apply-session-cache-on-leave'
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
  useMypageMember,
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
import { PFAlertModal, PFFormPage, PFLoadingSpinner, PFText } from '@/shared/ui'

const INSTRUCTOR_APPLY_SUCCESS_TITLE = '신청이 완료되었어요.'
const INSTRUCTOR_APPLY_SUCCESS_DESCRIPTION = [
  '승인 상태는 나의 홈에서 확인할 수 있어요.',
  '승인이 완료되면, 강사 프로그램 신청이 가능해요.',
].join('\n')

export function MypageInstructorApplyPage() {
  useInstructorApplySessionCacheOnLeave()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reapplyFromQuery = searchParams.get(INSTRUCTOR_APPLY_REAPPLY_QUERY) === '1'
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [reapplyAfterReject, setReapplyAfterReject] = useState(reapplyFromQuery)
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const { isLoading, isError, lockedBasic } = useInstructorApplyLockedBasic()
  const member = useMypageMember()
  const remoteSession = isRemoteApiConfigured() && Boolean(getAccessToken())
  const currentRequestQuery = useCurrentInstructorRoleRequestQuery({ enabled: remoteSession })
  const submitContext = {
    isApprovedInstructor: member.profile === 'instructor_only' || member.profile === 'instructor_dual',
  }
  const canSubmit = canSubmitInstructorRoleRequest(currentRequestQuery.data, submitContext)
  const statusMessage = getInstructorRoleRequestStatusMessage(
    currentRequestQuery.data,
    submitContext,
  )
  /**
   * 신청 완료 팝업이 떠 있는 동안에는 뒤 화면(신청 폼·제목)을 그대로 둔다.
   * 신청 상태 재조회로 「승인 대기」 화면이 팝업 뒤에서 먼저 바뀌지 않게, 팝업을 닫은 뒤에 반영한다.
   */
  const holdSubmittedForm = successOpen
  const isPendingReview =
    !holdSubmittedForm &&
    remoteSession &&
    isInstructorRoleRequestPendingReview(currentRequestQuery.data)
  const isRejected =
    !holdSubmittedForm && remoteSession && isInstructorRoleRequestRejected(currentRequestQuery.data)

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

  const applyForm = (
    <InstructorApplyForm
      lockedBasic={lockedBasic}
      seedFromSubmittedRequest={reapplyAfterReject}
      rejectedSummary={reapplyAfterReject ? currentRequestQuery.data : undefined}
      onSubmitSuccess={() => setSuccessOpen(true)}
    />
  )

  const isPageLoading =
    isLoading ||
    member.isLoading ||
    (remoteSession && currentRequestQuery.isPending && !currentRequestQuery.data)

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
          ) : isRejected ? (
            <InstructorApplyRejectedTitle />
          ) : (
            '강사 신청'
          )
        }
      >
        {holdSubmittedForm ? (
          applyForm
        ) : isPageLoading ? (
          <PFLoadingSpinner centered label="회원 정보를 불러오는 중" />
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
        ) : remoteSession && !canSubmit && !reapplyAfterReject ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            {statusMessage}
          </PFText>
        ) : (
          applyForm
        )}
      </PFFormPage>

      <PFAlertModal
        open={successOpen}
        title={INSTRUCTOR_APPLY_SUCCESS_TITLE}
        description={INSTRUCTOR_APPLY_SUCCESS_DESCRIPTION}
        onConfirm={() => {
          setSuccessOpen(false)
          navigate(MYPAGE_PATH)
        }}
      />
    </>
  )
}
