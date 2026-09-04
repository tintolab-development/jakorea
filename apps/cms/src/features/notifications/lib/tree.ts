export const NOTIFICATION_ROOT_CATEGORY_ID = 'root'

export type NotificationTreeCategory = {
  id: string
  name: string
  parentId: string
}

export type NotificationTreeTemplate = {
  id: string
  name: string
  templateName: string
  categoryId: string
  /** BE tree approvalStatus — 서버가 APPROVED만 내려줌. FE 이중 필터 금지 */
  approvalStatus?: string
}

export type NotificationTreeChild<T extends NotificationTreeTemplate> =
  | { kind: 'category'; category: NotificationTreeCategory }
  | { kind: 'template'; template: T }

export function categoryChildren(
  categories: NotificationTreeCategory[],
  parentId: string
): NotificationTreeCategory[] {
  return categories.filter(category => category.parentId === parentId)
}

export function templatesInCategory<T extends NotificationTreeTemplate>(
  templates: T[],
  categoryId: string
): T[] {
  return templates.filter(template => template.categoryId === categoryId)
}

export function childrenOf<T extends NotificationTreeTemplate>(
  categories: NotificationTreeCategory[],
  templates: T[],
  parentId: string
): NotificationTreeChild<T>[] {
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
  categories: NotificationTreeCategory[],
  id: string
): NotificationTreeCategory | undefined {
  return categories.find(category => category.id === id)
}

export function findTemplate<T extends NotificationTreeTemplate>(
  templates: T[],
  id: string
): T | undefined {
  return templates.find(template => template.id === id)
}

export function categoryNameById(
  categories: NotificationTreeCategory[],
  id: string
): string {
  if (id === NOTIFICATION_ROOT_CATEGORY_ID) return 'Category'
  return findCategory(categories, id)?.name ?? '-'
}

/** 루트 제외 조상→현재 카테고리명. UI에서는 TdDivider로 구분한다. */
export function categoryPathNames(
  categories: NotificationTreeCategory[],
  categoryId: string
): string[] {
  return ancestorIds(categories, categoryId)
    .reverse()
    .map(id => categoryNameById(categories, id))
    .filter(name => name !== '-')
}

export function ancestorIds(categories: NotificationTreeCategory[], categoryId: string): string[] {
  const ids: string[] = []
  let currentId = categoryId
  const seen = new Set<string>()
  while (currentId && currentId !== NOTIFICATION_ROOT_CATEGORY_ID && !seen.has(currentId)) {
    seen.add(currentId)
    ids.push(currentId)
    const category = findCategory(categories, currentId)
    if (!category) break
    currentId = category.parentId
  }
  return ids
}

export function descendantCategoryIds(
  categories: NotificationTreeCategory[],
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

export function collectDeleteIds<T extends NotificationTreeTemplate>(
  categories: NotificationTreeCategory[],
  templates: T[],
  checkedIds: ReadonlySet<string>
): { categoryIds: string[]; templateIds: string[] } {
  const categoryIds = new Set<string>()
  const templateIds = new Set<string>()

  for (const id of checkedIds) {
    if (id === NOTIFICATION_ROOT_CATEGORY_ID) continue
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

export function isVirtualUnclassifiedCategoryId(id: string): boolean {
  return id.startsWith('unclassified-')
}

export function sortCategoryIdsDeepestFirst(
  categories: NotificationTreeCategory[],
  ids: readonly string[]
): string[] {
  return [...ids].sort(
    (a, b) => ancestorIds(categories, b).length - ancestorIds(categories, a).length
  )
}

/** 체크·선택된 항목만. 하위 자동 포함 없음(BE는 cascade DELETE 없음). */
export function collectExplicitDeleteIds<T extends NotificationTreeTemplate>(
  categories: NotificationTreeCategory[],
  templates: T[],
  checkedIds: ReadonlySet<string>
): { categoryIds: string[]; templateIds: string[] } {
  const categoryIds: string[] = []
  const templateIds: string[] = []

  for (const id of checkedIds) {
    if (id === NOTIFICATION_ROOT_CATEGORY_ID || isVirtualUnclassifiedCategoryId(id)) continue
    const category = findCategory(categories, id)
    if (category) {
      categoryIds.push(category.id)
      continue
    }
    const template = findTemplate(templates, id)
    if (template) templateIds.push(template.id)
  }

  return {
    categoryIds: sortCategoryIdsDeepestFirst(categories, categoryIds),
    templateIds,
  }
}

export function categoryHasUndeletedChildren<T extends NotificationTreeTemplate>(
  categories: NotificationTreeCategory[],
  templates: T[],
  categoryId: string,
  deletingCategoryIds: ReadonlySet<string>,
  deletingTemplateIds: ReadonlySet<string>
): boolean {
  const leftoverCategories = categoryChildren(categories, categoryId).some(
    child => !deletingCategoryIds.has(child.id)
  )
  const leftoverTemplates = templatesInCategory(templates, categoryId).some(
    template => !deletingTemplateIds.has(template.id)
  )
  return leftoverCategories || leftoverTemplates
}

export function categoryHasChildren<T extends NotificationTreeTemplate>(
  categories: NotificationTreeCategory[],
  templates: T[],
  categoryId: string
): boolean {
  return childrenOf(categories, templates, categoryId).length > 0
}

export function moveTemplateToCategory<T extends NotificationTreeTemplate>(
  templates: T[],
  templateId: string,
  targetCategoryId: string
): T[] {
  return templates.map(template =>
    template.id === templateId ? { ...template, categoryId: targetCategoryId } : template
  )
}

export function canMoveCategoryTo(
  categories: NotificationTreeCategory[],
  categoryId: string,
  targetParentId: string
): boolean {
  if (categoryId === NOTIFICATION_ROOT_CATEGORY_ID) return false
  if (categoryId === targetParentId) return false
  const category = findCategory(categories, categoryId)
  if (!category || category.parentId === targetParentId) return false
  if (targetParentId !== NOTIFICATION_ROOT_CATEGORY_ID) {
    if (ancestorIds(categories, targetParentId).includes(categoryId)) return false
  }
  return true
}

export function moveCategoryToParent(
  categories: NotificationTreeCategory[],
  categoryId: string,
  targetParentId: string
): NotificationTreeCategory[] {
  if (!canMoveCategoryTo(categories, categoryId, targetParentId)) return categories
  return categories.map(category =>
    category.id === categoryId ? { ...category, parentId: targetParentId } : category
  )
}

function includesIgnoreCase(value: string, query: string): boolean {
  if (!query) return true
  return value.toLowerCase().includes(query.toLowerCase())
}

export function filterNotificationTree<T extends NotificationTreeTemplate>(
  categories: NotificationTreeCategory[],
  templates: T[],
  categoryNameQuery: string,
  templateNameQuery: string
): { categories: NotificationTreeCategory[]; templates: T[] } {
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

/** @deprecated use filterNotificationTree */
export const filterAlimtalkTree = filterNotificationTree
