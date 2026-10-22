/** 세부 프로그램 일괄 수정·삭제 최대 건수. 초과 시 요청을 분할하지 않고 차단한다. */
export const DETAILED_PROGRAM_BULK_MAX = 500

/** PATCH /api/admin/detailed-programs/bulk-update 요청 행 */
export type DetailedProgramBulkUpdateItem = {
  id: number
  nameKo: string
  useYn: boolean
  version: number
}

export function toDetailedProgramBulkUpdateItem(input: {
  id: string
  name: string
  active: boolean
  version: number
}): DetailedProgramBulkUpdateItem {
  return {
    id: Number(input.id),
    nameKo: input.name.trim(),
    useYn: input.active,
    version: input.version,
  }
}
