const VERSION_CACHE_KEY = 'cms.jakorea.formTemplateVersionCache.v1'

export type FormTemplateVersionCacheEntry = {
  templateCode: string
  templateId: number
  templateVersionId?: number
  latestVersionNo?: number
}

type FormTemplateVersionCacheFile = {
  version: 1
  byTemplateCode: Record<string, FormTemplateVersionCacheEntry>
}

function readCacheFile(): FormTemplateVersionCacheFile {
  try {
    const raw = localStorage.getItem(VERSION_CACHE_KEY)
    if (raw == null || raw === '') return { version: 1, byTemplateCode: {} }
    const parsed = JSON.parse(raw) as FormTemplateVersionCacheFile
    if (parsed?.version !== 1 || typeof parsed.byTemplateCode !== 'object') {
      return { version: 1, byTemplateCode: {} }
    }
    return parsed
  } catch {
    return { version: 1, byTemplateCode: {} }
  }
}

function writeCacheFile(file: FormTemplateVersionCacheFile): void {
  localStorage.setItem(VERSION_CACHE_KEY, JSON.stringify(file))
}

export function getFormTemplateVersionCacheEntry(
  templateCode: string
): FormTemplateVersionCacheEntry | null {
  return readCacheFile().byTemplateCode[templateCode] ?? null
}

export function upsertFormTemplateVersionCacheEntry(
  entry: FormTemplateVersionCacheEntry
): void {
  const file = readCacheFile()
  file.byTemplateCode[entry.templateCode] = entry
  writeCacheFile(file)
}

export function upsertFormTemplateVersionCacheFromListItems(
  items: Array<{
    templateCode?: string
    templateId?: number
    latestVersionNo?: number
  }>
): void {
  const file = readCacheFile()
  for (const item of items) {
    const templateCode = item.templateCode?.trim()
    if (templateCode == null || templateCode === '' || item.templateId == null) continue
    const existing = file.byTemplateCode[templateCode]
    file.byTemplateCode[templateCode] = {
      templateCode,
      templateId: item.templateId,
      templateVersionId: existing?.templateVersionId,
      latestVersionNo: item.latestVersionNo ?? existing?.latestVersionNo,
    }
  }
  writeCacheFile(file)
}
