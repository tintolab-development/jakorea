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
import { createSettlementApplicationIssuanceDraft } from '@/features/template/model/settlement-application-issuance-draft'
import {
  createAgreementNoticeDraft,
  createAgreementPortraitDraft,
  createDefaultSurveyDraft,
  createEducatorFacilitatorPledgeDraft,
  createLectureReportIssuanceDraft,
  createUjatEducationJournalIssuanceDraft,
  createUjatEducationPlanIssuanceDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

const EXCLUDED_TEMPLATE_CODES = new Set(['registration-general'])

type PayloadKind = 'A' | 'B' | 'C' | 'D' | 'E'

const EMPTY_CERTIFICATE_BODY =
  '귀하는 위의 과정에 참여하여\n교육과정을 수료하였음을 확인합니다.'

function createCertificateSettingsJson(titleName: string): Record<string, unknown> {
  return {
    orgLogo: null,
    orgLogo02: null,
    certificateBackground: null,
    chairmanSeal: null,
    titleName,
    bodyContent: EMPTY_CERTIFICATE_BODY,
    participantRowVisibility: [true, true, true, true, true, true],
  }
}

function createEmptyPlaceholderDraft(): WritingFormDraft {
  return {
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs: [],
  }
}

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
    '**발급 양식 14종** 시드: [issuance-form-seeds-backend-handoff.md](./issuance-form-seeds-backend-handoff.md) (`exportIssuanceFormTemplateSeeds`)',
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

type IssuanceFormSeedSpec = {
  templateCode: string
  payload: 'A' | 'D' | 'E'
  /** Payload A/E. Payload D(인증서)는 null schemaJson */
  createDraft?: () => WritingFormDraft
  schemaJsonNull?: boolean
  createExtension?: () => FormTemplateExtensionPayload
  settingsJson?: Record<string, unknown> | null
  /** 기본: `{templateCode}.json`. 인증서 document-3 하위호환용 */
  fileName?: string
  note?: string
  apiStorageNote?: string
}

/** 발급 양식 14종 — ISSUANCE_TEMPLATE_CODE_CATALOG 순서 */
const ISSUANCE_FORM_SEED_SPECS: IssuanceFormSeedSpec[] = [
  {
    templateCode: 'issuance-1',
    payload: 'E',
    createDraft: createEmptyPlaceholderDraft,
    note: '플레이스홀더. FE 편집기·저장 UI 없음. BE는 메타 등록 또는 빈 DRAFT만.',
  },
  {
    templateCode: 'issuance-2',
    payload: 'A',
    createDraft: () => createUjatEducationPlanIssuanceDraft(),
  },
  {
    templateCode: 'issuance-ujat-edu-journal',
    payload: 'A',
    createDraft: () => createUjatEducationJournalIssuanceDraft(),
  },
  {
    templateCode: 'issuance-3',
    payload: 'A',
    createDraft: () => createLectureReportIssuanceDraft(),
  },
  {
    templateCode: 'issuance-4',
    payload: 'A',
    createDraft: () => createSettlementApplicationIssuanceDraft(),
  },
  {
    templateCode: 'issuance-5',
    payload: 'E',
    createDraft: createEmptyPlaceholderDraft,
    note: '플레이스홀더(미리보기만). FE 저장 UI 없음. BE는 메타 등록 또는 빈 DRAFT만.',
  },
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
  {
    templateCode: 'document-1',
    payload: 'E',
    createDraft: createEmptyPlaceholderDraft,
    note: '플레이스홀더. FE 편집기·저장 UI 없음. BE는 메타 등록 또는 빈 DRAFT만.',
  },
  {
    templateCode: 'document-2',
    payload: 'D',
    schemaJsonNull: true,
    settingsJson: createCertificateSettingsJson('휴가 인증서'),
    apiStorageNote:
      '인증서 양식은 schemaJson 없이 settingsJson만 사용. DB/API에는 settingsJson을 JSON.stringify한 string으로 저장',
  },
  {
    templateCode: 'document-3',
    payload: 'D',
    schemaJsonNull: true,
    settingsJson: createCertificateSettingsJson('수료증'),
    fileName: 'document-3-certificate.json',
    apiStorageNote:
      '인증서 양식은 schemaJson 없이 settingsJson만 사용. DB/API에는 settingsJson을 JSON.stringify한 string으로 저장',
  },
  {
    templateCode: 'document-participation-certificate',
    payload: 'D',
    schemaJsonNull: true,
    settingsJson: createCertificateSettingsJson('참여인증서'),
    apiStorageNote:
      '인증서 양식은 schemaJson 없이 settingsJson만 사용. DB/API에는 settingsJson을 JSON.stringify한 string으로 저장',
  },
  {
    templateCode: 'document-4',
    payload: 'D',
    schemaJsonNull: true,
    settingsJson: createCertificateSettingsJson('강사 활동 인증서'),
    apiStorageNote:
      '인증서 양식은 schemaJson 없이 settingsJson만 사용. DB/API에는 settingsJson을 JSON.stringify한 string으로 저장',
  },
  {
    templateCode: 'document-5',
    payload: 'D',
    schemaJsonNull: true,
    settingsJson: createCertificateSettingsJson('봉사 활동 인증서'),
    apiStorageNote:
      '인증서 양식은 schemaJson 없이 settingsJson만 사용. DB/API에는 settingsJson을 JSON.stringify한 string으로 저장',
  },
]

export type ExportedIssuanceFormSeed = {
  templateCode: string
  templateName: string
  formType: 'ISSUANCE'
  category: 'ISSUANCE'
  feSubcategory: string
  payload: 'A' | 'D' | 'E'
  schemaJson: WritingFormDraft | null
  extensionJson: FormTemplateExtensionPayload | null
  settingsJson: Record<string, unknown> | null
  fileName: string
  paragraphSummary: Array<{
    id: string
    kind: string
    variant: string
    paragraphTitle: string
  }>
  note?: string
  apiStorageNote?: string
}

export function getIssuanceFormSeedSpecsForExport(): IssuanceFormSeedSpec[] {
  return ISSUANCE_FORM_SEED_SPECS
}

export function buildIssuanceFormSeedExport(spec: IssuanceFormSeedSpec): ExportedIssuanceFormSeed {
  const catalog = ISSUANCE_TEMPLATE_CODE_CATALOG[spec.templateCode]
  const draft = spec.schemaJsonNull ? null : (spec.createDraft?.() ?? createEmptyPlaceholderDraft())
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
    fileName: spec.fileName ?? `${spec.templateCode}.json`,
    paragraphSummary:
      draft?.paragraphs.map(p => ({
        id: p.id,
        kind: p.kind,
        variant: 'variant' in p ? String(p.variant) : '',
        paragraphTitle: p.paragraphTitle ?? '',
      })) ?? [],
    note: spec.note,
    apiStorageNote: spec.apiStorageNote,
  }
}

/**
 * 발급 양식 14종 시드 JSON + handoff markdown 기록.
 */
export function exportIssuanceFormTemplateSeeds(options?: {
  seedsDir?: string
  handoffDocPath?: string
}): { exported: number; seedsDir: string; files: string[]; handoffDocPath: string } {
  const seedsDir =
    options?.seedsDir ??
    repoRelativeFromModule('../../../../docs/api/form-template-seeds')
  const handoffDocPath =
    options?.handoffDocPath ??
    repoRelativeFromModule('../../../../docs/api/issuance-form-seeds-backend-handoff.md')

  mkdirSync(seedsDir, { recursive: true })

  const exports = getIssuanceFormSeedSpecsForExport().map(buildIssuanceFormSeedExport)
  const files: string[] = []

  for (const item of exports) {
    const fileBody = {
      templateCode: item.templateCode,
      templateName: item.templateName,
      formType: item.formType,
      category: item.category,
      schemaJson: item.schemaJson,
      extensionJson: item.extensionJson,
      settingsJson: item.settingsJson,
      _apiStorageNote:
        item.apiStorageNote ??
        'DB/API에는 schemaJson, extensionJson, settingsJson 각각을 JSON.stringify한 string으로 저장',
      _feSubcategoryNote: `FE 목록 서브분류: ${item.feSubcategory} (ISSUANCE_TEMPLATE_CODE_CATALOG). BE category enum은 ISSUANCE 단일 vs REPORT/DOCUMENT 분리 확인 필요.`,
      _payload: item.payload,
      ...(item.payload === 'D'
        ? {
            _imageFieldNote:
              'orgLogo 등 이미지 필드는 BE 합의 후 fileId 또는 { fileId, url } 객체로 확장',
          }
        : {}),
      ...(item.note ? { _note: item.note } : {}),
    }
    writeFileSync(join(seedsDir, item.fileName), `${JSON.stringify(fileBody, null, 2)}\n`, 'utf8')
    files.push(item.fileName)
  }

  const reportRows = exports.filter(i => i.feSubcategory === 'REPORT')
  const documentRows = exports.filter(i => i.feSubcategory === 'DOCUMENT')

  const lines: string[] = [
    '# 발급 양식 시드 JSON — 백엔드 전달 (14종)',
    '',
    '`formType=ISSUANCE` 초기 DRAFT / DB 시드용입니다. FE mock factory에서 생성했습니다.',
    '',
    '**관련**',
    '',
    '- JSON 계약: [form-template-json-contract.md](./form-template-json-contract.md) §8',
    '- API 후속: [issuance-form-api-follow-up.md](./issuance-form-api-follow-up.md)',
    '- 카탈로그 SSOT: `src/features/template/api/form-template-catalog.ts` → `ISSUANCE_TEMPLATE_CODE_CATALOG`',
    '- 생성: `exportIssuanceFormTemplateSeeds()` (`export-writing-form-template-seeds.ts`)',
    '',
    '## 저장 규칙',
    '',
    '| 필드 | 설명 |',
    '|------|------|',
    '| `schemaJson` | Payload **A**: `WritingFormDraft` object → API 저장 시 **JSON string**. Payload **D**: `null`. Payload **E**: 빈 paragraphs object |',
    '| `extensionJson` | `{ overlay, editorState, uiState }` → JSON string (기본 빈 object) |',
    '| `settingsJson` | Payload **D**(인증서)만 사용. 그 외 `null` |',
    '| `formType` | 항상 `ISSUANCE` |',
    '| `category` | 시드 JSON은 `ISSUANCE` (FE 목록 서브분류 REPORT/DOCUMENT는 `_feSubcategoryNote` 참고) |',
    '',
    '### Payload 종류',
    '',
    '| 코드 | body |',
    '|------|------|',
    '| **A** | `schemaJson` + 빈 `extensionJson`, `settingsJson: null` |',
    '| **D** | `schemaJson: null` + `settingsJson` (인증서 5종) |',
    '| **E** | 빈 `schemaJson.paragraphs` — FE 편집기 없음. 메타/빈 DRAFT만 |',
    '',
    '## 목록 (14종)',
    '',
    '### 보고 양식 (6)',
    '',
    '| templateCode | templateName | Payload | 시드 JSON | 단락 수 |',
    '|--------------|--------------|---------|-----------|--------:|',
  ]

  for (const item of reportRows) {
    lines.push(
      `| \`${item.templateCode}\` | ${item.templateName} | ${item.payload} | [${item.fileName}](./form-template-seeds/${item.fileName}) | ${item.paragraphSummary.length} |`
    )
  }

  lines.push('', '### 서류 양식 (8)', '', '| templateCode | templateName | Payload | 시드 JSON | 단락 수 |', '|--------------|--------------|---------|-----------|--------:|')

  for (const item of documentRows) {
    lines.push(
      `| \`${item.templateCode}\` | ${item.templateName} | ${item.payload} | [${item.fileName}](./form-template-seeds/${item.fileName}) | ${item.paragraphSummary.length} |`
    )
  }

  lines.push('', '## 단락 id 요약 (Payload A)', '')

  for (const item of exports.filter(i => i.payload === 'A')) {
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
    '## Payload D · E 참고',
    '',
    '- **D (인증서 5종):** `settingsJson.titleName` / `bodyContent` / `participantRowVisibility` 시드. 이미지 필드는 `null`.',
    '- **E (3종):** `issuance-1`, `issuance-5`, `document-1` — 제품 스펙 확정 전까지 빈 DRAFT.',
    '',
    '---',
    '',
    '_Generated from FE draft factories (`exportIssuanceFormTemplateSeeds`)._',
    ''
  )

  writeFileSync(handoffDocPath, lines.join('\n'), 'utf8')

  return { exported: exports.length, seedsDir, files, handoffDocPath }
}
