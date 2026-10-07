import { lookupTemplateRegistry } from '@/features/template/model/template-registry/template-registry'
import type { TemplateRegistryDefinition } from '@/features/template/model/template-registry/template-registry'

/** 에디터 종류는 `baseTemplateCode`(목록/상세)로 찾고, draft id는 실제 templateCode를 유지한다. */
export function lookupWritingTemplateRegistry(
  templateId: string | undefined | null,
  options?: { baseTemplateCode?: string | null }
): TemplateRegistryDefinition | undefined {
  const code = templateId?.trim()
  if (code == null || code === '') return undefined

  const explicit = options?.baseTemplateCode?.trim()
  if (explicit != null && explicit !== '') {
    const base = lookupTemplateRegistry(explicit)
    if (base != null) return { ...base, id: code }
  }

  return lookupTemplateRegistry(code)
}
