import type { CertificateCanvasRegion } from './form-certificate-preview-mapping'
import { shouldDimFooterPart } from './form-certificate-preview-mapping'
import { cn, getRegionActivationHandlers } from './form-certificate-preview-utils'

const P = 'form-certificate-preview'
const FRAME_ACTIVE = `${P}__region--frame-active`
const FRAME_DIMMED = `${P}__region--dimmed`
const HANDLE_DOT = `${P}__region--has-dot`

export interface CertificatePreviewFooterProps {
  region: CertificateCanvasRegion | null
  orgAddress: string
  orgPhone: string
  orgFax: string
  orgWebsite: string
  onRegionClick?: (fieldName: string) => void
}

export function CertificatePreviewFooter({
  region,
  orgAddress,
  orgPhone,
  orgFax,
  orgWebsite,
  onRegionClick,
}: CertificatePreviewFooterProps) {
  return (
    <div className={`${P}__footer`}>
      <span
        className={cn(`${P}__footer-brand`, shouldDimFooterPart(region, 'brand') && FRAME_DIMMED)}
      >
        사단법인 제이에이코리아
      </span>
      <span
        role="button"
        tabIndex={0}
        className={cn(
          `${P}__footer-field-wrap`,
          `${P}__footer-field-wrap--address`,
          HANDLE_DOT,
          region === 'footerAddress' && FRAME_ACTIVE,
          shouldDimFooterPart(region, 'footerAddress') && FRAME_DIMMED
        )}
        aria-label="기관 주소지 편집"
        {...getRegionActivationHandlers('orgAddress', onRegionClick)}
      >
        {orgAddress}
      </span>
      <span
        role="button"
        tabIndex={0}
        className={cn(
          `${P}__footer-field-wrap`,
          `${P}__footer-field-wrap--tel`,
          HANDLE_DOT,
          region === 'footerPhone' && FRAME_ACTIVE,
          shouldDimFooterPart(region, 'footerPhone') && FRAME_DIMMED
        )}
        aria-label="기관 전화번호 편집"
        {...getRegionActivationHandlers('orgPhone', onRegionClick)}
      >
        {orgPhone}
      </span>
      <span
        role="button"
        tabIndex={0}
        className={cn(
          `${P}__footer-field-wrap`,
          `${P}__footer-field-wrap--fax`,
          HANDLE_DOT,
          region === 'footerFax' && FRAME_ACTIVE,
          shouldDimFooterPart(region, 'footerFax') && FRAME_DIMMED
        )}
        aria-label="기관 팩스번호 편집"
        {...getRegionActivationHandlers('orgFax', onRegionClick)}
      >
        {orgFax}
      </span>
      <span
        role="button"
        tabIndex={0}
        className={cn(
          `${P}__footer-field-wrap`,
          `${P}__footer-field-wrap--link`,
          HANDLE_DOT,
          region === 'footerWebsite' && FRAME_ACTIVE,
          shouldDimFooterPart(region, 'footerWebsite') && FRAME_DIMMED
        )}
        aria-label="기관 홈페이지 주소 편집"
        {...getRegionActivationHandlers('orgWebsite', onRegionClick)}
      >
        {orgWebsite}
      </span>
    </div>
  )
}
