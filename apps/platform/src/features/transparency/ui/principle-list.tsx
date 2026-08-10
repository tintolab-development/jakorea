import { Fragment } from 'react'
import { PFText } from '@/shared/ui'
import type { TransparencyPrinciple } from '../model/types'
import { PrincipleIcon } from './principle-icon'
import styles from './principle-list.module.css'

type PrincipleListProps = {
  principles: readonly TransparencyPrinciple[]
}

export function PrincipleList({ principles }: PrincipleListProps) {
  return (
    <ul className={styles.list}>
      {principles.map(principle => (
        <li key={principle.id} className={styles.item}>
          <span className={styles.icon}>
            <PrincipleIcon icon={principle.icon} />
          </span>
          <PFText as="h3" typo="hd-md" color="black" className={styles.title}>
            {principle.title}
          </PFText>
          <PFText
            as="p"
            typo="bd-lg-rg"
            color="neutral-cool-700"
            className={styles.description}
          >
            {principle.description.map((line, index) => (
              <Fragment key={line}>
                {index > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </PFText>
        </li>
      ))}
    </ul>
  )
}
