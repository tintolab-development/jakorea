/**
 * TODO(temp-mock): 열여라 참깨 — 기관·개인 쇼케이스 공통 시드 (검증 후 삭제)
 */

import type { ProgramManagerRow } from '@/features/program/general/model/program-managers'

export const TEMP_MOCK_PRIMARY_SPONSOR_ID = '1627251'
export const TEMP_MOCK_SECONDARY_SPONSOR_ID = '163302'
export const TEMP_MOCK_SPONSOR_DISPLAY_NAME = '로컬나눔은행, 스타벅스'
export const TEMP_MOCK_SPONSOR_MANAGER_LINE = '백진혁 | 010-8681-6741'

export const TEMP_MOCK_DETAILED_PROGRAM_NAME = '소비와 저축의 균형'
export const TEMP_MOCK_TEXTBOOK_ID = '168032'
export const TEMP_MOCK_TEXTBOOK_BUSINESS_AREA = '경제금융'

export const TEMP_MOCK_CONTACT_PHONE = '02-6085-6028'
export const TEMP_MOCK_CONTACT_EMAIL = 'qa.temp-mock@tinto.co.kr'

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  return raw
}

export function ageFromBirth(iso: string): number {
  return 2026 - Number(iso.slice(0, 4))
}

export function formatBirth(iso: string): string {
  return iso.replace(/-/g, '.')
}

/** QA admin-accounts — 165001(PM) · 165002(파트너) · 165003(뷰어) */
export function buildTempMockProgramManagers(idPrefix: string): ProgramManagerRow[] {
  return [
    {
      id: `${idPrefix}-manager-165001`,
      no: 3,
      name: '테스트 PM 관리자',
      role: 'OWNER',
      phone: '010-0000-5001',
      email: 'pm@jakorea.org',
      registeredAt: '2026-09-16',
      adminId: 165001,
      cmsRoleCode: 'MIDDLE',
      removableYn: true,
    },
    {
      id: `${idPrefix}-manager-165002`,
      no: 2,
      name: '테스트 파트너 관리자',
      role: 'PARTNER',
      phone: '010-0000-5002',
      email: 'partner@jakorea.org',
      registeredAt: '2026-09-16',
      adminId: 165002,
      cmsRoleCode: 'MIDDLE',
      removableYn: true,
    },
    {
      id: `${idPrefix}-manager-165003`,
      no: 1,
      name: '테스트 뷰어 관리자',
      role: 'ASSISTANT',
      phone: '010-0000-5003',
      email: 'viewer@jakorea.org',
      registeredAt: '2026-09-16',
      adminId: 165003,
      cmsRoleCode: 'VIEWER',
      removableYn: true,
    },
  ]
}

export function remapTempMockRowsProgramId<T extends { programId?: string; id: string }>(
  rows: T[],
  programId: string,
  idPrefixReplacements: Array<[string, string]>
): T[] {
  return rows.map(row => {
    let nextId = row.id
    for (const [from, to] of idPrefixReplacements) {
      nextId = nextId.replace(from, to)
    }
    return { ...row, programId, id: nextId }
  })
}

/** JSON 문자열 값 전체 치환 — prefix가 겹쳐도 안전 (`"old"`만 교체) */
export function replaceTempMockJsonStringValues<T>(value: T, replacements: Array<[string, string]>): T {
  let json = JSON.stringify(value)
  for (const [from, to] of replacements) {
    json = json.split(JSON.stringify(from)).join(JSON.stringify(to))
  }
  return JSON.parse(json) as T
}

/** id prefix 치환 — `from`이 `to`의 부분 문자열이 아니어야 함 */
export function replaceTempMockIdPrefixes<T>(value: T, replacements: Array<[string, string]>): T {
  let json = JSON.stringify(value)
  for (const [from, to] of replacements) {
    json = json.split(from).join(to)
  }
  return JSON.parse(json) as T
}
