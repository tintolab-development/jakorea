/**
 * 세부 프로그램 관리 목록 Mock (UI·삭제 제한 시연)
 */

import type { DetailedProgramManagementRow } from '@/features/detailed-program/model/detailed-program-management.types'

const CREATED_BY = '홍길동'
const BASE = '2026-03-30T01:10:32.000Z'

/** 스크린샷·기획 예시에 가까운 상단 행 (No. 내림차순 시 앞쪽에 노출) */
const NAMES: Array<{ name: string; active: boolean; inUse: boolean }> = [
  { name: '1차 교육 워크숍', active: true, inUse: true },
  { name: '겨울 코딩 부트캠프', active: true, inUse: false },
  { name: '봄학기 진로 특강', active: true, inUse: false },
  { name: '여름방학 집중 캠프', active: true, inUse: true },
  { name: '2차 교육 워크숍', active: false, inUse: false },
  { name: '경제 리터러시 기초', active: true, inUse: false },
  { name: '디지털 역량 강화', active: true, inUse: false },
  { name: '창업 멘토링 A', active: false, inUse: false },
  { name: '창업 멘토링 B', active: true, inUse: false },
  { name: '봉사활동 인증 과정', active: true, inUse: true },
  { name: '청소년 리더십 캠프', active: true, inUse: false },
  { name: '가을학기 심화반', active: false, inUse: false },
  { name: '겨울방학 온라인 특강', active: true, inUse: false },
]

function isoWithOffset(index: number): string {
  const d = new Date(BASE)
  d.setMinutes(d.getMinutes() - index)
  return d.toISOString()
}

export const mockDetailedProgramManagementListRows: DetailedProgramManagementRow[] = NAMES.map(
  (item, index) => ({
    id: `dp-${131 - index}`,
    name: item.name,
    active: item.active,
    createdBy: CREATED_BY,
    createdAt: isoWithOffset(index),
    inUse: item.inUse,
  })
)
