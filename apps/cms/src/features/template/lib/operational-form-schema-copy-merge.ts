import { getFormTemplateSeedDraft } from '@/features/template/lib/form-template-seed-registry'
import { resolveWritingFormBaseTemplateCode } from '@/features/template/lib/form-template-delete-policy'
import type {
  WritingFormDraft,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

/**
 * 예전 시드가 서버 저장본에 그대로 남아 있는 단락 설명 — 불러올 때 현재 시드 문구로 바꾼다.
 * 관리자가 직접 고친 문구(목록에 없는 값)는 그대로 둔다. (Figma 재대조 2026-11-13, BE 요청서 T7·T9)
 */
const LEGACY_SEED_PARAGRAPH_DESCRIPTIONS: Readonly<Record<string, readonly string[]>> = {
  'economy-recruit-institution-seed-detail-info': [
    '공란인 경우, 홈페이지 모집 상세에서 항목 미노출 됩니다.',
  ],
  'gemini-vt-recruit-seed-detail-info': ['공란인 경우, 홈페이지 모집 상세에서 항목 미노출 됩니다.'],
  'trained-teachers-recruit-institution-seed-detail-info': [
    '공란인 경우, 홈페이지 모집 상세에서 항목 미노출 됩니다.',
  ],
  'ujat-recruit-institution-seed-detail-info': [
    '공란인 경우, 홈페이지 모집 상세에서 항목 미노출 됩니다.',
  ],
  'ujat-recruit-form-volunteer-seed-recruit-info': [
    '봉사자 모집은 프로그램 등록 시 상반기/하반기 구분되어 진행되며, 양식 내용은 동일하게 노출됩니다. (모집 공고 노출 시점은 하반기 모집 폼에서만 노출됩니다.)',
  ],
  'ujat-recruit-form-volunteer-seed-detail-info': [
    '공란인 경우, 홈페이지 모집 상세에서 항목 미노출 됩니다.',
  ],
  'ujat-recruit-form-volunteer-seed-interview-schedule': [
    '면접 진행 가능 시간을 입력해주세요. 면접 진행 가능 일정은 평일만 선택 가능합니다.',
  ],
  'recruit-form-volunteer-seed-interview-schedule': [
    '면접 진행 가능 시간을 입력해주세요. 면접 진행 가능 일정은 평일만 선택 가능합니다.',
  ],
  'program-registration-seed-wage-info': [
    '해당 프로그램 내에서 각 등급별로 지급할 강사비를 책정해 주세요.',
  ],
  'program-registration-seed-education-curriculum': ['차시 별 정보를 입력해 주세요'],
  'ujat-reg-first-half-education-schedule': ['행사 일정 별 정보를 입력해 주세요'],
  'ujat-reg-second-half-education-schedule': ['행사 일정 별 정보를 입력해 주세요'],
  'ujat-reg-education-schedule-settings': ['교육이 진행되는 일정을 설정해 주세요.'],
}

function resolveParagraphDescriptionFromEditor(
  seedParagraph: WritingFormParagraph,
  editorParagraph: WritingFormParagraph
): string {
  const editorValue = editorParagraph.paragraphDescription ?? ''
  const legacy = LEGACY_SEED_PARAGRAPH_DESCRIPTIONS[seedParagraph.id]
  if (legacy != null && legacy.includes(editorValue.trim())) {
    return seedParagraph.paragraphDescription ?? ''
  }
  return editorValue
}

function applyAllowedParagraphCopyFromEditor(
  seedParagraph: WritingFormParagraph,
  editorParagraph: WritingFormParagraph
): WritingFormParagraph {
  if (seedParagraph.id !== editorParagraph.id) return seedParagraph
  if (seedParagraph.kind !== editorParagraph.kind) return seedParagraph

  let next: WritingFormParagraph = {
    ...seedParagraph,
    paragraphTitle: editorParagraph.paragraphTitle ?? '',
    paragraphDescription: resolveParagraphDescriptionFromEditor(seedParagraph, editorParagraph),
  }

  if (
    seedParagraph.kind === 'description' &&
    seedParagraph.variant === 'survey_title_with_period' &&
    editorParagraph.kind === 'description' &&
    editorParagraph.variant === 'survey_title_with_period'
  ) {
    next = {
      ...seedParagraph,
      paragraphTitle: editorParagraph.paragraphTitle ?? '',
      paragraphDescription: editorParagraph.paragraphDescription ?? '',
      surveyTitle: editorParagraph.surveyTitle,
    }
  }

  return next
}

/** 잠긴 단락: baseline에 있는 키만, 값은 에디터 현재 입력 */
function mergeEditorValuesOntoBaselineKeys(
  seedParagraph: WritingFormParagraph,
  editorParagraph: WritingFormParagraph
): WritingFormParagraph {
  if (seedParagraph.id !== editorParagraph.id) return seedParagraph
  if (seedParagraph.kind !== editorParagraph.kind) return seedParagraph
  if (seedParagraph.variant !== editorParagraph.variant) return seedParagraph

  const base = seedParagraph as unknown as Record<string, unknown>
  const editor = editorParagraph as unknown as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(base)) {
    if (key === 'id' || key === 'kind' || key === 'variant') {
      out[key] = base[key]
      continue
    }
    out[key] = key in editor ? editor[key] : base[key]
  }
  return out as unknown as WritingFormParagraph
}

/**
 * 등록·모집 시스템 양식 PUT — BE `FORM_SCHEMA_IMMUTABLE` 회피.
 * 에디터 draft 전체가 아니라 시드 구조 + 허용 카피(`paragraphTitle` / `paragraphDescription` 등)만 schemaJson으로 보낸다.
 */
export function buildOperationalImmutableFormSchemaDraft(args: {
  templateCode: string
  editorDraft: WritingFormDraft
  baseTemplateCode?: string | null
  /** COPY GET schema — FE 시드가 아니라 이 복사본이 잠근 구조 */
  catalogBaseline?: WritingFormDraft | null
}): WritingFormDraft | null {
  const catalogCode = resolveWritingFormBaseTemplateCode(args.templateCode, args.baseTemplateCode)
  const seed = args.catalogBaseline ?? getFormTemplateSeedDraft(catalogCode)
  if (seed == null) return null

  const editorById = new Map(args.editorDraft.paragraphs.map(p => [p.id, p]))
  const seedIds = new Set(seed.paragraphs.map(p => p.id))

  const useCurrentEditorValues = catalogCode === 'application-participant-individual'
  const paragraphs: WritingFormParagraph[] = seed.paragraphs.map(seedParagraph => {
    const editorParagraph = editorById.get(seedParagraph.id)
    if (editorParagraph == null) return seedParagraph
    return useCurrentEditorValues
      ? mergeEditorValuesOntoBaselineKeys(seedParagraph, editorParagraph)
      : applyAllowedParagraphCopyFromEditor(seedParagraph, editorParagraph)
  })

  for (const editorParagraph of args.editorDraft.paragraphs) {
    if (seedIds.has(editorParagraph.id)) continue
    // 카탈로그 시드 id가 섞여 들어온 단락(예: 면접 일정)은 COPY 구조 잠금에 걸린다.
    if (/-seed-/.test(editorParagraph.id)) continue
    paragraphs.push(editorParagraph)
  }

  // normalizeWritingFormDraft는 short_essay에 maxLength 등을 주입한다.
  // 시스템 신청·모집 COPY PUT은 BE 카탈로그 구조와 byte-level 맞춤이 필요하다.
  return {
    ...seed,
    formSettings: seed.formSettings,
    paragraphs,
  }
}
