/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { buildGeneralProgramCreateFromWizardRhf } from './build-registration-create-from-rhf'
import { createDefaultRegistrationWizardUiValues } from './registration-wizard-ui-values'

/**
 * 개인 모집 「참여자 면접 유무」 — QA-0121 이후 기본값 없음(미선택, 등록 필수 검사로 막음).
 * 고른 값만 serviceDetailJson.generalParticipantInterviewEnabled 로 싣는다.
 */

const KEY = 'recruit.individual.interviewRequired'
const RANGE = { start: '2026-11-30T15:00:00.000Z', end: '2026-12-20T14:59:59.999Z' }

function build(
  participant: { individual: boolean; organization: boolean },
  recruitmentKv: Record<string, unknown> = {}
) {
  const values = createDefaultRegistrationWizardUiValues({
    programType: 'curriculum',
    sessionRoundType: 'single',
    curriculumChartSessionCount: 1,
    participant: { ...participant, teacherInstructor: false, volunteer: false },
  })
  const ui = {
    ...values,
    programTitleKo: '[BOT-TEST] individual interview default',
    recruitmentKv: {
      'recruit.recruitRangeSeal': RANGE,
      'recruit.programRangeSeal': RANGE,
      ...recruitmentKv,
    },
  } as typeof values
  const built = buildGeneralProgramCreateFromWizardRhf({ id: 'local-wizard', uiValues: ui })
  return JSON.parse(built.createRequest.serviceDetailJson ?? '{}') as Record<string, unknown>
}

describe('위저드 RHF 생성 — 개인 참여자 면접 유무 기본값', () => {
  it('개인: 라디오 미조작(미선택) → 면접 있음으로 채우지 않는다', () => {
    expect(
      build({ individual: true, organization: false }).generalParticipantInterviewEnabled
    ).not.toBe(true)
  })
  it('개인: 면접 있음 선택 → true', () => {
    expect(
      build({ individual: true, organization: false }, { [KEY]: 'yes' })
        .generalParticipantInterviewEnabled
    ).toBe(true)
  })
  it('개인: 면접 없음 선택 → false', () => {
    expect(
      build({ individual: true, organization: false }, { [KEY]: 'no' })
        .generalParticipantInterviewEnabled
    ).toBe(false)
  })
  it('기관만: 기본값 주입 없음', () => {
    expect(build({ individual: false, organization: true })).not.toHaveProperty(
      'generalParticipantInterviewEnabled'
    )
  })
})
