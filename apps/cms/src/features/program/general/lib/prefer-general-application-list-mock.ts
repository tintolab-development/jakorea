import type { Program } from '@/types/domain'
import { getGeneralParticipantInterviewEnabled } from '@/features/program/general/lib/detail-meta'
import { shouldUseGeneralProgramFeSeed } from '@/features/program/general/lib/general-program-fe-seed'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'

/**
 * 참여자 신청이 FE mock으로 노출되는 프로그램에서는
 * 강사·봉사자 신청 목록도 remote 대신 mock을 쓴다.
 *
 * - 개인 + 면접 2depth: 1차/합격/2차 모두 mock 고정
 * - 개인 `general-prog-*` FE 시드(env ON): 동일하게 mock 고정(면접 플래그 누락 대비)
 */
export function shouldPreferGeneralApplicationListMock(
  program: Program | null | undefined
): boolean {
  if (!program?.id) return false
  if (getGeneralParticipantInterviewEnabled(program)) return true
  return isGeneralIndividualProgram(program) && shouldUseGeneralProgramFeSeed(program.id)
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
