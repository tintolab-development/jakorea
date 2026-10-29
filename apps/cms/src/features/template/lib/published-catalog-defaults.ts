import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { parseCatalogSchemaJson } from '@/features/template/api/adapters/form-template-draft-adapters'
import { fetchPublishedFormTemplatePayloadByCodeRemote } from '@/features/template/api/form-templates-api-client'
import { applyUneditedCatalogContent } from '@/features/template/lib/catalog-structure-diff'
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

/**
 * 임시저장·기존 입력이 있으면 그대로 둔다.
 * 없을 때만 게시 원본의 기본 내용을 아직 편집하지 않은 필드에 넣는다.
 */
export function resolveWizardCatalogDraft<T extends { paragraphs: readonly unknown[] }>(args: {
  saved: T | null | undefined
  seed: T
  published: T | null | undefined
}): T {
  if (args.saved != null && args.saved.paragraphs.length > 0) return args.saved
  if (args.published == null) return args.seed
  return applyUneditedCatalogContent(args.seed, args.published, args.seed)
}
