import { useState } from 'react'
import { Button } from '@jakorea/ui'
import { formatDate } from '@jakorea/utils'
import styles from './home-page.module.css'

export function HomePage() {
  const [waitlist, setWaitlist] = useState(38)
  const [launchDate] = useState(() => new Date('2025-02-14T09:00:00+09:00'))

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>JaKorea Platform</h1>
        <p className={styles.lead}>모바일·PC 반응형 플랫폼 개발 환경</p>
      </header>

      <article className={styles.card}>
        <div className={styles['card-content']}>
          <p className={styles.stat}>기다리는 사용자: {waitlist}명</p>
          <p className={styles.stat}>
            다음 메이저 배포: {formatDate(launchDate, { dateStyle: 'long' })}
          </p>
        </div>
        <div className={styles.actions}>
          <Button onClick={() => setWaitlist((value) => value + 5)}>
            사전 등록 홍보하기
          </Button>
        </div>
      </article>

      <p className={styles.hint}>
        개발 서버: <code className={styles.code}>pnpm --filter platform dev</code>
      </p>
    </section>
  )
}
