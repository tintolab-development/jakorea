import { Fragment, useRef, type CSSProperties, type RefObject } from 'react'
import { DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES } from '@/features/template/ui/template-management/template-custom-fields-form'
import templateCertificateBg from '@/assets/images/template/templatge-background.png'
import templateEducation from '@/assets/images/template/template-education.png'
import templateLogo from '@/assets/images/template/template-logo.png'
import templateStamp from '@/assets/images/template/template-stamp.png'
import { CertificatePreviewFooter } from './certificate-preview-footer'
import { CertificatePreviewParticipantBlock } from './certificate-preview-participant-block'
import {
  CANVAS_REGION_TO_FIELD_NAME,
  shouldDim,
  TEMPLATE_FIELD_TO_CANVAS_REGION,
} from './form-certificate-preview-mapping'
import {
  cn,
  formatCertificateIssueDate,
  certificateIssueDateIso,
  getRegionActivationHandlers,
  labelToGraphemes,
} from './form-certificate-preview-utils'
import { useCertificatePreviewModel } from './use-certificate-preview-model'
import { useScrollActiveFieldIntoView } from './use-scroll-active-field-into-view'
import './form-certificate-preview.css'

const P = 'form-certificate-preview'

const FRAME_ACTIVE = `${P}__region--frame-active`
const FRAME_DIMMED = `${P}__region--dimmed`
const HANDLE_DOT = `${P}__region--has-dot`
// 커스텀 필드 노출 범위와 동일하게 좌측 편집 닷/프레임도 세 필드만 유지
const CERTIFICATE_EDIT_FIELD_NAMES = new Set(['certificateBackground', 'titleName', 'bodyContent'])

function shouldShowCertificateEditChrome(fieldName: string): boolean {
  return CERTIFICATE_EDIT_FIELD_NAMES.has(fieldName)
}

export type { CertificateCanvasRegion } from './form-certificate-preview-mapping'
export { TEMPLATE_FIELD_TO_CANVAS_REGION, CANVAS_REGION_TO_FIELD_NAME }

/** 우측 회장명 인풋 기본값 — `DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES`와 동일 */
export const DEFAULT_CERTIFICATE_CHAIRMAN_NAME = DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES.chairmanName

export interface FormCertificatePreviewProps {
  /** 기관 로고 1(orgLogo) 업로드 시 — JA 로고 슬롯에 표시. 없으면 기본 `template-logo.png` */
  orgLogoPreviewSrc?: string
  /** 기관 로고 2(orgLogo02) 업로드 시 — 교육기부 슬롯에 표시. 없으면 기본 `template-education.png` */
  orgLogo02PreviewSrc?: string
  /** 수료증 배경(certificateBackground) 업로드 시 — 캔버스 배경. 없으면 기본 `templatge-background.png` */
  certificateBackgroundPreviewSrc?: string
  /** 회장 직인(chairmanSeal) 업로드 시 — 직인 이미지. 없으면 기본 `template-stamp.png` */
  chairmanSealPreviewSrc?: string
  /** 우측 카드에서 선택한 커스텀 필드 — 해당 영역에 점선 프레임 적용 */
  activeFieldName?: string | null
  /** 캔버스 닷/영역 클릭 시 — 우측 필드 선택과 동일하게 동기화 */
  onRegionClick?: (fieldName: string) => void
  /** 우측 타이틀명 — 수료증 큰 제목 */
  titleText?: string
  /** 우측 본문 내용 — 확인 문구 영역(줄바꿈 `\n` 반영) */
  bodyContent?: string
  /** 우측 회장명 — '회장'은 고정, 이름만 이 값으로 표시 */
  chairmanNameDisplay?: string
  /** 우측 참여자 정보 — 줄당 한 행, 6행까지(디폴트 샘플) */
  participantInfo?: string
  /** 발급일자 — 미지정 시 오늘 날짜 */
  issueDate?: Date
  /** 참여자 표 행 표시(체크박스와 동기화). 미지정 시 전 행 표시 */
  participantRowVisibility?: boolean[]
  /** 하단 푸터 — 우측 기관 주소·연락처 필드와 동기화 */
  orgAddress?: string
  orgPhone?: string
  orgFax?: string
  orgWebsite?: string
  /** 필드명 → CSS 색(흑백 등). 미리보기 텍스트 색 — `DEFAULT_TEMPLATE_FIELD_TEXT_COLORS` 키와 동일 */
  fieldTextColors?: Record<string, string>
  /** 루트 클래스 — PDF 내보내기 시 `form-certificate-preview--pdf-export` 등 */
  className?: string
  /**
   * PDF(html2canvas) 캡처 대상 — 흰색 캔버스(`__canvas`)만 지정하면 회색 바깥 래퍼(`__bg`)는 제외됨
   */
  canvasRef?: RefObject<HTMLDivElement | null>
}

/** PDF 캡처 시 편집용 닷·프레임을 숨길 때 루트에 붙이는 클래스 */
export const FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_CLASS = `${P}--pdf-export`

/** 화면 밖 PDF 캡처용 래퍼 — 폭은 `__bg`(1208px)와 맞춤 */
export const FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS = `${P}__pdf-export-root`

/**
 * 양식 관리 — 봉사활동인증서 프리뷰 슬롯
 * 캔버스(1144×1618 비율) 기준 절대 배치 오버레이
 */
export function FormCertificatePreview({
  orgLogoPreviewSrc,
  orgLogo02PreviewSrc,
  certificateBackgroundPreviewSrc,
  chairmanSealPreviewSrc,
  activeFieldName,
  onRegionClick,
  titleText = DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES.titleName,
  bodyContent = DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES.bodyContent,
  chairmanNameDisplay = DEFAULT_CERTIFICATE_CHAIRMAN_NAME,
  participantInfo = DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES.participantInfo,
  issueDate = new Date(),
  participantRowVisibility,
  orgAddress = DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES.orgAddress,
  orgPhone = DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES.orgPhone,
  orgFax = DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES.orgFax,
  orgWebsite = DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES.orgWebsite,
  fieldTextColors,
  className,
  canvasRef,
}: FormCertificatePreviewProps) {
  const logoSrc = orgLogoPreviewSrc ?? templateLogo
  const educationSrc = orgLogo02PreviewSrc ?? templateEducation
  const certificateBgSrc = certificateBackgroundPreviewSrc ?? templateCertificateBg
  const stampSrc = chairmanSealPreviewSrc ?? templateStamp

  const previewActiveFieldName =
    activeFieldName != null && shouldShowCertificateEditChrome(activeFieldName)
      ? activeFieldName
      : null
  const { region, confirmLines, participantValues, rowVisibility } = useCertificatePreviewModel({
    activeFieldName: previewActiveFieldName,
    bodyContent,
    participantInfo,
    participantRowVisibility,
  })

  const canvasBgStyle = {
    '--certificate-bg-url': `url(${certificateBgSrc})`,
  } as CSSProperties

  const chairmanNameParts = labelToGraphemes(chairmanNameDisplay.trim())
  const chairmanAriaLabel =
    chairmanNameParts.length > 0 ? `회장 ${chairmanNameDisplay.trim()}` : '회장'

  const bgField = CANVAS_REGION_TO_FIELD_NAME.canvas
  const showBackgroundEditChrome = shouldShowCertificateEditChrome(bgField)
  const showTitleEditChrome = shouldShowCertificateEditChrome(CANVAS_REGION_TO_FIELD_NAME.title)
  const showBodyEditChrome = shouldShowCertificateEditChrome('bodyContent')
  const showLogoEditChrome = shouldShowCertificateEditChrome(CANVAS_REGION_TO_FIELD_NAME.logo)
  const showEducationEditChrome = shouldShowCertificateEditChrome(CANVAS_REGION_TO_FIELD_NAME.education)
  const showChairmanEditChrome = shouldShowCertificateEditChrome(CANVAS_REGION_TO_FIELD_NAME.chairmanName)
  const showStampEditChrome = shouldShowCertificateEditChrome(CANVAS_REGION_TO_FIELD_NAME.stamp)

  const previewRootRef = useRef<HTMLDivElement>(null)
  useScrollActiveFieldIntoView(previewRootRef, previewActiveFieldName)

  const titleTextColor = fieldTextColors?.titleName
  const bodyTextColor = fieldTextColors?.bodyContent
  const chairmanTextColor = fieldTextColors?.chairmanName
  const participantTextColor = fieldTextColors?.participantInfo

  return (
    <div ref={previewRootRef} className={cn(P, className)}>
      <div className={`${P}__bg`}>
        <div
          ref={canvasRef}
          className={cn(
            `${P}__canvas`,
            showBackgroundEditChrome && HANDLE_DOT,
            showBackgroundEditChrome && region === 'canvas' && FRAME_ACTIVE
          )}
          style={canvasBgStyle}
          data-template-field="certificateBackground"
        >
          <div
            role={showBackgroundEditChrome ? 'button' : undefined}
            tabIndex={showBackgroundEditChrome ? 0 : undefined}
            className={cn(`${P}__canvas-bg`, shouldDim(region, 'canvas') && FRAME_DIMMED)}
            aria-label="수료증 배경 편집"
            {...(showBackgroundEditChrome
              ? getRegionActivationHandlers(bgField, onRegionClick)
              : {})}
          />
          <span className={cn(`${P}__tag`, shouldDim(region, 'decor') && FRAME_DIMMED)}>
            26-JA-00000
          </span>
          <span
            role={showLogoEditChrome ? 'button' : undefined}
            tabIndex={showLogoEditChrome ? 0 : undefined}
            className={cn(
              `${P}__logo-wrap`,
              showLogoEditChrome && HANDLE_DOT,
              showLogoEditChrome && region === 'logo' && FRAME_ACTIVE,
              shouldDim(region, 'logo') && FRAME_DIMMED
            )}
            data-template-field="orgLogo"
            {...(showLogoEditChrome
              ? getRegionActivationHandlers(CANVAS_REGION_TO_FIELD_NAME.logo, onRegionClick)
              : {})}
          >
            <img
              src={logoSrc}
              alt={orgLogoPreviewSrc ? '기관 로고' : 'JA Korea'}
              className={`${P}__logo`}
              draggable={false}
            />
          </span>
          <span
            role={showEducationEditChrome ? 'button' : undefined}
            tabIndex={showEducationEditChrome ? 0 : undefined}
            className={cn(
              `${P}__education-wrap`,
              showEducationEditChrome && HANDLE_DOT,
              showEducationEditChrome && region === 'education' && FRAME_ACTIVE,
              shouldDim(region, 'education') && FRAME_DIMMED
            )}
            data-template-field="orgLogo02"
            {...(showEducationEditChrome
              ? getRegionActivationHandlers(CANVAS_REGION_TO_FIELD_NAME.education, onRegionClick)
              : {})}
          >
            <img
              src={educationSrc}
              alt={orgLogo02PreviewSrc ? '기관 로고 2' : '교육기부'}
              className={`${P}__education`}
              width={150}
              height={130}
              draggable={false}
            />
          </span>
          <h1
            role={showTitleEditChrome ? 'button' : undefined}
            tabIndex={showTitleEditChrome ? 0 : undefined}
            className={cn(
              `${P}__title`,
              showTitleEditChrome && HANDLE_DOT,
              showTitleEditChrome && region === 'title' && FRAME_ACTIVE,
              shouldDim(region, 'title') && FRAME_DIMMED
            )}
            data-template-field="titleName"
            style={titleTextColor ? { color: titleTextColor } : undefined}
            {...(showTitleEditChrome
              ? getRegionActivationHandlers(CANVAS_REGION_TO_FIELD_NAME.title, onRegionClick)
              : {})}
          >
            {titleText}
          </h1>
          <CertificatePreviewParticipantBlock
            region={region}
            rowVisibility={rowVisibility}
            participantValues={participantValues}
            participantTextColor={participantTextColor}
            onRegionClick={undefined}
            showEditChrome={false}
          />
          <p
            role={showBodyEditChrome ? 'button' : undefined}
            tabIndex={showBodyEditChrome ? 0 : undefined}
            className={cn(
              `${P}__confirm`,
              showBodyEditChrome && HANDLE_DOT,
              showBodyEditChrome && region === 'confirm' && FRAME_ACTIVE,
              shouldDim(region, 'confirm') && FRAME_DIMMED
            )}
            aria-label="본문 내용 편집"
            data-template-field="bodyContent"
            style={bodyTextColor ? { color: bodyTextColor } : undefined}
            {...(showBodyEditChrome
              ? getRegionActivationHandlers('bodyContent', onRegionClick)
              : {})}
          >
            {confirmLines.map((line, i) => (
              <Fragment key={`confirm-line-${i}`}>
                {i > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </p>
          <time
            className={cn(`${P}__issue-date`, shouldDim(region, 'decor') && FRAME_DIMMED)}
            dateTime={certificateIssueDateIso(issueDate)}
          >
            {formatCertificateIssueDate(issueDate)}
          </time>
          <p className={cn(`${P}__org-name`, shouldDim(region, 'decor') && FRAME_DIMMED)}>
            사단법인 제이에이코리아
          </p>
          <p
            role={showChairmanEditChrome ? 'button' : undefined}
            tabIndex={showChairmanEditChrome ? 0 : undefined}
            className={cn(
              `${P}__chairman-name`,
              showChairmanEditChrome && HANDLE_DOT,
              showChairmanEditChrome && region === 'chairmanName' && FRAME_ACTIVE,
              shouldDim(region, 'chairmanName') && FRAME_DIMMED
            )}
            aria-label={chairmanAriaLabel}
            data-template-field="chairmanName"
            style={chairmanTextColor ? { color: chairmanTextColor } : undefined}
            {...(showChairmanEditChrome
              ? getRegionActivationHandlers(CANVAS_REGION_TO_FIELD_NAME.chairmanName, onRegionClick)
              : {})}
          >
            <span className={`${P}__chairman-name-part`}>회장</span>
            {chairmanNameParts.map((ch, i) => (
              <span key={`chairman-name-${i}`} className={`${P}__chairman-name-part`}>
                {ch}
              </span>
            ))}
          </p>
          <span
            role={showStampEditChrome ? 'button' : undefined}
            tabIndex={showStampEditChrome ? 0 : undefined}
            className={cn(
              `${P}__stamp-wrap`,
              showStampEditChrome && HANDLE_DOT,
              showStampEditChrome && region === 'stamp' && FRAME_ACTIVE,
              shouldDim(region, 'stamp') && FRAME_DIMMED
            )}
            data-template-field="chairmanSeal"
            {...(showStampEditChrome
              ? getRegionActivationHandlers(CANVAS_REGION_TO_FIELD_NAME.stamp, onRegionClick)
              : {})}
          >
            <img
              src={stampSrc}
              alt="사단법인 제이에이코리아 직인"
              className={`${P}__stamp`}
              width={179}
              height={178}
              draggable={false}
            />
          </span>
          <CertificatePreviewFooter
            region={region}
            orgAddress={orgAddress}
            orgPhone={orgPhone}
            orgFax={orgFax}
            orgWebsite={orgWebsite}
            fieldTextColors={fieldTextColors}
            onRegionClick={undefined}
            showEditChrome={false}
          />
        </div>
      </div>
    </div>
  )
}
