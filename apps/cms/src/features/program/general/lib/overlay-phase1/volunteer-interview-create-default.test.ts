/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import type { Program } from '@/types/domain'
import { buildGeneralProgramCreateFromWizardRhf } from './build-registration-create-from-rhf'
import { createDefaultRegistrationWizardUiValues } from './registration-wizard-ui-values'

/**
 * 봉사 모집 「봉사자 면접 유무」 — QA-0121 이후 기본값 없음(미선택, 등록 필수 검사로 막음).
 * 고른 값만 봉사 행 interviewEnabled 로 싣는다.
 */

const KEY = 'recruit.volunteer.interviewRequired'
const RANGE = { start: '2026-11-30T15:00:00.000Z', end: '2026-12-20T14:59:59.999Z' }

function build(volunteer: boolean, recruitmentKv: Record<string, unknown> = {}) {
  const values = createDefaultRegistrationWizardUiValues({
    programType: 'curriculum',
    sessionRoundType: 'single',
    curriculumChartSessionCount: 1,
    participant: { individual: false, organization: true, teacherInstructor: false, volunteer },
  })
  const ui = {
    ...values,
    programTitleKo: '[BOT-TEST] volunteer interview default',
    recruitmentKv: {
      'recruit.recruitRangeSeal': RANGE,
      'recruit.programRangeSeal': RANGE,
      'recruit.volunteer.recruitRangeSeal': RANGE,
      'recruit.volunteer.programRangeSeal': RANGE,
      ...recruitmentKv,
    },
  } as typeof values
  const built = buildGeneralProgramCreateFromWizardRhf({ id: 'local-wizard', uiValues: ui })
  const rows = (built.createRequest.recruitments ?? []) as unknown as Array<Record<string, unknown>>
  return rows.find(r => String(r.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER')
}

describe('위저드 RHF 생성 — 봉사자 면접 유무 기본값', () => {
  it('봉사: 라디오 미조작(미선택) → 면접 있음으로 채우지 않는다', () => {
    expect(build(true)?.interviewEnabled).not.toBe(true)
  })
  it('봉사: 면접 없음 선택 → false', () => {
    expect(build(true, { [KEY]: 'no' })?.interviewEnabled).toBe(false)
  })
  it('봉사: 면접 있음 선택 → true', () => {
    expect(build(true, { [KEY]: 'yes' })?.interviewEnabled).toBe(true)
  })
  it('봉사 미선택: 봉사 행 없음', () => {
    expect(build(false)).toBeUndefined()
  })
})

describe('수정 모드 hydrate — 저장값 그대로(기본값 주입 없음)', () => {
  const base = { id: 'p1', title: 't' } as unknown as Program
  it('저장 true → yes', () => {
    expect(
      programToDetailEditValues({ ...base, generalVolunteerInterviewEnabled: true } as Program)
        .volunteerRecruitmentInterviewEnabled
    ).toBe('yes')
  })
  it('레거시 저장 false → no (뒤집지 않음)', () => {
    expect(
      programToDetailEditValues({ ...base, generalVolunteerInterviewEnabled: false } as Program)
        .volunteerRecruitmentInterviewEnabled
    ).toBe('no')
  })
  it('값 없음 → undefined', () => {
    expect(programToDetailEditValues(base).volunteerRecruitmentInterviewEnabled).toBeUndefined()
  })
})
