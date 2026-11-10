import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import './institution-select-assign-modals.css'

const MODAL_WIDTH = 600
const MODAL_Z_INDEX = 2500

/**
 * - `default` — 기존 문구(「기관 배정 완료」 · "[기관]에 [이름] 님의 배정이 완료되었습니다."). 1사1교 등 기존 호출부 기본값.
 * - `result` — 일반 프로그램(기관형) Figma 04-2 / 05-2 「배정 완료」:
 *   단건 "[기관]에 배정되었습니다." + (현재 배정 인원 : n/m명), 일괄 "[기관] 외 N개의 기관에 배정되었습니다.", [확인] secondary.
 */
export type InstitutionAssignCompleteVariant = 'default' | 'result'

export interface InstitutionAssignCompleteModalProps {
  open: boolean
  onClose: () => void
  institutionName: string
  instructorName: string
  variant?: InstitutionAssignCompleteVariant
  /** `result` 단건 — `(현재 배정 인원 : n/m명)` 등 완성된 인원 줄. 없으면 미노출 */
  countLine?: string | null
  /** `result` — 첫 기관 외 추가로 배정된 기관 수 (0이면 단건) */
  extraTargetCount?: number
}

export function InstitutionAssignCompleteModal({
  open,
  onClose,
  institutionName,
  instructorName,
  variant = 'default',
  countLine,
  extraTargetCount = 0,
}: InstitutionAssignCompleteModalProps) {
  if (variant === 'result') {
    const isBulk = extraTargetCount > 0
    return (
      <ContentModal
        open={open}
        onCancel={onClose}
        title="배정 완료"
        width={MODAL_WIDTH}
        zIndex={MODAL_Z_INDEX}
        footer={
          <div className="institution-assign-confirm__footer">
            <CmsButton variant="secondary" size="medium" onClick={onClose}>
              확인
            </CmsButton>
          </div>
        }
      >
        <div className="institution-assign-confirm">
          <div>
            <p className="institution-assign-confirm__message">
              <strong>[{institutionName}]</strong>
              {isBulk ? (
                <>
                  {' '}
                  <strong>외 {extraTargetCount}개</strong>
                  {'의 기관에 배정되었습니다.'}
                </>
              ) : (
                '에 배정되었습니다.'
              )}
            </p>
            {!isBulk && countLine ? (
              <p className="institution-assign-confirm__count">{countLine}</p>
            ) : null}
          </div>
        </div>
      </ContentModal>
    )
  }

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="기관 배정 완료"
      width={MODAL_WIDTH}
      zIndex={MODAL_Z_INDEX}
      footer={
        <div className="institution-assign-confirm__footer">
          <CmsButton variant="primary" size="medium" onClick={onClose}>
            확인
          </CmsButton>
        </div>
      }
    >
      <div className="institution-assign-confirm">
        <p className="institution-assign-confirm__message">
          <strong>[{institutionName}]</strong>
          {'에 '}
          <strong>[{instructorName}]</strong>
          {' 님의 배정이 완료되었습니다.'}
        </p>
      </div>
    </ContentModal>
  )
}
