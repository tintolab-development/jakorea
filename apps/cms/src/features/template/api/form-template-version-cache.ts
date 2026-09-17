/**
 * templateCode → API numeric id 캐시 (메모리).
 * 목록·version 응답으로 채운다. localStorage에 쓰지 않는다.
 */

export type FormTemplateVersionCacheEntry = {
  templateCode: string
  templateId: number
  templateVersionId?: number
  latestVersionId?: number
  latestVersionNo?: number
}

const byTemplateCode = new Map<string, FormTemplateVersionCacheEntry>()

export function getFormTemplateVersionCacheEntry(
  templateCode: string
): FormTemplateVersionCacheEntry | null {
  return byTemplateCode.get(templateCode) ?? null
}

export function upsertFormTemplateVersionCacheEntry(
  entry: FormTemplateVersionCacheEntry
): void {
  byTemplateCode.set(entry.templateCode, entry)
}

export function removeFormTemplateVersionCacheEntry(templateCode: string): void {
  byTemplateCode.delete(templateCode)
}

/** 테스트·로그아웃 등 — 메모리 캐시 전체 비우기 */
export function clearFormTemplateVersionCache(): void {
  byTemplateCode.clear()
}

export function upsertFormTemplateVersionCacheFromListItems(
  items: Array<{
    templateCode?: string
    templateId?: number
    latestVersionId?: number
    latestVersionNo?: number
  }>
): void {
  for (const item of items) {
    const templateCode = item.templateCode?.trim()
    if (templateCode == null || templateCode === '' || item.templateId == null) continue
    const existing = byTemplateCode.get(templateCode)
    const latestVersionId = item.latestVersionId ?? existing?.latestVersionId
    byTemplateCode.set(templateCode, {
      templateCode,
      templateId: item.templateId,
      templateVersionId: latestVersionId ?? existing?.templateVersionId,
      latestVersionId,
      latestVersionNo: item.latestVersionNo ?? existing?.latestVersionNo,
    })
  }
}
