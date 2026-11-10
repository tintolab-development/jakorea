import { describe, expect, it } from 'vitest'
import { buildGeneralInstitutionSelectAssignDescription } from './school-detail-select-assign-confirm-modal'
import { buildGeneralInstitutionAssignCompleteDescription } from './school-detail-assign-complete-modal'

describe('일반 기관형 강사 선택 배정·배정 완료 문구 (시안 09-1·11-1·10·11-4)', () => {
  it('단건 선택 배정', () => {
    expect(buildGeneralInstitutionSelectAssignDescription(['김제이'], 'JA초등학교', 3, 4)).toBe(
      '[**김제이**] 님을 [**JA초등학교**]에 배정하시겠습니까?\n(현재 배정 인원 : 3/4명)'
    )
  })

  it('일괄 선택 배정은 중복 강사를 한 명으로 센다', () => {
    expect(
      buildGeneralInstitutionSelectAssignDescription(['김제이', '김제이', '곽도규'], 'JA초등학교', 1, 4)
    ).toBe('[**김제이**] 님 외 1명을 [**JA초등학교**]에 배정하시겠습니까?\n(현재 배정 인원 : 1/4명)')
  })

  it('배정 완료', () => {
    expect(buildGeneralInstitutionAssignCompleteDescription(['김제이'], 4, 4)).toBe(
      '[**김제이**] 님이 배정되었습니다.\n(현재 배정 인원 : 4/4명)'
    )
  })
})
