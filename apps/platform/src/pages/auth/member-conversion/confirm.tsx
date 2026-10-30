import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePortalProfileQuery } from '@/features/auth/sign-in'
import { MYPAGE_SETTINGS_PATH } from '@/features/mypage'
import { getAccessToken, isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFInfoReview, PFLoadingSpinner, PFText } from '@/shared/ui'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import { buildMemberConversionConfirmRows } from './lib/confirm-rows'
import {
  MEMBER_CONVERSION_IDENTITY_PATH,
  MEMBER_CONVERSION_MARKETING_PATH,
  withMemberConversionRedirect,
} from './lib/paths'
import { useMemberConversionValidatedGate } from './lib/use-validated-gate'
import styles from './flow.module.css'

export function MemberConversionConfirmPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const gate = useMemberConversionValidatedGate()
  const remote = isRemoteApiConfigured()
  const hasToken = Boolean(getAccessToken())
  const profileQuery = usePortalProfileQuery()
  const redirect = searchParams.get('redirect')

  useEffect(() => {
    if (gate !== 'block') return
    navigate(withMemberConversionRedirect(MEMBER_CONVERSION_IDENTITY_PATH, redirect), {
      replace: true,
    })
  }, [gate, navigate, redirect])

  if (gate === 'pending') return <PFLoadingSpinner centered />
  if (gate !== 'ok') return null

  const isLoading = remote && hasToken && profileQuery.isPending && !profileQuery.data
  const rows = buildMemberConversionConfirmRows(profileQuery.data ?? {})

  const handleComplete = () => {
    navigate(withMemberConversionRedirect(MEMBER_CONVERSION_MARKETING_PATH, redirect))
  }

  const handleEdit = () => {
    navigate(MYPAGE_SETTINGS_PATH)
  }

  const handlePrevious = () => {
    navigate(withMemberConversionRedirect(MEMBER_CONVERSION_IDENTITY_PATH, redirect))
  }

  return (
    <section>
      <div className={styles.header}>
        <PFText as="h1" typo="hd-sm" color="black" className={authPageCopyClass('title')}>
          가입된 정보를 확인해 주세요.
        </PFText>
        <PFText
          as="p"
          typo="bd-lg-rg"
          color="primary-800"
          className={authPageCopyClass('description')}
        >
          변경된 내용이 있다면 정보를 수정해 주세요.
          <br />
          휴대폰 번호는 마이페이지에서 본인인증 후 변경할 수 있어요.
        </PFText>
      </div>

      {isLoading ? <PFLoadingSpinner centered label="가입 정보를 불러오는 중" /> : null}

      {profileQuery.isError ? (
        <PFText as="p" typo="bd-sm-md" color="error" className={styles.statusMessage}>
          가입 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </PFText>
      ) : null}

      {!isLoading && !profileQuery.isError ? (
        <PFInfoReview rows={rows} className={styles.confirmReview} />
      ) : null}

      <div className={styles.actions}>
        <PFButton size="xlarge" width="100%" disabled={isLoading} onClick={handleComplete}>
          가입 정보 확인 완료
        </PFButton>
        <PFButton
          size="xlarge"
          variant="secondary"
          width="100%"
          disabled={isLoading}
          onClick={handleEdit}
        >
          정보 수정하기
        </PFButton>
        <PFButton size="xlarge" variant="tertiary" width="100%" onClick={handlePrevious}>
          이전
        </PFButton>
      </div>
    </section>
  )
}
