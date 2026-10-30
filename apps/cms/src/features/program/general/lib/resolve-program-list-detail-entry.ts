import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import {
  isProgramProgressPhaseFilter,
  programMatchesProgressPhase,
  type ProgramProgressPhaseFilter,
} from '@/features/program/general/ui/constants/program-list-constants'

export type ProgramListDetailEntry = {
  /** 호출한 상세 모달이 허용하는 실제 URL 값 */
  lnb: 'info' | 'applicants' | 'institution_applications' | 'progress'
  tab: 'info' | 'main' | 'institutions'
}

type ProgramListDetailEntryOptions = {
  /** 기존 전체 목록의 프로그램 유형 구분. 1사1교 전용 목록은 공통정보로 연다. */
  programType?: 'company_school' | 'education' | 'all' | 'volunteer'
  /** 목록 위젯에서 선택한 진행 단계. 없으면 프로그램의 canonical lifecycleStatus를 사용한다. */
  statusFilter?: ProgramProgressPhaseFilter | ProgramLifecycleStatus | null
  /** `/programs/general` 전용 모달과 기존 `/programs` 모달의 URL 계약을 구분한다. */
  detailSurface?: 'general' | 'program-list'
}

function resolveProgressPhase(
  program: Pick<Program, 'lifecycleStatus'>,
  statusFilter?: ProgramProgressPhaseFilter | ProgramLifecycleStatus | null
): ProgramProgressPhaseFilter | null {
  if (statusFilter && isProgramProgressPhaseFilter(statusFilter)) return statusFilter
  if (programMatchesProgressPhase(program, 'completed')) return 'completed'
  if (programMatchesProgressPhase(program, 'in_progress')) return 'in_progress'
  if (programMatchesProgressPhase(program, 'scheduled')) return 'scheduled'
  return null
}

/**
 * 프로그램 목록에서 상세로 진입할 때의 초기 LNB/tab을 한 곳에서 결정한다.
 * - 일반 프로그램 목록(`/programs/general`): 진행 상태와 무관하게 공통정보
 * - 1사1교 목록(`/programs/company-school`): 진행 상태와 무관하게 공통정보
 * - 진행 중: 신청 목록
 * - 진행 완료: 참여자(진행) 목록
 * - 예정/알 수 없음: 공통정보
 */
export function resolveProgramListDetailEntry(
  program: Pick<Program, 'lifecycleStatus'>,
  options: ProgramListDetailEntryOptions = {}
): ProgramListDetailEntry {
  if (options.detailSurface === 'general') {
    return { lnb: 'info', tab: 'info' }
  }

  if (options.programType === 'company_school') {
    return { lnb: 'info', tab: 'info' }
  }

  const phase = resolveProgressPhase(program, options.statusFilter)

  if (phase === 'in_progress') {
    return { lnb: 'applicants', tab: 'institutions' }
  }
  if (phase === 'completed') return { lnb: 'progress', tab: 'institutions' }
  return { lnb: 'info', tab: 'info' }
}
