import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import {
  assertBulkDeleteSucceeded,
  forEachBulkIdChunk,
  parseBulkPositiveIntegerId,
} from '@/features/data-management/api/bulk-delete'
import type { BulkActionResponse } from '@/shared/api/generated/posts/schemas'

export async function deletePostsByBulkIdsOrEach(
  ids: string[],
  options: {
    bulk: (numericIds: number[]) => Promise<unknown>
    each: (id: string) => Promise<void>
    failedMessage: string
  }
): Promise<void> {
  const unique = [...new Set(ids.map(id => id.trim()).filter(Boolean))]
  if (unique.length === 0) return

  const numericIds: number[] = []
  const fallbackIds: string[] = []
  for (const id of unique) {
    const parsed = parseBulkPositiveIntegerId(id)
    if (parsed != null) numericIds.push(parsed)
    else fallbackIds.push(id)
  }

  if (numericIds.length > 0) {
    await forEachBulkIdChunk(
      numericIds.map(id => String(id)),
      async chunk => {
        const chunkIds = chunk.map(id => Number(id))
        const result = unwrapApiBody<BulkActionResponse>(await options.bulk(chunkIds))
        assertBulkDeleteSucceeded(result, options.failedMessage)
      }
    )
  }

  for (const id of fallbackIds) {
    await options.each(id)
  }
}
