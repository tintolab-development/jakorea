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
  /** 목록·payload — false면 사용자 복제/생성, 공용 카탈로그가 아님 */
  systemTemplate?: boolean
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
    systemTemplate: entry.systemTemplate ?? existing?.systemTemplate,
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
    systemTemplate?: boolean
  }>
): void {
  for (const item of items) {
    const templateCode = item.templateCode?.trim()
    if (templateCode == null || templateCode === '' || item.templateId == null) continue
    const existing = byTemplateCode.get(templateCode)
    const latestVersionId = item.latestVersionId ?? existing?.latestVersionId
    const baseTemplateCode = item.baseTemplateCode?.trim() || existing?.baseTemplateCode
    const templateName = item.templateName?.trim() || existing?.templateName
    const systemTemplate = item.systemTemplate ?? existing?.systemTemplate
    byTemplateCode.set(templateCode, {
      templateCode,
      templateId: item.templateId,
      templateVersionId: latestVersionId ?? existing?.templateVersionId,
      latestVersionId,
      latestVersionNo: item.latestVersionNo ?? existing?.latestVersionNo,
      ...(baseTemplateCode != null && baseTemplateCode !== '' ? { baseTemplateCode } : {}),
      ...(templateName != null && templateName !== '' ? { templateName } : {}),
      ...(systemTemplate != null ? { systemTemplate } : {}),
    })
  }
}
