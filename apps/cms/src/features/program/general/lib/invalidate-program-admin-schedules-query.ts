import type { QueryClient } from '@tanstack/react-query'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'

/** 설문 옵션·승인 교차검증 등 `GET /programs/{id}/schedules` 캐시 */
export async function invalidateProgramAdminSchedulesQuery(
  queryClient: QueryClient,
  programId: string | null | undefined
): Promise<void> {
  const id = programId?.trim()
  if (!id) return
  await queryClient.invalidateQueries({
    queryKey: generalProgramQueryKeys.schedules(id),
  })
}
