import {
  ALIMTALK_ROOT_CATEGORY_ID,
  type AlimtalkCategory,
  type AlimtalkTemplateItem,
} from '@/features/notifications/model/alimtalk-template/types'

export type AlimtalkTreeChild =
  | { kind: 'category'; category: AlimtalkCategory }
  | { kind: 'template'; template: AlimtalkTemplateItem }

export function categoryChildren(
  categories: AlimtalkCategory[],
  parentId: string
): AlimtalkCategory[] {
  return categories.filter(category => category.parentId === parentId)
}

export function templatesInCategory(
  templates: AlimtalkTemplateItem[],
  categoryId: string
): AlimtalkTemplateItem[] {
  return templates.filter(template => template.categoryId === categoryId)
}

export function childrenOf(
  categories: AlimtalkCategory[],
  templates: AlimtalkTemplateItem[],
  parentId: string
): AlimtalkTreeChild[] {
  return [
    ...categoryChildren(categories, parentId).map(
      category => ({ kind: 'category', category }) as const
    ),
    ...templatesInCategory(templates, parentId).map(
      template => ({ kind: 'template', template }) as const
    ),
  ]
}

export function findCategory(
  categories: AlimtalkCategory[],
  id: string
): AlimtalkCategory | undefined {
  return categories.find(category => category.id === id)
}

export function findTemplate(
  templates: AlimtalkTemplateItem[],
  id: string
): AlimtalkTemplateItem | undefined {
  return templates.find(template => template.id === id)
}

export function categoryNameById(
  categories: AlimtalkCategory[],
  id: string
): string {
  if (id === ALIMTALK_ROOT_CATEGORY_ID) return 'Category'
  return findCategory(categories, id)?.name ?? '-'
}

export function ancestorIds(categories: AlimtalkCategory[], categoryId: string): string[] {
  const ids: string[] = []
  let currentId = categoryId
  const seen = new Set<string>()
  while (currentId && currentId !== ALIMTALK_ROOT_CATEGORY_ID && !seen.has(currentId)) {
    seen.add(currentId)
    ids.push(currentId)
    const category = findCategory(categories, currentId)
    if (!category) break
    currentId = category.parentId
  }
  return ids
}

export function descendantCategoryIds(
  categories: AlimtalkCategory[],
  categoryId: string
): string[] {
  const ids: string[] = []
  const walk = (parentId: string) => {
    for (const child of categoryChildren(categories, parentId)) {
      ids.push(child.id)
      walk(child.id)
    }
  }
  walk(categoryId)
  return ids
}

export function collectDeleteIds(
  categories: AlimtalkCategory[],
  templates: AlimtalkTemplateItem[],
  checkedIds: ReadonlySet<string>
): { categoryIds: string[]; templateIds: string[] } {
  const categoryIds = new Set<string>()
  const templateIds = new Set<string>()

  for (const id of checkedIds) {
    if (id === ALIMTALK_ROOT_CATEGORY_ID) continue
    const category = findCategory(categories, id)
    if (category) {
      categoryIds.add(category.id)
      for (const descendantId of descendantCategoryIds(categories, category.id)) {
        categoryIds.add(descendantId)
      }
      continue
    }
    const template = findTemplate(templates, id)
    if (template) templateIds.add(template.id)
  }

  for (const template of templates) {
    if (categoryIds.has(template.categoryId)) templateIds.add(template.id)
  }

  return { categoryIds: [...categoryIds], templateIds: [...templateIds] }
}

export function categoryHasChildren(
  categories: AlimtalkCategory[],
  templates: AlimtalkTemplateItem[],
  categoryId: string
): boolean {
  return childrenOf(categories, templates, categoryId).length > 0
}

export function moveTemplateToCategory(
  templates: AlimtalkTemplateItem[],
  templateId: string,
  targetCategoryId: string
): AlimtalkTemplateItem[] {
  return templates.map(template =>
    template.id === templateId ? { ...template, categoryId: targetCategoryId } : template
  )
}

export function canMoveCategoryTo(
  categories: AlimtalkCategory[],
  categoryId: string,
  targetParentId: string
): boolean {
  if (categoryId === ALIMTALK_ROOT_CATEGORY_ID) return false
  if (categoryId === targetParentId) return false
  const category = findCategory(categories, categoryId)
  if (!category || category.parentId === targetParentId) return false
  if (targetParentId !== ALIMTALK_ROOT_CATEGORY_ID) {
    if (ancestorIds(categories, targetParentId).includes(categoryId)) return false
  }
  return true
}

export function moveCategoryToParent(
  categories: AlimtalkCategory[],
  categoryId: string,
  targetParentId: string
): AlimtalkCategory[] {
  if (!canMoveCategoryTo(categories, categoryId, targetParentId)) return categories
  return categories.map(category =>
    category.id === categoryId ? { ...category, parentId: targetParentId } : category
  )
}

function includesIgnoreCase(value: string, query: string): boolean {
  if (!query) return true
  return value.toLowerCase().includes(query.toLowerCase())
}

export function filterAlimtalkTree(
  categories: AlimtalkCategory[],
  templates: AlimtalkTemplateItem[],
  categoryNameQuery: string,
  templateNameQuery: string
): { categories: AlimtalkCategory[]; templates: AlimtalkTemplateItem[] } {
  const categoryQ = categoryNameQuery.trim()
  const templateQ = templateNameQuery.trim()
  if (!categoryQ && !templateQ) {
    return { categories, templates }
  }

  const visibleTemplateIds = new Set<string>()
  const visibleCategoryIds = new Set<string>()

  for (const template of templates) {
    const nameHit =
      includesIgnoreCase(template.name, templateQ) ||
      includesIgnoreCase(template.templateName, templateQ)
    if (templateQ && !nameHit) continue

    const pathIds = ancestorIds(categories, template.categoryId)
    const categoryHit =
      !categoryQ ||
      pathIds.some(id => includesIgnoreCase(categoryNameById(categories, id), categoryQ))
    if (!categoryHit) continue

    visibleTemplateIds.add(template.id)
    for (const id of pathIds) visibleCategoryIds.add(id)
  }

  if (!templateQ) {
    for (const category of categories) {
      if (!includesIgnoreCase(category.name, categoryQ)) continue
      visibleCategoryIds.add(category.id)
      for (const id of ancestorIds(categories, category.parentId)) {
        visibleCategoryIds.add(id)
      }
      for (const id of descendantCategoryIds(categories, category.id)) {
        visibleCategoryIds.add(id)
      }
    }
  }

  return {
    categories: categories.filter(category => visibleCategoryIds.has(category.id)),
    templates: templates.filter(template => visibleTemplateIds.has(template.id)),
  }
}
