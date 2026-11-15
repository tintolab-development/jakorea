import { useQuery } from '@tanstack/react-query'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { fetchLectureAttendanceSourceRemote } from '@/features/program/general/api/student-lecture-attendance-api'

/**
 * 학생 명단 「강의 출석 내역」 열 — 기관 배정 회차와 회차별 출결을 한 번 조회한다.
 * 학생별 상세 조회와 같은 원본·계산을 써서 목록 값과 상세 모달 값이 같다.
 */
export function useStudentLectureAttendanceSource(input: {
  programId: string | number | null | undefined
  organizationApplicationId: string
  enabled: boolean
}) {
  const programId = input.programId != null ? String(input.programId).trim() : ''
  const organizationApplicationId = input.organizationApplicationId.trim()
  return useQuery({
    queryKey: generalProgramProgressQueryKeys.studentLectureAttendanceSource(
      programId || '__none__',
      organizationApplicationId || '__none__'
    ),
    queryFn: () => fetchLectureAttendanceSourceRemote({ programId, organizationApplicationId }),
    enabled: input.enabled && Boolean(programId) && Boolean(organizationApplicationId),
    // 운영 데이터(E) — 출석 관리 탭 등 다른 화면에서 출결이 바뀌므로 탭 진입마다 다시 조회한다.
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
