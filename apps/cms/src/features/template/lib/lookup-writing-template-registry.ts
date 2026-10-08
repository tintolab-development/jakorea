import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
  type TemplateRegistryDefinition,
} from '@/features/template/model/template-registry/template-registry'

const WRITING_TEMPLATE_DERIVED_SUFFIX = /-(?:copy(?:-\d+)?|custom-\d+)$/i

function resolveLookupBaseTemplateCode(
  templateCode: string,
  explicitBase?: string | null
): string {
  const explicit = explicitBase?.trim()
  if (explicit != null && explicit !== '') return explicit

  const cached = getFormTemplateVersionCacheEntry(templateCode)?.baseTemplateCode?.trim()
  if (cached != null && cached !== '') return cached

  return templateCode.replace(WRITING_TEMPLATE_DERIVED_SUFFIX, '')
}

/** 에디터 종류는 `baseTemplateCode`(목록/상세)로 찾고, draft id는 실제 templateCode를 유지한다. */
export function lookupWritingTemplateRegistry(
  templateId: string | undefined | null,
  options?: { baseTemplateCode?: string | null }
): TemplateRegistryDefinition | undefined {
  const code = templateId?.trim()
  if (code == null || code === '') return undefined

  const direct = lookupTemplateRegistry(code)
  const resolvedBase = resolveLookupBaseTemplateCode(code, options?.baseTemplateCode)
  const base = resolvedBase !== code ? lookupTemplateRegistry(resolvedBase) : undefined
  const entry = base ?? direct
  if (entry == null) return undefined
  if (entry.id === code) return entry
  return { ...entry, id: code }
}

/** 위저드 배너·미리보기 제목 — 목록 캐시 이름을 우선한다. */
export function resolveWritingTemplateDisplayName(templateCode: string): string {
  const cachedName = getFormTemplateVersionCacheEntry(templateCode)?.templateName?.trim()
  if (cachedName != null && cachedName !== '') return cachedName

  const rowName = findWritingTemplateRowByDefinitionId(templateCode)?.templateName?.trim()
  if (rowName != null && rowName !== '') return rowName

  return resolvePreviewHeaderTitle(lookupWritingTemplateRegistry(templateCode), undefined)
}
