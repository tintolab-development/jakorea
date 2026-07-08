import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

/** 실 API JWT + `programs` 모듈 활성화 시 일반 프로그램 목록·상세를 API로 조회 */
export function shouldUseGeneralProgramsRemoteApi(): boolean {
  return isRealApiModuleEnabled('programs') && hasRemoteAdminJwt()
}

/** 로그인 우회·mock JWT 등 — CMS mock 프로그램 데이터 사용 */
export function shouldUseGeneralProgramsMockData(): boolean {
  return !shouldUseGeneralProgramsRemoteApi()
}
