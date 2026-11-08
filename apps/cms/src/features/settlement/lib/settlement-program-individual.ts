/**
 * 정산 화면(산출 내역서·계좌 지급 현황 상세) — 개인형 프로그램이면 「참여 기관명」열을 숨긴다.
 * 서버 `programType`(backendProgramType)을 우선한다. 프로그램 서비스 상세 JSON의 예전 audience 값이
 * typed programType과 어긋나는 경우(GENERAL_INDIVIDUAL인데 organization)가 있어 typed 값을 정본으로 쓴다.
 */
import type { Program } from '@/types/domain'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'

export function isIndividualProgramForSettlement(program: Program): boolean {
  const backendType = program.backendProgramType?.trim().toUpperCase()
  if (backendType) return backendType === 'GENERAL_INDIVIDUAL'
  return isGeneralIndividualProgram(program)
}
