import type { TemplateRow, TemplateSection } from '@/features/template/model/template.schema'

export const PAYMENT_STATEMENT_ISSUANCE_TEMPLATE_CODE = 'document-payment-order-issue' as const
export const PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_CODE = 'document-payment-order-pre-consent' as const
export const SETTLEMENT_APPLICATION_TEMPLATE_CODE = 'issuance-4' as const
export const UJAT_EDUCATION_PLAN_TEMPLATE_CODE = 'issuance-2' as const
export const UJAT_EDUCATION_JOURNAL_TEMPLATE_CODE = 'issuance-ujat-edu-journal' as const
export const LECTURE_REPORT_TEMPLATE_CODE = 'issuance-3' as const

export const PAYMENT_STATEMENT_ISSUANCE_TEMPLATE_NAME = '지급조서 (발급용)'
export const PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_NAME = '지급조서 사전 동의서'
export const SETTLEMENT_APPLICATION_TEMPLATE_NAME = '정산 신청서'
export const UJAT_EDUCATION_PLAN_TEMPLATE_NAME = 'UJAT 교육계획서'
export const UJAT_EDUCATION_JOURNAL_TEMPLATE_NAME = 'UJAT 교육일지'
export const LECTURE_REPORT_TEMPLATE_NAME = '강의보고서'

export type IssuanceTemplateRow = TemplateRow

const createIssuanceRows = (
  prefix: string,
  definitions: Array<{ id: string; templateName: string }>,
  options?: { startNo?: number }
): IssuanceTemplateRow[] =>
  definitions.map((definition, index) => ({
    id: definition.id,
    templateName: definition.templateName,
    variant: 'default',
    key: `${prefix}-${index + 1}`,
    no: (options?.startNo ?? 1) + index,
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-',
  }))

const issuanceReportDefinitions = [
  { id: 'issuance-1', templateName: 'UJAT 결과리포트' },
  { id: 'issuance-2', templateName: UJAT_EDUCATION_PLAN_TEMPLATE_NAME },
  { id: 'issuance-ujat-edu-journal', templateName: UJAT_EDUCATION_JOURNAL_TEMPLATE_NAME },
  { id: 'issuance-3', templateName: LECTURE_REPORT_TEMPLATE_NAME },
  { id: 'issuance-4', templateName: SETTLEMENT_APPLICATION_TEMPLATE_NAME },
  { id: 'issuance-5', templateName: '결과보고서' },
] as const

const issuanceDocumentDefinitions = [
  { id: PAYMENT_STATEMENT_ISSUANCE_TEMPLATE_CODE, templateName: PAYMENT_STATEMENT_ISSUANCE_TEMPLATE_NAME },
  {
    id: PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_CODE,
    templateName: PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_NAME,
  },
  { id: 'document-1', templateName: '지출증빙서류(필수폼)' },
  { id: 'document-2', templateName: '휴가 인증서' },
  { id: 'document-3', templateName: '수료증' },
  { id: 'document-participation-certificate', templateName: '참가인증서' },
  { id: 'document-4', templateName: '강사 활동 인증서' },
  { id: 'document-5', templateName: '봉사 활동 인증서' },
] as const

export const issuanceReportRows = createIssuanceRows('issuance', [...issuanceReportDefinitions])

export const issuanceDocumentRows = createIssuanceRows('document', [...issuanceDocumentDefinitions])

export const issuanceFormSections: TemplateSection[] = [
  {
    key: 'issuance-report',
    title: '보고 양식',
    description: '모든 프로그램에 동일한 구조로 노출되는 양식입니다.',
    rows: issuanceReportRows,
  },
  {
    key: 'issuance-document',
    title: '서류 양식',
    description: '모든 프로그램에 동일한 구조로 노출되는 양식입니다.',
    rows: issuanceDocumentRows,
  },
]

export function findIssuanceTemplateRowById(
  templateCode: string,
  sections: TemplateSection[] = issuanceFormSections
): IssuanceTemplateRow | undefined {
  for (const section of sections) {
    const row = section.rows.find(r => r.id === templateCode)
    if (row) return row
  }
  return undefined
}
