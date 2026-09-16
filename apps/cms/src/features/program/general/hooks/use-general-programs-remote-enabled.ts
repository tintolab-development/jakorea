import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'

/** 일반 프로그램 programs remote gate. */
export function useGeneralProgramsRemoteEnabled(
  enabled = true,
  _programId?: string | null
): boolean {
  void _programId
  return enabled && shouldUseGeneralProgramsRemoteApi()
}
