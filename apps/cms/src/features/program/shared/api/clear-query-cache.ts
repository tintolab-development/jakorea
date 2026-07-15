import { queryClient } from '@/shared/lib/query-client'

const CMS_PROGRAM_QUERY_ROOT = ['cms', 'programs'] as const
const LEGACY_GENERAL_PROGRAM_QUERY_ROOT = ['general-programs'] as const

/** 로그인·로그아웃 경계에서 사용자별 프로그램 서버 상태가 재사용되지 않도록 제거한다. */
export function clearProgramQueryCache(): void {
  void queryClient.removeQueries({ queryKey: CMS_PROGRAM_QUERY_ROOT })
  void queryClient.removeQueries({ queryKey: LEGACY_GENERAL_PROGRAM_QUERY_ROOT })
}
