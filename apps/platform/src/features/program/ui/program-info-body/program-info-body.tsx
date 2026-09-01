import type { ReactNode } from 'react'
import { canApplyToProgram } from '../../lib/badge-config'
import type { ProgramDetail } from '../../model/types'
import { ProgramInfoAside } from './program-info-aside'
import { ProgramInfoDetail } from './program-info-detail'
import styles from './program-info-body.module.css'

type ProgramInfoBodyProps = {
  program: ProgramDetail
  /** 참여하기 상세 header 등 — article 상단에 슬롯 */
  header?: ReactNode
  showApplyCta?: boolean
  showCancelCta?: boolean
  onApply?: () => void
  onCancel?: () => void
  showTopFab?: boolean
  className?: string
}

export function ProgramInfoBody({
  program,
  header,
  showApplyCta = false,
  showCancelCta = false,
  onApply,
  onCancel,
  showTopFab = true,
  className,
}: ProgramInfoBodyProps) {
  const rootClassName = [styles.body, className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName}>
      <ProgramInfoDetail program={program} header={header} />

      <ProgramInfoAside
        detailImageUrl={program.detailImageUrl}
        thumbnailUrl={program.thumbnailUrl}
        attachments={program.attachments}
        canApply={canApplyToProgram(program.recruitmentStatus)}
        applicationPeriodLabel={program.applicationPeriodLabel}
        showApplyCta={showApplyCta}
        showCancelCta={showCancelCta}
        onApply={onApply}
        onCancel={onCancel}
        showTopFab={showTopFab}
      />
    </div>
  )
}
