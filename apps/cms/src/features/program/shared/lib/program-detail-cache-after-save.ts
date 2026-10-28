import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { Program } from '@/types/domain'

/**
 * 공통정보 저장 직후 상세 캐시.
 * PATCH echo가 방금 보낸 필드를 빼거나 구값이면, 이번 patch로 덮어 열린 화면에 바로 반영한다.
 * 키는 화면이 구독 중인 programId를 쓴다.
 */
export function programDetailCacheAfterSave(
  programId: string,
  echoed: Program,
  patch?: Partial<Program>
): Program {
  const {
    createdAt: _patchCreatedAt,
    updatedAt: _patchUpdatedAt,
    createdByName: _patchCreatedByName,
    updatedByName: _patchUpdatedByName,
    ...patchWithoutAudit
  } = patch ?? {}
  void _patchCreatedAt
  void _patchUpdatedAt
  void _patchCreatedByName
  void _patchUpdatedByName
  return {
    ...echoed,
    ...patchWithoutAudit,
    id: programId || echoed.id,
    createdAt: echoed.createdAt,
    updatedAt: echoed.updatedAt,
    createdByName: echoed.createdByName,
    updatedByName: echoed.updatedByName,
    generalCommonInfo: {
      ...echoed.generalCommonInfo,
      ...patch?.generalCommonInfo,
    },
  }
}

/**
 * 저장 draft의 overlay·설문 keys를 echo에 남긴다. 패치에 있으면 패치가 우선이다.
 * (TT/GENERAL 공통정보 — PATCH echo가 keys·registrationOverlay를 빼도 LNB가 바로 반영되게)
 */
export function programDetailCacheFromSave(
  programId: string,
  echoed: Program,
  draft: Program,
  patch?: Partial<Program>
): Program {
  const next = programDetailCacheAfterSave(programId, echoed, patch)
  const generalSurveyMenuKeys =
    patch?.generalSurveyMenuKeys !== undefined
      ? patch.generalSurveyMenuKeys
      : draft.generalSurveyMenuKeys !== undefined
        ? draft.generalSurveyMenuKeys
        : next.generalSurveyMenuKeys
  const registrationOverlay =
    patch?.registrationOverlay ?? draft.registrationOverlay ?? next.registrationOverlay
  const ujatRegistrationOverlay =
    patch?.ujatRegistrationOverlay ?? draft.ujatRegistrationOverlay ?? next.ujatRegistrationOverlay

  if (
    generalSurveyMenuKeys === next.generalSurveyMenuKeys &&
    registrationOverlay === next.registrationOverlay &&
    ujatRegistrationOverlay === next.ujatRegistrationOverlay
  ) {
    return next
  }

  return {
    ...next,
    ...(generalSurveyMenuKeys !== undefined ? { generalSurveyMenuKeys } : {}),
    ...(registrationOverlay !== undefined ? { registrationOverlay } : {}),
    ...(ujatRegistrationOverlay !== undefined ? { ujatRegistrationOverlay } : {}),
  }
}

/**
 * 열린 상세 캐시를 저장 결과로 갈아끼운 뒤 다시 조회한다.
 * 저장 전에 나가 있던 GET이 나중에 도착해 새 값을 덮지 않게 먼저 취소한다.
 *
 * 공통정보·모집 행 저장은 `refetch: false`. 직후 GET이 저장 전 상세를 돌려주면
 * 방금 저장한 공통정보·모집 화면이 다시 이전 값으로 돌아간다.
 */
export async function syncOpenProgramDetailCache(
  queryClient: QueryClient,
  detailKey: QueryKey,
  next: Program,
  options?: { refetch?: boolean }
): Promise<void> {
  await queryClient.cancelQueries({ queryKey: detailKey })
  queryClient.setQueryData(detailKey, next)
  if (options?.refetch === false) return
  await queryClient.invalidateQueries({ queryKey: detailKey })
}
