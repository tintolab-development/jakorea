import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'

export function useGeneralProgramsRemoteEnabled(enabled = true): boolean {
  return enabled && shouldUseGeneralProgramsRemoteApi()
}
