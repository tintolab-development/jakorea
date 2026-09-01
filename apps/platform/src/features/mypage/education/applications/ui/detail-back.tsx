import chevronLeftGray7AUrl from '@/shared/assets/icons/chevron-left-gray7A.svg'
import { PFButton, PFText } from '@/shared/ui'
import styles from './detail-back.module.css'

type EducationDetailBackProps = {
  onClick: () => void
}

export function EducationDetailBack({ onClick }: EducationDetailBackProps) {
  return (
    <PFButton variant="text" size="medium" className={styles.button} onClick={onClick}>
      <img className={styles.icon} src={chevronLeftGray7AUrl} alt="" width={8} height={12} />
      <PFText as="span" typo="hl-sm" color="black">
        교육현황
      </PFText>
    </PFButton>
  )
}
