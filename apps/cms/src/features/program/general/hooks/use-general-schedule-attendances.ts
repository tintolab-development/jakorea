import { useQuery } from '@tanstack/react-query'
import { fetchGeneralScheduleAttendances } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import type { AttendanceItemResponse } from '@/shared/api/generated/dashboard/schemas/attendanceItemResponse'

/**
 * 스케줄 단위 출석 조회.
 * BE에 프로그램 schedules 목록 GET이 없어 UI 세션 매핑은 호출부에서 scheduleId를 확보한 뒤 사용.
 */
export function useGeneralScheduleAttendances(
  programId: string | undefined,
  scheduleId: string | undefined
) {
  const surfaceRemote = useProgramProgressRemoteEnabledForSurface(programId)
  const remoteEnabled = surfaceRemote && Boolean(scheduleId)

  const query = useQuery({
    queryKey: generalProgramProgressQueryKeys.attendances(programId ?? '', scheduleId ?? ''),
    queryFn: () => fetchGeneralScheduleAttendances(programId!, scheduleId!),
    enabled: remoteEnabled,
    staleTime: 15_000,
    retry: false,
  })

  return {
    attendances: (query.data ?? null) as AttendanceItemResponse[] | null,
    loading: remoteEnabled ? query.isFetching : false,
    isRemoteDataSource: remoteEnabled && !query.isError,
  }
}
