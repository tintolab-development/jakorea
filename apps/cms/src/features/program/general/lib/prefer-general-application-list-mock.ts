import type { Program } from '@/types/domain'
import { shouldUseGeneralProgramFeSeed } from '@/features/program/general/lib/general-program-fe-seed'

/**
 * FE 시드 프로그램의 신청 목록은 mock을 사용한다.
 * 실제 등록 프로그램은 면접 단계 유무와 무관하게 applications API를 사용한다.
 */
export function shouldPreferGeneralApplicationListMock(
  program: Program | null | undefined
): boolean {
  if (!program?.id) return false
  return shouldUseGeneralProgramFeSeed(program.id)
}

/**
 * 프로그램 진행 현황(참여자·강사·봉사자·기관) mock 강제.
 * 신청 목록이 mock인 프로그램과 FE 시드(`general-prog-*`, env ON)는 remote 대신 mock.
 */
export function shouldPreferGeneralProgramProgressMock(
  program: Program | null | undefined
): boolean {
  if (!program?.id) return false
  if (shouldPreferGeneralApplicationListMock(program)) return true
  return shouldUseGeneralProgramFeSeed(program.id)
}
