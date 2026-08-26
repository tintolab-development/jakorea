/**
 * 회원 로그인 이력
 * 화면 스펙: No. / 관리자명 / 아이디 / 로그인 일시 / IP
 */

import type { DateValue, UUID } from './index'

export interface MemberLoginLog {
  id: UUID
  adminName: string
  loginId: string
  loggedAt: DateValue
  ipAddress: string
}

export interface MemberLoginLogFilters {
  adminName?: string
  loginId?: string
  startDate?: DateValue
  endDate?: DateValue
}
