import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { parseCatalogSchemaJson } from '@/features/template/api/adapters/form-template-draft-adapters'
import { fetchPublishedFormTemplatePayloadByCodeRemote } from '@/features/template/api/form-templates-api-client'
import {
  applyUneditedCatalogContentWithReport,
  type CatalogDefaultsMismatch,
} from '@/features/template/lib/catalog-structure-diff'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

const publishedDraftCache = new Map<string, Promise<WritingFormDraft | null>>()

export function clearPublishedCatalogDraftCache(templateCode?: string): void {
  if (templateCode == null || templateCode.trim() === '') {
    publishedDraftCache.clear()
    return
  }
  publishedDraftCache.delete(templateCode.trim())
}

async function fetchPublishedCatalogDraft(templateCode: string): Promise<WritingFormDraft | null> {
  if (!isRealApiModuleEnabled('formsSurveys') || !hasRemoteAdminJwt()) return null
  const payload = await fetchPublishedFormTemplatePayloadByCodeRemote(templateCode)
  return parseCatalogSchemaJson(payload.schemaJson)
}

/**
 * templateCode당 한 번만 published-payload를 조회한다.
 * 같은 위저드 단계의 재렌더에서는 진행 중인 Promise를 재사용한다.
 */
export function loadPublishedCatalogDraft(templateCode: string): Promise<WritingFormDraft | null> {
  const code = templateCode.trim()
  if (code === '') return Promise.resolve(null)
  const cached = publishedDraftCache.get(code)
  if (cached != null) return cached
  const pending = fetchPublishedCatalogDraft(code)
    .then(draft => {
      if (draft == null) publishedDraftCache.delete(code)
      return draft
    })
    .catch(() => {
      publishedDraftCache.delete(code)
      return null
    })
  publishedDraftCache.set(code, pending)
  return pending
}

/** 게시 원본과 FE 시드 구조가 다를 때 — 새 UI 없이 기존 console.warn 패턴으로 남긴다(C6). */
function reportPublishedCatalogStructureMismatch(
  templateCode: string | undefined,
  mismatches: CatalogDefaultsMismatch[]
): void {
  if (mismatches.length === 0) return
  console.warn(
    '[published-catalog-defaults] 게시 원본과 FE 시드 구조가 달라 해당 경로의 게시 기본 내용을 적용하지 않았습니다. 항목 순서·ID는 유지합니다.',
    { templateCode: templateCode ?? null, mismatches }
  )
}

/**
 * 비동기 published 응답을 "현재 draft" 위에 합친다(C8).
 * 사용자가 이미 고친 값은 current에 남고, 시드와 같은(미편집) 기본 내용만 게시 값으로 채운다.
 * current가 비어 있으면(초기 EMPTY) 시드를 기준으로 한다. 순서·ID·구조는 바꾸지 않는다.
 */
export function mergePublishedCatalogDefaults<T extends { paragraphs: readonly unknown[] }>(args: {
  current: T
  seed: T
  published: T | null | undefined
  templateCode?: string
}): T {
  const base = args.current.paragraphs.length > 0 ? args.current : args.seed
  if (args.published == null) return base
  const { value, mismatches } = applyUneditedCatalogContentWithReport(
    base,
    args.published,
    args.seed
  )
  reportPublishedCatalogStructureMismatch(args.templateCode, mismatches)
  return value
}

/**
 * 임시저장·기존 입력이 있으면 그대로 둔다.
 * 없을 때만 게시 원본의 기본 내용을 아직 편집하지 않은 필드에 넣는다.
 */
export function resolveWizardCatalogDraft<T extends { paragraphs: readonly unknown[] }>(args: {
  saved: T | null | undefined
  seed: T
  published: T | null | undefined
  templateCode?: string
}): T {
  if (args.saved != null && args.saved.paragraphs.length > 0) return args.saved
  return mergePublishedCatalogDefaults({
    current: args.seed,
    seed: args.seed,
    published: args.published,
    templateCode: args.templateCode,
  })
}
