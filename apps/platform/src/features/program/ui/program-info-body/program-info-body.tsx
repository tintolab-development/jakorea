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
  /** 교육·봉사현황 상세처럼 참여하기 header를 쓰지 않을 때 운영 기간·후원사 노출 */
  showPeriodSponsor?: boolean
  showApplyCta?: boolean
  showCancelCta?: boolean
  onApply?: () => void
  applyChecking?: boolean
  applyBlockedReason?: string | null
  /** 이미 신청한 기관도 신청 내역 안내 모달에 진입할 수 있도록 CTA 허용 */
  allowApplyWhenBlockedReason?: boolean
  onCancel?: () => void
  showTopFab?: boolean
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
  applyBlockedReason,
  allowApplyWhenBlockedReason = false,
  onCancel,
  showTopFab = true,
  className,
}: ProgramInfoBodyProps) {
  const rootClassName = [styles.body, className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName}>
      <ProgramInfoDetail
        program={program}
        header={header}
        showPeriodSponsor={showPeriodSponsor}
      />

      <ProgramInfoAside
        detailImageUrl={program.detailImageUrl}
        thumbnailUrl={program.thumbnailUrl}
        attachments={program.attachments}
        canApply={
          canApplyToProgram(program.recruitmentStatus) &&
          !program.recruitmentSelectionAmbiguous &&
          (!applyBlockedReason || allowApplyWhenBlockedReason)
        }
        applicationPeriodLabel={program.applicationPeriodLabel}
        applyBlockedReason={applyBlockedReason}
        showApplyCta={showApplyCta}
        showCancelCta={showCancelCta}
        onApply={onApply}
        applyChecking={applyChecking}
        onCancel={onCancel}
        showTopFab={showTopFab}
      />
    </div>
  )
}
