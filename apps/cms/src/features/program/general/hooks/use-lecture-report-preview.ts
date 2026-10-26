import { useQuery } from '@tanstack/react-query'
import { fetchGeneralProgramLectureReportPreviewContent } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import type { ParticipatingInstructorLectureReportRow } from '@/features/program/general/api/adapters/lecture-reports-adapters'

export function useLectureReportPreview(
  programId: string | undefined,
  row: ParticipatingInstructorLectureReportRow | null
) {
  const enabled =
    Boolean(programId) &&
    row != null &&
    row.canViewReport &&
    row.reportId != null &&
    row.reportId > 0

  return useQuery({
    queryKey: generalProgramProgressQueryKeys.lectureReportPreview(programId ?? '', row?.id ?? ''),
    queryFn: () => fetchGeneralProgramLectureReportPreviewContent(programId!, row!),
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}
