import {
  buildAdminRegisteredConfirmationRows,
  requireAdminRegisteredWizardState,
} from '@/features/auth/admin-registered'
import { PFButton, PFText } from '@/shared/ui'
import sharedStyles from './shared.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import { useNavigate } from 'react-router-dom'

export function AdminRegisteredConfirmPage() {
  const navigate = useNavigate()
  const wizardState = requireAdminRegisteredWizardState()

  if (!wizardState?.birthDate || !wizardState.gender) {
    navigate('/auth/admin-registered/birth')
    return null
  }

  const rows = buildAdminRegisteredConfirmationRows(wizardState)

  const handleComplete = () => {
    navigate('/auth/admin-registered/complete')
  }

  const handleEdit = () => {
    navigate('/auth/admin-registered/edit')
  }

  const handlePrevious = () => {
    navigate('/auth/admin-registered/change-password')
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

        <div className={sharedStyles.actionsTerms}>
          <PFButton size="xlarge" width="100%" onClick={handleComplete}>
            가입 정보 확인 완료
          </PFButton>
          <PFButton size="xlarge" variant="secondary" width="100%" onClick={handleEdit}>
            정보 수정하기
          </PFButton>
          <PFButton size="xlarge" variant="tertiary" width="100%" onClick={handlePrevious}>
            이전
          </PFButton>
        </div>
    </section>
  )
}
