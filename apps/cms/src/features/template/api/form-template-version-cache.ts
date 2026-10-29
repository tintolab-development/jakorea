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
  /** 목록 API — 복제·사용자 생성 행의 카탈로그 원본 */
  baseTemplateCode?: string
  templateName?: string
  /** BE `template_scope` — 버전/목록 DTO에 노출되면 채운다(현재 미노출). */
  templateScope?: string
  /** BE `source_template_id` — CATALOG 원본은 null */
  sourceTemplateId?: number | null
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
  const existing = byTemplateCode.get(entry.templateCode)
  byTemplateCode.set(entry.templateCode, {
    ...existing,
    ...entry,
    baseTemplateCode: entry.baseTemplateCode ?? existing?.baseTemplateCode,
    templateName: entry.templateName ?? existing?.templateName,
    templateScope: entry.templateScope ?? existing?.templateScope,
    sourceTemplateId:
      entry.sourceTemplateId !== undefined ? entry.sourceTemplateId : existing?.sourceTemplateId,
  })
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
    baseTemplateCode?: string
    templateName?: string
    templateScope?: string
    sourceTemplateId?: number | null
  }>
): void {
  for (const item of items) {
    const templateCode = item.templateCode?.trim()
    if (templateCode == null || templateCode === '' || item.templateId == null) continue
    const existing = byTemplateCode.get(templateCode)
    const latestVersionId = item.latestVersionId ?? existing?.latestVersionId
    const baseTemplateCode = item.baseTemplateCode?.trim() || existing?.baseTemplateCode
    const templateName = item.templateName?.trim() || existing?.templateName
    const templateScope = item.templateScope?.trim() || existing?.templateScope
    const sourceTemplateId =
      item.sourceTemplateId !== undefined ? item.sourceTemplateId : existing?.sourceTemplateId
    byTemplateCode.set(templateCode, {
      templateCode,
      templateId: item.templateId,
      templateVersionId: latestVersionId ?? existing?.templateVersionId,
      latestVersionId,
      latestVersionNo: item.latestVersionNo ?? existing?.latestVersionNo,
      ...(baseTemplateCode != null && baseTemplateCode !== '' ? { baseTemplateCode } : {}),
      ...(templateName != null && templateName !== '' ? { templateName } : {}),
      ...(templateScope != null && templateScope !== '' ? { templateScope } : {}),
      ...(sourceTemplateId !== undefined ? { sourceTemplateId } : {}),
    })
  }
}
