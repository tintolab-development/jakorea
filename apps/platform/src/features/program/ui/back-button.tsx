import { PFButton, PFChevronButton, PFText } from '@/shared/ui'
import styles from './back-button.module.css'

type ProgramBackButtonProps = {
  label: string
  onClick: () => void
}

export function ProgramBackButton({ label, onClick }: ProgramBackButtonProps) {
  return (
    <PFButton
      variant="text"
      size="medium"
      className={styles.button}
      data-pf-chevron-hover=""
      onClick={onClick}
    >
      <PFChevronButton direction="left" decorative />
      <PFText as="span" typo="bd-lg-sb" color="neutral-cool-500">
        {label}
      </PFText>
    </PFButton>
  )
}
