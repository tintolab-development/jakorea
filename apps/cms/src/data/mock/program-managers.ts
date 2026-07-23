/**
 * 프로그램 상세 - 담당자 정보 탭 Mock 데이터
 * 담당자 목록(필터: 담당자명, 권한) · programId별 목록 · 등록 후보 풀
 * API 연동 시 getMockProgramManagers → fetch 대체
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
  /** remote assignment의 adminId (mock에는 없음) */
  adminId?: number
  /** remote 삭제 가능 여부 — false면 선택·삭제 비활성 */
  removableYn?: boolean
}

/** UI 표시용 권한 라벨 (시안: PM / 파트너 / 뷰어) */
export const PROGRAM_ROLE_LABELS: Record<ProgramRole, string> = {
  OWNER: 'PM',
  PARTNER: '파트너',
  ASSISTANT: '뷰어',
}

/** @deprecated {@link MAX_PM_PER_PROGRAM} 사용 권장 (엔티티 정책과 동일 값) */
export { MAX_PM_PER_PROGRAM as MAX_OWNER_COUNT } from '@/entities/program/lib/program-pm-role-policy'

/**
 * 기본 담당자 목록 (programId 미매칭 시)
 * PM 3명(한도) · 파트너 2 · 보조 2 — 총 7명
 */
export const MOCK_PROGRAM_MANAGERS: ProgramManagerRow[] = [
  {
    id: 'mgr-default-1',
    no: 1,
    name: '김운영',
    role: 'OWNER',
    phone: '010-2001-1001',
    email: 'kim.ops@jakorea.org',
    registeredAt: '2026.01.05 09:00',
  },
  {
    id: 'mgr-default-2',
    no: 2,
    name: '이기획',
    role: 'OWNER',
    phone: '010-2002-2002',
    email: 'lee.plan@jakorea.org',
    registeredAt: '2026.01.06 10:15',
  },
  {
    id: 'mgr-default-3',
    no: 3,
    name: '박총괄',
    role: 'OWNER',
    phone: '010-2003-3003',
    email: 'park.lead@jakorea.org',
    registeredAt: '2026.01.08 11:20',
  },
  {
    id: 'mgr-default-4',
    no: 4,
    name: '최협력',
    role: 'PARTNER',
    phone: '010-3927-5140',
    email: 'choi.partner@jakorea.org',
    registeredAt: '2026.02.01 14:00',
  },
  {
    id: 'mgr-default-5',
    no: 5,
    name: '정파트',
    role: 'PARTNER',
    phone: '010-5218-3674',
    email: 'jung.part@jakorea.org',
    registeredAt: '2026.02.03 15:30',
  },
  {
    id: 'mgr-default-6',
    no: 6,
    name: '강제이',
    role: 'ASSISTANT',
    phone: '010-7483-2915',
    email: 'ja.kang@jakorea.org',
    registeredAt: '2026.02.10 09:15',
  },
  {
    id: 'mgr-default-7',
    no: 7,
    name: '한보조',
    role: 'ASSISTANT',
    phone: '010-6482-1190',
    email: 'han.help@jakorea.org',
    registeredAt: '2026.02.11 16:45',
  },
]

/** 상세 mock용 첫 프로그램 (mockPrograms[0] = prog-001): PM 2명만 — PM 추가 등록 시나리오 테스트 */
const MOCK_MANAGERS_PROG_001: ProgramManagerRow[] = [
  {
    id: 'mgr-p001-1',
    no: 1,
    name: '김운영',
    role: 'OWNER',
    phone: '010-2001-1001',
    email: 'kim.ops@jakorea.org',
    registeredAt: '2026.01.05 09:00',
  },
  {
    id: 'mgr-p001-2',
    no: 2,
    name: '이기획',
    role: 'OWNER',
    phone: '010-2002-2002',
    email: 'lee.plan@jakorea.org',
    registeredAt: '2026.01.06 10:15',
  },
  {
    id: 'mgr-p001-3',
    no: 3,
    name: '최협력',
    role: 'PARTNER',
    phone: '010-3927-5140',
    email: 'choi.partner@jakorea.org',
    registeredAt: '2026.02.01 14:00',
  },
  {
    id: 'mgr-p001-4',
    no: 4,
    name: '정파트',
    role: 'PARTNER',
    phone: '010-5218-3674',
    email: 'jung.part@jakorea.org',
    registeredAt: '2026.02.03 15:30',
  },
  {
    id: 'mgr-p001-5',
    no: 5,
    name: '강제이',
    role: 'ASSISTANT',
    phone: '010-7483-2915',
    email: 'ja.kang@jakorea.org',
    registeredAt: '2026.02.10 09:15',
  },
  {
    id: 'mgr-p001-6',
    no: 6,
    name: '한보조',
    role: 'ASSISTANT',
    phone: '010-6482-1190',
    email: 'han.help@jakorea.org',
    registeredAt: '2026.02.11 16:45',
  },
]

/** PM 1명만 — 권한 변경·표 샘플용 소형 목록 */
const MOCK_MANAGERS_PROG_002: ProgramManagerRow[] = [
  {
    id: 'mgr-p002-1',
    no: 1,
    name: '손단독',
    role: 'OWNER',
    phone: '010-3100-7700',
    email: 'son.pm@jakorea.org',
    registeredAt: '2026.01.12 08:30',
  },
  {
    id: 'mgr-p002-2',
    no: 2,
    name: '오서포',
    role: 'ASSISTANT',
    phone: '010-4200-8800',
    email: 'oh.asst@jakorea.org',
    registeredAt: '2026.02.05 13:20',
  },
]

/** UJAT 프로그램 상세 담당자 정보 — 스크린샷 기준 3건 */
const MOCK_MANAGERS_UJAT: ProgramManagerRow[] = [
  {
    id: 'mgr-ujat-1',
    no: 3,
    name: '김제이',
    role: 'OWNER',
    phone: '010-1234-0000',
    email: 'gwanl***@naver.com',
    registeredAt: '2026.02.10 09:15',
  },
  {
    id: 'mgr-ujat-2',
    no: 2,
    name: '박제이',
    role: 'PARTNER',
    phone: '010-5678-0000',
    email: 'park***@naver.com',
    registeredAt: '2026.02.09 14:30',
  },
  {
    id: 'mgr-ujat-3',
    no: 1,
    name: '강제이',
    role: 'ASSISTANT',
    phone: '010-9012-0000',
    email: 'kang***@naver.com',
    registeredAt: '2026.02.08 11:00',
  },
]

const MOCK_PROGRAM_MANAGERS_BY_ID: Record<string, ProgramManagerRow[]> = {
  'prog-001': MOCK_MANAGERS_PROG_001,
  'prog-002': MOCK_MANAGERS_PROG_002,
}

function isUjatProgramManagerId(programId: string): boolean {
  return programId.startsWith('ujat-progress-')
}

/** programId에 맞는 담당자 목록 (행 단위 복사본 — 탭 state 오염 방지) */
export function getMockProgramManagers(programId: string): ProgramManagerRow[] {
  if (isUjatProgramManagerId(programId)) {
    return MOCK_MANAGERS_UJAT.map(r => ({ ...r }))
  }
  const rows = MOCK_PROGRAM_MANAGERS_BY_ID[programId] ?? MOCK_PROGRAM_MANAGERS
  return rows.map(r => ({ ...r }))
}

/** 담당자 등록 시 선택 가능한 회원 후보 (이미 담당자인 이름은 UI에서 제외) */
export const MOCK_ASSIGNABLE_MANAGER_CANDIDATES: {
  id: string
  name: string
  email: string
  phone: string
}[] = [
  { id: 'cand-1', name: '박총괄', email: 'park.lead@jakorea.org', phone: '010-2003-3003' },
  { id: 'cand-2', name: '윤신규', email: 'yoon.new@jakorea.org', phone: '010-3301-4402' },
  { id: 'cand-3', name: '장추가', email: 'jang.add@jakorea.org', phone: '010-3302-4403' },
  { id: 'cand-4', name: '배등록', email: 'bae.reg@jakorea.org', phone: '010-3303-4404' },
  { id: 'cand-5', name: '권미등', email: 'kwon.join@jakorea.org', phone: '010-3304-4405' },
  { id: 'cand-6', name: '노가입', email: 'rookie@jakorea.org', phone: '010-3305-4406' },
  { id: 'cand-7', name: '신초빈', email: 'shin.cb@jakorea.org', phone: '010-3306-4407' },
  { id: 'cand-8', name: '임모집', email: 'lim.recruit@jakorea.org', phone: '010-3307-4408' },
]

export function getAssignableManagerCandidates(
  excludeNames: readonly string[]
): typeof MOCK_ASSIGNABLE_MANAGER_CANDIDATES {
  const exclude = new Set(excludeNames.map(n => n.trim().toLowerCase()))
  return MOCK_ASSIGNABLE_MANAGER_CANDIDATES.filter(
    c => !exclude.has(c.name.trim().toLowerCase())
  )
}
