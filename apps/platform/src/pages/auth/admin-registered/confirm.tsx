import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buildAdminRegisteredConfirmationRows,
  requireAdminRegisteredWizardState,
  useAdminProvisionedCompleteMutation,
  useAdminRegisteredProfileHydration,
} from '@/features/auth/admin-registered'
import { readLoginApiServerMessage, resolveLoginApiFailureAlert } from '@/features/auth/sign-in'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFAlertModal, PFButton, PFInfoReview, PFLoadingSpinner, PFText } from '@/shared/ui'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import sharedStyles from './shared.module.css'
import type { PlatformAlertCopy } from '@/shared/lib/platform-alert-copy'

export function AdminRegisteredConfirmPage() {
  const navigate = useNavigate()
  const initialWizardState = useRef(requireAdminRegisteredWizardState()).current
  const { wizardState, isHydrating, isError } =
    useAdminRegisteredProfileHydration(initialWizardState)
  const completeMutation = useAdminProvisionedCompleteMutation()
  const [completeError, setCompleteError] = useState<string>()
  /** 요청 실패 — 시안 「처리 실패 / 처리 제한 / 네트워크 오류」 팝업 */
  const [errorAlert, setErrorAlert] = useState<PlatformAlertCopy | null>(null)

  useEffect(() => {
    if (isHydrating) return
    if (!wizardState?.birthDate || !wizardState.gender) {
      navigate('/auth/admin-registered/birth', { replace: true })
    }
  }, [navigate, wizardState?.birthDate, wizardState?.gender, isHydrating])

  if (!initialWizardState) {
    return null
  }

  if (isHydrating) {
    return (
      <section>
        <PFLoadingSpinner centered label="가입 정보를 불러오는 중" />
      </section>
    )
  }

  if (!wizardState?.birthDate || !wizardState.gender) {
    return null
  }

  const rows = buildAdminRegisteredConfirmationRows(wizardState)
  const isCompleting = completeMutation.isPending

  const handleComplete = () => {
    void (async () => {
      if (isCompleting) return
      setCompleteError(undefined)

      if (isRemoteApiConfigured()) {
        try {
          await completeMutation.mutateAsync()
        } catch (error) {
          // 서버 업무 메시지는 화면 문구로, 그 밖의 실패는 시안 공통 팝업으로
          const failureAlert = resolveLoginApiFailureAlert(error)
          if (failureAlert) {
            setErrorAlert(failureAlert)
          } else {
            setCompleteError(readLoginApiServerMessage(error))
          }
          return
        }
      }

      // 세션 종료는 완료 화면 진입 시 처리한다 (시안: 「확인이 완료되었어요!」)
      navigate('/auth/admin-registered/complete', { replace: true })
    })()
  }

  return (
    <section>
      <div className={sharedStyles.header}>
        <PFText as="h1" typo="hd-sm" color="black" className={authPageCopyClass('title')}>
          가입된 정보를 확인해 주세요
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="primary-800" className={authPageCopyClass('description')}>
          변경된 내용이 있다면 정보를 수정해 주세요
        </PFText>
      </div>

      {isHydrating ? (
        <PFLoadingSpinner centered label="가입 정보를 불러오는 중" />
      ) : null}

      {isError ? (
        <PFText as="p" typo="bd-sm-md" color="error" className={sharedStyles.statusMessage}>
          가입 정보를 불러오지 못했습니다. 이전 단계에서 입력·인증한 정보만 표시됩니다.
        </PFText>
      ) : null}

      {!isHydrating ? <PFInfoReview rows={rows} className={sharedStyles.confirmReview} /> : null}

      {completeError ? (
        <PFText as="p" typo="bd-sm-md" color="error" className={sharedStyles.statusMessage}>
          {completeError}
        </PFText>
      ) : null}

      <div className={sharedStyles.actionsTerms}>
        <PFButton
          size="xlarge"
          width="100%"
          disabled={isHydrating || isCompleting}
          onClick={handleComplete}
        >
          {isCompleting ? '확인 중…' : '가입 정보 확인 완료'}
        </PFButton>
        <PFButton
          size="xlarge"
          variant="secondary"
          width="100%"
          disabled={isHydrating || isCompleting}
          onClick={() => navigate('/auth/admin-registered/edit')}
        >
          정보 수정하기
        </PFButton>
        <PFButton
          size="xlarge"
          variant="tertiary"
          width="100%"
          disabled={isCompleting}
          onClick={() => navigate('/auth/admin-registered/change-password')}
        >
          이전
        </PFButton>
      </div>
      <PFAlertModal
        open={errorAlert != null}
        title={errorAlert?.title ?? ''}
        description={errorAlert?.description}
        onConfirm={() => setErrorAlert(null)}
      />
    </section>
  )
}
