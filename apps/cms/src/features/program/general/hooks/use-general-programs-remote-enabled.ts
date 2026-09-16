import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { shouldUseGeneralProgramFeSeed } from '@/features/program/general/lib/general-program-fe-seed'

/**
 * 일반 프로그램 programs remote gate.
 * FE 시드 id(`general-prog-*`, env ON)는 항상 OFF — 목록 병합·상세 mock resolve 경로.
 */
export function useGeneralProgramsRemoteEnabled(
  enabled = true,
  programId?: string | null
): boolean {
  if (shouldUseGeneralProgramFeSeed(programId)) return false
  return enabled && shouldUseGeneralProgramsRemoteApi()
}
