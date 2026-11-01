/**
 * 등록 저장(create·로컬 저장)에서 모집 라디오 기본값을 채울 탭 — 모집 overlay 를 모으는
 * `collectSelectedRecruitOverlaysForProgram` 과 같은 출처(`listVisibleOperationalFormSpecs`)로 판정한다.
 * (위저드 단계 노출 `isGeneralProgramRegistrationStepVisible` + 유형별 탭 숨김(1사1교·교육받은 교사 봉사 없음))
 */
import type { Program } from '@/types/domain'
import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import { listVisibleOperationalFormSpecs } from '@/features/program/general/lib/operational-form-bindings'

export type RecruitRadioTabSelection = Pick<
  ProgramRegistrationParticipantSelection,
  'individual' | 'organization' | 'teacherInstructor' | 'volunteer'
>

export function resolveVisibleRecruitTabsForProgram(program: Program): RecruitRadioTabSelection {
  const tabs: RecruitRadioTabSelection = {
    individual: false,
    organization: false,
    teacherInstructor: false,
    volunteer: false,
  }
  for (const spec of listVisibleOperationalFormSpecs(program)) {
    if (spec.formType !== 'RECRUITMENT') continue
    const role = spec.targetRole?.trim().toUpperCase()
    if (role === 'ORGANIZATION') tabs.organization = true
    else if (role === 'INDIVIDUAL') tabs.individual = true
    else if (role === 'INSTRUCTOR') tabs.teacherInstructor = true
    else if (role === 'VOLUNTEER') tabs.volunteer = true
  }
  return tabs
}
