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
  return {
    ...echoed,
    ...patch,
    id: programId || echoed.id,
    generalCommonInfo: {
      ...echoed.generalCommonInfo,
      ...patch?.generalCommonInfo,
    },
  }
}

/** 저장 draft의 UJAT 세션 overlay를 echo에 남긴다. 패치에 있으면 패치가 우선이다. */
export function programDetailCacheFromSave(
  programId: string,
  echoed: Program,
  draft: Program,
  patch?: Partial<Program>
): Program {
  const next = programDetailCacheAfterSave(programId, echoed, patch)
  if (!draft.ujatRegistrationOverlay && !patch?.ujatRegistrationOverlay) return next
  return {
    ...next,
    ujatRegistrationOverlay:
      patch?.ujatRegistrationOverlay ?? draft.ujatRegistrationOverlay,
  }
}

/**
 * 열린 상세 캐시를 저장 결과로 갈아끼운 뒤 다시 조회한다.
 * 저장 전에 나가 있던 GET이 나중에 도착해 새 값을 덮지 않게 먼저 취소한다.
 */
export async function syncOpenProgramDetailCache(
  queryClient: QueryClient,
  detailKey: QueryKey,
  next: Program
): Promise<void> {
  await queryClient.cancelQueries({ queryKey: detailKey })
  queryClient.setQueryData(detailKey, next)
  await queryClient.invalidateQueries({ queryKey: detailKey })
}
