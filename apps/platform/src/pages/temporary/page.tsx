import { useLocation } from 'react-router-dom'
import { getTemporaryPageTitle } from '@/shared/config/gnb-temporary-paths'
import { PFText } from '@/shared/ui'
import styles from './page.module.css'

export function TemporaryPage() {
  const { pathname } = useLocation()
  const title = getTemporaryPageTitle(pathname)

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <PFText as="h1" typo="page-title-md" color="black" className={styles.title}>
          {title}
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.description}>
          페이지 준비 중입니다. 곧 내용을 공개할 예정이에요.
        </PFText>
      </header>
    </section>
  )
}
