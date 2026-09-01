import type { BulkActionResponse } from '@/shared/api/generated/data-management/schemas'

export const BULK_DELETE_CHUNK_SIZE = 100

export function toBulkNumericIds(ids: string[]): number[] {
  return ids.map(id => {
    const parsed = Number(id)
    return Number.isFinite(parsed) ? parsed : (id as unknown as number)
  })
}

export function assertBulkDeleteSucceeded(
  result: BulkActionResponse | undefined,
  fallbackMessage: string
): void {
  if ((result?.failureCount ?? 0) > 0) {
    throw new Error(result?.failures?.[0]?.message ?? fallbackMessage)
  }
}

export async function forEachBulkIdChunk(
  ids: string[],
  runChunk: (chunk: string[]) => Promise<void>
): Promise<void> {
  const unique = [...new Set(ids.filter(Boolean))]
  for (let i = 0; i < unique.length; i += BULK_DELETE_CHUNK_SIZE) {
    await runChunk(unique.slice(i, i + BULK_DELETE_CHUNK_SIZE))
  }
}
