import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ISSUANCE_TEMPLATE_CODE_CATALOG,
  TEMPLATE_CODE_CATALOG,
} from '@/features/template/api/form-template-catalog'
import type { FormTemplateExtensionPayload } from '@/features/template/api/adapters/form-template-draft-adapters'
import { createApplicantRecruitFormIndividualDraft } from '@/features/template/model/applicant-recruit-form-individual-draft'
import { createApplicantRecruitFormInstitutionDraft } from '@/features/template/model/applicant-recruit-form-institution-draft'
import { createGeminiVisitingTrainingApplicationFormInstructorDraft } from '@/features/template/model/gemini-visiting-training-application-form-instructor-draft'
import { createGeminiVisitingTrainingApplicationFormInstitutionDraft } from '@/features/template/model/gemini-visiting-training-application-form-institution-draft'
import { createProgramApplicationFormEconomyDraft } from '@/features/template/model/program-application-form-economy-draft'
import { createProgramApplicationFormInstructorDraft } from '@/features/template/model/program-application-form-instructor-draft'
import { createProgramApplicationFormInstitutionDraft } from '@/features/template/model/program-application-form-institution-draft'
import { createProgramApplicationFormTrainedTeachersDraft } from '@/features/template/model/program-application-form-trained-teachers-draft'
import { createProgramApplicationFormVolunteerDraft } from '@/features/template/model/program-application-form-volunteer-draft'
import { createProgramParticipantApplicationDraft } from '@/features/template/model/program-application-form-individual-draft'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'
import { createRecruitFormInstructorDraft } from '@/features/template/model/recruit-form-instructor-draft'
import { createRecruitFormVolunteerDraft } from '@/features/template/model/recruit-form-volunteer-draft'
import { createUjatProgramApplicationFormInstitutionDraft } from '@/features/template/model/ujat-program-application-form-institution-draft'
import { createUjatProgramApplicationFormVolunteerDraft } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import { createUjatProgramRegistrationDraft } from '@/features/template/model/ujat-program-registration-draft'
import { createUjatRecruitFormInstitutionDraft } from '@/features/template/model/ujat-recruit-form-institution-draft'
import { createUjatRecruitFormVolunteerDraft } from '@/features/template/model/ujat-recruit-form-volunteer-draft'
import { createPaymentStatementIssuanceDraft } from '@/features/template/model/payment-statement-issuance-draft'
import { createPaymentStatementPreConsentDraft } from '@/features/template/model/payment-statement-pre-consent-draft'
import {
  createAgreementNoticeDraft,
  createAgreementPortraitDraft,
  createDefaultSurveyDraft,
  createEducatorFacilitatorPledgeDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

const EXCLUDED_TEMPLATE_CODES = new Set(['registration-general'])

type PayloadKind = 'A' | 'B' | 'C' | 'D'

type WritingFormSeedSpec = {
  templateCode: string
  payload: PayloadKind
  createDraft: () => WritingFormDraft
  createExtension?: () => FormTemplateExtensionPayload
  settingsJson?: Record<string, unknown> | null
  note?: string
}

const EMPTY_EXTENSION = (): FormTemplateExtensionPayload => ({
  overlay: {},
  editorState: {},
  uiState: {},
})

const WRITING_FORM_SEED_SPECS: WritingFormSeedSpec[] = [
  {
    templateCode: 'registration-economy',
    payload: 'A',
    createDraft: () => createProgramRegistrationDraft('economy'),
  },
  {
    templateCode: 'registration-ujat',
    payload: 'C',
    createDraft: () => createUjatProgramRegistrationDraft(),
    createExtension: EMPTY_EXTENSION,
  },
  {
    templateCode: 'registration-trained-teachers',
    payload: 'A',
    createDraft: () => createProgramRegistrationDraft('trainedTeachers'),
  },
  {
    templateCode: 'recruitment-participant-school',
    payload: 'A',
    createDraft: () => createApplicantRecruitFormInstitutionDraft(),
    note: 'UJAT 모집 overlay는 extensionJson.overlay에 저장(초기 {}).',
  },
  {
    templateCode: 'recruitment-participant-individual',
    payload: 'A',
    createDraft: () => createApplicantRecruitFormIndividualDraft(),
  },
  {
    templateCode: 'recruitment-instructor',
    payload: 'A',
    createDraft: () => createRecruitFormInstructorDraft(),
  },
  {
    templateCode: 'recruitment-volunteer',
    payload: 'A',
    createDraft: () => createRecruitFormVolunteerDraft(),
  },
  {
    templateCode: 'recruitment-ujat-school',
    payload: 'C',
    createDraft: () => createUjatRecruitFormInstitutionDraft(),
    createExtension: EMPTY_EXTENSION,
  },
  {
    templateCode: 'recruitment-ujat-volunteer',
    payload: 'C',
    createDraft: () => createUjatRecruitFormVolunteerDraft(),
    createExtension: EMPTY_EXTENSION,
  },
  {
    templateCode: 'application-participant-school',
    payload: 'A',
    createDraft: () => createProgramApplicationFormInstitutionDraft(),
  },
  {
    templateCode: 'application-participant-individual',
    payload: 'A',
    createDraft: () => createProgramParticipantApplicationDraft(),
  },
  {
    templateCode: 'application-instructor',
    payload: 'A',
    createDraft: () => createProgramApplicationFormInstructorDraft(),
  },
  {
    templateCode: 'application-volunteer',
    payload: 'A',
    createDraft: () => createProgramApplicationFormVolunteerDraft(),
    createExtension: () => ({
      overlay: {},
      editorState: { volunteerExceptionScheduleCount: 0 },
      uiState: {},
    }),
  },
  {
    templateCode: 'application-economy',
    payload: 'A',
    createDraft: () => createProgramApplicationFormEconomyDraft(),
  },
  {
    templateCode: 'application-trained-teachers',
    payload: 'A',
    createDraft: () => createProgramApplicationFormTrainedTeachersDraft(),
  },
  {
    templateCode: 'application-gemini-visiting-training-instructor',
    payload: 'A',
    createDraft: () => createGeminiVisitingTrainingApplicationFormInstructorDraft(),
  },
  {
    templateCode: 'application-gemini-visiting-training-school',
    payload: 'A',
    createDraft: () => createGeminiVisitingTrainingApplicationFormInstitutionDraft(),
  },
  {
    templateCode: 'application-ujat-school',
    payload: 'C',
    createDraft: () => createUjatProgramApplicationFormInstitutionDraft(),
    createExtension: EMPTY_EXTENSION,
  },
  {
    templateCode: 'application-ujat-volunteer',
    payload: 'C',
    createDraft: () => createUjatProgramApplicationFormVolunteerDraft(),
    createExtension: () => ({
      overlay: {},
      editorState: { ujatVolunteerApplicationType: 'ujat-graduate' },
      uiState: {},
    }),
  },
  {
    templateCode: 'survey-default',
    payload: 'A',
    createDraft: () => createDefaultSurveyDraft(),
  },
  {
    templateCode: 'survey-student',
    payload: 'A',
    createDraft: () => createDefaultSurveyDraft(),
  },
  {
    templateCode: 'survey-teacher',
    payload: 'A',
    createDraft: () => createDefaultSurveyDraft(),
  },
  {
    templateCode: 'survey-admin',
    payload: 'A',
    createDraft: () => createDefaultSurveyDraft(),
  },
  {
    templateCode: 'agreement-third-party',
    payload: 'A',
    createDraft: () => createPaymentStatementPreConsentDraft(),
    note: '발급 document-payment-order-pre-consent와 동일 schema, templateCode만 분리.',
  },
  {
    templateCode: 'agreement-crime',
    payload: 'D',
    createDraft: () => ({
      schemaVersion: 1,
      formSettings: { titleNumbering: 'none' },
      paragraphs: [],
    }),
    createExtension: EMPTY_EXTENSION,
    settingsJson: null,
    note: '정적 A4 문서 + 파일 교체 UI. schemaJson paragraphs 빈 배열 허용.',
  },
  {
    templateCode: 'agreement-notice',
    payload: 'A',
    createDraft: () => createAgreementNoticeDraft(),
  },
  {
    templateCode: 'agreement-expense',
    payload: 'A',
    createDraft: () => createEducatorFacilitatorPledgeDraft(),
  },
  {
    templateCode: 'agreement-portrait',
    payload: 'A',
    createDraft: () => createAgreementPortraitDraft(),
  },
]

export type ExportedWritingFormSeed = {
  templateCode: string
  templateName: string
  formType: 'WRITING'
  category: string
  payload: PayloadKind
  schemaJson: WritingFormDraft
  extensionJson: FormTemplateExtensionPayload | null
  settingsJson: Record<string, unknown> | null
  paragraphSummary: Array<{
    id: string
    kind: string
    variant: string
    paragraphTitle: string
  }>
  note?: string
}

export function buildWritingFormSeedExport(spec: WritingFormSeedSpec): ExportedWritingFormSeed {
  const catalog = TEMPLATE_CODE_CATALOG[spec.templateCode]
  const draft = spec.createDraft()
  const extension = spec.createExtension?.() ?? null

  return {
    templateCode: spec.templateCode,
    templateName: catalog?.templateName ?? spec.templateCode,
    formType: 'WRITING',
    category: catalog?.category ?? 'UNKNOWN',
    payload: spec.payload,
    schemaJson: draft,
    extensionJson:
      extension ??
      (spec.payload === 'A' && spec.templateCode !== 'agreement-crime'
        ? { overlay: {}, editorState: {}, uiState: {} }
        : null),
    settingsJson: spec.settingsJson ?? null,
    paragraphSummary: draft.paragraphs.map(p => ({
      id: p.id,
      kind: p.kind,
      variant: 'variant' in p ? String(p.variant) : '',
      paragraphTitle: p.paragraphTitle ?? '',
    })),
    note: spec.note,
  }
}

export function getWritingFormSeedSpecsForExport(): WritingFormSeedSpec[] {
  return WRITING_FORM_SEED_SPECS.filter(spec => !EXCLUDED_TEMPLATE_CODES.has(spec.templateCode))
}

function repoRelativeFromModule(relativePath: string): string {
  const moduleDir = dirname(fileURLToPath(import.meta.url))
  return join(moduleDir, relativePath)
}

export function exportWritingFormTemplateSeeds(options?: {
  seedsDir?: string
  handoffDocPath?: string
}): { exported: number; seedsDir: string; handoffDocPath: string } {
  const seedsDir =
    options?.seedsDir ??
    repoRelativeFromModule('../../../../docs/api/form-template-seeds')
  const handoffDocPath =
    options?.handoffDocPath ??
    repoRelativeFromModule('../../../../docs/api/writing-form-seeds-backend-handoff.md')

  mkdirSync(seedsDir, { recursive: true })

  const exports = getWritingFormSeedSpecsForExport().map(buildWritingFormSeedExport)

  for (const item of exports) {
    const fileBody = {
      templateCode: item.templateCode,
      formType: item.formType,
      category: item.category,
      schemaJson: item.schemaJson,
      extensionJson: item.extensionJson,
      settingsJson: item.settingsJson,
      _apiStorageNote:
        'DB/API에는 schemaJson, extensionJson, settingsJson 각각을 JSON.stringify한 string으로 저장',
      ...(item.note ? { _note: item.note } : {}),
    }
    writeFileSync(
      join(seedsDir, `${item.templateCode}.json`),
      `${JSON.stringify(fileBody, null, 2)}\n`,
      'utf8'
    )
  }

  const grouped = new Map<string, ExportedWritingFormSeed[]>()
  for (const item of exports) {
    const list = grouped.get(item.category) ?? []
    list.push(item)
    grouped.set(item.category, list)
  }

  const categoryOrder = [
    'REGISTRATION',
    'RECRUITMENT',
    'APPLICATION',
    'SURVEY',
    'AGREEMENT',
  ] as const

  const categoryTitle: Record<string, string> = {
    REGISTRATION: '등록 양식',
    RECRUITMENT: '모집 양식',
    APPLICATION: '신청 양식',
    SURVEY: '설문 양식',
    AGREEMENT: '동의 양식',
  }

  const lines: string[] = [
    '# 작성 양식 시드 JSON — 백엔드 전달 (registration-general 제외)',
    '',
    '`GET/PUT /api/admin/form-template-versions/{versionId}` 시드·초기 DRAFT용입니다.',
    '',
    '**발급 양식 14종** 시드·후속 작업: [issuance-form-api-follow-up.md](./issuance-form-api-follow-up.md)  ',
    'P0 지급조서 2종 FE 시드: [document-payment-order-issue.json](./form-template-seeds/document-payment-order-issue.json), [document-payment-order-pre-consent.json](./form-template-seeds/document-payment-order-pre-consent.json) (`exportIssuanceFormTemplateSeeds`)',
    '',
    '## 제외',
    '',
    '- `registration-general` (일반 프로그램 등록 폼) — 별도: [form-template-seeds/registration-general.json](./form-template-seeds/registration-general.json)',
    '',
    '## 저장 규칙',
    '',
    '| 필드 | 설명 |',
    '|------|------|',
    '| `schemaJson` | `WritingFormDraft` object → API 저장 시 **JSON string** (이중 stringify 금지) |',
    '| `extensionJson` | `{ overlay, editorState, uiState }` object → JSON string |',
    '| `settingsJson` | 인증서·파일 설정. 대부분 `null`. `agreement-crime` 포함 schema-only |',
    '',
    '### Payload 종류',
    '',
    '| 코드 | body 필드 |',
    '|------|-----------|',
    '| **A** | `schemaJson` (+ 선택 `extensionJson` 빈 object) |',
    '| **C** | `schemaJson` + `extensionJson` (UJAT overlay/editorState) |',
    '| **D** | `schemaJson` 빈 paragraphs 또는 `settingsJson` (agreement-crime) |',
    '',
    '상세 계약: [form-template-json-contract.md](./form-template-json-contract.md)',
    '',
    '## 목록 (28종)',
    '',
  ]

  for (const category of categoryOrder) {
    const items = grouped.get(category)
    if (items == null || items.length === 0) continue
    lines.push(`### ${categoryTitle[category] ?? category} (${items.length})`, '')
    lines.push('| templateCode | templateName | Payload | 시드 JSON | 단락 수 |')
    lines.push('|--------------|--------------|---------|-----------|--------:|')
    for (const item of items) {
      lines.push(
        `| \`${item.templateCode}\` | ${item.templateName} | ${item.payload} | [${item.templateCode}.json](./form-template-seeds/${item.templateCode}.json) | ${item.paragraphSummary.length} |`
      )
    }
    lines.push('')
  }

  lines.push('## 단락 id 요약', '')

  for (const item of exports) {
    lines.push(`### \`${item.templateCode}\` — ${item.templateName}`, '')
    if (item.note) {
      lines.push(`> ${item.note}`, '')
    }
    if (item.paragraphSummary.length === 0) {
      lines.push('_(paragraphs 없음)_', '')
      continue
    }
    lines.push('| id | kind | variant | paragraphTitle |')
    lines.push('|----|------|---------|----------------|')
    for (const p of item.paragraphSummary) {
      lines.push(
        `| \`${p.id}\` | ${p.kind} | ${p.variant} | ${p.paragraphTitle.replace(/\|/g, '\\|')} |`
      )
    }
    lines.push('')
  }

  lines.push(
    '---',
    '',
    '_Generated from FE draft factories (`export-writing-form-template-seeds.ts`)._',
    ''
  )

  writeFileSync(handoffDocPath, lines.join('\n'), 'utf8')

  return { exported: exports.length, seedsDir, handoffDocPath }
}

/** 발급 Payload A — P0 시드 (issuance-form-api-follow-up.md §3.2) */
const ISSUANCE_FORM_SEED_SPECS: WritingFormSeedSpec[] = [
  {
    templateCode: 'document-payment-order-issue',
    payload: 'A',
    createDraft: () => createPaymentStatementIssuanceDraft(),
  },
  {
    templateCode: 'document-payment-order-pre-consent',
    payload: 'A',
    createDraft: () => createPaymentStatementPreConsentDraft(),
    note: '작성 agreement-third-party와 동일 schema, templateCode·formType만 분리.',
  },
]

export type ExportedIssuanceFormSeed = {
  templateCode: string
  templateName: string
  formType: 'ISSUANCE'
  category: 'ISSUANCE'
  feSubcategory: string
  payload: PayloadKind
  schemaJson: WritingFormDraft
  extensionJson: FormTemplateExtensionPayload | null
  settingsJson: Record<string, unknown> | null
  paragraphSummary: Array<{
    id: string
    kind: string
    variant: string
    paragraphTitle: string
  }>
  note?: string
}

export function getIssuanceFormSeedSpecsForExport(): WritingFormSeedSpec[] {
  return ISSUANCE_FORM_SEED_SPECS
}

export function buildIssuanceFormSeedExport(spec: WritingFormSeedSpec): ExportedIssuanceFormSeed {
  const catalog = ISSUANCE_TEMPLATE_CODE_CATALOG[spec.templateCode]
  const draft = spec.createDraft()
  const extension = spec.createExtension?.() ?? {
    overlay: {},
    editorState: {},
    uiState: {},
  }

  return {
    templateCode: spec.templateCode,
    templateName: catalog?.templateName ?? spec.templateCode,
    formType: 'ISSUANCE',
    category: 'ISSUANCE',
    feSubcategory: catalog?.category ?? 'DOCUMENT',
    payload: spec.payload,
    schemaJson: draft,
    extensionJson: extension,
    settingsJson: spec.settingsJson ?? null,
    paragraphSummary: draft.paragraphs.map(p => ({
      id: p.id,
      kind: p.kind,
      variant: 'variant' in p ? String(p.variant) : '',
      paragraphTitle: p.paragraphTitle ?? '',
    })),
    note: spec.note,
  }
}

/**
 * 발급 양식 Payload A 시드 JSON을 `docs/api/form-template-seeds/`에 기록.
 * 작성 양식 handoff markdown은 갱신하지 않음.
 */
export function exportIssuanceFormTemplateSeeds(options?: {
  seedsDir?: string
}): { exported: number; seedsDir: string; files: string[] } {
  const seedsDir =
    options?.seedsDir ??
    repoRelativeFromModule('../../../../docs/api/form-template-seeds')

  mkdirSync(seedsDir, { recursive: true })

  const exports = getIssuanceFormSeedSpecsForExport().map(buildIssuanceFormSeedExport)
  const files: string[] = []

  for (const item of exports) {
    const fileName = `${item.templateCode}.json`
    const fileBody = {
      templateCode: item.templateCode,
      templateName: item.templateName,
      formType: item.formType,
      category: item.category,
      schemaJson: item.schemaJson,
      extensionJson: item.extensionJson,
      settingsJson: item.settingsJson,
      _apiStorageNote:
        'DB/API에는 schemaJson, extensionJson, settingsJson 각각을 JSON.stringify한 string으로 저장',
      _feSubcategoryNote: `FE 목록 서브분류: ${item.feSubcategory} (ISSUANCE_TEMPLATE_CODE_CATALOG). BE category enum은 ISSUANCE 단일 vs REPORT/DOCUMENT 분리 확인 필요.`,
      ...(item.note ? { _note: item.note } : {}),
    }
    writeFileSync(join(seedsDir, fileName), `${JSON.stringify(fileBody, null, 2)}\n`, 'utf8')
    files.push(fileName)
  }

  return { exported: exports.length, seedsDir, files }
}
