import { describe, expect, it } from 'vitest'
import { getTrainedTeachersInstitutionDetailTabKeys } from '@/features/program/trained-teachers/lib/institution-detail-tabs'
import { getGeneralParticipatingInstitutionDetailTabKeys } from './participating-institution-detail-tabs'

describe('프로그램 진행 현황 하위 capability', () => {
  it('학생 명단 capability가 비활성이면 학생 명단 탭만 숨긴다', () => {
    const tabs = getGeneralParticipatingInstitutionDetailTabKeys(
      { studentListRequired: 'required' },
      false
    )

    expect(tabs).not.toContain('students')
    expect(tabs).toContain('attendance')
    expect(tabs).toContain('application')
  })

  it('학생 명단 capability가 없으면 프로그램 설정 fallback을 유지한다', () => {
    expect(
      getGeneralParticipatingInstitutionDetailTabKeys(
        { studentListRequired: 'required' },
        undefined
      )
    ).toContain('students')
    expect(
      getGeneralParticipatingInstitutionDetailTabKeys(
        { studentListRequired: 'not_required' },
        undefined
      )
    ).not.toContain('students')
  })

  it('교육일지 capability가 비활성이면 교육받은 교사 교육 일지 탭만 숨긴다', () => {
    const tabs = getTrainedTeachersInstitutionDetailTabKeys(false)

    expect(tabs).toEqual(['application'])
  })

  it('교육일지 capability가 없으면 교육받은 교사 기존 탭 fallback을 유지한다', () => {
    expect(getTrainedTeachersInstitutionDetailTabKeys()).toEqual(['application', 'journal'])
  })
})
