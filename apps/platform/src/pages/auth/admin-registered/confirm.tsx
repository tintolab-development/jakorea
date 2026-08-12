import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buildAdminRegisteredConfirmationRows,
  requireAdminRegisteredWizardState,
  useAdminRegisteredProfileHydration,
} from '@/features/auth/admin-registered'
import { PFButton, PFText } from '@/shared/ui'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import sharedStyles from './shared.module.css'

export function AdminRegisteredConfirmPage() {
  const navigate = useNavigate()
  const initialWizardState = requireAdminRegisteredWizardState()
  const { wizardState, isHydrating, isError } =
    useAdminRegisteredProfileHydration(initialWizardState)

  useEffect(() => {
    if (!wizardState?.birthDate || !wizardState.gender) {
      navigate('/auth/admin-registered/birth', { replace: true })
    }
  }, [navigate, wizardState?.birthDate, wizardState?.gender])

  if (!initialWizardState || !wizardState?.birthDate || !wizardState.gender) {
    return null
  }

  const rows = buildAdminRegisteredConfirmationRows(wizardState)

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
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={sharedStyles.confirmReview}>
          가입 정보를 불러오는 중…
        </PFText>
      ) : null}

      {isError ? (
        <PFText as="p" typo="bd-sm-md" color="error" className={sharedStyles.confirmReview}>
          가입 정보를 불러오지 못했습니다. 이전 단계에서 입력·인증한 정보만 표시됩니다.
        </PFText>
      ) : null}

      {!isHydrating ? (
        <div className={sharedStyles.confirmReview}>
          {rows.map((row, index) => (
            <div
              className={[
                sharedStyles.confirmReviewRow,
                index === 0 ? sharedStyles.confirmReviewRowFirst : undefined,
              ]
                .filter(Boolean)
                .join(' ')}
              key={row.label}
            >
              <PFText
                typo="bd-md-md"
                color="neutral-cool-500"
                className={sharedStyles.confirmReviewLabel}
              >
                {row.label}
              </PFText>
              <PFText typo="bd-md-sb" color="black" className={sharedStyles.confirmReviewValue}>
                {row.value}
              </PFText>
            </div>
          ))}
        </div>
      ) : null}

      <div className={sharedStyles.actionsTerms}>
        <PFButton
          size="xlarge"
          width="100%"
          disabled={isHydrating}
          onClick={() => navigate('/auth/admin-registered/complete')}
        >
          가입 정보 확인 완료
        </PFButton>
        <PFButton
          size="xlarge"
          variant="secondary"
          width="100%"
          disabled={isHydrating}
          onClick={() => navigate('/auth/admin-registered/edit')}
        >
          정보 수정하기
        </PFButton>
        <PFButton
          size="xlarge"
          variant="tertiary"
          width="100%"
          onClick={() => navigate('/auth/admin-registered/change-password')}
        >
          이전
        </PFButton>
      </div>
    </section>
  )
}
