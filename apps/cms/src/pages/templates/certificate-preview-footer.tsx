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
  fieldTextColors?: Record<string, string>
  onRegionClick?: (fieldName: string) => void
  showEditChrome?: boolean
}

export function CertificatePreviewFooter({
  region,
  orgAddress,
  orgPhone,
  orgFax,
  orgWebsite,
  fieldTextColors,
  onRegionClick,
  showEditChrome = true,
}: CertificatePreviewFooterProps) {
  const orgAddressColor = fieldTextColors?.orgAddress
  const orgPhoneColor = fieldTextColors?.orgPhone
  const orgFaxColor = fieldTextColors?.orgFax
  const orgWebsiteColor = fieldTextColors?.orgWebsite

  return (
    <div className={`${P}__footer`}>
      <span
        className={cn(`${P}__footer-brand`, shouldDimFooterPart(region, 'brand') && FRAME_DIMMED)}
      >
        사단법인 제이에이코리아
      </span>
      <span
        role={showEditChrome ? 'button' : undefined}
        tabIndex={showEditChrome ? 0 : undefined}
        className={cn(
          `${P}__footer-field-wrap`,
          `${P}__footer-field-wrap--address`,
          showEditChrome && HANDLE_DOT,
          showEditChrome && region === 'footerAddress' && FRAME_ACTIVE,
          shouldDimFooterPart(region, 'footerAddress') && FRAME_DIMMED
        )}
        aria-label="기관 주소지 편집"
        data-template-field="orgAddress"
        style={orgAddressColor ? { color: orgAddressColor } : undefined}
        {...(showEditChrome ? getRegionActivationHandlers('orgAddress', onRegionClick) : {})}
      >
        {orgAddress}
      </span>
      <span
        role={showEditChrome ? 'button' : undefined}
        tabIndex={showEditChrome ? 0 : undefined}
        className={cn(
          `${P}__footer-field-wrap`,
          `${P}__footer-field-wrap--tel`,
          showEditChrome && HANDLE_DOT,
          showEditChrome && region === 'footerPhone' && FRAME_ACTIVE,
          shouldDimFooterPart(region, 'footerPhone') && FRAME_DIMMED
        )}
        aria-label="기관 전화번호 편집"
        data-template-field="orgPhone"
        style={orgPhoneColor ? { color: orgPhoneColor } : undefined}
        {...(showEditChrome ? getRegionActivationHandlers('orgPhone', onRegionClick) : {})}
      >
        {orgPhone}
      </span>
      <span
        role={showEditChrome ? 'button' : undefined}
        tabIndex={showEditChrome ? 0 : undefined}
        className={cn(
          `${P}__footer-field-wrap`,
          `${P}__footer-field-wrap--fax`,
          showEditChrome && HANDLE_DOT,
          showEditChrome && region === 'footerFax' && FRAME_ACTIVE,
          shouldDimFooterPart(region, 'footerFax') && FRAME_DIMMED
        )}
        aria-label="기관 팩스번호 편집"
        data-template-field="orgFax"
        style={orgFaxColor ? { color: orgFaxColor } : undefined}
        {...(showEditChrome ? getRegionActivationHandlers('orgFax', onRegionClick) : {})}
      >
        {orgFax}
      </span>
      <span
        role={showEditChrome ? 'button' : undefined}
        tabIndex={showEditChrome ? 0 : undefined}
        className={cn(
          `${P}__footer-field-wrap`,
          `${P}__footer-field-wrap--link`,
          showEditChrome && HANDLE_DOT,
          showEditChrome && region === 'footerWebsite' && FRAME_ACTIVE,
          shouldDimFooterPart(region, 'footerWebsite') && FRAME_DIMMED
        )}
        aria-label="기관 홈페이지 주소 편집"
        data-template-field="orgWebsite"
        style={orgWebsiteColor ? { color: orgWebsiteColor } : undefined}
        {...(showEditChrome ? getRegionActivationHandlers('orgWebsite', onRegionClick) : {})}
      >
        {orgWebsite}
      </span>
    </div>
  )
}
