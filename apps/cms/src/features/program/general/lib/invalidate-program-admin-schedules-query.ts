import type { QueryClient } from '@tanstack/react-query'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'

/** OSA 메타 조인용 schedules + 예정 슬롯(education-slots) 캐시 */
export async function invalidateProgramAdminSchedulesQuery(
  queryClient: QueryClient,
  programId: string | null | undefined
): Promise<void> {
  const id = programId?.trim()
  if (!id) return
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: generalProgramQueryKeys.schedules(id),
    }),
    queryClient.invalidateQueries({
      queryKey: generalProgramQueryKeys.educationSlots(id),
    }),
  ])
}
