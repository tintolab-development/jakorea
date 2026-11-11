/**
 * UJAT 1365 봉사시간 등록 양식 — 반기 일괄 API (operationId ujat1365SemesterRegistrationForm)
 *
 * 요청 1회마다 개인정보 접근 감사 로그가 남는다.
 * - 미리보기: 모달을 열 때 PREVIEW 1회. 포커스·재연결·리렌더로 다시 부르지 않고, 닫으면 캐시를 버린다.
 * - 다운로드: 버튼을 누를 때마다 DOWNLOAD 1회 (PREVIEW 응답 재사용 금지).
 * 응답에는 1365 ID·생년월일 원문이 있으므로 전역 저장·persist·로그 출력을 하지 않는다.
 */

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { getJAKoreaCMSBackendAPIProgramProgressSubset } from '@/shared/api/generated/program-progress/program-progress-api'
import type { Ujat1365SemesterRegistrationFormRequestMode } from '@/shared/api/generated/program-progress/schemas/ujat1365SemesterRegistrationFormRequestMode'
import type { Ujat1365SemesterRegistrationFormResponse } from '@/shared/api/generated/program-progress/schemas/ujat1365SemesterRegistrationFormResponse'
import { getApiErrorCode, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import type { EducationProgressHalfKey } from '../tabs'

const programProgressApi = getJAKoreaCMSBackendAPIProgramProgressSubset()

export async function fetchUjat1365SemesterRegistrationForm(input: {
  programId: string
  half: EducationProgressHalfKey
  mode: Ujat1365SemesterRegistrationFormRequestMode
  /** DOWNLOAD일 때 브라우저 저장 파일명. 서버가 다운로드 이력 파일명으로 기록한다. */
  fileName?: string
}): Promise<Ujat1365SemesterRegistrationFormResponse> {
  const numericProgramId = Number(input.programId)
  if (!Number.isFinite(numericProgramId)) {
    throw new Error(`Invalid programId: ${input.programId}`)
  }
  return unwrapApiBody<Ujat1365SemesterRegistrationFormResponse>(
    await programProgressApi.ujat1365SemesterRegistrationForm(numericProgramId, {
      semesterType: input.half === 'h1' ? 'FIRST_HALF' : 'SECOND_HALF',
      mode: input.mode,
      ...(input.mode === 'DOWNLOAD' && input.fileName ? { fileName: input.fileName } : {}),
    })
  )
}

/** 에러 → 안내 문구. 원문 값은 노출하지 않는다. */
export function resolveVolunteer1365FormErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error)
  if (code === 'UJAT_1365_SEMESTER_TYPE_INVALID') {
    return '반기 정보가 올바르지 않아 양식을 불러오지 못했습니다. 상반기·하반기 탭을 다시 선택해 주세요.'
  }
  if (code === 'UJAT_1365_MODE_INVALID') {
    return '양식 요청 형식이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.'
  }
  if (code === 'UJAT_1365_PROGRAM_NOT_FOUND') {
    return 'UJAT 프로그램 정보를 찾을 수 없어 양식을 불러오지 못했습니다.'
  }
  const status = getApiErrorHttpStatus(error)
  if (status === 401 || status === 403) {
    return '1365 봉사시간 등록 양식을 열람할 권한이 없습니다. 관리자에게 권한을 요청해 주세요.'
  }
  if (status === 404) {
    return '1365 봉사시간 등록 양식을 찾을 수 없습니다.'
  }
  return '1365 봉사시간 등록 양식을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

/** 미리보기(PREVIEW) — 모달이 열려 있는 동안 1회만 조회 */
export function useVolunteer1365SemesterFormPreview(input: {
  programId?: string | null
  half: EducationProgressHalfKey
  enabled: boolean
}) {
  const { programId, half, enabled } = input
  const remoteEnabled = enabled && shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  const queryClient = useQueryClient()
  const queryKey = ujatQueryKeys.volunteer1365SemesterForm(String(programId ?? ''), half)
  const queryKeyHash = JSON.stringify(queryKey)

  // 모달 컴포넌트는 닫혀도 마운트된 채라 gcTime만으로는 캐시가 남는다.
  // 닫히면(또는 반기·프로그램이 바뀌면) 직접 지워 원문을 남기지 않고, 다시 열 때 PREVIEW 1회를 새로 남긴다.
  useEffect(() => {
    if (!enabled) {
      queryClient.removeQueries({ queryKey: JSON.parse(queryKeyHash), exact: true })
      return undefined
    }
    return () => {
      queryClient.removeQueries({ queryKey: JSON.parse(queryKeyHash), exact: true })
    }
  }, [enabled, queryClient, queryKeyHash])

  return useQuery({
    queryKey,
    enabled: remoteEnabled,
    queryFn: () =>
      fetchUjat1365SemesterRegistrationForm({
        programId: String(programId),
        half,
        mode: 'PREVIEW',
      }),
    staleTime: Infinity,
    // 모달을 닫아 구독이 없어지면 바로 버린다 — 원문을 캐시에 남기지 않는다.
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })
}
