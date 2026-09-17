import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { isGeneralProgramTempMockProgramId } from '@/features/program/general/api/temp-mock-capabilities'

/** 일반 프로그램 programs remote gate. FE 전용 mock programId는 remote GET을 타지 않는다. */
export function useGeneralProgramsRemoteEnabled(
  enabled = true,
  programId?: string | null
): boolean {
  if (isGeneralProgramTempMockProgramId(programId)) return false
  return enabled && shouldUseGeneralProgramsRemoteApi()
}
