import { PARTICIPANT_INFO_ROW_LABELS } from '@/features/template/ui/template-custom-fields-form'
import type { CertificateCanvasRegion } from './form-certificate-preview-mapping'
import { shouldDim } from './form-certificate-preview-mapping'
import { cn, getRegionActivationHandlers, labelToGraphemes } from './form-certificate-preview-utils'

const P = 'form-certificate-preview'
const FRAME_ACTIVE = `${P}__region--frame-active`
const FRAME_DIMMED = `${P}__region--dimmed`
const HANDLE_DOT = `${P}__region--has-dot`

export interface CertificatePreviewParticipantBlockProps {
  region: CertificateCanvasRegion | null
  rowVisibility: boolean[]
  participantValues: string[]
  /** 라벨·값 텍스트 공통 색(흑백 등). 미지정 시 시트 기본(#606060) */
  participantTextColor?: string
  onRegionClick?: (fieldName: string) => void
}

export function CertificatePreviewParticipantBlock({
  region,
  rowVisibility,
  participantValues,
  participantTextColor,
  onRegionClick,
}: CertificatePreviewParticipantBlockProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        `${P}__content-frame`,
        participantTextColor ? `${P}__content-frame--custom-text` : '',
        HANDLE_DOT,
        region === 'contentFrame' && FRAME_ACTIVE,
        shouldDim(region, 'contentFrame') && FRAME_DIMMED
      )}
      data-template-field="participantInfo"
      style={participantTextColor ? { color: participantTextColor } : undefined}
      {...getRegionActivationHandlers('participantInfo', onRegionClick)}
    >
      <div className={`${P}__content-frame-labels`}>
        {PARTICIPANT_INFO_ROW_LABELS.map((label, index) => {
          if (rowVisibility[index] === false) return null
          return (
            <div key={label} className={`${P}__label-row`}>
              <span className={`${P}__label-text`} aria-label={label}>
                {labelToGraphemes(label).map((ch, i) => (
                  <span key={`${label}-${i}`} className={`${P}__label-char`}>
                    {ch}
                  </span>
                ))}
              </span>
            </div>
          )
        })}
      </div>
      <div className={`${P}__content-frame-values`}>
        {PARTICIPANT_INFO_ROW_LABELS.map((label, index) => {
          if (rowVisibility[index] === false) return null
          return (
            <div key={label} className={`${P}__value-row`}>
              <span className={`${P}__value-text`}>{participantValues[index] ?? ''}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
