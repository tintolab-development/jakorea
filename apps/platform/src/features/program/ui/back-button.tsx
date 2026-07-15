import { PFButton } from '@/shared/ui'
import chevronLeftUrl from '@/shared/assets/icons/chevron-left-black.svg'
import styles from './back-button.module.css'

type ProgramBackButtonProps = {
  label: string
  onClick: () => void
}

export function ProgramBackButton({ label, onClick }: ProgramBackButtonProps) {
  return (
    <PFButton variant="text" size="medium" className={styles.button} onClick={onClick}>
      <img className={styles.icon} src={chevronLeftUrl} alt="" aria-hidden="true" />
      {label}
    </PFButton>
  )
}
