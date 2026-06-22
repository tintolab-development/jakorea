import { PFText } from '@/shared/ui'
import styles from './sign-up-page.module.css'

export function SignUpPage() {
  return (
    <section className={styles.page}>
      <PFText as="div" typo="hd-lg" color="black">
        회원가입
      </PFText>
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
        JaKorea Platform 회원가입 페이지입니다.
      </PFText>
    </section>
  )
}
