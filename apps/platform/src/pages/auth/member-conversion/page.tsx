import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  dismissAgeTransitionNoticeThisLogin,
  useAgeTransitionChoiceMutation,
} from '@/features/auth/age-transition'
import { MYPAGE_INQUIRIES_PATH } from '@/features/mypage'
import illustExclamationUrl from '@/shared/assets/illustration/illust-exclamation.svg'
import { PFButton, PFText } from '@/shared/ui'
import { authPageCopy, authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import {
  MEMBER_CONVERSION_IDENTITY_PATH,
  readMemberConversionLaterPath,
  withMemberConversionRedirect,
} from './lib/paths'
import styles from './page.module.css'

export function MemberConversionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const choiceMutation = useAgeTransitionChoiceMutation()
  const [busyAction, setBusyAction] = useState<'later' | 'transition' | null>(null)

  const handleConvert = async () => {
    if (busyAction) return
    setBusyAction('transition')
    try {
      await choiceMutation.mutateAsync('TRANSITION')
      navigate(
        withMemberConversionRedirect(MEMBER_CONVERSION_IDENTITY_PATH, searchParams.get('redirect')),
      )
    } catch {
      setBusyAction(null)
    }
  }

  const handleLater = async () => {
    if (busyAction) return
    setBusyAction('later')
    try {
      await choiceMutation.mutateAsync('LATER')
      dismissAgeTransitionNoticeThisLogin()
      navigate(readMemberConversionLaterPath(searchParams.get('redirect')))
    } catch {
      setBusyAction(null)
    }
  }

  const handleInquiry = () => {
    navigate(MYPAGE_INQUIRIES_PATH)
  }

  const busy = busyAction != null

  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.illustration}>
            <img src={illustExclamationUrl} alt="" width={70} height={70} />
          </div>
          <div className={styles.copy}>
            <PFText
              as="h1"
              typo="hd-md"
              color="black"
              className={authPageCopyClass('title', authPageCopy.titleAfterMedia, styles.title)}
            >
              만 14세가 되어 회원 전환이 필요해요.
            </PFText>
            <PFText
              as="p"
              typo="bd-lg-rg"
              color="primary-800"
              className={authPageCopyClass(
                'description',
                authPageCopy.descriptionTight,
                styles.description,
              )}
            >
              본인인증 후 만 14세 이상 회원으로 전환해 주세요.
              <br />
              전환 전까지는 서비스 안내가 보호자 연락처로 발송돼요.
              <br />
              전환이 완료되면 등록된 법정대리인 정보는 바로 삭제돼요.
            </PFText>
          </div>
        </div>

        <div className={styles.actions}>
          <PFButton
            size="xlarge"
            width="100%"
            disabled={busy}
            onClick={() => void handleConvert()}
          >
            본인인증 후 회원 전환하기
          </PFButton>
          <PFButton
            size="xlarge"
            variant="tertiary"
            width="100%"
            disabled={busy}
            onClick={() => void handleLater()}
          >
            나중에 하기
          </PFButton>
          <PFButton size="small" variant="text" onClick={handleInquiry}>
            본인인증이 어려우신가요? 문의하기
          </PFButton>
        </div>
      </div>
    </section>
  )
}
