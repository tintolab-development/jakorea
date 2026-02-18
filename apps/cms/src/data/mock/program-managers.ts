/**
 * 프로그램 상세 - 담당자 정보 탭 Mock 데이터
 * 담당자 목록 (필터: 담당자명, 권한)
 */

import type { ProgramRole } from '@/types/user'

export interface ProgramManagerRow {
  id: string
  no: number
  name: string
  role: ProgramRole
  phone: string
  email: string
  registeredAt: string
}

/** UI 표시용 권한 라벨 (시안: PM / 파트너 / 보조) */
export const PROGRAM_ROLE_LABELS: Record<ProgramRole, string> = {
  OWNER: 'PM',
  PARTNER: '파트너',
  ASSISTANT: '보조',
}

export const MOCK_PROGRAM_MANAGERS: ProgramManagerRow[] = [
  {
    id: 'manager-1',
    no: 1,
    name: '강제이',
    role: 'ASSISTANT',
    phone: '010-1234-5678',
    email: 'ja.kang@jakorea.org',
    registeredAt: '2026.02.10 09:15',
  },
  {
    id: 'manager-2',
    no: 2,
    name: '박제이',
    role: 'PARTNER',
    phone: '010-1234-5678',
    email: 'ja.park@jakorea.org',
    registeredAt: '2026.02.10 09:15',
  },
  {
    id: 'manager-3',
    no: 3,
    name: '김제이',
    role: 'OWNER',
    phone: '010-1234-5678',
    email: 'ja.kim@jakorea.org',
    registeredAt: '2026.02.10 09:15',
  },
]
