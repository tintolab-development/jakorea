import type { Key } from 'react'

/** 목록 체크 키(공개 id) → 일괄삭제용 숫자 PK. resourceId가 있으면 그건 쓴다. */
export function selectedPostRowKeysToBulkIds(
  selectedKeys: readonly Key[],
  rows: Array<{ id: string; resourceId?: number }>
): string[] {
  const resourceByPublicId = new Map(rows.map(row => [row.id, row.resourceId]))
  return selectedKeys.map(key => {
    const publicId = String(key)
    const resourceId = resourceByPublicId.get(publicId)
    if (typeof resourceId === 'number' && Number.isSafeInteger(resourceId) && resourceId > 0) {
      return String(resourceId)
    }
    return publicId
  })
}
