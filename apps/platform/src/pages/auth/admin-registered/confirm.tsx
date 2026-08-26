import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buildAdminRegisteredConfirmationRows,
  finishAdminRegisteredOnboardingToSignIn,
  requireAdminRegisteredWizardState,
  useAdminProvisionedCompleteMutation,
  useAdminRegisteredProfileHydration,
} from '@/features/auth/admin-registered'
import { getLoginApiErrorMessage } from '@/features/auth/sign-in'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFInfoReview, PFText } from '@/shared/ui'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import sharedStyles from './shared.module.css'

export function AdminRegisteredConfirmPage() {
  const navigate = useNavigate()
  const initialWizardState = useRef(requireAdminRegisteredWizardState()).current
  const { wizardState, isHydrating, isError } =
    useAdminRegisteredProfileHydration(initialWizardState)
  const completeMutation = useAdminProvisionedCompleteMutation()
  const [completeError, setCompleteError] = useState<string>()

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
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={sharedStyles.statusMessage}>
          가입 정보를 불러오는 중…
        </PFText>
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
          setCompleteError(
            getLoginApiErrorMessage(error, '가입 정보 확인을 완료하지 못했습니다. 다시 시도해 주세요.'),
          )
          return
        }
      }

      finishAdminRegisteredOnboardingToSignIn()
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
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={sharedStyles.statusMessage}>
          가입 정보를 불러오는 중…
        </PFText>
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
    </section>
  )
}
