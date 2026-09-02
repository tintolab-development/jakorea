import { Fragment } from 'react'
import type { MypageProgramStats } from '@/features/mypage'
import illustBookUrl from '@/shared/assets/illustration/illust-book.svg'
import illustFlagUrl from '@/shared/assets/illustration/illust-flag.svg'
import { PFText } from '@/shared/ui'
import styles from './program-stat-cards.module.css'

type ProgramStatCardsProps = {
  stats: MypageProgramStats
}

const STAT_ITEMS: {
  key: keyof MypageProgramStats
  label: string
  illustrationUrl: string
}[] = [
  { key: 'applied', label: '신청한 프로그램', illustrationUrl: illustBookUrl },
  { key: 'inProgress', label: '진행중인 프로그램', illustrationUrl: illustFlagUrl },
  { key: 'completed', label: '종료된 프로그램', illustrationUrl: illustBookUrl },
]

export function ProgramStatCards({ stats }: ProgramStatCardsProps) {
  return (
    <div className={styles.cards}>
      {STAT_ITEMS.map(item => (
        <article key={item.key} className={styles.card}>
          <div className={styles.info}>
            <PFText as="p" typo="bd-md-md" color="black" className={styles.label}>
              {item.label.split(' ').map((part, index) => (
                <Fragment key={`${item.key}-${part}`}>
                  {index > 0 ? (
                    <>
                      <span className={styles.labelSpace}> </span>
                      <br className={styles.labelBreak} />
                    </>
                  ) : null}
                  {part}
                </Fragment>
              ))}
            </PFText>
            <PFText as="p" typo="hd-md" color="black" className={styles.value}>
              {stats[item.key]}
            </PFText>
          </div>
          <img
            className={styles.illustration}
            src={item.illustrationUrl}
            alt=""
            aria-hidden="true"
          />
        </article>
      ))}
    </div>
  )
}
