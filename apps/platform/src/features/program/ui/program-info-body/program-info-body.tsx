import type { ReactNode } from 'react'
import type { ProgramDetail } from '../../model/types'
import { ProgramInfoAside, type ProgramInfoVariant } from './program-info-aside'
import { ProgramInfoDetail } from './program-info-detail'
import styles from './program-info-body.module.css'

type ProgramInfoBodyProps = {
  program: ProgramDetail
  /** 참여하기 상세 header 등 — article 상단에 슬롯 */
  header?: ReactNode
  /** 교육·봉사현황 상세처럼 참여하기 header를 쓰지 않을 때 운영 기간·후원사 노출 */
  showPeriodSponsor?: boolean
  showApplyCta?: boolean
  showCancelCta?: boolean
  onApply?: () => void
  applyChecking?: boolean
  onCancel?: () => void
  showTopFab?: boolean
  /** `participate`: 참여하기 상세 전용 스타일(마이페이지 등 기본값은 기존 그대로) */
  variant?: ProgramInfoVariant
  className?: string
}

export function ProgramInfoBody({
  program,
  header,
  showPeriodSponsor = false,
  showApplyCta = false,
  showCancelCta = false,
  onApply,
  applyChecking,
  onCancel,
  showTopFab = true,
  variant = 'default',
  className,
}: ProgramInfoBodyProps) {
  const rootClassName = [styles.body, variant === 'participate' ? styles.participate : null, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClassName}>
      <ProgramInfoDetail
        program={program}
        header={header}
        showPeriodSponsor={showPeriodSponsor}
        variant={variant}
      />

      <ProgramInfoAside
        detailImageUrl={program.detailImageUrl}
        thumbnailUrl={program.thumbnailUrl}
        attachments={program.attachments}
        applicationPeriodLabel={program.applicationPeriodLabel}
        showApplyCta={showApplyCta}
        showCancelCta={showCancelCta}
        onApply={onApply}
        applyChecking={applyChecking}
        onCancel={onCancel}
        showTopFab={showTopFab}
        variant={variant}
      />
    </div>
  )
}
