export type DeleteBlockedGuideCopy = {
  title: string
  description: string
}

export function buildDeleteBlockedBulkLead(selectedCount: number): string {
  const n = Math.max(0, selectedCount)
  return `**선택한 ${n}개의 항목** 중 삭제가 불가한 항목이 포함되어 있습니다.`
}

export function buildDeleteBlockedGuideTitle(entityLabel: string, bulk: boolean): string {
  return bulk ? `${entityLabel} 일괄 삭제 불가 안내` : `${entityLabel} 삭제 불가 안내`
}

export function resolveDeleteBlockedGuideCopy(params: {
  entityLabel: string
  reasonLine: string
  selectedCount: number
}): DeleteBlockedGuideCopy {
  const { entityLabel, reasonLine, selectedCount } = params
  const reason = reasonLine.trim()
  const bulk = selectedCount >= 2

  const title = buildDeleteBlockedGuideTitle(entityLabel, bulk)
  const description = bulk ? `${buildDeleteBlockedBulkLead(selectedCount)}\n${reason}` : reason

  return { title, description }
}
