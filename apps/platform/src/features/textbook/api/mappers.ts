import { isEducationLevelKey, type EducationLevelKey } from '@/shared/lib'
import type { TextbookContent, TextbookThemeKey, TextbookThemeSection } from '../model/types'
import { TEXTBOOK_THEME_ITEMS } from '../lib/constants'
import { mapPublicTextbookListThumbnail } from '../lib/list-thumbnail'
import type { PublicTextbookDetail, PublicTextbookListItem } from './types'

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

function themeFromField(code: string | undefined): TextbookThemeKey | null {
  if (!code) return null
  return FIELD_CODE_TO_THEME[code] ?? null
}

function levelFromTargetCode(code: string | undefined): EducationLevelKey | null {
  const trimmed = code?.trim()
  if (!trimmed) return null
  if (TARGET_CODE_TO_LEVEL[trimmed]) return TARGET_CODE_TO_LEVEL[trimmed]
  const lower = trimmed.toLowerCase()
  return isEducationLevelKey(lower) ? lower : null
}

/** Admin에서 복수 선택한 교육 대상 전부 — 서버 displayOrder 순, 중복 제거. 없으면 안내사항 */
function levelsFromTargets(targets: PublicTextbookListItem['targets']): EducationLevelKey[] {
  const ordered = (targets ?? [])
    .map((target, index) => ({ target, index }))
    .sort((a, b) => {
      const order =
        (a.target.displayOrder ?? Number.MAX_SAFE_INTEGER) -
        (b.target.displayOrder ?? Number.MAX_SAFE_INTEGER)
      return order !== 0 ? order : a.index - b.index
    })
  const levels: EducationLevelKey[] = []
  for (const { target } of ordered) {
    const level = levelFromTargetCode(target.targetCode)
    if (level && !levels.includes(level)) levels.push(level)
  }
  return levels.length > 0 ? levels : ['notice']
}

function sessionSummary(unitCount: number, sessionDescription: string): string {
  if (unitCount > 0 && sessionDescription) {
    return `총 ${unitCount}단원 (${sessionDescription})`
  }
  if (unitCount > 0) return `총 ${unitCount}단원`
  return sessionDescription
}

function normalizeBusinessFieldDescription(description: string | undefined): string | undefined {
  const normalized = description?.trim()
  if (!normalized) return undefined
  return normalized.replaceAll('창엽 역량', '창업 역량')
}

export function mapPublicTextbookListItem(row: PublicTextbookListItem): TextbookContent | null {
  if (row.id == null) return null
  const title = row.textbookName?.trim()
  if (!title) return null
  const theme = themeFromField(row.businessField?.fieldCode)
  if (!theme) return null
  const unitCount = row.unitCount && row.unitCount > 0 ? row.unitCount : 0
  const unitSessionText = row.sessionDescription?.trim() || undefined
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
  return {
    id: String(row.id),
    title,
    description: row.description?.trim() || '',
    thumbnailUrl: row.thumbnailUrl?.trim() || undefined,
    listThumbnail: mapPublicTextbookListThumbnail(row),
    theme,
    levels: levelsFromTargets(row.targets),
    tags,
    modalTags,
    sessionSummary: sessionSummary(unitCount, unitSessionText ?? ''),
    unitCount,
    unitSessionText,
    fieldDescription: normalizeBusinessFieldDescription(row.businessField?.description),
    units: [],
  }
}

export function mapPublicTextbookList(items: PublicTextbookListItem[] | undefined): TextbookContent[] {
  return (items ?? [])
    .map(mapPublicTextbookListItem)
    .filter((row): row is TextbookContent => row != null)
}

export function mergePublicTextbookDetail(
  base: TextbookContent,
  detail: PublicTextbookDetail | undefined,
): TextbookContent {
  if (!detail) return base
  const unitCount = detail.unitCount && detail.unitCount > 0 ? detail.unitCount : base.unitCount
  const unitSessionText = detail.sessionDescription?.trim() || base.unitSessionText
  const unitIntroHtml = detail.unitIntroHtml?.trim() || base.unitIntroHtml
  return {
    ...base,
    description: detail.description?.trim() || base.description,
    thumbnailUrl: detail.thumbnailUrl?.trim() || base.thumbnailUrl,
    unitCount,
    unitSessionText,
    unitIntroHtml,
    sessionSummary: sessionSummary(unitCount, unitSessionText ?? ''),
  }
}

/** 딥링크 등 목록 row 없이 상세만 있을 때 */
export function mapPublicTextbookDetail(detail: PublicTextbookDetail): TextbookContent | null {
  const base = mapPublicTextbookListItem(detail)
  if (!base) return null
  return mergePublicTextbookDetail(base, detail)
}

export function buildThemeSections(items: TextbookContent[]): TextbookThemeSection[] {
  return TEXTBOOK_THEME_ITEMS.flatMap(theme => {
    const rows = items.filter(item => item.theme === theme.key)
    if (rows.length === 0) return []
    const description = rows.find(item => item.fieldDescription)?.fieldDescription ?? ''
    return [
      {
        key: theme.key,
        title: theme.label,
        description,
        // Render one educational target per directory row. All rows open the same textbook.
        rows: rows.flatMap(item =>
          item.levels.map(level => ({
            id: `${item.id}-${level}`,
            titles: [item.title],
            levels: [level],
            contentId: item.id,
          })),
        ),
      },
    ]
  })
}
