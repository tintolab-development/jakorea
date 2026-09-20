import { isEducationLevelKey, type EducationLevelKey } from '@/shared/lib'
import type { TextbookContent, TextbookThemeKey } from '../model/types'
import { MOCK_TEXTBOOK_CONTENTS } from '../lib/mock-data'
import type { PublicTextbookListItem } from './types'

const FIELD_CODE_TO_THEME: Record<string, TextbookThemeKey> = {
  CAREER_EMPLOYMENT: 'career',
  ECONOMICS_FINANCE: 'economy',
  ENTREPRENEURSHIP: 'entrepreneurship',
  DIGITAL_LITERACY: 'digital',
}

const TARGET_CODE_TO_LEVEL: Record<string, EducationLevelKey> = {
  PRESCHOOL: 'preschool',
  ELEMENTARY: 'elementary',
  MIDDLE_SCHOOL: 'middle',
  HIGH_SCHOOL: 'high',
  ADULT: 'adult',
  NOTICE: 'notice',
}

function themeFromField(code: string | undefined): TextbookThemeKey {
  if (!code) return 'economy'
  return FIELD_CODE_TO_THEME[code] ?? 'economy'
}

function levelFromTargets(
  targets: PublicTextbookListItem['targets'],
  title: string,
): EducationLevelKey {
  if (title === '교육 콘텐츠 이용 안내') return 'notice'
  const code = targets?.[0]?.targetCode?.trim()
  if (code && TARGET_CODE_TO_LEVEL[code]) return TARGET_CODE_TO_LEVEL[code]
  if (code && isEducationLevelKey(code.toLowerCase())) return code.toLowerCase() as EducationLevelKey
  return 'elementary'
}

function mockByTitle(title: string): TextbookContent | undefined {
  return MOCK_TEXTBOOK_CONTENTS.find(item => item.title === title)
}

export function mapPublicTextbookListItem(row: PublicTextbookListItem): TextbookContent | null {
  if (row.id == null) return null
  const title = row.textbookName?.trim()
  if (!title) return null
  const mock = mockByTitle(title)
  const theme = themeFromField(row.businessField?.fieldCode) ?? mock?.theme ?? 'economy'
  const level = levelFromTargets(row.targets, title)
  const targetNames = (row.targets ?? [])
    .map(target => target.targetName?.trim())
    .filter((name): name is string => Boolean(name))
  const fieldName = row.businessField?.displayName?.trim()
  const effect = row.educationEffect?.trim()
  const tags = [
    ...(targetNames.length > 0 ? [targetNames.join(', ')] : []),
    ...(fieldName ? [fieldName] : []),
  ]
  const modalTags = [
    ...targetNames.map(label => ({ label, icon: 'target' as const })),
    ...(fieldName ? [{ label: fieldName, icon: 'category' as const }] : []),
    ...(effect ? [{ label: effect, icon: 'skill' as const }] : []),
  ]
  const unitCount = mock?.unitCount ?? 0
  const unitSessionText = mock?.unitSessionText
  return {
    id: String(row.id),
    title,
    description: row.description?.trim() || mock?.description || '',
    thumbnailUrl: row.thumbnailUrl?.trim() || mock?.thumbnailUrl,
    theme,
    level,
    compositions: mock?.compositions,
    tags: tags.length > 0 ? tags : (mock?.tags ?? []),
    modalTags: modalTags.length > 0 ? modalTags : (mock?.modalTags ?? []),
    sessionSummary:
      mock?.sessionSummary ??
      (unitCount > 0
        ? `총 ${unitCount}단원${unitSessionText ? ` (${unitSessionText})` : ''}`
        : '안내 자료'),
    unitCount,
    unitSessionText,
    units: mock?.units ?? [],
  }
}

export function mapPublicTextbookList(items: PublicTextbookListItem[] | undefined): TextbookContent[] {
  return (items ?? [])
    .map(mapPublicTextbookListItem)
    .filter((row): row is TextbookContent => row != null)
}

export function resolveTextbookContent(
  id: string | null,
  catalog: TextbookContent[],
): TextbookContent | null {
  if (!id) return null
  const fromCatalog = catalog.find(item => item.id === id)
  if (fromCatalog) return fromCatalog
  const mock = MOCK_TEXTBOOK_CONTENTS.find(item => item.id === id)
  if (!mock) return null
  return catalog.find(item => item.title === mock.title) ?? mock
}
