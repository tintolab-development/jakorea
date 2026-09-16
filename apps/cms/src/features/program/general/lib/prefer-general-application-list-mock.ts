import type { Program } from '@/types/domain'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'

/**
 * FE 전용 일반 프로그램 시드만 신청 목록 mock을 쓴다.
 *
 * 숫자형 API 프로그램은 면접 2depth 여부와 무관하게
 * individual-applications API를 사용한다.
 */
export function shouldPreferGeneralApplicationListMock(
  program: Program | null | undefined
): boolean {
  if (!program?.id) return false
  return isGeneralIndividualProgram(program) && program.id.startsWith('general-prog-')
}

/**
 * 프로그램 진행 현황(참여자·강사·봉사자·기관) mock 강제.
 * 신청 목록이 mock인 프로그램과 FE 시드(`general-prog-*`)는 remote 대신 mock.
 */
export function shouldPreferGeneralProgramProgressMock(
  program: Program | null | undefined
): boolean {
  if (!program?.id) return false
  if (shouldPreferGeneralApplicationListMock(program)) return true
  return program.id.startsWith('general-prog-')
}
