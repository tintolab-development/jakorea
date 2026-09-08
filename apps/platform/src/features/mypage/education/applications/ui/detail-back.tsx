import chevronLeftGray7AUrl from '@/shared/assets/icons/chevron-left-gray7A.svg'
import { PFButton, PFText } from '@/shared/ui'
import styles from './detail-back.module.css'

type EducationDetailBackProps = {
  onClick: () => void
  label?: string
}

export function EducationDetailBack({
  onClick,
  label = '교육현황',
}: EducationDetailBackProps) {
  return (
    <PFButton variant="text" size="medium" className={styles.button} onClick={onClick}>
      <img className={styles.icon} src={chevronLeftGray7AUrl} alt="" width={8} height={12} />
      <PFText as="span" typo="hl-sm" color="black">
        {label}
      </PFText>
    </PFButton>
  )
}
