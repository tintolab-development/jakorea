import chevronLeftGray7AUrl from '@/shared/assets/icons/chevron-left-gray7A.svg'
import { ProgramBackButton } from '@/features/program'
import { PFButton, PFText } from '@/shared/ui'
import styles from './detail-back.module.css'

type EducationDetailBackProps = {
  onClick: () => void
  label?: string
}

/**
 * 교육·봉사·강의 현황 상세 뒤로가기
 * - PC: 텍스트 + 회색 chevron
 * - 모바일(~1079): ProgramBackButton(원형 쉐브론)
 */
export function EducationDetailBack({
  onClick,
  label = '교육현황',
}: EducationDetailBackProps) {
  return (
    <>
      <PFButton
        variant="text"
        size="medium"
        className={[styles.button, styles.pcOnly].join(' ')}
        onClick={onClick}
      >
        <img className={styles.icon} src={chevronLeftGray7AUrl} alt="" width={8} height={12} />
        <PFText as="span" typo="hl-sm" color="black">
          {label}
        </PFText>
      </PFButton>

      <div className={styles.mobileOnly}>
        <ProgramBackButton label={label} onClick={onClick} />
      </div>
    </>
  )
}
