/**
 * 위젯별 프로그램 필터 인코딩
 *
 * - 키 없음 / `[]` = 전체 선택 (BE 빈 필터와 동일, 「선택 없음」은 표현 불가)
 * - `[id…]` = 해당 프로그램만
 *
 * 마지막 그룹을 끄면 `[]`가 되어 다시 전체가 되는 wrap-around를 막기 위해
 * 해제의 결과가 빈 목록이면 이전 선택을 유지한다.
 */

export function isWidgetProgramFilterAll(ids: string[] | undefined): boolean {
  return ids == null || ids.length === 0
}

export function isWidgetProgramGroupSelected(
  ids: string[] | undefined,
  groupIds: string[]
): boolean {
  if (groupIds.length === 0) return false
  if (ids == null || ids.length === 0) return true
  return groupIds.every(id => ids.includes(id))
}

export function isWidgetProgramGroupIndeterminate(
  ids: string[] | undefined,
  groupIds: string[]
): boolean {
  if (groupIds.length === 0 || ids == null || ids.length === 0) return false
  const selectedCount = groupIds.filter(id => ids.includes(id)).length
  return selectedCount > 0 && selectedCount < groupIds.length
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.map(String))]
}

export type ProgramSettingRow = {
  title: string
  /** 위젯 키 → 해당 타이틀에 대응하는 program id 목록 (해당 위젯 목록에 없으면 키 없음) */
  idsByWidget: Record<string, string[]>
}

function buildProgramTitleGroups(
  rows: { id: string; title: string }[]
): { title: string; ids: string[] }[] {
  const byTitle = new Map<string, string[]>()
  const order: string[] = []
  for (const { id, title } of rows) {
    const programId = String(id)
    if (!byTitle.has(title)) {
      byTitle.set(title, [])
      order.push(title)
    }
    byTitle.get(title)!.push(programId)
  }
  return order.map(title => ({ title, ids: byTitle.get(title)! }))
}

export function getAllProgramIdsForWidget(
  catalog: Record<string, { id: string; title: string }[]>,
  widgetKey: string
): string[] {
  return uniqueIds((catalog[widgetKey] ?? []).map(p => String(p.id)))
}

/**
 * 위젯 카탈로그를 프로그램 제목 행으로 합친다.
 * 각 행의 `idsByWidget[widgetKey]`는 그 제목에 속한 id만 담는다 (위젯 전체 목록이 아님).
 */
export function buildUnifiedProgramRows(
  visibleWidgetKeys: readonly string[],
  catalog: Record<string, { id: string; title: string }[]>
): ProgramSettingRow[] {
  const titleOrder: string[] = []
  const byTitle = new Map<string, Record<string, string[]>>()

  for (const widgetKey of visibleWidgetKeys) {
    for (const group of buildProgramTitleGroups(catalog[widgetKey] ?? [])) {
      if (!byTitle.has(group.title)) {
        titleOrder.push(group.title)
        byTitle.set(group.title, {})
      }
      byTitle.get(group.title)![widgetKey] = group.ids
    }
  }

  return titleOrder.map(title => ({
    title,
    idsByWidget: byTitle.get(title)!,
  }))
}

export function remainingIdsAfterUnselectingGroup(
  currentIds: string[] | undefined,
  groupIds: string[],
  allProgramIds: string[]
): string[] {
  const base = currentIds == null || currentIds.length === 0 ? allProgramIds : currentIds
  return base.filter(id => !groupIds.includes(id))
}

/** 해당 그룹이 켜져 있고, 꺼도 최소 1개 프로그램이 남는 경우만 true */
export function canUnselectWidgetProgramGroup(
  currentIds: string[] | undefined,
  groupIds: string[],
  allProgramIds: string[]
): boolean {
  if (!isWidgetProgramGroupSelected(currentIds, groupIds)) return false
  return remainingIdsAfterUnselectingGroup(currentIds, groupIds, allProgramIds).length > 0
}

/**
 * 위젯 필터에 타이틀 그룹을 켜거나 끈다.
 * `selected`는 체크박스 `e.target.checked` (토글 추론이 아님).
 */
export function setWidgetProgramGroupSelected(
  currentIds: string[] | undefined,
  groupIds: string[],
  allProgramIds: string[],
  selected: boolean
): string[] {
  if (selected) {
    if (currentIds == null || currentIds.length === 0) return []
    const next = uniqueIds([...currentIds, ...groupIds])
    return allProgramIds.every(id => next.includes(id)) ? [] : next
  }

  const remaining = remainingIdsAfterUnselectingGroup(currentIds, groupIds, allProgramIds)
  if (remaining.length === 0) {
    if (currentIds == null || currentIds.length === 0) return []
    return [...currentIds]
  }
  return remaining
}
