import {
  CERTIFICATE_ISSUANCE_TEMPLATE_CODES,
  isCertificateIssuanceTemplateCode,
  ISSUANCE_TEMPLATE_CODE_CATALOG,
} from '@/features/template/api/form-template-catalog'
import type { FormDocumentPreviewParagraphGapResolver, FormDocumentPreviewRenderMode } from '@/features/template/lib/a4-document-preview'

/** API가 templateName을 바꿔도 catalog 기본명으로 fallback 판별 */
const CERTIFICATE_ISSUANCE_TEMPLATE_NAMES = new Set(
  CERTIFICATE_ISSUANCE_TEMPLATE_CODES.map(
    code => ISSUANCE_TEMPLATE_CODE_CATALOG[code]?.templateName
  ).filter((name): name is string => name != null && name !== '')
)

const AGREEMENT_WRITING_TEMPLATE_IDS = new Set([
  'agreement-third-party',
  'agreement-notice',
  'agreement-expense',
  'agreement-portrait',
])

export interface A4PreviewSessionOptions {
  previewLayout?: 'default' | 'a4-document'
  a4RenderMode?: FormDocumentPreviewRenderMode
  hideParagraphRequiredChrome?: boolean
  a4HiddenParagraphIds?: ReadonlySet<string>
  a4PageBreakBeforeParagraphIds?: ReadonlySet<string>
  a4ParagraphGapPx?: number | FormDocumentPreviewParagraphGapResolver
}

export type CertificateIssuanceTemplateRef = {
  templateCode?: string
  templateName?: string
}

/**
 * 인증서(Payload D) 판별 — `templateCode` 우선, 없으면 catalog 기본 `templateName` exact match.
 * API가 `수료증 (API)`처럼 이름을 바꿔도 code가 맞으면 인증서 모달로 라우팅한다.
 */
export function isCertificateIssuanceTemplate(ref?: CertificateIssuanceTemplateRef): boolean {
  if (ref == null) return false
  if (isCertificateIssuanceTemplateCode(ref.templateCode)) return true
  if (ref.templateName == null || ref.templateName === '') return false
  return CERTIFICATE_ISSUANCE_TEMPLATE_NAMES.has(ref.templateName)
}

/** @deprecated Prefer `isCertificateIssuanceTemplate({ templateCode, templateName })` */
export function isCertificateIssuanceTemplateName(templateName?: string): boolean {
  return isCertificateIssuanceTemplate({ templateName })
}

export function shouldUseA4PreviewForIssuanceTemplate(
  ref?: string | CertificateIssuanceTemplateRef
): boolean {
  if (ref == null) return true
  if (typeof ref === 'string') {
    return !isCertificateIssuanceTemplate({ templateName: ref })
  }
  return !isCertificateIssuanceTemplate(ref)
}

export function shouldUseA4PreviewForWritingTemplate(templateId?: string): boolean {
  if (templateId == null) return false
  return AGREEMENT_WRITING_TEMPLATE_IDS.has(templateId)
}

export function createContentOnlyA4PreviewOptions(
  overrides?: Pick<
    A4PreviewSessionOptions,
    | 'a4HiddenParagraphIds'
    | 'a4PageBreakBeforeParagraphIds'
    | 'a4ParagraphGapPx'
    | 'hideParagraphRequiredChrome'
  >
): A4PreviewSessionOptions {
  return {
    previewLayout: 'a4-document',
    a4RenderMode: 'contentOnly',
    hideParagraphRequiredChrome: overrides?.hideParagraphRequiredChrome ?? true,
    a4HiddenParagraphIds: overrides?.a4HiddenParagraphIds,
    a4PageBreakBeforeParagraphIds: overrides?.a4PageBreakBeforeParagraphIds,
    a4ParagraphGapPx: overrides?.a4ParagraphGapPx,
  }
}
