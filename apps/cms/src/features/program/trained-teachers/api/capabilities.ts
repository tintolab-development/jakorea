import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export const TRAINED_TEACHER_REMOTE_OPT_IN_ENV =
  'VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED' as const

export function isTrainedTeacherRemoteOptedIn(): boolean {
  return (
    String(import.meta.env.VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED)
      .trim()
      .toLowerCase() === 'true'
  )
}

/**
 * JWT + programs + (opt-in env 또는 trainedTeacherPrograms 모듈)이 모두 충족될 때만 원격 API 사용.
 * 일반 programs만으로는 켜지지 않는다.
 */
export function shouldUseTrainedTeacherProgramsRemoteApi(): boolean {
  return (
    hasRemoteAdminJwt() &&
    isRealApiModuleEnabled('programs') &&
    (isTrainedTeacherRemoteOptedIn() ||
      isRealApiModuleEnabled('trainedTeacherPrograms'))
  )
}
