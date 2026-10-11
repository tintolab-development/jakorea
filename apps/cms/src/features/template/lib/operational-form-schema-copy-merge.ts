import { getFormTemplateSeedDraft } from '@/features/template/lib/form-template-seed-registry'
import { resolveWritingFormBaseTemplateCode } from '@/features/template/lib/form-template-delete-policy'
import type {
  WritingFormDraft,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

function applyAllowedParagraphCopyFromEditor(
  seedParagraph: WritingFormParagraph,
  editorParagraph: WritingFormParagraph
): WritingFormParagraph {
  if (seedParagraph.id !== editorParagraph.id) return seedParagraph
  if (seedParagraph.kind !== editorParagraph.kind) return seedParagraph

  let next: WritingFormParagraph = {
    ...seedParagraph,
    paragraphTitle: editorParagraph.paragraphTitle ?? '',
    paragraphDescription: editorParagraph.paragraphDescription ?? '',
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
  const catalogCode = resolveWritingFormBaseTemplateCode(
    args.templateCode,
    args.baseTemplateCode
  )
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
