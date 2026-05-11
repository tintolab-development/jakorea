import type { FormDocumentPreviewParagraphGapResolver, FormDocumentPreviewRenderMode } from '@/features/template/lib/a4-document-preview'

const CERTIFICATE_ISSUANCE_TEMPLATE_NAMES = new Set([
  '휴가 인증서',
  '수료증',
  '강사 활동 인증서',
  '봉사 활동 인증서',
])

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
  a4ParagraphGapPx?: number | FormDocumentPreviewParagraphGapResolver
}

export function isCertificateIssuanceTemplateName(templateName?: string): boolean {
  if (templateName == null) return false
  return CERTIFICATE_ISSUANCE_TEMPLATE_NAMES.has(templateName)
}

export function shouldUseA4PreviewForIssuanceTemplate(templateName?: string): boolean {
  return !isCertificateIssuanceTemplateName(templateName)
}

export function shouldUseA4PreviewForWritingTemplate(templateId?: string): boolean {
  if (templateId == null) return false
  return AGREEMENT_WRITING_TEMPLATE_IDS.has(templateId)
}

export function createContentOnlyA4PreviewOptions(
  overrides?: Pick<A4PreviewSessionOptions, 'a4HiddenParagraphIds' | 'a4ParagraphGapPx'>
): A4PreviewSessionOptions {
  return {
    previewLayout: 'a4-document',
    a4RenderMode: 'contentOnly',
    hideParagraphRequiredChrome: true,
    a4HiddenParagraphIds: overrides?.a4HiddenParagraphIds,
    a4ParagraphGapPx: overrides?.a4ParagraphGapPx,
  }
}
