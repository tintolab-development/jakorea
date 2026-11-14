import { PARTICIPANT_INFO_ROW_LABELS } from '@/features/template/ui/template-management/template-custom-fields-form'
import type { CertificateVariableChip } from '@/features/template/lib/certificate-participant-layout'
import type { CertificateCanvasRegion } from './form-certificate-preview-mapping'
import { shouldDim } from './form-certificate-preview-mapping'
import { cn, getRegionActivationHandlers, labelToGraphemes } from './form-certificate-preview-utils'

const P = 'form-certificate-preview'
const FRAME_ACTIVE = `${P}__region--frame-active`
const FRAME_DIMMED = `${P}__region--dimmed`
const HANDLE_DOT = `${P}__region--has-dot`

export interface CertificatePreviewParticipantBlockProps {
  region: CertificateCanvasRegion | null
  /** 줄 라벨(증명서 종류별). 미지정 시 기본 6줄 */
  rowLabels?: readonly string[]
  rowVisibility: boolean[]
  participantValues: string[]
  /** 라벨·값 텍스트 공통 색(흑백 등). 미지정 시 시트 기본(#606060) */
  participantTextColor?: string
  onRegionClick?: (fieldName: string) => void
  showEditChrome?: boolean
  /**
   * 템플릿 관리 편집 캔버스 전용 — 값 대신 변수 칩(@성명 등)을 줄마다 그린다.
   * 미지정이면 실제 값(`participantValues`)을 그린다(발급 PDF·발급 화면·미리보기 팝업).
   */
  variableChips?: readonly CertificateVariableChip[]
}

/**
 * 띄어쓰기가 있는 라벨(수료증 「프로그램 기간」)은 시안 5767:47765처럼 글자를 벌리지 않고 그대로 쓴다.
 * 라벨 열 폭은 가장 긴 라벨에 맞고, 나머지 라벨은 그 폭에 양끝 정렬된다.
 */
function isNaturalSpacingLabel(label: string): boolean {
  return /\s/.test(label)
}

export function CertificatePreviewParticipantBlock({
  region,
  rowLabels = PARTICIPANT_INFO_ROW_LABELS,
  rowVisibility,
  participantValues,
  participantTextColor,
  onRegionClick,
  showEditChrome = true,
  variableChips,
}: CertificatePreviewParticipantBlockProps) {
  return (
    <div
      role={showEditChrome ? 'button' : undefined}
      tabIndex={showEditChrome ? 0 : undefined}
      className={cn(
        `${P}__content-frame`,
        participantTextColor ? `${P}__content-frame--custom-text` : '',
        showEditChrome && HANDLE_DOT,
        showEditChrome && region === 'contentFrame' && FRAME_ACTIVE,
        shouldDim(region, 'contentFrame') && FRAME_DIMMED
      )}
      data-template-field="participantInfo"
      style={participantTextColor ? { color: participantTextColor } : undefined}
      {...(showEditChrome ? getRegionActivationHandlers('participantInfo', onRegionClick) : {})}
    >
      <div className={`${P}__content-frame-labels`}>
        {rowLabels.map((label, index) => {
          if (rowVisibility[index] === false) return null
          return (
            <div key={label} className={`${P}__label-row`}>
              {isNaturalSpacingLabel(label) ? (
                <span className={cn(`${P}__label-text`, `${P}__label-text--natural`)}>{label}</span>
              ) : (
                <span className={`${P}__label-text`} aria-label={label}>
                  {labelToGraphemes(label).map((ch, i) => (
                    <span key={`${label}-${i}`} className={`${P}__label-char`}>
                      {ch}
                    </span>
                  ))}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className={`${P}__content-frame-values`}>
        {rowLabels.map((label, index) => {
          if (rowVisibility[index] === false) return null
          const chip = variableChips?.[index]
          return (
            <div key={label} className={`${P}__value-row`}>
              {chip != null ? (
                <span
                  className={cn(
                    `${P}__variable-chip`,
                    chip.fullWidth ? `${P}__variable-chip--full` : ''
                  )}
                  data-certificate-variable-chip="participant"
                >
                  {chip.text}
                </span>
              ) : (
                <span className={`${P}__value-text`}>{participantValues[index] ?? ''}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
