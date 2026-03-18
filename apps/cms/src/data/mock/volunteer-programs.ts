/**
 * 봉사 프로그램 Mock 데이터
 * 봉사자 참여가 필요한 프로그램 목록
 */

import type { Program } from '../../types/domain'
import { mockPrograms } from './programs'

/**
 * 봉사 프로그램 필터링
 * 봉사자가 참여하는 프로그램 (일반적으로 봉사자 수가 필요한 프로그램)
 */
export function getVolunteerPrograms(): Program[] {
  // 봉사자가 필요한 프로그램 필터링
  // 실제로는 프로그램 타입이나 설정에 따라 결정되지만,
  // 여기서는 mockPrograms에서 일부를 봉사 프로그램으로 지정
  return mockPrograms.filter((_program, index) => {
    // 일부 프로그램만 봉사 프로그램으로 지정 (인덱스 기반).
    // format 기준 제거 시 교육 프로그램 목록에 mockPrograms가 포함되어 0번에 신용케어 아카데미(교육 2) 등 노출 가능.
    return index % 3 === 0
  })
}

/**
 * 봉사 프로그램 Map
 */
export const mockVolunteerProgramsMap = new Map(
  getVolunteerPrograms().map(program => [program.id, program])
)
