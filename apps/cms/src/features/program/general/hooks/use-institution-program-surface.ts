import type { Program } from '@/types/domain'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { useIsCompanySchoolProgramsSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'

/**
 * 일반 프로그램 **기관형** 표면 여부 — 개인형·1사1교(경제교육) 진행 현황과 분기할 때 쓴다.
 * 참여 강사/봉사자 화면이 1사1교·개인형과 컴포넌트를 공유하므로, 기관형 Figma 전용 UI는 이 값으로만 켠다.
 */
export function useIsInstitutionProgramSurface(program: Program | null | undefined): boolean {
  const isCompanySchoolSurface = useIsCompanySchoolProgramsSurface()
  if (program == null) return false
  if (isCompanySchoolSurface || isCompanySchoolProgram(program)) return false
  return !isGeneralIndividualProgram(program)
}
